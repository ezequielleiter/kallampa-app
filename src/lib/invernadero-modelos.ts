// Modelos de invernadero armados que tienen figura en vivo en el monitoreo.
export const MODELOS_INVERNADERO = ["kallampa_fructificacion_1"] as const;
export type ModeloInvernadero = (typeof MODELOS_INVERNADERO)[number];
