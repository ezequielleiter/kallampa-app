"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { ESTADO_DERIVADO_BADGE_VARIANT, ESTADO_DERIVADO_LABELS } from "@/lib/constants";
import type { BatchListItem } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [batches, setBatches] = useState<BatchListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<BatchListItem[]>("/api/batches");
      setBatches(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron cargar los lotes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => cargar());
  }, [cargar]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Lotes</h1>
        <Button size="sm" onClick={() => router.push("/lotes/nuevo")}>
          <Plus /> Nuevo lote
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : batches.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay lotes cargados.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° de lote</TableHead>
              <TableHead>Hongo</TableHead>
              <TableHead>Fecha de inicio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Alertas</TableHead>
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
                    {ESTADO_DERIVADO_LABELS[batch.estadoDerivado]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {batch.alertas > 0 && (
                    <Badge variant="destructive">
                      <TriangleAlert /> {batch.alertas} alerta{batch.alertas === 1 ? "" : "s"}
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
