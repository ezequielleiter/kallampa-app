"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  CheckCircleIcon,
  DotsThreeIcon,
  DropIcon,
  PlusIcon,
  WarningCircleIcon,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/kallampa/PageHeader";
import { SectionCard } from "@/components/kallampa/SectionCard";
import { StatusTag } from "@/components/kallampa/StatusTag";
import { useFormat } from "@/components/kallampa/useFormat";
import { apiFetch } from "@/lib/api-client";
import type { FrascoLiquidoEstado } from "@/lib/constants";
import type { FrascoLiquido, Placa } from "@/lib/types";
import { NuevoFrascoLiquidoSheet } from "./NuevoFrascoLiquidoSheet";

interface FrascosLiquidosSectionProps {
  /** Numero de seccion ("02" si hay placas antes, "01" si no). */
  number?: string;
  frascosLiquidos: FrascoLiquido[];
  /** Placas de la clonacion, para elegir el origen de un frasco nuevo. */
  placas: Placa[];
  onChanged: () => void;
  permiteAgregar: boolean;
}

export function FrascosLiquidosSection({
  number,
  frascosLiquidos,
  placas,
  onChanged,
  permiteAgregar,
}: FrascosLiquidosSectionProps) {
  const t = useTranslations("components.frascosLiquidosSection");
  const tEstado = useTranslations("estados.frascoLiquido");
  const fmt = useFormat();
  const [nuevoOpen, setNuevoOpen] = useState(false);

  async function handleMarcarEstado(frasco: FrascoLiquido, estado: FrascoLiquidoEstado) {
    try {
      await apiFetch(`/api/frascos-liquidos/${frasco._id}`, {
        method: "PATCH",
        body: JSON.stringify({ estado }),
      });
      toast.success(
        t("frascoMarcadoCodigo", {
          numero: frasco.numeroGuia,
          estado: tEstado(estado).toLowerCase(),
        })
      );
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorMessage"));
    }
  }

  function placaOrigenLabel(frasco: FrascoLiquido): string {
    if (frasco.origenPlacaId === undefined) return "—";
    return typeof frasco.origenPlacaId === "object"
      ? frasco.origenPlacaId.numeroPlaca
      : (placas.find((p) => p._id === frasco.origenPlacaId)?.numeroPlaca ??
          frasco.origenPlacaId);
  }

  const colonizados = frascosLiquidos.filter((f) => f.estado === "colonizado").length;

  return (
    <SectionCard
      number={number}
      title={t("sectionTitle")}
      meta={t("meta", { count: frascosLiquidos.length, colonizados })}
      actions={
        permiteAgregar && (
          <Button onClick={() => setNuevoOpen(true)}>
            <PlusIcon /> {t("nuevoFrasco")}
          </Button>
        )
      }
    >
      {frascosLiquidos.length === 0 ? (
        <EmptyState>{t("emptyState")}</EmptyState>
      ) : (
        <Table minWidth={560}>
          <TableHeader>
            <TableRow>
              <TableHead>{t("numeroGuia")}</TableHead>
              <TableHead>{t("placaOrigen")}</TableHead>
              <TableHead>{t("fecha")}</TableHead>
              <TableHead>{t("estado")}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {frascosLiquidos.map((frasco) => (
              <TableRow key={frasco._id}>
                <TableCell className="font-medium">{frasco.numeroGuia}</TableCell>
                <TableCell className="text-text-muted">{placaOrigenLabel(frasco)}</TableCell>
                <TableCell>{fmt.fecha(frasco.fechaCreacion)}</TableCell>
                <TableCell>
                  <StatusTag kind="frascoLiquido" estado={frasco.estado} />
                </TableCell>
                <TableCell className="text-right">
                  {(frasco.estado === "colonizando" || frasco.estado === "colonizado") && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t("acciones", { numero: frasco.numeroGuia })}
                          >
                            <DotsThreeIcon className="size-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="min-w-52">
                        {frasco.estado === "colonizando" ? (
                          <DropdownMenuItem onClick={() => handleMarcarEstado(frasco, "colonizado")}>
                            <CheckCircleIcon />
                            {t("marcarColonizado")}
                          </DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => handleMarcarEstado(frasco, "vacio")}>
                              <DropIcon />
                              {t("marcarVacio")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleMarcarEstado(frasco, "finalizado")}
                            >
                              <CheckCircleIcon />
                              {t("marcarFinalizado")}
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleMarcarEstado(frasco, "contaminado")}
                        >
                          <WarningCircleIcon />
                          {t("marcarContaminado")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {permiteAgregar && (
        <NuevoFrascoLiquidoSheet
          open={nuevoOpen}
          onOpenChange={setNuevoOpen}
          placas={placas}
          onSuccess={onChanged}
        />
      )}
    </SectionCard>
  );
}
