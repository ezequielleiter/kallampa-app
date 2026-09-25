"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/kallampa/Field";

interface FormValues {
  nombre: string;
  email: string;
  telefono: string;
  invernaderos: string;
  superficie: string;
  mensaje: string;
  /** Campo trampa: oculto para personas; si viene completo, es un bot. */
  sitio: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Seccion "Contacto": consulta para instalar la automatizacion en sitio. */
export function ContactSection() {
  const t = useTranslations("pages.landing.contacto");
  const [estado, setEstado] = useState<"idle" | "enviado" | "error">("idle");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { nombre: "", email: "", telefono: "", invernaderos: "", superficie: "", mensaje: "", sitio: "" },
  });

  async function onSubmit(v: FormValues) {
    setEstado("idle");
    const opt = (s: string) => (s.trim() === "" ? undefined : s.trim());
    const cant = v.invernaderos.trim() === "" ? undefined : Number(v.invernaderos);
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: v.nombre.trim(),
          email: v.email.trim(),
          telefono: opt(v.telefono),
          invernaderos: cant,
          superficie: opt(v.superficie),
          mensaje: opt(v.mensaje),
          sitio: opt(v.sitio),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setEstado("enviado");
      reset();
    } catch {
      setEstado("error");
    }
  }

  const pasos = [t("paso1"), t("paso2"), t("paso3")];

  return (
    <section id="contacto" className="landing-band scroll-mt-4 py-[clamp(56px,8vw,96px)]">
      <div className="landing-wrap grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-start gap-x-[clamp(32px,6vw,96px)] gap-y-10">
        <div>
          <div className="landing-kicker text-text/64">{t("kicker")}</div>
          <h2 className="landing-h2 max-w-[18ch]">{t("titulo")}</h2>
          <p className="mt-4 mb-0 max-w-[46ch] text-[15.5px] leading-[26px] text-text/82">{t("texto")}</p>
          <ol className="m-0 mt-7 flex list-none flex-col gap-3.5 p-0">
            {pasos.map((p, i) => (
              <li key={p} className="flex items-baseline gap-3 text-[14.5px]">
                <span className="w-[22px] text-[13px] text-text/64 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                {p}
              </li>
            ))}
          </ol>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="relative grid grid-cols-2 gap-3.5 rounded-lg bg-surface p-6 shadow-md"
        >
          <Field className="col-span-full" label={t("nombre")} htmlFor="c-nombre" error={errors.nombre?.message}>
            <Input
              id="c-nombre"
              autoComplete="name"
              placeholder={t("nombrePh")}
              aria-invalid={!!errors.nombre}
              {...register("nombre", { validate: (v) => v.trim() !== "" || t("nombreRequerido") })}
            />
          </Field>
          <Field className="col-span-full sm:col-span-1" label={t("correo")} htmlFor="c-email" error={errors.email?.message}>
            <Input
              id="c-email"
              type="email"
              autoComplete="email"
              placeholder={t("correoPh")}
              aria-invalid={!!errors.email}
              {...register("email", { validate: (v) => EMAIL_RE.test(v.trim()) || t("correoInvalido") })}
            />
          </Field>
          <Field className="col-span-full sm:col-span-1" label={t("telefono")} htmlFor="c-tel">
            <Input id="c-tel" type="tel" autoComplete="tel" placeholder={t("telefonoPh")} {...register("telefono")} />
          </Field>
          <Field className="col-span-full sm:col-span-1" label={t("invernaderos")} htmlFor="c-inv">
            <Input id="c-inv" type="number" min={1} inputMode="numeric" placeholder={t("invernaderosPh")} {...register("invernaderos")} />
          </Field>
          <Field className="col-span-full sm:col-span-1" label={t("superficie")} htmlFor="c-sup">
            <Input id="c-sup" placeholder={t("superficiePh")} {...register("superficie")} />
          </Field>
          <Field className="col-span-full" label={t("mensaje")} htmlFor="c-msg">
            <Textarea id="c-msg" rows={3} placeholder={t("mensajePh")} {...register("mensaje")} />
          </Field>
          {/* Campo trampa: fuera de pantalla y sin foco con teclado. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>
              Sitio web
              <input tabIndex={-1} autoComplete="off" {...register("sitio")} />
            </label>
          </div>

          <div className="col-span-full mt-1 flex flex-wrap items-center justify-between gap-3">
            <span role="status" className="flex items-center gap-1.5 text-[13px]">
              {estado === "error" && (
                <span className="flex items-center gap-1.5 text-danger-text">
                  <WarningCircleIcon className="size-4" />
                  {t("error")}
                </span>
              )}
            </span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="landing-btn cursor-pointer bg-transparent disabled:cursor-progress disabled:opacity-60"
            >
              {estado === "enviado" && !isSubmitting && <CheckCircleIcon className="size-4" />}
              {isSubmitting ? t("enviando") : estado === "enviado" ? t("enviado") : t("enviar")}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
