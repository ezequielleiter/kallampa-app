"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import { ESTADO_DERIVADO_BADGE_VARIANT } from "@/lib/constants";
import type {
  TrazabilidadClonacion,
  TrazabilidadLote,
  TrazabilidadResponse,
} from "@/lib/types";

/**
 * Esta página muestra la trazabilidad de UN lote elegido, no un bosque
 * general: primero se busca/elige el lote, y recién ahí se arma (100% en
 * el cliente, a partir del material crudo de `GET /api/trazabilidad`) la
 * cadena de ANCESTROS (de dónde vino ese lote) y el árbol de DESCENDIENTES
 * (qué clonaciones se hicieron a partir de él, y qué lotes salieron de
 * esas clonaciones), con el lote elegido en el medio.
 *
 * Resolución de links:
 * - Lote -> Clonación de origen: lote.origenFrascoLiquidoId -> frascoLiquido
 *   -> frascoLiquido.clonacionId -> esa Clonación.
 * - Clonación -> Lote de origen: clonacion.origenBatchId -> ese Lote.
 * - Lote -> Clonaciones hijas: clonaciones con origenBatchId === lote._id.
 * - Clonación -> Lotes hijos: frascosLiquidos con clonacionId === esa
 *   clonación, después lotes cuyo origenFrascoLiquidoId esté en esos ids.
 */
export default function TrazabilidadPage() {
  const router = useRouter();
  const t = useTranslations("pages.trazabilidad");
  const tEstado = useTranslations("estados.lote");
  const [data, setData] = useState<TrazabilidadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [loteId, setLoteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      try {
        const res = await apiFetch<TrazabilidadResponse>("/api/trazabilidad");
        if (!cancelado) setData(res);
      } catch (err) {
        if (!cancelado) {
          toast.error(err instanceof Error ? err.message : t("loadError"));
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    }
    void cargar();
    return () => {
      cancelado = true;
    };
  }, [t]);

  const lotesFiltrados = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.lotes;
    return data.lotes.filter(
      (l) =>
        l.numeroLote.toLowerCase().includes(q) ||
        l.fungusTypeId?.nombre?.toLowerCase().includes(q)
    );
  }, [data, query]);

  if (loading) {
    return <p className="p-4 text-sm text-muted-foreground">{t("loading")}</p>;
  }

  if (!data) {
    return <p className="p-4 text-sm text-muted-foreground">{t("loadErrorFull")}</p>;
  }

  const { lotes, clonaciones, frascosLiquidos } = data;
  const loteSeleccionado = lotes.find((l) => l._id === loteId) ?? null;

  // --- índices para resolver la cadena en ambas direcciones ---
  const clonacionPorId = new Map(clonaciones.map((c) => [c._id, c]));
  const lotePorId = new Map(lotes.map((l) => [l._id, l]));
  const frascoLiquidoPorId = new Map(frascosLiquidos.map((f) => [f._id, f]));

  const clonacionesPorLoteOrigen = new Map<string, TrazabilidadClonacion[]>();
  for (const c of clonaciones) {
    if (!c.origenBatchId) continue;
    const lista = clonacionesPorLoteOrigen.get(c.origenBatchId) ?? [];
    lista.push(c);
    clonacionesPorLoteOrigen.set(c.origenBatchId, lista);
  }

  const frascosIdsPorClonacion = new Map<string, string[]>();
  for (const f of frascosLiquidos) {
    const lista = frascosIdsPorClonacion.get(f.clonacionId) ?? [];
    lista.push(f._id);
    frascosIdsPorClonacion.set(f.clonacionId, lista);
  }

  const lotesPorFrascoOrigen = new Map<string, TrazabilidadLote[]>();
  for (const l of lotes) {
    if (!l.origenFrascoLiquidoId) continue;
    const lista = lotesPorFrascoOrigen.get(l.origenFrascoLiquidoId) ?? [];
    lista.push(l);
    lotesPorFrascoOrigen.set(l.origenFrascoLiquidoId, lista);
  }

  function hijosDeLote(lote: TrazabilidadLote): TrazabilidadClonacion[] {
    return clonacionesPorLoteOrigen.get(lote._id) ?? [];
  }

  function hijosDeClonacion(clonacion: TrazabilidadClonacion): TrazabilidadLote[] {
    const frascoIds = frascosIdsPorClonacion.get(clonacion._id) ?? [];
    const hijos: TrazabilidadLote[] = [];
    for (const fid of frascoIds) {
      hijos.push(...(lotesPorFrascoOrigen.get(fid) ?? []));
    }
    return hijos;
  }

  /** Cadena de ancestros del lote elegido, del más antiguo al más reciente (sin incluir al lote elegido). */
  type AncestroNodo =
    | { tipo: "lote"; lote: TrazabilidadLote }
    | { tipo: "clonacion"; clonacion: TrazabilidadClonacion };

  function ancestrosDe(lote: TrazabilidadLote): AncestroNodo[] {
    const cadena: AncestroNodo[] = [];
    let actual: TrazabilidadLote | undefined = lote;
    const visitados = new Set<string>();
    while (actual?.origenFrascoLiquidoId && !visitados.has(actual._id)) {
      visitados.add(actual._id);
      const frascoId: string | undefined =
        typeof actual.origenFrascoLiquidoId === "string"
          ? actual.origenFrascoLiquidoId
          : undefined;
      const frasco: { _id: string; numeroGuia: string; clonacionId: string } | undefined = frascoId
        ? frascoLiquidoPorId.get(frascoId)
        : undefined;
      const clon: TrazabilidadClonacion | undefined = frasco
        ? clonacionPorId.get(frasco.clonacionId)
        : undefined;
      if (!clon) break;
      cadena.unshift({ tipo: "clonacion", clonacion: clon });
      const loteOrigen: TrazabilidadLote | undefined = clon.origenBatchId
        ? lotePorId.get(clon.origenBatchId)
        : undefined;
      if (loteOrigen) {
        cadena.unshift({ tipo: "lote", lote: loteOrigen });
        actual = loteOrigen;
      } else {
        actual = undefined;
      }
    }
    return cadena;
  }

  function renderLoteNodo(lote: TrazabilidadLote, visitados: Set<string>, destacado = false) {
    const clave = `lote-${lote._id}`;
    if (visitados.has(clave)) return null;
    const siguientesVisitados = new Set(visitados).add(clave);
    const hijos = hijosDeLote(lote);

    return (
      <div key={clave} className="flex flex-col gap-2">
        <Card
          className={`cursor-pointer transition-colors hover:bg-muted ${
            destacado ? "border-primary ring-1 ring-primary" : ""
          }`}
          onClick={() => router.push(`/lotes/${lote._id}`)}
        >
          <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1 py-1">
            <span className="text-xs font-medium text-muted-foreground">{t("loteLabel")}</span>
            <span className="font-semibold">{lote.numeroLote}</span>
            <span className="text-sm text-muted-foreground">{lote.fungusTypeId?.nombre}</span>
            <Badge variant={ESTADO_DERIVADO_BADGE_VARIANT[lote.resumen.estadoDerivado]}>
              {tEstado(lote.resumen.estadoDerivado)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {t("ebLabel")}:{" "}
              {lote.resumen.eficienciaBiologica !== null
                ? `${lote.resumen.eficienciaBiologica.toFixed(1)}%`
                : "—"}
            </span>
            <span className="text-xs text-muted-foreground">
              {lote.resumen.diasTotales !== null
                ? t("diasCount", { count: lote.resumen.diasTotales })
                : "—"}
            </span>
          </CardContent>
        </Card>
        {hijos.length > 0 && (
          <div className="ml-4 flex flex-col gap-2 border-l border-border pl-4">
            {hijos.map((c) => renderClonacionNodo(c, siguientesVisitados))}
          </div>
        )}
      </div>
    );
  }

  function renderClonacionNodo(clonacion: TrazabilidadClonacion, visitados: Set<string>) {
    const clave = `clonacion-${clonacion._id}`;
    if (visitados.has(clave)) return null;
    const siguientesVisitados = new Set(visitados).add(clave);
    const hijos = hijosDeClonacion(clonacion);
    const r = clonacion.resumen;
    const totalPlacas = r.placasColonizando + r.placasColonizado + r.placasContaminado;
    const totalFrascosLiquidos =
      r.frascosLiquidosValidos +
      r.frascosLiquidosVacios +
      r.frascosLiquidosFinalizados +
      r.frascosLiquidosContaminados;

    return (
      <div key={clave} className="flex flex-col gap-2">
        <Card
          className="cursor-pointer border-dashed transition-colors hover:bg-muted"
          onClick={() => router.push(`/clonacion/${clonacion._id}`)}
        >
          <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1 py-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t("clonacionLabel")}
            </span>
            <span className="font-semibold">{clonacion.numeroLote}</span>
            <span className="text-sm text-muted-foreground">
              {clonacion.fungusTypeId?.nombre}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("placasCount", { count: totalPlacas })}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("frascosLiquidosCount", { count: totalFrascosLiquidos })}
            </span>
          </CardContent>
        </Card>
        {hijos.length > 0 && (
          <div className="ml-4 flex flex-col gap-2 border-l border-border pl-4">
            {hijos.map((l) => renderLoteNodo(l, siguientesVisitados))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">{t("title")}</h1>

      {loteSeleccionado && (
        <button
          type="button"
          onClick={() => setLoteId(null)}
          className="self-start text-xs text-muted-foreground underline hover:text-foreground"
        >
          {t("chooseAnotherLote")}
        </button>
      )}

      {!loteSeleccionado && (
        <div className="flex flex-col gap-2">
          <Input
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded-md border p-1">
            {lotesFiltrados.length === 0 ? (
              <p className="p-3 text-center text-sm text-muted-foreground">
                {lotes.length === 0 ? t("noLotes") : t("noSearchResults")}
              </p>
            ) : (
              lotesFiltrados.map((l) => (
                <button
                  key={l._id}
                  type="button"
                  onClick={() => setLoteId(l._id)}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
                >
                  <span className="font-medium">{l.numeroLote}</span>
                  <span className="text-muted-foreground">{l.fungusTypeId?.nombre}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {tEstado(l.resumen.estadoDerivado)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {loteSeleccionado && (
        <div className="flex flex-col gap-2">
          {ancestrosDe(loteSeleccionado).length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("noOrigin")}</p>
          ) : (
            <>
              <p className="text-xs font-medium text-muted-foreground">{t("whereFrom")}</p>
              <div className="flex flex-col items-start gap-1">
                {ancestrosDe(loteSeleccionado).map((nodo, i) => (
                  <div key={i} className="flex flex-col items-start gap-1">
                    {nodo.tipo === "lote" ? (
                      <Card
                        className="cursor-pointer transition-colors hover:bg-muted"
                        onClick={() => router.push(`/lotes/${nodo.lote._id}`)}
                      >
                        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1 py-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            {t("loteLabel")}
                          </span>
                          <span className="font-semibold">{nodo.lote.numeroLote}</span>
                          <span className="text-sm text-muted-foreground">
                            {nodo.lote.fungusTypeId?.nombre}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t("ebLabel")}:{" "}
                            {nodo.lote.resumen.eficienciaBiologica !== null
                              ? `${nodo.lote.resumen.eficienciaBiologica.toFixed(1)}%`
                              : "—"}
                          </span>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card
                        className="cursor-pointer border-dashed transition-colors hover:bg-muted"
                        onClick={() => router.push(`/clonacion/${nodo.clonacion._id}`)}
                      >
                        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1 py-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            {t("clonacionLabel")}
                          </span>
                          <span className="font-semibold">{nodo.clonacion.numeroLote}</span>
                          {nodo.clonacion.origenJarId &&
                            typeof nodo.clonacion.origenJarId === "object" && (
                              <span className="text-xs text-muted-foreground">
                                {t("fromJar")} {nodo.clonacion.origenJarId.numeroGuia}
                              </span>
                            )}
                          {nodo.clonacion.origenRecipienteId &&
                            typeof nodo.clonacion.origenRecipienteId === "object" && (
                              <span className="text-xs text-muted-foreground">
                                {t("fromRecipiente")}{" "}
                                {nodo.clonacion.origenRecipienteId.numeroSeguimiento}
                              </span>
                            )}
                        </CardContent>
                      </Card>
                    )}
                    <ChevronDown className="ml-4 size-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </>
          )}

          <p className="text-xs font-medium text-muted-foreground">
            {ancestrosDe(loteSeleccionado).length > 0
              ? t("selectedLoteAndDescendants")
              : t("loteAndDescendants")}
          </p>
          {renderLoteNodo(loteSeleccionado, new Set(), true)}
        </div>
      )}
    </div>
  );
}
