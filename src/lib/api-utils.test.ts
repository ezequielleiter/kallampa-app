import { describe, it, expect } from "vitest";
import { splitErrorCode } from "@/lib/api-utils";

describe("splitErrorCode", () => {
  it("separa code y mensaje cuando el string sigue la convencion", () => {
    expect(splitErrorCode("titulo_requerido:El título es requerido")).toEqual({
      code: "titulo_requerido",
      message: "El título es requerido",
    });
  });

  it("devuelve el string entero como mensaje si no tiene ':'", () => {
    expect(splitErrorCode("mensaje sin dos puntos")).toEqual({
      message: "mensaje sin dos puntos",
    });
  });

  it("devuelve mensaje vacio sin code para un string vacio", () => {
    expect(splitErrorCode("")).toEqual({ message: "" });
  });

  it("no confunde un ':' dentro del propio mensaje con un code", () => {
    // Caso real: mensajes que ya traen dos puntos en su prosa (ej. "estado
    // actual: 'colonizando'") no deben partirse como si el texto antes del
    // ':' fuera un code -- el patron de code exige snake_case sin espacios.
    const raw = "El frasco no esta disponible (estado actual: 'colonizando')";
    expect(splitErrorCode(raw)).toEqual({ message: raw });
  });
});
