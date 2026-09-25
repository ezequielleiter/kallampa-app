import type { Metadata } from "next";
import { Landing } from "@/components/landing/Landing";

export const metadata: Metadata = {
  title: "Kallampa · Gestión de cultivos de hongos",
  description:
    "Del micelio a la cosecha: producción, contaminación, clonación, trazabilidad, costos y el clima de tus invernaderos, en un solo lugar.",
};

// Landing publica. El panel (lista de lotes) vive en /lotes.
export default function Home() {
  return <Landing />;
}
