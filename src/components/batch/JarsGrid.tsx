"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { GitBranchIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
import { StateSelect } from "@/components/kallampa/StateSelect";
import { EmptyState } from "@/components/kallampa/PageHeader";
import { JAR_ESTADOS, type JarEstado } from "@/lib/constants";
import { apiFetch } from "@/lib/api-client";
import type { Jar } from "@/lib/types";
import { AgregarFrascosDialog } from "./AgregarFrascosDialog";
import { codigoCorto } from "./lote-view";

interface JarsGridProps {
  batchId: string;
  numeroLote: string;
  jars: Jar[];
  onChanged: () => void;
}

export function JarsGrid({ batchId, numeroLote, jars, onChanged }: JarsGridProps) {
  const t = useTranslations("components.jarsGrid");
  const tEstado = useTranslations("estados.jar");
  const tCommon = useTranslations("common");
  const [agregarOpen, setAgregarOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Jar | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function patchEstado(jar: Jar, estado: JarEstado) {
    await apiFetch(`/api/jars/${jar._id}`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    });
  }

  // El cambio se guarda al toque; el toast ofrece volver al estado anterior
  // (un toque de mas en "Contaminado" en la carpa no tiene que costar nada).
  async function handleEstadoChange(jar: Jar, estado: JarEstado) {
    const anterior = jar.estado;
    const codigo = codigoCorto(jar.numeroGuia);
    try {
      await patchEstado(jar, estado);
      toast.success(t("successMessage", { codigo, estado: tEstado(estado).toLowerCase() }), {
        duration: 8000,
        action: {
          label: t("deshacer"),
          onClick: async () => {
            try {
              await patchEstado(jar, anterior);
              toast.success(
                t("deshechoMessage", { codigo, estado: tEstado(anterior).toLowerCase() })
              );
              onChanged();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : t("errorMessage"));
            }
          },
        },
      });
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorMessage"));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/jars/${deleteTarget._id}`, { method: "DELETE" });
      toast.success(t("eliminadoMessage", { codigo: deleteTarget.numeroGuia }));
      setDeleteTarget(null);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("eliminarErrorMessage"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setAgregarOpen(true)}>
          <PlusIcon /> {t("agregar")}
        </Button>
      </div>

      {jars.length === 0 ? (
        <EmptyState>{t("emptyState")}</EmptyState>
      ) : (
        <Table minWidth={300}>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-normal md:whitespace-nowrap">{t("numeroGuia")}</TableHead>
              <TableHead>{t("estado")}</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">{t("acciones")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jars.map((jar) => (
              <TableRow key={jar._id}>
                <TableCell>
                  {/* En el celular alcanza con "F01": el lote ya esta en la cabecera. */}
                  <span className="md:hidden">{codigoCorto(jar.numeroGuia)}</span>
                  <span className="hidden md:inline">{jar.numeroGuia}</span>
                </TableCell>
                <TableCell>
                  <StateSelect
                    label={t("estadoDe", { codigo: jar.numeroGuia })}
                    width={128}
                    value={jar.estado}
                    options={JAR_ESTADOS.map((estado) => ({
                      value: estado,
                      label: tEstado(estado),
                    }))}
                    onChange={(v) => handleEstadoChange(jar, v as JarEstado)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  {jar.estado === "colonizado" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={t("clonar")}
                      render={<Link href={`/clonacion/nueva?origenJarId=${jar._id}`} />}
                    >
                      <GitBranchIcon /> <span className="hidden sm:inline">{t("clonar")}</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t("eliminarDe", { codigo: jar.numeroGuia })}
                    onClick={() => setDeleteTarget(jar)}
                  >
                    <TrashIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AgregarFrascosDialog
        open={agregarOpen}
        onOpenChange={setAgregarOpen}
        batchId={batchId}
        numeroLote={numeroLote}
        onSuccess={onChanged}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget && t("confirmEliminarTitle", { codigo: deleteTarget.numeroGuia })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("confirmEliminarDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" loading={deleting} onClick={handleDelete}>
              <TrashIcon /> {t("eliminar")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
