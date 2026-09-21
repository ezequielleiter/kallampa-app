import { describe, it, expect, beforeEach } from "vitest";
import { addDays } from "date-fns";
import { GET } from "./route";
import {
  callRoute,
  makeBatch,
  colonizarJars,
  makeBatchConRecipiente,
  fructificarRecipiente,
  makeClonacion,
  makeClonacionDirecta,
  colonizarPlacas,
  makeTarea,
  makeFungusType,
  makeUser,
  authHeaders,
} from "@/test-utils/api-test-helpers";

function yearMonthOf(date: Date) {
  return { year: String(date.getUTCFullYear()), month: String(date.getUTCMonth() + 1) };
}

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

describe("GET /api/calendario", () => {
  it("incluye un pill 'grano' para un batch con jars sin colonizar", async () => {
    const batch = await makeBatch({
      userId: user._id,
      headers,
      fechaInicio: "2030-01-01T00:00:00.000Z",
      diasEsperados: 10,
    });

    const { status, json } = await callRoute(GET, {
      headers,
      searchParams: { year: "2030", month: "1" },
    });

    expect(status).toBe(200);
    const pill = json.data.lotePills.find((p: { tipo: string }) => p.tipo === "grano");
    expect(pill).toBeDefined();
    expect(pill!.codigo).toBe(batch.numeroLote);
    expect(pill!.href).toBe(`/lotes/${batch._id}`);
  });

  it("oculta el pill 'grano' cuando todos los jars ya fueron colonizados", async () => {
    const batch = await makeBatch({
      userId: user._id,
      headers,
      fechaInicio: "2030-01-01T00:00:00.000Z",
      diasEsperados: 10,
    });
    await colonizarJars(batch.jars, { userId: user._id, headers });

    const { json } = await callRoute(GET, { headers, searchParams: { year: "2030", month: "1" } });

    const pill = json.data.lotePills.find((p: { tipo: string }) => p.tipo === "grano");
    expect(pill).toBeUndefined();
  });

  it("no aparece al pedir un mes distinto al de la fecha esperada, si al pedir el correcto", async () => {
    await makeBatch({ userId: user._id, headers, fechaInicio: "2030-01-01T00:00:00.000Z", diasEsperados: 10 });

    const mesIncorrecto = await callRoute(GET, { headers, searchParams: { year: "2030", month: "2" } });
    expect(
      mesIncorrecto.json.data.lotePills.find((p: { tipo: string }) => p.tipo === "grano")
    ).toBeUndefined();

    const mesCorrecto = await callRoute(GET, { headers, searchParams: { year: "2030", month: "1" } });
    expect(
      mesCorrecto.json.data.lotePills.find((p: { tipo: string }) => p.tipo === "grano")
    ).toBeDefined();
  });

  it("incluye un pill 'incubacion' para un recipiente incubando, con href al lote", async () => {
    const { batch, recipiente } = await makeBatchConRecipiente({ userId: user._id, headers });
    // Default de fixture: fechaInicioIncubacion = ahora, diasEsperadosIncubacion = 20.
    const { year, month } = yearMonthOf(addDays(new Date(), 20));

    const { status, json } = await callRoute(GET, { headers, searchParams: { year, month } });

    expect(status).toBe(200);
    const pill = json.data.lotePills.find((p: { tipo: string }) => p.tipo === "incubacion");
    expect(pill).toBeDefined();
    expect(pill.codigo).toBe(recipiente.numeroSeguimiento);
    expect(pill.href).toBe(`/lotes/${batch._id}`);
  });

  it("al fructificar el recipiente, el pill 'incubacion' desaparece y aparece 'fructificacion'", async () => {
    const { recipiente } = await makeBatchConRecipiente({ userId: user._id, headers });
    await fructificarRecipiente(recipiente._id, { userId: user._id, headers });
    // Default de fixture: fechaInicioFructificacion = ahora, diasEsperadosFructificacion = 10.
    const { year, month } = yearMonthOf(addDays(new Date(), 10));

    const { json } = await callRoute(GET, { headers, searchParams: { year, month } });

    const pillIncub = json.data.lotePills.find((p: { tipo: string }) => p.tipo === "incubacion");
    expect(pillIncub).toBeUndefined();

    const pillFruct = json.data.lotePills.find((p: { tipo: string }) => p.tipo === "fructificacion");
    expect(pillFruct).toBeDefined();
    expect(pillFruct.codigo).toBe(recipiente.numeroSeguimiento);
  });

  it("incluye un pill 'placas' para una clonacion (origen placa) sin colonizar", async () => {
    const clonacion = await makeClonacion({
      userId: user._id,
      headers,
      fechaInicio: "2030-02-01T00:00:00.000Z",
      diasEsperados: 5,
    });

    const { status, json } = await callRoute(GET, { headers, searchParams: { year: "2030", month: "2" } });

    expect(status).toBe(200);
    const pill = json.data.lotePills.find((p: { tipo: string }) => p.tipo === "placas");
    expect(pill).toBeDefined();
    expect(pill.codigo).toBe(clonacion.numeroLote);
    expect(pill.href).toBe(`/clonacion/${clonacion._id}`);
  });

  it("oculta el pill 'placas' cuando todas las placas ya fueron colonizadas", async () => {
    const clonacion = await makeClonacion({
      userId: user._id,
      headers,
      fechaInicio: "2030-02-01T00:00:00.000Z",
      diasEsperados: 5,
    });
    await colonizarPlacas(clonacion.placas, { userId: user._id, headers });

    const { json } = await callRoute(GET, { headers, searchParams: { year: "2030", month: "2" } });

    const pill = json.data.lotePills.find((p: { tipo: string }) => p.tipo === "placas");
    expect(pill).toBeUndefined();
  });

  it("una clonacion directa (origen 'comprado') nunca genera pill 'placas'", async () => {
    const fungusType = await makeFungusType({ userId: user._id, headers });
    await makeClonacionDirecta({
      userId: user._id,
      headers,
      origenProceso: "comprado",
      fungusTypeId: fungusType._id,
      fechaInicio: new Date("2030-02-01"),
    });

    const { json } = await callRoute(GET, { headers, searchParams: { year: "2030", month: "2" } });

    const pill = json.data.lotePills.find((p: { tipo: string }) => p.tipo === "placas");
    expect(pill).toBeUndefined();
  });

  it("trae tareas y lotePills sin mezclarse", async () => {
    await makeBatch({ userId: user._id, headers, fechaInicio: "2030-01-01T00:00:00.000Z", diasEsperados: 10 });
    await makeTarea({ userId: user._id, headers, titulo: "Revisar", fecha: "2030-01-20" });

    const { status, json } = await callRoute(GET, { headers, searchParams: { year: "2030", month: "1" } });

    expect(status).toBe(200);
    expect(json.data.tareas).toHaveLength(1);
    expect(json.data.tareas[0].titulo).toBe("Revisar");
    expect(json.data.lotePills).toHaveLength(1);
    expect(json.data.lotePills[0].tipo).toBe("grano");
  });
});
