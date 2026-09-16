@AGENTS.md

## Bases de datos: nunca usar `cultivo_hongos` para pruebas

Este proyecto tiene **tres bases MongoDB separadas**, cada una con un único uso. No mezclar:

- **`cultivo_hongos`** — la base real de producción/uso diario (`.env.local`, `npm run dev`, puerto 3000). Contiene los datos reales del usuario. Nunca sembrar datos de prueba ni QA acá, ni limpiar/borrar nada de esta base salvo que el usuario lo pida explícitamente.
- **`cultivo_hongos_test`** — usada exclusivamente por la suite automatizada (`npm test`, ver `vitest.config.ts`/`vitest.global-setup.ts`). Se limpia sola antes/después de cada corrida. No la uses para probar algo a mano — puede estar corriendo un test en paralelo.
- **`cultivo_hongos_agent`** — para cuando un agente (una subtarea, una verificación en navegador, un `curl` de prueba, sembrar datos QA) necesita levantar la app de verdad y pegarle. Corré `npm run dev:agent` (arranca en el puerto **3099**, contra esta base, sin tocar `.env.local` ni el server que ya esté corriendo en 3000). Es de uso libre y descartable: para dejarla vacía de nuevo, `npm run db:reset-agent`.

**Regla para cualquier agente que trabaje en este repo**: si necesitás correr la app para verificar algo (no solo tests de Vitest), usá `npm run dev:agent`, nunca `npm run dev` a pelo — así no tocás los datos reales ni tenés que limpiar nada a mano después.
