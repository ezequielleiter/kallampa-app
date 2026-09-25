"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { CalendarioResponse, Tarea, LotePill } from "@/lib/types";
import { LOTE_PILL_COLORS } from "@/lib/constants";
import { TareaFormDialog } from "@/components/calendario/TareaFormDialog";
import { useAppLocale } from "@/components/shared/LocaleProvider";
import { EmptyState, PageContainer, PageHeader } from "@/components/kallampa/PageHeader";

// Clave YYYY-MM-DD en horario LOCAL (para comparar contra celdas de la
// grilla, que tambien se generan en horario local). Distinto del criterio
// UTC que usa el backend para filtrar el mes -- acá es solo UI.
function toKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function CalendarioPage() {
  const router = useRouter();
  const t = useTranslations("pages.calendario");
  const tPill = useTranslations("estados.lotePill");
  const { locale } = useAppLocale();
  const DIAS_SEMANA = [
    t("dayMon"),
    t("dayTue"),
    t("dayWed"),
    t("dayThu"),
    t("dayFri"),
    t("daySat"),
    t("daySun"),
  ];
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [data, setData] = useState<CalendarioResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [tareaEditando, setTareaEditando] = useState<Tarea | null>(null);
  const [fechaNueva, setFechaNueva] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<CalendarioResponse>(
        `/api/calendario?year=${year}&month=${month}`
      );
      setData(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [year, month, t]);

  useEffect(() => {
    void Promise.resolve().then(() => cargar());
  }, [cargar]);

  function irMesAnterior() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function irMesSiguiente() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function irHoy() {
    const hoy = new Date();
    setYear(hoy.getFullYear());
    setMonth(hoy.getMonth() + 1);
  }

  const dias = useMemo(() => {
    const inicioMes = startOfMonth(new Date(year, month - 1, 1));
    const finMes = endOfMonth(inicioMes);
    const inicioGrilla = startOfWeek(inicioMes, { weekStartsOn: 1 });
    const finGrilla = endOfWeek(finMes, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: inicioGrilla, end: finGrilla });
  }, [year, month]);

  const tareasPorDia = useMemo(() => {
    const map = new Map<string, Tarea[]>();
    for (const t of data?.tareas ?? []) {
      const key = t.fecha.slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return map;
  }, [data]);

  const pillsPorDia = useMemo(() => {
    const map = new Map<string, LotePill[]>();
    for (const p of data?.lotePills ?? []) {
      const key = p.fechaEsperada.slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return map;
  }, [data]);

  const tituloMes = useMemo(() => {
    const raw = new Date(year, month - 1, 1).toLocaleDateString(
      locale === "en" ? "en-US" : "es-AR",
      { month: "long", year: "numeric" }
    );
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [year, month, locale]);

  const hoyKey = toKey(new Date());

  function abrirCreacion(fecha: string) {
    setTareaEditando(null);
    setFechaNueva(fecha);
    setDialogOpen(true);
  }

  function abrirEdicion(tarea: Tarea) {
    setTareaEditando(tarea);
    setFechaNueva(null);
    setDialogOpen(true);
  }

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={irHoy}>
              {t("today")}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={irMesAnterior}
              aria-label={t("prevMonth")}
            >
              <CaretLeftIcon />
            </Button>
            <span className="min-w-36 text-center text-sm font-medium" aria-live="polite">
              {tituloMes}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={irMesSiguiente}
              aria-label={t("nextMonth")}
            >
              <CaretRightIcon />
            </Button>
          </div>
        }
      />

      <div className="overflow-x-auto rounded-lg bg-surface-card p-3 shadow-sm">
        {loading && !data ? (
          <EmptyState>{t("loading")}</EmptyState>
        ) : (
          <div className="grid min-w-[720px] grid-cols-7 gap-1 text-[13px]">
            {DIAS_SEMANA.map((d) => (
              <div
                key={d}
                className="px-2 pt-0.5 pb-1.5 text-[11px] tracking-[0.08em] text-text/60 uppercase"
              >
                {d}
              </div>
            ))}
            {dias.map((dia) => {
              const key = toKey(dia);
              const esDelMes = dia.getMonth() === month - 1;
              const esHoy = key === hoyKey;
              const tareasDia = tareasPorDia.get(key) ?? [];
              const pillsDia = pillsPorDia.get(key) ?? [];
              return (
                <div
                  key={key}
                  className={cn(
                    "group flex min-h-24 cursor-pointer flex-col gap-1 rounded-md bg-surface-inset p-1.5 transition-colors hover:shadow-[inset_0_0_0_1px_var(--color-divider)]",
                    !esDelMes && "bg-transparent opacity-55",
                    esHoy && "shadow-[inset_0_0_0_1px_var(--color-accent)] hover:shadow-[inset_0_0_0_1px_var(--color-accent)]"
                  )}
                  onClick={() => abrirCreacion(key)}
                >
                  <span
                    className={cn(
                      "grid size-5 place-items-center rounded-full text-xs tabular-nums",
                      esDelMes ? "text-text-muted" : "text-text-subtle",
                      esHoy && "bg-accent-800 font-medium text-accent-100"
                    )}
                  >
                    {dia.getDate()}
                  </span>
                  <div className="flex flex-col gap-1">
                    {tareasDia.map((t) => (
                      <button
                        key={t._id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirEdicion(t);
                        }}
                        className={cn(
                          "truncate rounded-sm bg-neutral-800 px-1.5 py-0.5 text-left text-[11.5px] text-neutral-100 transition-colors hover:bg-neutral-700",
                          t.estado === "hecha" && "text-text-subtle line-through opacity-70"
                        )}
                        title={t.titulo}
                      >
                        {t.titulo}
                      </button>
                    ))}
                    {pillsDia.map((p) => (
                      <button
                        key={`${p.tipo}-${p.codigo}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(p.href);
                        }}
                        style={{ backgroundColor: LOTE_PILL_COLORS[p.tipo] }}
                        className="truncate rounded-sm px-1.5 py-0.5 text-left text-[11.5px] text-accent-100 tabular-nums transition-[filter] hover:brightness-115"
                        title={`${tPill(p.tipo)} · ${p.codigo}`}
                      >
                        {tPill(p.tipo)} · {p.codigo}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TareaFormDialog
        key={tareaEditando ? tareaEditando._id : `nueva-${fechaNueva ?? ""}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tarea={tareaEditando}
        fechaInicial={fechaNueva}
        onSuccess={cargar}
        onDeleted={cargar}
      />
    </PageContainer>
  );
}
