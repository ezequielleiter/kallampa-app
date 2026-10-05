"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { MinusCircleIcon, PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFormat } from "@/components/kallampa/useFormat";
import { VentaFormDialog } from "@/components/ventas/VentaFormDialog";
import { MermaFormDialog } from "@/components/ventas/MermaFormDialog";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { BatchDetail, VentaListItem } from "@/lib/types";

interface LoteVentasProps {
  batch: BatchDetail;
  onChanged: () => void;
}

/**
 * Ventas del lote: card en la columna derecha del detalle. Resume ingresos,
 * margen y stock, lista las ventas que tocaron este lote y permite registrar
 * una venta o una merma.
 */
export function LoteVentas({ batch, onChanged }: LoteVentasProps) {
  const t = useTranslations("components.loteVentas");
  const fmt = useFormat();
  const comercial = batch.comercial;
  const [ventas, setVentas] = useState<VentaListItem[] | null>(null);
  const [ventaOpen, setVentaOpen] = useState(false);
  const [mermaOpen, setMermaOpen] = useState(false);

  const cargarVentas = useCallback(async () => {
    try {
      const data = await apiFetch<VentaListItem[]>(`/api/ventas?batchId=${batch._id}`);
      setVentas(data);
    } catch (err) {
      setVentas([]);
      toast.error(err instanceof Error ? err.message : t("loadError"));
    }
  }, [batch._id, t]);

  useEffect(() => {
    void Promise.resolve().then(() => cargarVentas());
  }, [cargarVentas]);

  function despuesDeGuardar() {
    void cargarVentas();
    onChanged();
  }

  const disponible = comercial?.disponibleKg ?? 0;
  const sinStock = disponible <= 0;

  return (
    <div className="rounded-lg bg-surface-card p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="m-0 text-sm font-medium">{t("title")}</h2>
        <Link href="/ventas" className="text-[12.5px] text-text-subtle hover:text-accent-300">
          {t("verTodas")}
        </Link>
      </div>

      {comercial && (
        <ul className="mt-3 mb-0 flex list-none flex-col divide-y divide-divider p-0 text-[13px]">
          <Fila label={t("ingresos")} valor={fmt.money(comercial.ingresos)} />
          <Fila
            label={t("margen")}
            hint={t("margenHint")}
            valor={fmt.money(comercial.margen)}
            className={cn(comercial.margen < 0 && "text-danger-text")}
          />
          <Fila
            label={t("precioPromedio")}
            valor={
              comercial.precioPromedioKg != null
                ? `${fmt.money(comercial.precioPromedioKg)}/kg`
                : "—"
            }
          />
          <Fila label={t("vendido")} valor={fmt.kg(comercial.vendidoKg, 2)} />
          <Fila label={t("merma")} valor={fmt.kg(comercial.mermaKg, 2)} />
          <Fila label={t("disponible")} valor={fmt.kg(comercial.disponibleKg, 2)} />
        </ul>
      )}

      <div className="mt-3 border-t border-divider pt-2.5">
        {ventas === null ? (
          <p className="m-0 text-[13px] text-text-subtle">{t("loading")}</p>
        ) : ventas.length === 0 ? (
          <p className="m-0 text-[13px] text-text-subtle">{t("sinVentas")}</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[12.5px]">
            {ventas.map((v) => {
              const item = v.items.find((i) => i.batchId._id === batch._id);
              const kg = item?.kg ?? 0;
              const monto = item ? item.kg * item.precioPorKg : 0;
              return (
                <li key={v._id}>
                  <Link
                    href="/ventas"
                    className="flex items-center justify-between gap-2 rounded-sm hover:text-accent-300"
                  >
                    <span className="min-w-0 truncate">
                      <span className="text-text-subtle tabular-nums">{fmt.fecha(v.fecha)}</span>
                      {" · "}
                      {v.clienteId?.nombre ?? t("consumidorFinal")}
                      {!v.cobrada && (
                        <Badge variant="secondary" className="ml-1.5 align-middle">
                          {t("pendiente")}
                        </Badge>
                      )}
                    </span>
                    <span className="shrink-0 whitespace-nowrap tabular-nums">
                      {fmt.kg(kg, 2)} · {fmt.money(monto)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-3 flex flex-col items-end gap-1.5">
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" disabled={sinStock} onClick={() => setMermaOpen(true)}>
            <MinusCircleIcon /> {t("merma")}
          </Button>
          <Button size="sm" disabled={sinStock} onClick={() => setVentaOpen(true)}>
            <PlusIcon /> {t("registrarVenta")}
          </Button>
        </div>
        {sinStock && <p className="m-0 text-xs text-text-subtle">{t("sinStockHint")}</p>}
      </div>

      <VentaFormDialog
        open={ventaOpen}
        onOpenChange={setVentaOpen}
        batchIdInicial={batch._id}
        onSaved={despuesDeGuardar}
      />
      <MermaFormDialog
        open={mermaOpen}
        onOpenChange={setMermaOpen}
        batchIdInicial={batch._id}
        onSaved={despuesDeGuardar}
      />
    </div>
  );
}

function Fila({
  label,
  valor,
  hint,
  className,
}: {
  label: string;
  valor: string;
  hint?: string;
  className?: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-1.5 first:pt-0">
      <span className="text-text-muted" title={hint}>
        {label}
      </span>
      <span className={cn("font-medium tabular-nums", className)}>{valor}</span>
    </li>
  );
}
