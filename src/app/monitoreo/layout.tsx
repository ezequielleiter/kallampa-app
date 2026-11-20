import { JetBrains_Mono } from "next/font/google";

// Cifras de telemetria en monoespaciada (solo en la vista de monitoreo).
const mono = JetBrains_Mono({ variable: "--font-mono-tele", subsets: ["latin"], weight: ["400", "500"] });

export default function MonitoreoLayout({ children }: LayoutProps<"/monitoreo">) {
  return <div className={`${mono.variable} contents`}>{children}</div>;
}
