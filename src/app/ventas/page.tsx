"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  ArchiveIcon,
  ArrowCounterClockwiseIcon,
  DotsThreeIcon,
  PackageIcon,
  PencilSimpleIcon,
  PlusIcon,
  ReceiptIcon,
  TrashIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader, EmptyState } from "@/components/kallampa/PageHeader";
import { SegmentedControl } from "@/components/kallampa/SegmentedControl";
import { KpiGrid } from "@/components/kallampa/Kpi";
import { useFormat } from "@/components/kallampa/useFormat";
import { useBreadcrumbs } from "@/components/shared/Breadcrumbs";
import { VentaFormDialog } from "@/components/ventas/VentaFormDialog";
import { MermaFormDialog } from "@/components/ventas/MermaFormDialog";
import { ClienteFormDialog } from "@/components/ventas/ClienteFormDialog";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Cliente, StockLote, VentaListItem } from "@/lib/types";

type Tab = "ventas" | "stock" | "clientes";
type FiltroCobro = "todas" | "pendientes";
const TODOS = "__todos";

export default function VentasPage() {
  const t = useTranslations("pages.ventas");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const tEstados = useTranslations("estados");
  const fmt = useFormat();

  const [ventas, setVentas] = useState<VentaListItem[]>([]);
  const [stock, setStock] = useState<StockLote[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<Tab>("ventas");
  const [filtroCobro, setFiltroCobro] = useState<FiltroCobro>("todas");
  const [filtroCliente, setFiltroCliente] = useState<string>(TODOS);
  const [mostrarSinStock, setMostrarSinStock] = useState(false);

  const [ventaTarget, setVentaTarget] = useState<VentaListItem | "new" | null>(null);
  const [borrarTarget, setBorrarTarget] = useState<VentaListItem | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [mermaOpen, setMermaOpen] = useState(false);
  const [mermaBatchId, setMermaBatchId] = useState<string | undefined>();
  const [clienteTarget, setClienteTarget] = useState<Cliente | "new" | null>(null);
  const [cobroPendiente, setCobroPendiente] = useState<string | null>(null);

  useBreadcrumbs([{ label: tNav("ventas") }]);

  const cargar = useCallback(async () => {
    try {
      const [v, s, c] = await Promise.all([
        apiFetch<VentaListItem[]>("/api/ventas"),
        apiFetch<StockLote[]>("/api/stock"),
        apiFetch<Cliente[]>("/api/clientes"),
      ]);
      setVentas(v);
      setStock(s);
      setClientes(c);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void Promise.resolve().then(() => cargar());
  }, [cargar]);

  const kpis = useMemo(() => {
    const ahora = new Date();
    const mes = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;
    const delMes = ventas.filter((v) => v.fecha.slice(0, 7) === mes);
    const pendientes = ventas.filter((v) => !v.cobrada);
    const kgTotal = ventas.reduce((a, v) => a + v.items.reduce((b, i) => b + i.kg, 0), 0);
    const montoTotal = ventas.reduce((a, v) => a + v.total, 0);
    return {
      vendidoMes: delMes.reduce((a, v) => a + v.total, 0),
      ventasMes: delMes.length,
      stockKg: stock.reduce((a, s) => a + Math.max(0, s.disponibleKg), 0),
      lotesConStock: stock.filter((s) => s.disponibleKg > 0).length,
      porCobrar: pendientes.reduce((a, v) => a + v.total, 0),
      pendientes: pendientes.length,
      precioPromedio: kgTotal > 0 ? montoTotal / kgTotal : null,
    };
  }, [ventas, stock]);

  const ventasDelCliente = useMemo(
    () => (filtroCliente === TODOS ? ventas : ventas.filter((v) => v.clienteId?._id === filtroCliente)),
    [ventas, filtroCliente]
  );
  const ventasVisibles =
    filtroCobro === "pendientes" ? ventasDelCliente.filter((v) => !v.cobrada) : ventasDelCliente;
  const stockVisible = mostrarSinStock ? stock : stock.filter((s) => s.disponibleKg > 0);
  const sinStock = stock.length - stock.filter((s) => s.disponibleKg > 0).length;

  async function toggleCobro(v: VentaListItem) {
    setCobroPendiente(v._id);
    try {
      await apiFetch<VentaListItem>(`/api/ventas/${v._id}`, {
        method: "PATCH",
        body: JSON.stringify({ cobrada: !v.cobrada }),
      });
      toast.success(
        v.cobrada
          ? t("marcadaPendiente", { numero: v.numeroVenta })
          : t("marcadaCobrada", { numero: v.numeroVenta })
      );
      await cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("updateError"));
    } finally {
      setCobroPendiente(null);
    }
  }

  async function borrarVenta() {
    if (!borrarTarget) return;
    setBorrando(true);
    try {
      await apiFetch<null>(`/api/ventas/${borrarTarget._id}`, { method: "DELETE" });
      toast.success(t("deletedMessage", { numero: borrarTarget.numeroVenta }));
      setBorrarTarget(null);
      await cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("updateError"));
    } finally {
      setBorrando(false);
    }
  }

  async function setClienteActivo(c: Cliente, activo: boolean) {
    try {
      await apiFetch<Cliente>(`/api/clientes/${c._id}`, {
        method: "PATCH",
        body: JSON.stringify({ activo }),
      });
      toast.success(
        activo
          ? t("clienteReactivado", { nombre: c.nombre })
          : t("clienteDesactivado", { nombre: c.nombre })
      );
      await cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("updateError"));
    }
  }

  function verVentasDe(c: Cliente) {
    setFiltroCliente(c._id);
    setFiltroCobro("todas");
    setTab("ventas");
  }

  function abrirMerma(batchId?: string) {
    setMermaBatchId(batchId);
    setMermaOpen(true);
  }

  const kgVenta = (v: VentaListItem) => v.items.reduce((a, i) => a + i.kg, 0);

  return (
    <PageContainer>
      <PageHeader
        title={tNav("ventas")}
        subtitle={t("subtitle")}
        actions={
          <>
            <Button variant="outline" onClick={() => abrirMerma()}>
              {t("registrarMerma")}
            </Button>
            <Button onClick={() => setVentaTarget("new")}>
              <PlusIcon /> {t("nuevaVenta")}
            </Button>
          </>
        }
      />

      <div className="rounded-lg bg-surface-card px-5 py-4 shadow-sm">
        <KpiGrid
          min={160}
          className="gap-y-4"
          items={[
            {
              label: t("kpiVendidoMes"),
              value: loading ? "—" : fmt.money(kpis.vendidoMes),
              note: t("kpiVendidoMesNote", { count: kpis.ventasMes }),
            },
            {
              label: t("kpiStock"),
              value: loading ? "—" : fmt.kg(kpis.stockKg, 2),
              note: t("kpiStockNote", { count: kpis.lotesConStock }),
            },
            {
              label: t("kpiPorCobrar"),
              value: (
                <span className={cn(kpis.porCobrar > 0 && "text-danger-text")}>
                  {loading ? "—" : fmt.money(kpis.porCobrar)}
                </span>
              ),
              note: t("kpiPorCobrarNote", { count: kpis.pendientes }),
            },
            {
              label: t("kpiPrecioPromedio"),
              value: fmt.money(kpis.precioPromedio),
              note: t("kpiPrecioPromedioNote"),
            },
          ]}
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList
          variant="line"
          className="w-full justify-start overflow-visible border-b border-divider pb-1"
        >
          <TabsTrigger value="ventas" className="flex-none">
            <ReceiptIcon /> {t("tabVentas")}
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex-none">
            <PackageIcon /> {t("tabStock")}
          </TabsTrigger>
          <TabsTrigger value="clientes" className="flex-none">
            <UsersIcon /> {t("tabClientes")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "ventas" && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl<FiltroCobro>
              aria-label={t("filtroCobroLabel")}
              value={filtroCobro}
              onChange={setFiltroCobro}
              options={[
                { value: "todas", label: t("filtroTodas"), count: ventasDelCliente.length },
                {
                  value: "pendientes",
                  label: t("filtroPendientes"),
                  count: ventasDelCliente.filter((v) => !v.cobrada).length,
                },
              ]}
            />
            <Select
              items={[
                { value: TODOS, label: t("todosLosClientes") },
                ...clientes.map((c) => ({ value: c._id, label: c.nombre })),
              ]}
              value={filtroCliente}
              onValueChange={(v) => setFiltroCliente((v as string | null) ?? TODOS)}
            >
              <SelectTrigger className="min-w-48" aria-label={t("filtroClienteLabel")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>{t("todosLosClientes")}</SelectItem>
                {clientes.length > 0 && <SelectSeparator />}
                {clientes.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-surface-card px-4 pt-1.5 pb-2.5 shadow-sm">
            {loading ? (
              <EmptyState>{t("loading")}</EmptyState>
            ) : ventasVisibles.length === 0 ? (
              <EmptyState>{ventas.length === 0 ? t("emptyVentas") : t("emptyFiltered")}</EmptyState>
            ) : (
              <Table minWidth={860}>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("colNumero")}</TableHead>
                    <TableHead>{t("colFecha")}</TableHead>
                    <TableHead>{t("colCliente")}</TableHead>
                    <TableHead>{t("colLotes")}</TableHead>
                    <TableHead className="text-right">{t("colKg")}</TableHead>
                    <TableHead className="text-right">{t("colTotal")}</TableHead>
                    <TableHead>{t("colMedioPago")}</TableHead>
                    <TableHead>{t("colCobro")}</TableHead>
                    <TableHead className="w-[44px]">
                      <span className="sr-only">{tCommon("actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ventasVisibles.map((v) => (
                    <TableRow key={v._id}>
                      <TableCell className="font-medium tabular-nums">{v.numeroVenta}</TableCell>
                      <TableCell className="tabular-nums">{fmt.fecha(v.fecha)}</TableCell>
                      <TableCell className="whitespace-normal">
                        {v.clienteId ? (
                          v.clienteId.nombre
                        ) : (
                          <span className="text-text-subtle">{t("consumidorFinal")}</span>
                        )}
                        {v.notas && (
                          <div className="max-w-60 truncate text-[11.5px] text-text-subtle">
                            {v.notas}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <span className="flex flex-wrap gap-x-2 gap-y-0.5">
                          {v.items.map((i) => (
                            <Link
                              key={i.batchId._id}
                              href={`/lotes/${i.batchId._id}`}
                              className="tabular-nums hover:text-accent-300"
                            >
                              {i.batchId.numeroLote}
                            </Link>
                          ))}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{fmt.kg(kgVenta(v), 2)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {fmt.money(v.total)}
                      </TableCell>
                      <TableCell className="text-text-body">
                        {tEstados(`medioPago.${v.medioPago}`)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={v.cobrada ? "outline" : "secondary"}
                          className="cursor-pointer hover:opacity-80 disabled:cursor-progress disabled:opacity-50"
                          title={v.cobrada ? t("marcarPendiente") : t("marcarCobrada")}
                          render={
                            <button
                              type="button"
                              disabled={cobroPendiente === v._id}
                              onClick={() => toggleCobro(v)}
                            />
                          }
                        >
                          {v.cobrada ? tEstados("cobro.cobrada") : tEstados("cobro.pendiente")}
                        </Badge>
                        {v.cobrada && v.fechaCobro && (
                          <div className="mt-0.5 text-[11px] text-text-subtle tabular-nums">
                            {fmt.fecha(v.fechaCobro)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t("accionesDe", { numero: v.numeroVenta })}
                                className="text-text-muted hover:text-foreground"
                              >
                                <DotsThreeIcon weight="bold" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="min-w-40">
                            <DropdownMenuItem onClick={() => setVentaTarget(v)}>
                              <PencilSimpleIcon /> {t("editar")}
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => setBorrarTarget(v)}>
                              <TrashIcon /> {t("eliminar")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </>
      )}

      {tab === "stock" && (
        <>
          {sinStock > 0 && (
            <label className="inline-flex w-fit cursor-pointer items-center gap-2 text-[13px] select-none">
              <input
                type="checkbox"
                className="size-4 accent-accent"
                checked={mostrarSinStock}
                onChange={(e) => setMostrarSinStock(e.target.checked)}
              />
              {t("mostrarSinStock", { count: sinStock })}
            </label>
          )}
          <div className="rounded-lg bg-surface-card px-4 pt-1.5 pb-2.5 shadow-sm">
            {loading ? (
              <EmptyState>{t("loading")}</EmptyState>
            ) : stockVisible.length === 0 ? (
              <EmptyState>{stock.length === 0 ? t("emptyStock") : t("emptyStockDisponible")}</EmptyState>
            ) : (
              <Table minWidth={760}>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("colLote")}</TableHead>
                    <TableHead>{t("colHongo")}</TableHead>
                    <TableHead className="text-right">{t("colCosechado")}</TableHead>
                    <TableHead className="text-right">{t("colVendido")}</TableHead>
                    <TableHead className="text-right">{t("colMerma")}</TableHead>
                    <TableHead className="text-right">{t("colDisponible")}</TableHead>
                    <TableHead className="w-[150px]">
                      <span className="sr-only">{tCommon("actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockVisible.map((s) => {
                    const agotado = s.disponibleKg <= 0;
                    return (
                      <TableRow key={s.batchId} className={cn(agotado && "opacity-60")}>
                        <TableCell>
                          <Link
                            href={`/lotes/${s.batchId}`}
                            className="font-medium tabular-nums hover:text-accent-300"
                          >
                            {s.numeroLote}
                          </Link>
                        </TableCell>
                        <TableCell className="text-text-body">{s.hongo}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt.kg(s.cosechadoKg, 2)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt.kg(s.vendidoKg, 2)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt.kg(s.mermaKg, 2)}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {fmt.kg(s.disponibleKg, 2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={agotado}
                            onClick={() => abrirMerma(s.batchId)}
                          >
                            {t("registrarMerma")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </>
      )}

      {tab === "clientes" && (
        <>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setClienteTarget("new")}>
              <PlusIcon /> {t("nuevoCliente")}
            </Button>
          </div>
          <div className="rounded-lg bg-surface-card px-4 pt-1.5 pb-2.5 shadow-sm">
            {loading ? (
              <EmptyState>{t("loading")}</EmptyState>
            ) : clientes.length === 0 ? (
              <EmptyState>{t("emptyClientes")}</EmptyState>
            ) : (
              <Table minWidth={720}>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("colNombre")}</TableHead>
                    <TableHead>{t("colContacto")}</TableHead>
                    <TableHead className="text-right">{t("colTotalComprado")}</TableHead>
                    <TableHead className="text-right">{t("colCantidadVentas")}</TableHead>
                    <TableHead className="text-right">{t("colSaldo")}</TableHead>
                    <TableHead className="w-[68px]">
                      <span className="sr-only">{tCommon("actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((c) => (
                    <TableRow key={c._id} className={cn(!c.activo && "opacity-60")}>
                      <TableCell className="whitespace-normal">
                        <button
                          type="button"
                          className="cursor-pointer text-left font-medium hover:text-accent-300"
                          title={t("verVentasDe", { nombre: c.nombre })}
                          onClick={() => verVentasDe(c)}
                        >
                          {c.nombre}
                        </button>
                        {!c.activo && (
                          <Badge variant="outline" className="ml-2">
                            {t("inactivo")}
                          </Badge>
                        )}
                        {c.notas && (
                          <div className="max-w-72 truncate text-[11.5px] text-text-subtle">
                            {c.notas}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-text-body">{c.contacto || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt.money(c.totalComprado)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt.number(c.cantidadVentas)}</TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          c.saldoPendiente > 0 && "font-medium text-danger-text"
                        )}
                      >
                        {fmt.money(c.saldoPendiente)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t("editarCliente", { nombre: c.nombre })}
                            title={t("editarCliente", { nombre: c.nombre })}
                            className="text-text-muted hover:text-foreground"
                            onClick={() => setClienteTarget(c)}
                          >
                            <PencilSimpleIcon />
                          </Button>
                          {c.activo ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={t("desactivarCliente", { nombre: c.nombre })}
                              title={t("desactivarCliente", { nombre: c.nombre })}
                              className="text-text-muted hover:bg-danger-bg hover:text-danger-text"
                              onClick={() => setClienteActivo(c, false)}
                            >
                              <ArchiveIcon />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={t("reactivarCliente", { nombre: c.nombre })}
                              title={t("reactivarCliente", { nombre: c.nombre })}
                              className="text-text-muted hover:text-foreground"
                              onClick={() => setClienteActivo(c, true)}
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
        </>
      )}

      {ventaTarget && (
        <VentaFormDialog
          key={ventaTarget === "new" ? "new" : ventaTarget._id}
          open
          onOpenChange={(open) => {
            if (!open) setVentaTarget(null);
          }}
          venta={ventaTarget === "new" ? undefined : ventaTarget}
          onSaved={cargar}
        />
      )}

      <MermaFormDialog
        open={mermaOpen}
        onOpenChange={setMermaOpen}
        batchIdInicial={mermaBatchId}
        onSaved={cargar}
      />

      {clienteTarget && (
        <ClienteFormDialog
          key={clienteTarget === "new" ? "new" : clienteTarget._id}
          open
          onOpenChange={(open) => {
            if (!open) setClienteTarget(null);
          }}
          cliente={clienteTarget === "new" ? undefined : clienteTarget}
          onSaved={() => cargar()}
        />
      )}

      <AlertDialog
        open={!!borrarTarget}
        onOpenChange={(open) => {
          if (!open) setBorrarTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {borrarTarget && t("confirmBorrarTitle", { numero: borrarTarget.numeroVenta })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("confirmBorrarDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" loading={borrando} onClick={borrarVenta}>
              <TrashIcon /> {t("eliminar")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
