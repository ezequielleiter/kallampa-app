"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api-client";
import { formatFechaCorta } from "@/lib/format";
import type { ClonacionListItem, ClonacionResumen } from "@/lib/types";

function placasResumenLabel(resumen: ClonacionResumen): string {
  const partes = [
    resumen.placasColonizado > 0 && `${resumen.placasColonizado} colonizado`,
    resumen.placasColonizando > 0 && `${resumen.placasColonizando} colonizando`,
    resumen.placasContaminado > 0 && `${resumen.placasContaminado} contaminado`,
  ].filter(Boolean);
  return partes.length > 0 ? partes.join(", ") : "—";
}

function frascosLiquidosResumenLabel(resumen: ClonacionResumen): string {
  const partes = [
    resumen.frascosLiquidosValidos > 0 && `${resumen.frascosLiquidosValidos} válido${resumen.frascosLiquidosValidos === 1 ? "" : "s"}`,
    resumen.frascosLiquidosVacios > 0 &&
      `${resumen.frascosLiquidosVacios} vacío${resumen.frascosLiquidosVacios === 1 ? "" : "s"}`,
    resumen.frascosLiquidosFinalizados > 0 &&
      `${resumen.frascosLiquidosFinalizados} finalizado${resumen.frascosLiquidosFinalizados === 1 ? "" : "s"}`,
    resumen.frascosLiquidosContaminados > 0 &&
      `${resumen.frascosLiquidosContaminados} contaminado${resumen.frascosLiquidosContaminados === 1 ? "" : "s"}`,
  ].filter(Boolean);
  return partes.length > 0 ? partes.join(", ") : "—";
}

export default function ClonacionPage() {
  const router = useRouter();
  const [clonaciones, setClonaciones] = useState<ClonacionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<ClonacionListItem[]>("/api/clonaciones");
      setClonaciones(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron cargar las clonaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => cargar());
  }, [cargar]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Clonación</h1>
        <Button size="sm" onClick={() => router.push("/clonacion/nueva")}>
          <Plus /> Nueva clonación
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : clonaciones.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay clonaciones cargadas.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° de clonación</TableHead>
              <TableHead>Hongo</TableHead>
              <TableHead>Fecha de inicio</TableHead>
              <TableHead>Placas</TableHead>
              <TableHead>Frascos líquidos</TableHead>
              <TableHead>Alertas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clonaciones.map((clonacion) => (
              <TableRow
                key={clonacion._id}
                className="cursor-pointer"
                onClick={() => router.push(`/clonacion/${clonacion._id}`)}
              >
                <TableCell className="font-medium">{clonacion.numeroLote}</TableCell>
                <TableCell>{clonacion.fungusTypeId?.nombre}</TableCell>
                <TableCell>{formatFechaCorta(clonacion.colonizacion.fechaInicio)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {placasResumenLabel(clonacion.resumen)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {frascosLiquidosResumenLabel(clonacion.resumen)}
                </TableCell>
                <TableCell>
                  {clonacion.resumen.alertas > 0 && (
                    <Badge variant="destructive">
                      <TriangleAlert /> {clonacion.resumen.alertas} alerta
                      {clonacion.resumen.alertas === 1 ? "" : "s"}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
