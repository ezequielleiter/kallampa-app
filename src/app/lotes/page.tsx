"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { PlusIcon, FlaskIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageContainer, PageHeader, EmptyState } from "@/components/kallampa/PageHeader";
import { SegmentedControl } from "@/components/kallampa/SegmentedControl";
import { StatusTag } from "@/components/kallampa/StatusTag";
import { useFormat } from "@/components/kallampa/useFormat";
import { useBreadcrumbs } from "@/components/shared/Breadcrumbs";
import { apiFetch } from "@/lib/api-client";
import type { EstadoDerivado } from "@/lib/constants";
import type { BatchListItem } from "@/lib/types";

type Filtro = "todos" | EstadoDerivado;

export default function Home() {
  const router = useRouter();
  const t = useTranslations("pages.lotes");
  const tNav = useTranslations("nav");
  const fmt = useFormat();
  const [batches, setBatches] = useState<BatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>("todos");

  useBreadcrumbs([{ label: tNav("produccion"), href: "/lotes" }, { label: t("title") }]);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<BatchListItem[]>("/api/batches");
      setBatches(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void Promise.resolve().then(() => cargar());
  }, [cargar]);

  const count = (f: Filtro) =>
    f === "todos" ? batches.length : batches.filter((b) => b.estadoDerivado === f).length;
  const visibles = batches.filter((b) => filtro === "todos" || b.estadoDerivado === filtro);

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        subtitle={
          loading
            ? undefined
            : t("subtitle", { enCurso: count("en_progreso"), finalizados: count("finalizado") })
        }
        actions={
          <>
            <SegmentedControl<Filtro>
              aria-label={t("filterLabel")}
              value={filtro}
              onChange={setFiltro}
              options={[
                { value: "todos", label: t("filterTodos"), count: count("todos") },
                { value: "en_progreso", label: t("filterEnCurso"), count: count("en_progreso") },
                { value: "finalizado", label: t("filterFinalizados"), count: count("finalizado") },
              ]}
            />
            <Button render={<Link href="/lotes/nuevo" />}>
              <PlusIcon /> {t("newBatch")}
            </Button>
          </>
        }
      />

      <div className="rounded-lg bg-surface-card px-4 pt-1.5 pb-2.5 shadow-sm">
        {loading ? (
          <EmptyState>{t("loading")}</EmptyState>
        ) : batches.length === 0 ? (
          <EmptyState>{t("empty")}</EmptyState>
        ) : visibles.length === 0 ? (
          <EmptyState>{t("emptyFiltered")}</EmptyState>
        ) : (
          <Table minWidth={680}>
            <TableHeader>
              <TableRow>
                <TableHead>{t("colNumero")}</TableHead>
                <TableHead>{t("colHongo")}</TableHead>
                <TableHead>{t("colOrigen")}</TableHead>
                <TableHead>{t("colFecha")}</TableHead>
                <TableHead>{t("colEstado")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.map((batch) => (
                <TableRow
                  key={batch._id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/lotes/${batch._id}`)}
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/lotes/${batch._id}`}
                      className="text-foreground no-underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {batch.numeroLote}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>{batch.fungusTypeId?.nombre}</div>
                    {batch.fungusTypeId?.nombreCientifico && (
                      <div className="text-[11.5px] text-text-subtle italic">
                        {batch.fungusTypeId.nombreCientifico}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {typeof batch.origenFrascoLiquidoId === "object" ? (
                      <span className="flex items-center gap-1.5 text-[12.5px]">
                        <FlaskIcon className="size-4 text-accent" />
                        {batch.origenFrascoLiquidoId.numeroGuia}
                      </span>
                    ) : (
                      <span className="text-text-subtle">—</span>
                    )}
                  </TableCell>
                  <TableCell>{fmt.fecha(batch.inoculacionGrano.fechaInicio)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <StatusTag kind="lote" estado={batch.estadoDerivado} />
                      {batch.alertas > 0 && (
                        <Badge variant="destructive">
                          <WarningCircleIcon /> {t("alertCount", { count: batch.alertas })}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </PageContainer>
  );
}
