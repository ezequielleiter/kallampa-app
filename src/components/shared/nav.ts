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
  StorefrontIcon,
  WrenchIcon,
  type Icon,
} from "@phosphor-icons/react";

type NavLink = { href: string; key: NavKey; icon: Icon };

// Secciones del panel, agrupadas como en la sidebar: el trabajo de todos los
// dias, el seguimiento y los recursos. Iconos segun el DS (kallampa-ds/README.md,
// ICONOGRAPHY). Las claves son las de `nav.*` y `nav.grupos.*`.
export const NAV_GROUPS: { key: "cultivo" | "seguimiento" | "recursos"; links: NavLink[] }[] = [
  {
    key: "cultivo",
    links: [
      { href: "/lotes", key: "produccion", icon: PlantIcon },
      { href: "/clonacion", key: "micelio", icon: FlaskIcon },
      { href: "/invernaderos", key: "invernaderos", icon: ThermometerSimpleIcon },
      { href: "/calendario", key: "calendario", icon: CalendarBlankIcon },
    ],
  },
  {
    key: "seguimiento",
    links: [
      { href: "/trazabilidad", key: "trazabilidad", icon: TreeStructureIcon },
      { href: "/estadisticas", key: "estadisticas", icon: ChartBarIcon },
      { href: "/ventas", key: "ventas", icon: StorefrontIcon },
    ],
  },
  {
    key: "recursos",
    links: [
      { href: "/inventario", key: "catalogos", icon: PackageIcon },
      { href: "/herramientas", key: "herramientas", icon: WrenchIcon },
      { href: "/notas", key: "notas", icon: NoteIcon },
    ],
  },
];

// /identificador no va en la sidebar: la busqueda por N° de guia de la topbar
// hace lo mismo. Sigue en la lista para que la pagina tenga su breadcrumb.
export const NAV_LINKS: NavLink[] = [
  ...NAV_GROUPS.flatMap((g) => g.links),
  { href: "/identificador", key: "frascos", icon: BarcodeIcon },
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
  | "ventas"
  | "estadisticas"
  | "herramientas";

export function navLinkForPath(pathname: string | null) {
  if (!pathname) return undefined;
  return NAV_LINKS.find((l) => pathname.startsWith(l.href));
}
