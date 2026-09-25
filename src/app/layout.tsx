import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthGate } from "@/components/shared/AuthGate";
import { LocaleProvider } from "@/components/shared/LocaleProvider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Kallampa",
  description: "Gestión de cultivos de hongos",
};

// `data-theme` elige el bloque de tokens de src/styles/kallampa/tokens.css.
// Hoy hay un solo tema (oscuro); para sumar otro, definir sus primitivos bajo
// `[data-theme="<nombre>"]` y cambiar este atributo.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" data-theme="kallampa-dark" className={`${inter.variable} h-full`}>
      <body className="min-h-full">
        <LocaleProvider>
          <AuthGate>{children}</AuthGate>
          <Toaster />
        </LocaleProvider>
      </body>
    </html>
  );
}
