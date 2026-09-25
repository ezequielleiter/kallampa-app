"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  PlusIcon,
  PencilSimpleIcon,
  ArchiveIcon,
  ArrowCounterClockwiseIcon,
} from "@phosphor-icons/react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageContainer, PageHeader, EmptyState } from "@/components/kallampa/PageHeader";
import { SegmentedControl } from "@/components/kallampa/SegmentedControl";
import { useFormat } from "@/components/kallampa/useFormat";
import { useBreadcrumbs } from "@/components/shared/Breadcrumbs";
import { InvernaderoFormDialog } from "@/components/invernaderos/InvernaderoFormDialog";
import { superficieM2, volumenM3 } from "@/components/invernaderos/medidas";
import { apiFetch } from "@/lib/api-client";
import type { Invernadero } from "@/lib/types";

type Filtro = "activos" | "inactivos" | "todos";

export default function InvernaderosPage() {
  const router = useRouter();
  const t = useTranslations("pages.invernaderos");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const fmt = useFormat();
  const [items, setItems] = useState<Invernadero[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>("activos");
  const [dialogTarget, setDialogTarget] = useState<Invernadero | "new" | null>(null);
  const [desactivarTarget, setDesactivarTarget] = useState<Invernadero | null>(null);
  const [guardando, setGuardando] = useState(false);

  useBreadcrumbs([{ label: tNav("invernaderos") }]);

  const cargar = useCallback(async () => {
    try {
      const data = await apiFetch<Invernadero[]>("/api/invernaderos");
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

  const counts = useMemo(
    () => ({
      activos: items.filter((i) => i.activo).length,
      inactivos: items.filter((i) => !i.activo).length,
      todos: items.length,
    }),
    [items]
  );
  const visibles = items.filter((i) =>
    filtro === "todos" ? true : filtro === "activos" ? i.activo : !i.activo
  );

  async function setActivo(item: Invernadero, activo: boolean) {
    setGuardando(true);
    try {
      await apiFetch(`/api/invernaderos/${item._id}`, {
        method: "PATCH",
        body: JSON.stringify({ activo }),
      });
      toast.success(
        activo
          ? t("reactivadoMessage", { nombre: item.nombre })
          : t("desactivadoMessage", { nombre: item.nombre })
      );
      setDesactivarTarget(null);
      cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("updateError"));
    } finally {
      setGuardando(false);
    }
  }

  const m = (n: number) => fmt.number(n, 2);

  return (
    <PageContainer>
      <PageHeader
        title={tNav("invernaderos")}
        subtitle={loading ? undefined : t("subtitle", { count: counts.activos })}
        actions={
          <>
            <SegmentedControl<Filtro>
              aria-label={t("filterLabel")}
              value={filtro}
              onChange={setFiltro}
              options={[
                { value: "activos", label: t("filterActivos"), count: counts.activos },
                { value: "inactivos", label: t("filterInactivos"), count: counts.inactivos },
                { value: "todos", label: t("filterTodos"), count: counts.todos },
              ]}
            />
            <Button onClick={() => setDialogTarget("new")}>
              <PlusIcon /> {t("nuevo")}
            </Button>
          </>
        }
      />

      <div className="rounded-lg bg-surface-card px-4 pt-1.5 pb-2.5 shadow-sm">
        {loading ? (
          <EmptyState>{t("loading")}</EmptyState>
        ) : visibles.length === 0 ? (
          <EmptyState>{items.length === 0 ? t("empty") : t("emptyFiltered")}</EmptyState>
        ) : (
          <Table minWidth={760}>
            <TableHeader>
              <TableRow>
                <TableHead>{t("colNombre")}</TableHead>
                <TableHead>{t("colMedidas")}</TableHead>
                <TableHead className="text-right">{t("colSuperficie")}</TableHead>
                <TableHead className="text-right">{t("colVolumen")}</TableHead>
                <TableHead className="text-right">{t("colDispositivos")}</TableHead>
                <TableHead>{t("colEstado")}</TableHead>
                <TableHead className="w-[68px]">
                  <span className="sr-only">{tCommon("actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.map((inv) => (
                <TableRow
                  key={inv._id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/invernaderos/${inv._id}`)}
                >
                  <TableCell className="whitespace-normal">
                    <Link
                      href={`/invernaderos/${inv._id}`}
                      className="font-medium hover:text-accent-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {inv.nombre}
                    </Link>
                    {inv.notas && (
                      <div className="max-w-72 truncate text-[11.5px] text-text-subtle">
                        {inv.notas}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-text-body">
                    {t("medidas", { alto: m(inv.altoM), largo: m(inv.largoM), prof: m(inv.profundidadM) })}
                  </TableCell>
                  <TableCell className="text-right">{m(superficieM2(inv))} m²</TableCell>
                  <TableCell className="text-right">{m(volumenM3(inv))} m³</TableCell>
                  <TableCell className="text-right">{inv.dispositivos?.length ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={inv.activo ? "default" : "outline"}>
                      {inv.activo ? t("activo") : t("inactivo")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("editar", { nombre: inv.nombre })}
                        title={t("editar", { nombre: inv.nombre })}
                        className="text-text-muted hover:text-foreground"
                        onClick={() => setDialogTarget(inv)}
                      >
                        <PencilSimpleIcon />
                      </Button>
                      {inv.activo ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("desactivar", { nombre: inv.nombre })}
                          title={t("desactivar", { nombre: inv.nombre })}
                          className="text-text-muted hover:bg-danger-bg hover:text-danger-text"
                          onClick={() => setDesactivarTarget(inv)}
                        >
                          <ArchiveIcon />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("reactivar", { nombre: inv.nombre })}
                          title={t("reactivar", { nombre: inv.nombre })}
                          className="text-text-muted hover:text-foreground"
                          disabled={guardando}
                          onClick={() => setActivo(inv, true)}
                        >
                          <ArrowCounterClockwiseIcon />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {dialogTarget && (
        <InvernaderoFormDialog
          key={dialogTarget === "new" ? "new" : dialogTarget._id}
          open={!!dialogTarget}
          onOpenChange={(open) => {
            if (!open) setDialogTarget(null);
          }}
          invernadero={dialogTarget === "new" ? undefined : dialogTarget}
          onSuccess={cargar}
        />
      )}

      <AlertDialog
        open={!!desactivarTarget}
        onOpenChange={(open) => {
          if (!open) setDesactivarTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {desactivarTarget && t("confirmTitle", { nombre: desactivarTarget.nombre })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("confirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              loading={guardando}
              onClick={() => desactivarTarget && setActivo(desactivarTarget, false)}
            >
              <ArchiveIcon /> {t("confirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
