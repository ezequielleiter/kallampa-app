"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  PlusIcon,
  PencilSimpleIcon,
  TrashIcon,
  ArrowSquareOutIcon,
  WifiHighIcon,
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
import { PageContainer, EmptyState } from "@/components/kallampa/PageHeader";
import { SectionCard } from "@/components/kallampa/SectionCard";
import { KpiGrid } from "@/components/kallampa/Kpi";
import { useFormat } from "@/components/kallampa/useFormat";
import { useBreadcrumbs } from "@/components/shared/Breadcrumbs";
import { InvernaderoFormDialog } from "@/components/invernaderos/InvernaderoFormDialog";
import { DispositivoFormDialog } from "@/components/invernaderos/DispositivoFormDialog";
import { superficieM2, volumenM3 } from "@/components/invernaderos/medidas";
import { apiFetch } from "@/lib/api-client";
import type { Dispositivo, Invernadero } from "@/lib/types";

export default function InvernaderoDetallePage() {
  const params = useParams<{ id: string }>();
  const t = useTranslations("pages.invernaderoDetalle");
  const tLista = useTranslations("pages.invernaderos");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const fmt = useFormat();
  const [invernadero, setInvernadero] = useState<Invernadero | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [dispositivoTarget, setDispositivoTarget] = useState<Dispositivo | "new" | null>(null);
  const [quitarTarget, setQuitarTarget] = useState<Dispositivo | null>(null);
  const [quitando, setQuitando] = useState(false);

  useBreadcrumbs(
    invernadero
      ? [
          { label: tNav("invernaderos"), href: "/invernaderos" },
          { label: invernadero.nombre },
        ]
      : [{ label: tNav("invernaderos"), href: "/invernaderos" }]
  );

  const cargar = useCallback(async () => {
    try {
      setInvernadero(await apiFetch<Invernadero>(`/api/invernaderos/${params.id}`));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [params.id, t]);

  useEffect(() => {
    void Promise.resolve().then(() => cargar());
  }, [cargar]);

  async function quitar() {
    if (!invernadero || !quitarTarget) return;
    setQuitando(true);
    try {
      await apiFetch(`/api/invernaderos/${invernadero._id}/dispositivos/${quitarTarget._id}`, {
        method: "DELETE",
      });
      toast.success(t("quitadoMessage", { nombre: quitarTarget.nombre }));
      setQuitarTarget(null);
      cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("quitarError"));
    } finally {
      setQuitando(false);
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <EmptyState>{t("loading")}</EmptyState>
      </PageContainer>
    );
  }
  if (!invernadero) {
    return (
      <PageContainer>
        <EmptyState>{t("notFound")}</EmptyState>
      </PageContainer>
    );
  }

  const m = (n: number) => fmt.number(n, 2);
  const dispositivos = invernadero.dispositivos ?? [];

  return (
    <PageContainer className="max-w-[960px]">
      <section className="rounded-lg bg-surface-card px-5 py-[18px] shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="m-0 text-[22px] leading-tight font-medium tracking-[-0.015em]">
                {invernadero.nombre}
              </h1>
              <Badge variant={invernadero.activo ? "default" : "outline"}>
                {invernadero.activo ? tLista("activo") : tLista("inactivo")}
              </Badge>
            </div>
            {invernadero.notas && (
              <p className="mt-1.5 mb-0 text-[13px] text-text-muted">{invernadero.notas}</p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <PencilSimpleIcon /> {t("editar")}
          </Button>
        </div>
        <KpiGrid
          className="mt-[18px] border-t border-divider pt-4"
          items={[
            {
              label: t("medidas"),
              value: tLista("medidas", {
                alto: m(invernadero.altoM),
                largo: m(invernadero.largoM),
                prof: m(invernadero.profundidadM),
              }),
              note: t("medidasNote"),
            },
            { label: tLista("colSuperficie"), value: `${m(superficieM2(invernadero))} m²` },
            { label: tLista("colVolumen"), value: `${m(volumenM3(invernadero))} m³` },
            { label: t("dispositivos"), value: String(dispositivos.length) },
          ]}
        />
      </section>

      <SectionCard
        number="01"
        title={t("dispositivosTitle")}
        meta={t("dispositivosMeta", { count: dispositivos.length })}
        actions={
          <Button size="sm" onClick={() => setDispositivoTarget("new")}>
            <PlusIcon /> {t("agregarDispositivo")}
          </Button>
        }
      >
        {dispositivos.length === 0 ? (
          <EmptyState>{t("emptyDispositivos")}</EmptyState>
        ) : (
          <Table minWidth={480}>
            <TableHeader>
              <TableRow>
                <TableHead>{t("colNombre")}</TableHead>
                <TableHead>{t("colDominio")}</TableHead>
                <TableHead className="w-[68px]">
                  <span className="sr-only">{tCommon("actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dispositivos.map((d) => (
                <TableRow key={d._id}>
                  <TableCell className="font-medium">{d.nombre}</TableCell>
                  <TableCell>
                    <a
                      href={`http://${d.dominio}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t("abrir", { nombre: d.nombre })}
                      className="inline-flex items-center gap-1.5 text-accent-300 tabular-nums hover:text-accent-100"
                    >
                      {d.dominio}
                      <ArrowSquareOutIcon className="size-3.5" />
                    </a>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("editarDispositivo", { nombre: d.nombre })}
                        title={t("editarDispositivo", { nombre: d.nombre })}
                        className="text-text-muted hover:text-foreground"
                        onClick={() => setDispositivoTarget(d)}
                      >
                        <PencilSimpleIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("quitarDispositivo", { nombre: d.nombre })}
                        title={t("quitarDispositivo", { nombre: d.nombre })}
                        className="text-text-muted hover:bg-danger-bg hover:text-danger-text"
                        onClick={() => setQuitarTarget(d)}
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <p className="mt-3 mb-0 flex items-start gap-1.5 text-xs leading-[17px] text-text-subtle">
          <WifiHighIcon className="mt-px size-3.5 shrink-0" />
          {t("wifiAviso")}
        </p>
      </SectionCard>

      {editOpen && (
        <InvernaderoFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          invernadero={invernadero}
          onSuccess={cargar}
        />
      )}

      {dispositivoTarget && (
        <DispositivoFormDialog
          key={dispositivoTarget === "new" ? "new" : dispositivoTarget._id}
          open={!!dispositivoTarget}
          onOpenChange={(open) => {
            if (!open) setDispositivoTarget(null);
          }}
          invernadero={invernadero}
          dispositivo={dispositivoTarget === "new" ? undefined : dispositivoTarget}
          onSuccess={cargar}
        />
      )}

      <AlertDialog
        open={!!quitarTarget}
        onOpenChange={(open) => {
          if (!open) setQuitarTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {quitarTarget && t("confirmTitle", { nombre: quitarTarget.nombre })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDescription", { invernadero: invernadero.nombre })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" loading={quitando} onClick={quitar}>
              <TrashIcon /> {t("confirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
