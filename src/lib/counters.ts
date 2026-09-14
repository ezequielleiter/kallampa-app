import Counter from "@/models/Counter";

/**
 * Genera y devuelve el siguiente numeroLote formateado como L-<anio>-<seq>,
 * con la secuencia scopeada por anio y padding a 3 digitos (001, 002, ...).
 * Usa findOneAndUpdate con $inc + upsert para que la asignacion sea atomica
 * incluso con requests concurrentes.
 */
export async function getNextNumeroLote(date: Date = new Date()): Promise<string> {
  const year = date.getFullYear();
  const scopeId = `batch:${year}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: scopeId },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );

  const seq = counter.seq;
  const padded = String(seq).padStart(3, "0");

  return `L-${year}-${padded}`;
}
