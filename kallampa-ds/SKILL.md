---
name: kallampa-design
description: Use this skill to generate well-branded interfaces and assets for Kallampa (gestión de cultivos de hongos), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Key rules (details in README.md):
- Import `styles.css` once; take every color/space/radius/shadow from its CSS variables. Load Phosphor Icons (regular).
- Compose screens from `components/` (read each `.prompt.md` and `.d.ts`). Use StatusTag for any domain state.
- Dark, dense, mono-accent UI: outlined primary buttons, accent as line/glow, coral (`--color-danger`) only for contamination and errors, Inter 500 max.
- Copy in rioplatense Spanish with voseo ("Elegí", "Ingresá"), es-AR number formatting ("4,00 kg", "$ 9.160"), traceable codes like `ENK-L-2026-001-R02`.
- Reference implementation of the full panel: `ui_kits/panel/`.
