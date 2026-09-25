"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { PlusIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/kallampa/PageHeader";
import { apiFetch } from "@/lib/api-client";
import type { FungusType } from "@/lib/types";
import { FungusTypeFormDialog } from "./FungusTypeFormDialog";

export function FungusTypeTable() {
  const t = useTranslations("components.fungusTypeTable");
  const [items, setItems] = useState<FungusType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogTarget, setDialogTarget] = useState<FungusType | "new" | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<FungusType[]>("/api/fungus-types");
      setItems(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void Promise.resolve().then(() => cargar());
  }, [cargar]);

  async function toggleActivo(item: FungusType) {
    try {
      await apiFetch(`/api/fungus-types/${item._id}`, {
        method: "PATCH",
        body: JSON.stringify({ activo: !item.activo }),
      });
      toast.success(item.activo ? t("desactivadoMessage") : t("activadoMessage"));
      cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("updateError"));
    }
  }

  return (
    <div className="rounded-lg bg-surface-card px-4 pt-3 pb-2.5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12.5px] text-text-subtle tabular-nums">
          {loading ? "" : t("count", { count: items.length })}
        </span>
        <Button size="sm" onClick={() => setDialogTarget("new")}>
          <PlusIcon /> {t("nuevoHongo")}
        </Button>
      </div>

      {loading ? (
        <EmptyState>{t("cargando")}</EmptyState>
      ) : items.length === 0 ? (
        <EmptyState>{t("emptyState")}</EmptyState>
      ) : (
        <Table minWidth={560} containerClassName="mt-1.5">
          <TableHeader>
            <TableRow>
              <TableHead>{t("nombre")}</TableHead>
              <TableHead>{t("diasEsperados")}</TableHead>
              <TableHead>{t("estado")}</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item._id}>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{item.nombre}</span>
                    {item.iniciales && <Badge variant="outline">{item.iniciales}</Badge>}
                  </div>
                  {item.nombreCientifico && (
                    <div className="text-[11.5px] text-text-subtle italic">
                      {item.nombreCientifico}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-text-muted tabular-nums">
                  {item.diasEsperadosDefault.inoculacionGrano} / {" "}
                  {item.diasEsperadosDefault.incubacion} / {" "}
                  {item.diasEsperadosDefault.fructificacion} / {" "}
                  {item.diasEsperadosDefault.colonizacionPlacas ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={item.activo ? "default" : "outline"}>
                    {item.activo ? t("activo") : t("inactivo")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("editar")}
                      title={t("editar")}
                      onClick={() => setDialogTarget(item)}
                    >
                      <PencilSimpleIcon />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleActivo(item)}>
                      {item.activo ? t("desactivar") : t("activar")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {dialogTarget && (
        <FungusTypeFormDialog
          key={dialogTarget === "new" ? "new" : dialogTarget._id}
          open={!!dialogTarget}
          onOpenChange={(open) => {
            if (!open) setDialogTarget(null);
          }}
          fungusType={dialogTarget === "new" ? undefined : dialogTarget}
          onSuccess={cargar}
        />
      )}
    </div>
  );
}
