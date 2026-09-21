import type { Metadata } from "next";
import { Hanken_Grotesk, Fira_Code } from "next/font/google";
import "./globals.css";
import { AuthGate } from "@/components/shared/AuthGate";
import { Toaster } from "@/components/ui/sonner";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const firaCode = Fira_Code({
  variable: "--font-fira",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Cultivo de hongos",
  description: "Gestión de lotes de cultivo de hongos productivos",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${hankenGrotesk.variable} ${firaCode.variable} h-full antialiased`}
    >
      <body className="h-full flex bg-background text-foreground">
        <AuthGate>{children}</AuthGate>
        <Toaster />
      </body>
    </html>
  );
}
