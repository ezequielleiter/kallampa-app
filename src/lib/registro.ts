/**
 * ¿Se pueden crear cuentas nuevas? Lo controla `REGISTRO_HABILITADO`:
 *  - "true"  → abierto.
 *  - cualquier otro valor → cerrado.
 *  - sin definir → abierto en desarrollo/tests y CERRADO en produccion, para
 *    que un deploy publico (Vercel) no quede con el registro abierto por
 *    olvido. Para crear la primera cuenta se pone en "true", se registra y
 *    se vuelve a sacar (ver DEPLOY.md).
 */
export function registroHabilitado(): boolean {
  const v = process.env.REGISTRO_HABILITADO?.trim().toLowerCase();
  if (v === undefined || v === "") return process.env.NODE_ENV !== "production";
  return v === "true";
}
