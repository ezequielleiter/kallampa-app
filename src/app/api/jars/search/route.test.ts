import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "./route";
import { callRoute, makeBatch, makeUser, authHeaders } from "@/test-utils/api-test-helpers";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

describe("GET /api/jars/search", () => {
  it("encuentra un frasco case-insensitive por numeroGuia", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    const numeroGuia: string = batch.jars[0].numeroGuia;

    const { status, json } = await callRoute(GET, {
      headers,
      searchParams: { numeroGuia: numeroGuia.toLowerCase() },
    });

    expect(status).toBe(200);
    expect(json.data.numeroGuia).toBe(numeroGuia);
    expect(json.data.batch.numeroLote).toBe(batch.numeroLote);
  });

  it("404 con mensaje claro si no existe", async () => {
    const { status, json } = await callRoute(GET, {
      headers,
      searchParams: { numeroGuia: "L-9999-999-F99" },
    });

    expect(status).toBe(404);
    expect(json.error).toMatch(/no se encontro/i);
    expect(json.error).toMatch(/L-9999-999-F99/);
  });
});
