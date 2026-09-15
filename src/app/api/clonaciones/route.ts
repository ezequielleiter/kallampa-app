import type { NextRequest } from "next/server";
import type { Types } from "mongoose";
import dbConnect from "@/lib/mongodb";
import Clonacion from "@/models/Clonacion";
import Placa from "@/models/Placa";
import FrascoLiquido from "@/models/FrascoLiquido";
import FungusType from "@/models/FungusType";
import { ok, fail, handleApiError, badRequest } from "@/lib/api-utils";
import { createClonacionSchema } from "@/lib/validations/clonacion.schema";
import { getNextNumeroClonacion } from "@/lib/counters";
import {
  resumenClonacion,
  type LeanClonacion,
  type LeanPlaca,
  type LeanFrascoLiquido,
} from "@/lib/metrics";

// GET /api/clonaciones
export async function GET() {
  try {
    await dbConnect();

    const clonaciones = (await Clonacion.find({})
      .populate("fungusTypeId")
      .sort({ createdAt: -1 })
      .lean()) as unknown as (LeanClonacion & { _id: unknown })[];

    const clonacionIds = clonaciones.map((c) => c._id) as Types.ObjectId[];

    const [placas, frascosLiquidos] = await Promise.all([
      Placa.find({ clonacionId: { $in: clonacionIds } }).lean(),
      FrascoLiquido.find({ clonacionId: { $in: clonacionIds } }).lean(),
    ]);

    const placasByClonacion = new Map<string, LeanPlaca[]>();
    for (const placa of placas as unknown as (LeanPlaca & { clonacionId: unknown })[]) {
      const key = String(placa.clonacionId);
      if (!placasByClonacion.has(key)) placasByClonacion.set(key, []);
      placasByClonacion.get(key)!.push(placa);
    }

    const frascosByClonacion = new Map<string, LeanFrascoLiquido[]>();
    for (const frasco of frascosLiquidos as unknown as (LeanFrascoLiquido & {
      clonacionId: unknown;
    })[]) {
      const key = String(frasco.clonacionId);
      if (!frascosByClonacion.has(key)) frascosByClonacion.set(key, []);
      frascosByClonacion.get(key)!.push(frasco);
    }

    const data = clonaciones.map((clonacion) => {
      const key = String(clonacion._id);
      const clonacionPlacas = placasByClonacion.get(key) ?? [];
      const clonacionFrascos = frascosByClonacion.get(key) ?? [];
      const resumen = resumenClonacion(clonacion, clonacionPlacas, clonacionFrascos);

      return {
        _id: clonacion._id,
        numeroLote: clonacion.numeroLote,
        fungusTypeId: clonacion.fungusTypeId,
        colonizacion: clonacion.colonizacion,
        resumen,
      };
    });

    return ok(data);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const parsed = createClonacionSchema.parse(body);

    const fungusType = await FungusType.findById(parsed.fungusTypeId).lean();
    if (!fungusType) {
      return fail("El tipo de hongo indicado no existe", 400);
    }

    const diasEsperados =
      parsed.diasEsperados ?? fungusType.diasEsperadosDefault?.colonizacionPlacas;

    if (!diasEsperados) {
      throw badRequest(
        "Este hongo no tiene configurado diasEsperadosDefault.colonizacionPlacas; indicá diasEsperados manualmente o completá el catálogo"
      );
    }

    // Armamos y validamos todo en memoria antes de persistir nada, mismo
    // criterio que POST /api/batches.
    const numeroLote = await getNextNumeroClonacion(parsed.fechaInicio);

    const placasToCreate = Array.from(
      { length: parsed.cantidadPlacas },
      (_, i) => ({
        numeroPlaca: `${numeroLote}-P${String(i + 1).padStart(2, "0")}`,
      })
    );

    const clonacion = await Clonacion.create({
      numeroLote,
      fungusTypeId: parsed.fungusTypeId,
      colonizacion: {
        cantidadPlacas: parsed.cantidadPlacas,
        fechaInicio: parsed.fechaInicio,
        diasEsperados,
      },
    });

    // La Clonacion ya esta persistida (numeroLote unico reservado via
    // Counter). Sin transaccion multi-documento (Mongo standalone, mismo
    // criterio que POST /api/batches): si la insercion de Placas fallara a
    // mitad de camino no hacemos rollback complejo.
    let placas;
    try {
      placas = await Placa.insertMany(
        placasToCreate.map((p) => ({ ...p, clonacionId: clonacion._id }))
      );
    } catch (placaErr) {
      return handleApiError(placaErr);
    }

    return ok({ ...clonacion.toObject(), placas }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
