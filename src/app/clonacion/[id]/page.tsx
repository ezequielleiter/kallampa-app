"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("pages.clonacionDetalle");
  const [clonacion, setClonacion] = useState<ClonacionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const data = await apiFetch<ClonacionDetail>(`/api/clonaciones/${params.id}`);
      setClonacion(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [params.id, t]);

  useEffect(() => {
    void Promise.resolve().then(() => cargar());
  }, [cargar]);

  if (loading) {
    return <p className="p-4 text-sm text-muted-foreground">{t("loading")}</p>;
  }

  if (!clonacion) {
    return <p className="p-4 text-sm text-muted-foreground">{t("notFound")}</p>;
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
          {t("backToClonaciones")}
        </Button>
        <Button variant="outline" size="sm" render={<Link href="/trazabilidad" />}>
          <Network /> {t("viewTraceability")}
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{clonacion.numeroLote}</h1>
            {placasDemoradas > 0 && (
              <Badge variant="destructive">
                <TriangleAlert /> {t("delayedPlacas", { count: placasDemoradas })}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {clonacion.fungusTypeId?.nombre}
            {clonacion.fungusTypeId?.nombreCientifico
              ? ` (${clonacion.fungusTypeId.nombreCientifico})`
              : ""}
            {" · "}
            {t("startedOn")}{" "}
            {formatFechaCorta(clonacion.fechaInicio)}
          </p>
          {clonacion.origenProceso !== "placa" && clonacion.cantidadFrascos !== undefined && (
            <p className="text-sm text-muted-foreground">
              {t("cantidadFrascosLabel")}:{" "}
              <span className="font-medium">{clonacion.cantidadFrascos}</span>
            </p>
          )}
          {origenBatch && (
            <p className="text-sm text-muted-foreground">
              {t("startedFromBatch")}{" "}
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
            <CardTitle>{t("colonizacionTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">{t("cantidadPlacas")}</span>
                <span className="font-medium">{clonacion.colonizacion?.cantidadPlacas}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">{t("fechaInicio")}</span>
                <span className="font-medium">
                  {formatFechaCorta(clonacion.colonizacion?.fechaInicio ?? "")}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">{t("diasEsperados")}</span>
                <span className="font-medium">{clonacion.colonizacion?.diasEsperados}</span>
              </div>
            </div>
            {clonacion.recetaAgar && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">{t("recetaAgar")}</span>
                <p className="whitespace-pre-wrap text-sm">{clonacion.recetaAgar}</p>
              </div>
            )}
            <PlacasGrid placas={clonacion.placas} onChanged={cargar} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("micelioLiquido")}</CardTitle>
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
