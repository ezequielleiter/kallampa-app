"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/kallampa/Field";
import { apiFetch } from "@/lib/api-client";
import { useOpenKey } from "./useOpenKey";
import type { Cliente } from "@/lib/types";

interface ClienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si viene, el dialogo edita ese cliente; si no, crea uno nuevo. */
  cliente?: Cliente;
  onSaved: (cliente: Cliente) => void;
}

/** Alta / edicion de un cliente (nombre, contacto, notas). */
export function ClienteFormDialog({ open, onOpenChange, cliente, onSaved }: ClienteFormDialogProps) {
  const t = useTranslations("components.clienteFormDialog");
  const formKey = useOpenKey(open);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[440px]">
        <DialogHeader>
          <DialogTitle>{cliente ? t("editTitle") : t("newTitle")}</DialogTitle>
        </DialogHeader>
        <ClienteForm
          key={formKey}
          cliente={cliente}
          onSaved={(c) => {
            onOpenChange(false);
            onSaved(c);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function ClienteForm({
  cliente,
  onSaved,
}: {
  cliente?: Cliente;
  onSaved: (cliente: Cliente) => void;
}) {
  const t = useTranslations("components.clienteFormDialog");
  const tCommon = useTranslations("common");
  const [nombre, setNombre] = useState(cliente?.nombre ?? "");
  const [contacto, setContacto] = useState(cliente?.contacto ?? "");
  const [notas, setNotas] = useState(cliente?.notas ?? "");
  const [errorNombre, setErrorNombre] = useState<string | undefined>();
  const [guardando, setGuardando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const n = nombre.trim();
    if (!n) {
      setErrorNombre(t("errorNombre"));
      return;
    }
    setErrorNombre(undefined);
    setGuardando(true);
    try {
      let guardado: Cliente;
      if (cliente) {
        guardado = await apiFetch<Cliente>(`/api/clientes/${cliente._id}`, {
          method: "PATCH",
          body: JSON.stringify({
            nombre: n,
            contacto: contacto.trim() || null,
            notas: notas.trim() || null,
          }),
        });
        toast.success(t("updatedMessage", { nombre: n }));
      } else {
        guardado = await apiFetch<Cliente>("/api/clientes", {
          method: "POST",
          body: JSON.stringify({
            nombre: n,
            ...(contacto.trim() ? { contacto: contacto.trim() } : {}),
            ...(notas.trim() ? { notas: notas.trim() } : {}),
          }),
        });
        toast.success(t("createdMessage", { nombre: n }));
      }
      onSaved(guardado);
    } catch (err) {
      // El 409 (nombre repetido) se muestra en el campo.
      setErrorNombre(err instanceof Error ? err.message : t("errorMessage"));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="flex flex-col gap-3.5" onSubmit={guardar} noValidate>
      <Field label={t("nombre")} htmlFor="cli-nombre" error={errorNombre}>
        <Input
          id="cli-nombre"
          placeholder={t("nombrePlaceholder")}
          autoFocus={!cliente}
          aria-invalid={!!errorNombre}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </Field>
      <Field label={t("contacto")} htmlFor="cli-contacto" optional>
        <Input
          id="cli-contacto"
          placeholder={t("contactoPlaceholder")}
          value={contacto}
          onChange={(e) => setContacto(e.target.value)}
        />
      </Field>
      <Field label={t("notas")} htmlFor="cli-notas" optional>
        <Textarea
          id="cli-notas"
          placeholder={t("notasPlaceholder")}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
      </Field>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          {tCommon("cancel")}
        </DialogClose>
        <Button type="submit" loading={guardando}>
          {cliente ? t("guardar") : t("crear")}
        </Button>
      </DialogFooter>
    </form>
  );
}
