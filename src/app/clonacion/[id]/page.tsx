"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { TriangleAlert, Network } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlacasGrid } from "@/components/clonacion/PlacasGrid";
import { FrascosLiquidosSection } from "@/components/clonacion/FrascosLiquidosSection";
import { apiFetch } from "@/lib/api-client";
import { formatFechaCorta } from "@/lib/format";
import { diasTranscurridos } from "@/lib/recipiente-utils";
import type { ClonacionDetail } from "@/lib/types";

export default function ClonacionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [clonacion, setClonacion] = useState<ClonacionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const data = await apiFetch<ClonacionDetail>(`/api/clonaciones/${params.id}`);
      setClonacion(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cargar la clonación");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void Promise.resolve().then(() => cargar());
  }, [cargar]);

  if (loading) {
    return <p className="p-4 text-sm text-muted-foreground">Cargando…</p>;
  }

  if (!clonacion) {
    return <p className="p-4 text-sm text-muted-foreground">Clonación no encontrada.</p>;
  }

  const placasDemoradas = clonacion.placas.filter((p) => {
    if (clonacion.origenProceso !== "placa") return false;
    if (p.estado !== "colonizando") return false;
    const dias = diasTranscurridos(clonacion.colonizacion?.fechaInicio ?? "");
    return dias !== null && dias > (clonacion.colonizacion?.diasEsperados ?? 0);
  }).length;

  const origenBatch =
    typeof clonacion.origenBatchId === "object" ? clonacion.origenBatchId : null;
  const origenEtiqueta =
    clonacion.origenTipo === "jar" && typeof clonacion.origenJarId === "object"
      ? clonacion.origenJarId.numeroGuia
      : clonacion.origenTipo === "recipiente" && typeof clonacion.origenRecipienteId === "object"
        ? clonacion.origenRecipienteId.numeroSeguimiento
        : null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push("/clonacion")}>
          ← Volver a clonación
        </Button>
        <Button variant="outline" size="sm" render={<Link href="/trazabilidad" />}>
          <Network /> Ver árbol de trazabilidad
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{clonacion.numeroLote}</h1>
            {placasDemoradas > 0 && (
              <Badge variant="destructive">
                <TriangleAlert /> {placasDemoradas} placa{placasDemoradas === 1 ? "" : "s"} demorada
                {placasDemoradas === 1 ? "" : "s"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {clonacion.fungusTypeId?.nombre}
            {clonacion.fungusTypeId?.nombreCientifico
              ? ` (${clonacion.fungusTypeId.nombreCientifico})`
              : ""}
            {" · Iniciada el "}
            {formatFechaCorta(clonacion.fechaInicio)}
          </p>
          {clonacion.origenProceso !== "placa" && clonacion.cantidadFrascos !== undefined && (
            <p className="text-sm text-muted-foreground">
              Cantidad de frascos: <span className="font-medium">{clonacion.cantidadFrascos}</span>
            </p>
          )}
          {origenBatch && (
            <p className="text-sm text-muted-foreground">
              Iniciada desde el lote{" "}
              <Link href={`/lotes/${origenBatch._id}`} className="font-medium text-primary hover:underline">
                {origenBatch.numeroLote}
              </Link>
              {origenEtiqueta ? ` (${origenEtiqueta})` : ""}
            </p>
          )}
        </CardContent>
      </Card>

      {clonacion.origenProceso === "placa" && (
        <Card>
          <CardHeader>
            <CardTitle>1. Colonización de placas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Cantidad de placas</span>
                <span className="font-medium">{clonacion.colonizacion?.cantidadPlacas}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Fecha de inicio</span>
                <span className="font-medium">
                  {formatFechaCorta(clonacion.colonizacion?.fechaInicio ?? "")}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Días esperados</span>
                <span className="font-medium">{clonacion.colonizacion?.diasEsperados}</span>
              </div>
            </div>
            {clonacion.recetaAgar && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Receta de agar</span>
                <p className="whitespace-pre-wrap text-sm">{clonacion.recetaAgar}</p>
              </div>
            )}
            <PlacasGrid placas={clonacion.placas} onChanged={cargar} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Micelio líquido</CardTitle>
        </CardHeader>
        <CardContent>
          <FrascosLiquidosSection
            clonacionId={clonacion._id}
            frascosLiquidos={clonacion.frascosLiquidos}
            onChanged={cargar}
            permiteAgregar={clonacion.origenProceso === "placa"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
