"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PlusIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import { SectionCard } from "@/components/kallampa/SectionCard";
import { StatusTag } from "@/components/kallampa/StatusTag";
import { EmptyState } from "@/components/kallampa/PageHeader";
import { useFormat } from "@/components/kallampa/useFormat";
import { apiFetch } from "@/lib/api-client";
import { pesoCosechadoRecipiente, pesoTotalCosechado } from "@/lib/recipiente-utils";
import type { Oleada, Recipiente } from "@/lib/types";
import { OleadaFormDialog } from "./OleadaFormDialog";
import { RecipienteEstadoDialog } from "./RecipienteEstadoDialog";
import { nombreSustrato } from "./lote-view";

interface CosechaSectionProps {
  recipientes: Recipiente[];
  onChanged: () => void;
}

/** Seccion "04 Cosecha": oleadas por recipiente fructificando o finalizado. */
export function CosechaSection({ recipientes, onChanged }: CosechaSectionProps) {
  const t = useTranslations("components.cosechaSection");
  const fmt = useFormat();
  const cosechables = recipientes.filter(
    (r) => r.estado === "fructificando" || r.estado === "finalizado"
  );

  return (
    <SectionCard
      number="04"
      title={t("title")}
      meta={t("meta", { total: fmt.kg(pesoTotalCosechado(recipientes)) })}
    >
      {cosechables.length === 0 ? (
        <EmptyState>{t("emptyState")}</EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {cosechables.map((r) => (
            <RecipienteCosecha key={r._id} recipiente={r} onChanged={onChanged} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function RecipienteCosecha({
  recipiente,
  onChanged,
}: {
  recipiente: Recipiente;
  onChanged: () => void;
}) {
  const t = useTranslations("components.cosechaSection");
  const tCommon = useTranslations("common");
  const fmt = useFormat();
  const [dialogTarget, setDialogTarget] = useState<Oleada | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Oleada | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [finalizarOpen, setFinalizarOpen] = useState(false);

  // Agregar oleadas (y finalizar) solo mientras fructifica, que es lo que exige
  // la API. Corregir o borrar una oleada se permite siempre (tambien con el
  // recipiente finalizado), por si hubo un error de carga.
  const puedeAgregar = recipiente.estado === "fructificando";
  const oleadas = [...recipiente.oleadas].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );
  const total = pesoCosechadoRecipiente(recipiente);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch<Recipiente>(
        `/api/recipientes/${recipiente._id}/oleadas/${deleteTarget._id}`,
        { method: "DELETE" }
      );
      toast.success(t("oleadaDeleted"));
      setDeleteTarget(null);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("oleadaDeleteError"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-md bg-surface-inset px-3.5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <span className="text-[13.5px] font-medium tabular-nums">
            {recipiente.numeroSeguimiento}
          </span>
          <StatusTag kind="recipiente" estado={recipiente.estado} />
          <span className="text-xs text-text-subtle tabular-nums">
            {nombreSustrato(recipiente)} · {fmt.kg(recipiente.pesoSustratoKg)}
          </span>
        </div>
        {puedeAgregar && (
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" onClick={() => setDialogTarget("new")}>
              <PlusIcon /> {t("addOleada")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setFinalizarOpen(true)}>
              {t("markFinalized")}
            </Button>
          </div>
        )}
      </div>

      {oleadas.length === 0 ? (
        <p className="mt-2.5 mb-0 text-[12.5px] text-text-subtle">{t("emptyOleadas")}</p>
      ) : (
        <Table minWidth={420} containerClassName="mt-1.5">
          <TableHeader>
            <TableRow>
              <TableHead>{t("oleada")}</TableHead>
              <TableHead>{t("fecha")}</TableHead>
              <TableHead className="text-right">{t("peso")}</TableHead>
              <TableHead>{t("notas")}</TableHead>
              <TableHead className="w-[68px]">
                <span className="sr-only">{t("acciones")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {oleadas.map((oleada, i) => (
              <TableRow key={oleada._id}>
                <TableCell>{t("ordinal", { n: i + 1 })}</TableCell>
                <TableCell>{fmt.fecha(oleada.fecha)}</TableCell>
                <TableCell className="text-right">{fmt.kg(oleada.pesoKg)}</TableCell>
                <TableCell className="max-w-48 truncate text-text-muted">{oleada.notas}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("editOleada", { n: i + 1 })}
                      title={t("editOleada", { n: i + 1 })}
                      className="text-text-muted hover:text-foreground"
                      onClick={() => setDialogTarget(oleada)}
                    >
                      <PencilSimpleIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("deleteOleada", { n: i + 1 })}
                      title={t("deleteOleada", { n: i + 1 })}
                      className="text-text-muted hover:bg-danger-bg hover:text-danger-text"
                      onClick={() => setDeleteTarget(oleada)}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {oleadas.length > 1 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="text-text-muted">
                  {t("total")}
                </TableCell>
                <TableCell className="text-right">{fmt.kg(total)}</TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      )}

      {dialogTarget && (
        <OleadaFormDialog
          key={dialogTarget === "new" ? "new" : dialogTarget._id}
          open={!!dialogTarget}
          onOpenChange={(open) => {
            if (!open) setDialogTarget(null);
          }}
          recipiente={recipiente}
          oleada={dialogTarget === "new" ? undefined : dialogTarget}
          onSuccess={onChanged}
        />
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget &&
                t("confirmDeleteOleada", { fecha: fmt.fecha(deleteTarget.fecha) })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget &&
                t("confirmDeleteDescription", {
                  codigo: recipiente.numeroSeguimiento,
                  peso: fmt.kg(deleteTarget.pesoKg),
                })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" loading={deleting} onClick={handleDelete}>
              <TrashIcon /> {t("confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RecipienteEstadoDialog
        open={finalizarOpen}
        onOpenChange={setFinalizarOpen}
        recipienteId={recipiente._id}
        numeroSeguimiento={recipiente.numeroSeguimiento}
        estadoObjetivo="finalizado"
        onSuccess={onChanged}
      />
    </div>
  );
}
