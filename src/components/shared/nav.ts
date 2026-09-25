import {
  PlantIcon,
  FlaskIcon,
  ThermometerSimpleIcon,
  CalendarBlankIcon,
  TreeStructureIcon,
  NoteIcon,
  BarcodeIcon,
  PackageIcon,
  ChartBarIcon,
  type Icon,
} from "@phosphor-icons/react";

// Secciones del panel, en el orden de la sidebar. Iconos segun el DS
// (kallampa-ds/README.md, ICONOGRAPHY). Las claves son las de `nav.*`.
export const NAV_LINKS: { href: string; key: NavKey; icon: Icon }[] = [
  { href: "/", key: "produccion", icon: PlantIcon },
  { href: "/clonacion", key: "micelio", icon: FlaskIcon },
  { href: "/invernaderos", key: "invernaderos", icon: ThermometerSimpleIcon },
  { href: "/calendario", key: "calendario", icon: CalendarBlankIcon },
  { href: "/trazabilidad", key: "trazabilidad", icon: TreeStructureIcon },
  { href: "/notas", key: "notas", icon: NoteIcon },
  { href: "/identificador", key: "frascos", icon: BarcodeIcon },
  { href: "/inventario", key: "catalogos", icon: PackageIcon },
  { href: "/estadisticas", key: "estadisticas", icon: ChartBarIcon },
];

export type NavKey =
  | "produccion"
  | "micelio"
  | "invernaderos"
  | "calendario"
  | "trazabilidad"
  | "notas"
  | "frascos"
  | "catalogos"
  | "estadisticas";

export function navLinkForPath(pathname: string | null) {
  if (!pathname) return undefined;
  if (pathname === "/" || pathname.startsWith("/lotes")) return NAV_LINKS[0];
  return NAV_LINKS.find((l) => l.href !== "/" && pathname.startsWith(l.href));
}
