import { describe, it, expect } from "vitest";
import { POST } from "./route";
import { callRoute } from "@/test-utils/api-test-helpers";
import Contacto from "@/models/Contacto";

const valido = {
  nombre: "Ana",
  email: "Ana@Ejemplo.com",
  telefono: "+54 11 5555-5555",
  invernaderos: 2,
  superficie: "120 m²",
  mensaje: "Ostra rosada, fructificación",
};

describe("POST /api/contacto", () => {
  it("guarda la consulta sin requerir cuenta", async () => {
    const { status, json } = await callRoute(POST, { method: "POST", body: valido });
    expect(status).toBe(201);
    expect(json.data).toEqual({ recibido: true });
    const guardados = await Contacto.find().lean();
    expect(guardados).toHaveLength(1);
    expect(guardados[0]).toMatchObject({ nombre: "Ana", email: "ana@ejemplo.com", invernaderos: 2 });
  });

  it("valida nombre, email y topes de largo", async () => {
    for (const body of [
      { ...valido, nombre: "" },
      { ...valido, email: "no-es-email" },
      { ...valido, mensaje: "x".repeat(2001) },
      { ...valido, invernaderos: 0 },
    ]) {
      expect((await callRoute(POST, { method: "POST", body })).status).toBe(400);
    }
    expect(await Contacto.countDocuments()).toBe(0);
  });

  it("si el campo trampa viene completo responde OK pero no guarda", async () => {
    const { status } = await callRoute(POST, { method: "POST", body: { ...valido, sitio: "http://spam" } });
    expect(status).toBe(201);
    expect(await Contacto.countDocuments()).toBe(0);
  });
});
