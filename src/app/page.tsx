"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Plus, TriangleAlert } from "lucide-react";
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
import { apiFetch } from "@/lib/api-client";
import { formatFechaCorta } from "@/lib/format";
import { ESTADO_DERIVADO_BADGE_VARIANT } from "@/lib/constants";
import type { BatchListItem } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const t = useTranslations("pages.lotes");
  const tEstado = useTranslations("estados.lote");
  const [batches, setBatches] = useState<BatchListItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        <Button size="sm" onClick={() => router.push("/lotes/nuevo")}>
          <Plus /> {t("newBatch")}
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : batches.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("colNumero")}</TableHead>
              <TableHead>{t("colHongo")}</TableHead>
              <TableHead>{t("colFecha")}</TableHead>
              <TableHead>{t("colEstado")}</TableHead>
              <TableHead>{t("colAlertas")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => (
              <TableRow
                key={batch._id}
                className="cursor-pointer"
                onClick={() => router.push(`/lotes/${batch._id}`)}
              >
                <TableCell className="font-medium">{batch.numeroLote}</TableCell>
                <TableCell>{batch.fungusTypeId?.nombre}</TableCell>
                <TableCell>{formatFechaCorta(batch.inoculacionGrano.fechaInicio)}</TableCell>
                <TableCell>
                  <Badge variant={ESTADO_DERIVADO_BADGE_VARIANT[batch.estadoDerivado]}>
                    {tEstado(batch.estadoDerivado)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {batch.alertas > 0 && (
                    <Badge variant="destructive">
                      <TriangleAlert /> {t("alertCount", { count: batch.alertas })}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
