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
import { CatalogFormDialog, type CatalogItem } from "./CatalogFormDialog";

interface CatalogTableProps {
  endpoint: string; // "/api/grain-types" | "/api/substrate-types"
  itemLabel: string; // "grano" | "sustrato"
}

// Tabla generica reutilizada por Granos y Sustratos: comparten exactamente
// la forma {nombre, notas?, activo}. FungusType tiene su propia tabla porque
// necesita mostrar/editar los diasEsperadosDefault.
export function CatalogTable({ endpoint, itemLabel }: CatalogTableProps) {
  const t = useTranslations("components.catalogTable");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogTarget, setDialogTarget] = useState<CatalogItem | "new" | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<CatalogItem[]>(endpoint);
      setItems(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [endpoint, t]);

  useEffect(() => {
    void Promise.resolve().then(() => cargar());
  }, [cargar]);

  async function toggleActivo(item: CatalogItem) {
    try {
      await apiFetch(`${endpoint}/${item._id}`, {
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
          <PlusIcon /> {t("newItem", { item: itemLabel })}
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
              <TableHead>{t("notas")}</TableHead>
              <TableHead>{t("estado")}</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item._id}>
                <TableCell className="font-medium">{item.nombre}</TableCell>
                <TableCell className="max-w-64 truncate text-text-subtle">
                  {item.notas}
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
        <CatalogFormDialog
          key={dialogTarget === "new" ? "new" : dialogTarget._id}
          open={!!dialogTarget}
          onOpenChange={(open) => {
            if (!open) setDialogTarget(null);
          }}
          endpoint={endpoint}
          item={dialogTarget === "new" ? undefined : dialogTarget}
          onSuccess={cargar}
        />
      )}
    </div>
  );
}
