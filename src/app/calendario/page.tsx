"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
    <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={irHoy}>
            {t("today")}
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={irMesAnterior}
            aria-label={t("prevMonth")}
          >
            <ChevronLeft />
          </Button>
          <span className="min-w-32 text-center text-sm font-medium capitalize">
            {tituloMes}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={irMesSiguiente}
            aria-label={t("nextMonth")}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : (
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border text-sm">
          {DIAS_SEMANA.map((d) => (
            <div
              key={d}
              className="bg-muted px-2 py-1 text-center text-xs font-medium text-muted-foreground"
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
                  "flex min-h-24 cursor-pointer flex-col gap-1 bg-background p-1.5",
                  !esDelMes && "bg-muted/30"
                )}
                onClick={() => abrirCreacion(key)}
              >
                <span
                  className={cn(
                    "w-fit rounded px-1 text-xs",
                    !esDelMes && "text-muted-foreground",
                    esHoy && "bg-primary font-semibold text-primary-foreground"
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
                        "truncate rounded bg-secondary px-1.5 py-0.5 text-left text-xs text-secondary-foreground hover:opacity-80",
                        t.estado === "hecha" && "text-muted-foreground line-through opacity-70"
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
                      className="truncate rounded px-1.5 py-0.5 text-left text-xs text-white hover:opacity-90"
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

      <TareaFormDialog
        key={tareaEditando ? tareaEditando._id : `nueva-${fechaNueva ?? ""}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tarea={tareaEditando}
        fechaInicial={fechaNueva}
        onSuccess={cargar}
        onDeleted={cargar}
      />
    </div>
  );
}
