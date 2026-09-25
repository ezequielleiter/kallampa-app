"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  FlaskIcon,
  MagnifyingGlassIcon,
  PlantIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChoiceList } from "@/components/kallampa/ChoiceList";
import { EmptyState, PageContainer, PageHeader } from "@/components/kallampa/PageHeader";
import { StatusTag } from "@/components/kallampa/StatusTag";
import { useFormat } from "@/components/kallampa/useFormat";
import { useBreadcrumbs } from "@/components/shared/Breadcrumbs";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type {
  TrazabilidadClonacion,
  TrazabilidadLote,
  TrazabilidadResponse,
} from "@/lib/types";

/**
 * Nodo del arbol de trazabilidad: card inset clicable con el tipo (lote /
 * clonacion) como kicker, el codigo y datos breves. El lote elegido lleva
 * borde de acento.
 */
function TraceNode({
  kind,
  label,
  code,
  highlighted = false,
  onClick,
  children,
}: {
  kind: "lote" | "clonacion";
  label: string;
  code: string;
  highlighted?: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  const Icon = kind === "lote" ? PlantIcon : FlaskIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full max-w-2xl flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-surface-inset px-3.5 py-2.5 text-left text-[13px] transition-colors hover:bg-neutral-800",
        highlighted && "shadow-[inset_0_0_0_1px_var(--color-accent)]"
      )}
    >
      <Icon className="size-4 shrink-0 text-accent" />
      <span className="text-[11px] tracking-[0.08em] text-text-subtle uppercase">{label}</span>
      <span className="font-medium tabular-nums">{code}</span>
      {children}
    </button>
  );
}

function NodeMeta({ children }: { children: React.ReactNode }) {
  return <span className="text-xs text-text-subtle tabular-nums">{children}</span>;
}

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
  const tNav = useTranslations("nav");
  const fmt = useFormat();
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

  const loteElegido = data?.lotes.find((l) => l._id === loteId) ?? null;
  useBreadcrumbs(
    loteElegido
      ? [{ label: tNav("trazabilidad"), href: "/trazabilidad" }, { label: loteElegido.numeroLote }]
      : null
  );

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

  if (loading || !data) {
    return (
      <PageContainer>
        <PageHeader title={t("title")} />
        <EmptyState>{loading ? t("loading") : t("loadErrorFull")}</EmptyState>
      </PageContainer>
    );
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
        <TraceNode
          kind="lote"
          label={t("loteLabel")}
          code={lote.numeroLote}
          highlighted={destacado}
          onClick={() => router.push(`/lotes/${lote._id}`)}
        >
          <span className="text-text-muted">{lote.fungusTypeId?.nombre}</span>
          <StatusTag kind="lote" estado={lote.resumen.estadoDerivado} />
          <NodeMeta>
            {t("ebLabel")} {fmt.pct(lote.resumen.eficienciaBiologica)}
          </NodeMeta>
          <NodeMeta>
            {lote.resumen.diasTotales !== null
              ? t("diasCount", { count: lote.resumen.diasTotales })
              : "—"}
          </NodeMeta>
        </TraceNode>
        {hijos.length > 0 && (
          <div className="ml-[21px] flex flex-col gap-2 border-l border-divider pl-4">
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
      r.frascosLiquidosColonizando +
      r.frascosLiquidosColonizados +
      r.frascosLiquidosVacios +
      r.frascosLiquidosFinalizados +
      r.frascosLiquidosContaminados;

    return (
      <div key={clave} className="flex flex-col gap-2">
        <TraceNode
          kind="clonacion"
          label={t("clonacionLabel")}
          code={clonacion.numeroLote}
          onClick={() => router.push(`/clonacion/${clonacion._id}`)}
        >
          <span className="text-text-muted">{clonacion.fungusTypeId?.nombre}</span>
          <NodeMeta>{t("placasCount", { count: totalPlacas })}</NodeMeta>
          <NodeMeta>{t("frascosLiquidosCount", { count: totalFrascosLiquidos })}</NodeMeta>
        </TraceNode>
        {hijos.length > 0 && (
          <div className="ml-[21px] flex flex-col gap-2 border-l border-divider pl-4">
            {hijos.map((l) => renderLoteNodo(l, siguientesVisitados))}
          </div>
        )}
      </div>
    );
  }

  const ancestros = loteSeleccionado ? ancestrosDe(loteSeleccionado) : [];

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        subtitle={loteSeleccionado ? loteSeleccionado.numeroLote : t("subtitle")}
        actions={
          loteSeleccionado && (
            <Button variant="outline" onClick={() => setLoteId(null)}>
              <ArrowLeftIcon /> {t("chooseAnotherLote")}
            </Button>
          )
        }
      />

      {!loteSeleccionado && (
        <div className="flex flex-col gap-3 rounded-lg bg-surface-card px-5 py-4 shadow-sm">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-text-subtle" />
            <Input
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-[30px]"
            />
          </div>
          <ChoiceList
            type="radio"
            value={loteId ?? undefined}
            onChange={setLoteId}
            className="max-h-96"
            empty={lotes.length === 0 ? t("noLotes") : t("noSearchResults")}
            items={lotesFiltrados.map((l) => ({
              value: l._id,
              label: <span className="font-medium">{l.numeroLote}</span>,
              meta: l.fungusTypeId?.nombre,
              aside: <StatusTag kind="lote" estado={l.resumen.estadoDerivado} />,
            }))}
          />
        </div>
      )}

      {loteSeleccionado && (
        <div className="flex flex-col gap-4 rounded-lg bg-surface-card px-5 py-4 shadow-sm">
          <section className="flex flex-col gap-2">
            <h2 className="m-0 text-xs font-normal tracking-[0.05em] text-accent uppercase">
              {t("whereFrom")}
            </h2>
            {ancestros.length === 0 ? (
              <p className="text-[13px] text-text-subtle">{t("noOrigin")}</p>
            ) : (
              <div className="flex flex-col items-start gap-1">
                {ancestros.map((nodo, i) => (
                  <div key={i} className="flex w-full flex-col items-start gap-1">
                    {nodo.tipo === "lote" ? (
                      <TraceNode
                        kind="lote"
                        label={t("loteLabel")}
                        code={nodo.lote.numeroLote}
                        onClick={() => router.push(`/lotes/${nodo.lote._id}`)}
                      >
                        <span className="text-text-muted">{nodo.lote.fungusTypeId?.nombre}</span>
                        <NodeMeta>
                          {t("ebLabel")} {fmt.pct(nodo.lote.resumen.eficienciaBiologica)}
                        </NodeMeta>
                      </TraceNode>
                    ) : (
                      <TraceNode
                        kind="clonacion"
                        label={t("clonacionLabel")}
                        code={nodo.clonacion.numeroLote}
                        onClick={() => router.push(`/clonacion/${nodo.clonacion._id}`)}
                      >
                        {nodo.clonacion.origenJarId &&
                          typeof nodo.clonacion.origenJarId === "object" && (
                            <NodeMeta>
                              {t("fromJar")} {nodo.clonacion.origenJarId.numeroGuia}
                            </NodeMeta>
                          )}
                        {nodo.clonacion.origenRecipienteId &&
                          typeof nodo.clonacion.origenRecipienteId === "object" && (
                            <NodeMeta>
                              {t("fromRecipiente")}{" "}
                              {nodo.clonacion.origenRecipienteId.numeroSeguimiento}
                            </NodeMeta>
                          )}
                      </TraceNode>
                    )}
                    <ArrowDownIcon className="ml-3.5 size-3.5 text-text-subtle" />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="m-0 text-xs font-normal tracking-[0.05em] text-accent uppercase">
              {ancestros.length > 0
                ? t("selectedLoteAndDescendants")
                : t("loteAndDescendants")}
            </h2>
            {renderLoteNodo(loteSeleccionado, new Set(), true)}
          </section>
        </div>
      )}
    </PageContainer>
  );
}
