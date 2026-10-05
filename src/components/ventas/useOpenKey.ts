"use client";

import { useState } from "react";

/**
 * Devuelve una key que cambia cada vez que el dialogo se abre, para remontar
 * el formulario con valores frescos sin vaciarlo durante la animacion de cierre.
 */
export function useOpenKey(open: boolean) {
  const [prevOpen, setPrevOpen] = useState(open);
  const [key, setKey] = useState(0);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setKey((k) => k + 1);
  }
  return key;
}
