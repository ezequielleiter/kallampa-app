"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChoiceList } from "@/components/kallampa/ChoiceList";
import { StatusTag } from "@/components/kallampa/StatusTag";
import type { StatsLote } from "@/lib/types";

interface LoteSelectorProps {
  lotes: StatsLote[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function LoteSelector({ lotes, selectedIds, onChange }: LoteSelectorProps) {
  const t = useTranslations("components.loteSelector");
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

  function remove(id: string) {
    onChange(selectedIds.filter((x) => x !== id));
  }

  return (
    <div className="flex flex-col gap-3">
      {selectedLotes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {selectedLotes.map((l) => (
            <Badge key={l._id} variant="secondary" className="gap-1 pr-1 tabular-nums">
              {l.numeroLote}
              <button
                type="button"
                onClick={() => remove(l._id)}
                aria-label={t("removeFromComparison", { numeroLote: l.numeroLote })}
                className="grid size-4 place-items-center rounded-sm hover:bg-accent/15"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
          <Button type="button" variant="ghost" size="xs" onClick={() => onChange([])}>
            {t("limpiarSeleccion")}
          </Button>
        </div>
      )}

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
        type="checkbox"
        value={selectedIds}
        onChange={onChange}
        className="max-h-56"
        empty={t("emptyState")}
        items={filtered.map((l) => ({
          value: l._id,
          label: <span className="font-medium">{l.numeroLote}</span>,
          meta: l.fungusTypeId?.nombre,
          aside: <StatusTag kind="lote" estado={l.resumen.estadoDerivado} />,
        }))}
      />
    </div>
  );
}
