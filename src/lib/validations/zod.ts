import { z } from "zod";

// Mensajes por defecto para los issues sin mensaje propio (sobre todo campos
// vacios), en el formato "codigo:mensaje" que entiende translateErrorMessage.
// Sin esto zod devuelve "expected number, received undefined" en ingles.
z.config({
  customError: (iss) => {
    if (iss.code === "invalid_type") {
      const vacio =
        iss.input === undefined ||
        iss.input === null ||
        iss.input === "" ||
        (typeof iss.input === "number" && Number.isNaN(iss.input)) ||
        (iss.input instanceof Date && Number.isNaN(iss.input.getTime()));
      return vacio
        ? "campo_requerido:Este campo es obligatorio"
        : "valor_invalido:Revisá este valor";
    }
    return "valor_invalido:Revisá este valor";
  },
});

export { z };
