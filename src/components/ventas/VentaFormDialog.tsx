"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { PlusIcon, XIcon } from "@phosphor-icons/react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldWarning } from "@/components/kallampa/Field";
import { SegmentedControl } from "@/components/kallampa/SegmentedControl";
import { useFormat } from "@/components/kallampa/useFormat";
import { useAppLocale } from "@/components/shared/LocaleProvider";
import { numeroAInput } from "@/components/herramientas/CalculadoraSustrato";
import { apiFetch } from "@/lib/api-client";
import { parseDecimal } from "@/lib/calculadora-sustrato";
import type { Cliente, MedioPago, StockLote, VentaListItem } from "@/lib/types";
import { useOpenKey } from "./useOpenKey";

export const MEDIOS_PAGO: MedioPago[] = ["efectivo", "transferencia", "mercadopago", "otro"];

const SIN_CLIENTE = "__consumidor_final";

// Keys estables para las filas de items (solo identifican filas en React).
let filaSeq = 0;
const nuevaKey = () => ++filaSeq;
const PRECIO_STORAGE_KEY = "kallampa:ventas:ultimoPrecioPorKg";

function leerUltimoPrecio(): number | null {
  try {
    const raw = window.localStorage.getItem(PRECIO_STORAGE_KEY);
    const n = raw == null ? NaN : Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : null;
  } catch {
    // localStorage puede fallar en modo privado o con site data bloqueada.
    return null;
  }
}

function guardarUltimoPrecio(n: number) {
  try {
    window.localStorage.setItem(PRECIO_STORAGE_KEY, String(n));
  } catch {
    // Es solo una comodidad: si falla, la proxima venta arranca vacia.
  }
}

interface VentaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si viene, el dialogo edita esa venta. */
  venta?: VentaListItem;
  /** Lote preseleccionado en la primera fila (alta desde el detalle del lote). */
  batchIdInicial?: string;
  onSaved: () => void;
}

export function VentaFormDialog({
  open,
  onOpenChange,
  venta,
  batchIdInicial,
  onSaved,
}: VentaFormDialogProps) {
  const t = useTranslations("components.ventaFormDialog");
  const formKey = useOpenKey(open);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[640px]">
        <DialogHeader>
          <DialogTitle>{venta ? t("editTitle") : t("newTitle")}</DialogTitle>
          {venta && <DialogDescription>{venta.numeroVenta}</DialogDescription>}
        </DialogHeader>
        <VentaForm
          key={formKey}
          venta={venta}
          batchIdInicial={batchIdInicial}
          onSaved={() => {
            onOpenChange(false);
            onSaved();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

interface Fila {
  key: number;
  batchId: string;
  kg: string;
  precio: string;
}

type ErroresFila = Partial<Record<"lote" | "kg" | "precio", string>>;

interface Errores {
  fecha?: string;
  items?: string;
  form?: string;
  filas: Record<number, ErroresFila>;
}

const SIN_ERRORES: Errores = { filas: {} };

function VentaForm({
  venta,
  batchIdInicial,
  onSaved,
}: {
  venta?: VentaListItem;
  batchIdInicial?: string;
  onSaved: () => void;
}) {
  const t = useTranslations("components.ventaFormDialog");
  const tCommon = useTranslations("common");
  const tEstados = useTranslations("estados");
  const fmt = useFormat();
  const { locale } = useAppLocale();

  const [stock, setStock] = useState<StockLote[] | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [fecha, setFecha] = useState(() =>
    venta ? venta.fecha.slice(0, 10) : format(new Date(), "yyyy-MM-dd")
  );
  const [clienteId, setClienteId] = useState<string>(venta?.clienteId?._id ?? SIN_CLIENTE);
  const [filas, setFilas] = useState<Fila[]>(() => {
    if (venta) {
      return venta.items.map((it) => ({
        key: nuevaKey(),
        batchId: it.batchId._id,
        kg: numeroAInput(it.kg, locale, 3),
        precio: numeroAInput(it.precioPorKg, locale, 2),
      }));
    }
    const ultimo = leerUltimoPrecio();
    return [
      {
        key: nuevaKey(),
        batchId: batchIdInicial ?? "",
        kg: "",
        precio: ultimo != null ? numeroAInput(ultimo, locale, 2) : "",
      },
    ];
  });
  const [medioPago, setMedioPago] = useState<MedioPago>(venta?.medioPago ?? "efectivo");
  const [cobrada, setCobrada] = useState(venta?.cobrada ?? true);
  const [notas, setNotas] = useState(venta?.notas ?? "");
  const [errores, setErrores] = useState<Errores>(SIN_ERRORES);
  const [guardando, setGuardando] = useState(false);

  // Alta de cliente en linea.
  const [nuevoClienteAbierto, setNuevoClienteAbierto] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [errorNuevoCliente, setErrorNuevoCliente] = useState<string | undefined>();
  const [creandoCliente, setCreandoCliente] = useState(false);

  useEffect(() => {
    let cancelado = false;
    Promise.all([
      apiFetch<StockLote[]>("/api/stock"),
      apiFetch<Cliente[]>("/api/clientes?activos=1"),
    ])
      .then(([s, c]) => {
        if (cancelado) return;
        setStock(s);
        setClientes(c);
      })
      .catch((err) => {
        if (cancelado) return;
        setStock([]);
        toast.error(err instanceof Error ? err.message : t("loadError"));
      });
    return () => {
      cancelado = true;
    };
  }, [t]);

  // Al editar, lo que esta venta ya tiene asignado vuelve a estar disponible.
  const propioPorLote = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of venta?.items ?? []) {
      m.set(it.batchId._id, (m.get(it.batchId._id) ?? 0) + it.kg);
    }
    return m;
  }, [venta]);

  const lotes = useMemo(() => {
    const m = new Map<string, { batchId: string; numeroLote: string; disponibleKg: number }>();
    for (const s of stock ?? []) {
      m.set(s.batchId, {
        batchId: s.batchId,
        numeroLote: s.numeroLote,
        disponibleKg: s.disponibleKg + (propioPorLote.get(s.batchId) ?? 0),
      });
    }
    // Un lote de esta venta que no vino en /api/stock (no deberia pasar).
    for (const it of venta?.items ?? []) {
      if (!m.has(it.batchId._id)) {
        m.set(it.batchId._id, {
          batchId: it.batchId._id,
          numeroLote: it.batchId.numeroLote,
          disponibleKg: propioPorLote.get(it.batchId._id) ?? 0,
        });
      }
    }
    return m;
  }, [stock, venta, propioPorLote]);

  const opcionesClientes = useMemo(() => {
    const lista = clientes.map((c) => ({ _id: c._id, nombre: c.nombre }));
    // El cliente de la venta puede estar desactivado: igual se muestra.
    if (venta?.clienteId && !lista.some((c) => c._id === venta.clienteId!._id)) {
      lista.push(venta.clienteId);
    }
    return lista;
  }, [clientes, venta]);

  const etiquetaLote = (l: { numeroLote: string; disponibleKg: number }) =>
    t("loteOption", { numeroLote: l.numeroLote, disponible: fmt.kg(l.disponibleKg, 2) });

  function opcionesLote(fila: Fila) {
    const usados = new Set(filas.filter((f) => f.key !== fila.key).map((f) => f.batchId));
    return [...lotes.values()].filter(
      (l) => l.batchId === fila.batchId || (l.disponibleKg > 0 && !usados.has(l.batchId))
    );
  }

  function editarFila(key: number, cambios: Partial<Fila>) {
    setFilas((fs) => fs.map((f) => (f.key === key ? { ...f, ...cambios } : f)));
  }

  function agregarFila() {
    const precioBase = filas[filas.length - 1]?.precio ?? "";
    setFilas((fs) => [...fs, { key: nuevaKey(), batchId: "", kg: "", precio: precioBase }]);
  }

  function quitarFila(key: number) {
    setFilas((fs) => fs.filter((f) => f.key !== key));
  }

  const subtotal = (f: Fila) => {
    const kg = parseDecimal(f.kg);
    const precio = parseDecimal(f.precio);
    return Number.isFinite(kg) && Number.isFinite(precio) ? kg * precio : null;
  };
  const total = filas.reduce((acc, f) => acc + (subtotal(f) ?? 0), 0);

  async function crearCliente() {
    const nombre = nombreNuevo.trim();
    if (!nombre) {
      setErrorNuevoCliente(t("errorNombreCliente"));
      return;
    }
    setCreandoCliente(true);
    try {
      const c = await apiFetch<Cliente>("/api/clientes", {
        method: "POST",
        body: JSON.stringify({ nombre }),
      });
      setClientes((cs) => [...cs, c].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setClienteId(c._id);
      setNuevoClienteAbierto(false);
      setNombreNuevo("");
      setErrorNuevoCliente(undefined);
      toast.success(t("clienteCreado", { nombre: c.nombre }));
    } catch (err) {
      setErrorNuevoCliente(err instanceof Error ? err.message : t("errorMessage"));
    } finally {
      setCreandoCliente(false);
    }
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const nuevos: Errores = { filas: {} };
    if (!fecha) nuevos.fecha = t("errorFecha");
    if (filas.length === 0) nuevos.items = t("errorSinItems");

    const vistos = new Set<string>();
    const items = filas.map((f) => {
      const err: ErroresFila = {};
      const kg = parseDecimal(f.kg);
      const precio = parseDecimal(f.precio);
      const lote = lotes.get(f.batchId);
      if (!f.batchId) err.lote = t("errorLote");
      else if (vistos.has(f.batchId)) err.lote = t("errorLoteRepetido");
      vistos.add(f.batchId);
      if (!(kg > 0)) err.kg = t("errorKg");
      else if (lote && kg > lote.disponibleKg + 1e-9)
        err.kg = t("errorKgMax", { disponible: fmt.kg(lote.disponibleKg, 2) });
      if (!Number.isFinite(precio) || precio < 0) err.precio = t("errorPrecio");
      if (Object.keys(err).length > 0) nuevos.filas[f.key] = err;
      return { batchId: f.batchId, kg, precioPorKg: precio };
    });

    const hayErrores =
      !!nuevos.fecha || !!nuevos.items || Object.keys(nuevos.filas).length > 0;
    setErrores(nuevos);
    if (hayErrores) return;

    const body = {
      fecha,
      clienteId: clienteId === SIN_CLIENTE ? null : clienteId,
      items,
      medioPago,
      cobrada,
      ...(notas.trim() ? { notas: notas.trim() } : venta?.notas ? { notas: "" } : {}),
    };

    setGuardando(true);
    try {
      if (venta) {
        await apiFetch<VentaListItem>(`/api/ventas/${venta._id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success(t("updatedMessage", { numero: venta.numeroVenta }));
      } else {
        const creada = await apiFetch<VentaListItem>("/api/ventas", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success(t("createdMessage", { numero: creada.numeroVenta }));
      }
      guardarUltimoPrecio(items[items.length - 1].precioPorKg);
      onSaved();
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : t("errorMessage");
      // 409 stock_insuficiente: el mensaje nombra el lote; marcamos su fila.
      const filasConError: Record<number, ErroresFila> = {};
      for (const f of filas) {
        const numero = lotes.get(f.batchId)?.numeroLote;
        if (numero && mensaje.includes(numero)) filasConError[f.key] = { kg: mensaje };
      }
      setErrores({ form: mensaje, filas: filasConError });
    } finally {
      setGuardando(false);
    }
  }

  const clienteItems = [
    { value: SIN_CLIENTE, label: t("consumidorFinal") },
    ...opcionesClientes.map((c) => ({ value: c._id, label: c.nombre })),
  ];

  return (
    <form className="flex flex-col gap-3.5" onSubmit={guardar} noValidate>
      <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
        <Field label={t("fecha")} error={errores.fecha}>
          <Input
            type="date"
            aria-label={t("fecha")}
            value={fecha}
            aria-invalid={!!errores.fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </Field>
        <Field label={t("cliente")} error={errorNuevoCliente}>
          {nuevoClienteAbierto ? (
            <div className="flex gap-2">
              <Input
                autoFocus
                aria-label={t("nombreNuevoCliente")}
                placeholder={t("nombreNuevoCliente")}
                value={nombreNuevo}
                aria-invalid={!!errorNuevoCliente}
                onChange={(e) => setNombreNuevo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void crearCliente();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    e.stopPropagation();
                    setNuevoClienteAbierto(false);
                  }
                }}
              />
              <Button type="button" loading={creandoCliente} onClick={crearCliente}>
                {t("crearCliente")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={tCommon("cancel")}
                onClick={() => {
                  setNuevoClienteAbierto(false);
                  setErrorNuevoCliente(undefined);
                }}
              >
                <XIcon />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Select
                items={clienteItems}
                value={clienteId}
                onValueChange={(v) => setClienteId((v as string | null) ?? SIN_CLIENTE)}
              >
                <SelectTrigger className="w-full min-w-0" aria-label={t("cliente")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SIN_CLIENTE}>{t("consumidorFinal")}</SelectItem>
                  {opcionesClientes.length > 0 && <SelectSeparator />}
                  {opcionesClientes.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                onClick={() => setNuevoClienteAbierto(true)}
              >
                <PlusIcon /> {t("nuevoCliente")}
              </Button>
            </div>
          )}
        </Field>
      </div>

      <div className="flex flex-col gap-2 border-t border-divider pt-3.5">
        <div className="hidden grid-cols-[minmax(0,1fr)_92px_108px_92px_32px] gap-2 text-xs text-text/70 sm:grid">
          <span>{t("lote")}</span>
          <span>{t("kg")}</span>
          <span>{t("precioPorKg")}</span>
          <span className="text-right">{t("subtotal")}</span>
          <span />
        </div>
        {filas.map((f) => {
          const err = errores.filas[f.key] ?? {};
          const opciones = opcionesLote(f);
          const lote = lotes.get(f.batchId);
          const sub = subtotal(f);
          return (
            <div key={f.key} className="flex flex-col gap-1">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_32px] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_92px_108px_92px_32px]">
                <div className="col-span-3 sm:col-span-1">
                  <Select
                    items={opciones.map((l) => ({ value: l.batchId, label: etiquetaLote(l) }))}
                    value={f.batchId || null}
                    onValueChange={(v) => editarFila(f.key, { batchId: (v as string | null) ?? "" })}
                  >
                    <SelectTrigger
                      className="w-full min-w-0"
                      aria-label={t("lote")}
                      aria-invalid={!!err.lote}
                    >
                      <SelectValue
                        placeholder={stock === null ? t("cargando") : t("elegirLote")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {opciones.length === 0 ? (
                        <div className="px-2.5 py-2 text-[13px] text-text-subtle">
                          {t("sinStock")}
                        </div>
                      ) : (
                        opciones.map((l) => (
                          <SelectItem key={l.batchId} value={l.batchId}>
                            {etiquetaLote(l)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0,00"
                  suffix="kg"
                  aria-label={t("kg")}
                  aria-invalid={!!err.kg}
                  value={f.kg}
                  onChange={(e) => editarFila(f.key, { kg: e.target.value })}
                />
                <Input
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0"
                  prefix="$"
                  aria-label={t("precioPorKg")}
                  aria-invalid={!!err.precio}
                  value={f.precio}
                  onChange={(e) => editarFila(f.key, { precio: e.target.value })}
                />
                <span className="hidden text-right text-[13px] tabular-nums sm:block">
                  {sub != null ? fmt.money(sub) : "—"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("quitarLote")}
                  title={t("quitarLote")}
                  className="text-text-muted hover:bg-danger-bg hover:text-danger-text"
                  disabled={filas.length === 1}
                  onClick={() => quitarFila(f.key)}
                >
                  <XIcon />
                </Button>
              </div>
              {(err.lote || err.kg || err.precio) ? (
                <p role="alert" className="m-0 text-xs leading-[17px] text-danger-text">
                  {[err.lote, err.kg, err.precio].filter(Boolean).join(" · ")}
                </p>
              ) : lote && f.batchId ? (
                <p className="m-0 text-xs text-text-subtle tabular-nums">
                  {t("disponibleHint", { disponible: fmt.kg(lote.disponibleKg, 2) })}
                  <span className="sm:hidden">
                    {" · "}
                    {t("subtotal")} {sub != null ? fmt.money(sub) : "—"}
                  </span>
                </p>
              ) : null}
            </div>
          );
        })}
        {errores.items && <p className="m-0 text-xs text-danger-text">{errores.items}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={agregarFila}
            disabled={stock !== null && filas.length >= lotes.size}
          >
            <PlusIcon /> {t("agregarLote")}
          </Button>
          <span className="text-[13px] text-text-muted">
            {t("total")}{" "}
            <span className="text-base font-medium text-foreground tabular-nums">
              {fmt.money(total)}
            </span>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-divider pt-3.5">
        <Field label={t("medioPago")}>
          <SegmentedControl<MedioPago>
            aria-label={t("medioPago")}
            block
            value={medioPago}
            onChange={setMedioPago}
            options={MEDIOS_PAGO.map((m) => ({ value: m, label: tEstados(`medioPago.${m}`) }))}
          />
        </Field>
        <label className="inline-flex w-fit cursor-pointer items-center gap-2 text-[13px] select-none">
          <input
            type="checkbox"
            className="size-4 accent-accent"
            checked={cobrada}
            onChange={(e) => setCobrada(e.target.checked)}
          />
          {t("cobrada")}
        </label>
        <Field label={t("notas")} optional>
          <Textarea
            aria-label={t("notas")}
            placeholder={t("notasPlaceholder")}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </Field>
      </div>

      {errores.form && <FieldWarning>{errores.form}</FieldWarning>}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          {tCommon("cancel")}
        </DialogClose>
        <Button type="submit" loading={guardando}>
          {venta ? t("guardar") : t("registrar")}
        </Button>
      </DialogFooter>
    </form>
  );
}
