"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { TriangleAlert } from "lucide-react";
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
    if (p.estado !== "colonizando") return false;
    const dias = diasTranscurridos(clonacion.colonizacion.fechaInicio);
    return dias !== null && dias > clonacion.colonizacion.diasEsperados;
  }).length;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4">
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push("/clonacion")}>
        ← Volver a clonación
      </Button>

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
            {formatFechaCorta(clonacion.colonizacion.fechaInicio)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>1. Colonización de placas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Cantidad de placas</span>
              <span className="font-medium">{clonacion.colonizacion.cantidadPlacas}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Fecha de inicio</span>
              <span className="font-medium">
                {formatFechaCorta(clonacion.colonizacion.fechaInicio)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Días esperados</span>
              <span className="font-medium">{clonacion.colonizacion.diasEsperados}</span>
            </div>
          </div>
          <PlacasGrid placas={clonacion.placas} onChanged={cargar} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Micelio líquido</CardTitle>
        </CardHeader>
        <CardContent>
          <FrascosLiquidosSection
            clonacionId={clonacion._id}
            frascosLiquidos={clonacion.frascosLiquidos}
            onChanged={cargar}
          />
        </CardContent>
      </Card>
    </div>
  );
}
