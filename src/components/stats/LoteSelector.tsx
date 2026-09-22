"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StatsLote } from "@/lib/types";

interface LoteSelectorProps {
  lotes: StatsLote[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function LoteSelector({ lotes, selectedIds, onChange }: LoteSelectorProps) {
  const t = useTranslations("components.loteSelector");
  const tEstado = useTranslations("estados.lote");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lotes;
    return lotes.filter(
      (l) =>
        l.numeroLote.toLowerCase().includes(q) ||
        l.fungusTypeId?.nombre?.toLowerCase().includes(q)
    );
  }, [lotes, query]);

  const selectedLotes = lotes.filter((l) => selectedIds.includes(l._id));

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {selectedLotes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedLotes.map((l) => (
            <Badge key={l._id} variant="secondary" className="gap-1 pr-1">
              {l.numeroLote}
              <button
                type="button"
                onClick={() => toggle(l._id)}
                aria-label={t("removeFromComparison", { numeroLote: l.numeroLote })}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])}>
            {t("limpiarSeleccion")}
          </Button>
        </div>
      )}

      <Input
        placeholder={t("searchPlaceholder")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-md border p-1">
        {filtered.length === 0 ? (
          <p className="p-3 text-center text-sm text-muted-foreground">{t("emptyState")}</p>
        ) : (
          filtered.map((l) => {
            const selected = selectedIds.includes(l._id);
            return (
              <button
                key={l._id}
                type="button"
                onClick={() => toggle(l._id)}
                className={`flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors ${
                  selected ? "bg-accent" : "hover:bg-muted"
                }`}
              >
                <span className="flex size-4 shrink-0 items-center justify-center">
                  {selected && <Check className="size-4 text-primary" />}
                </span>
                <span className="font-medium">{l.numeroLote}</span>
                <span className="text-muted-foreground">{l.fungusTypeId?.nombre}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {tEstado(l.resumen.estadoDerivado)}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
