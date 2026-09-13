import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { jakarta, jetbrainsMono } from "./fonts";
import AppShell from "../components/AppShell";
import { SCRIPT_TEMA_INICIAL } from "../lib/tema";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simulador de Feridas",
  description:
    "Simulador clínico para avaliação e tratamento de feridas, baseado em guidelines internacionais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA_INICIAL }} />
      </head>
      {/*
        suppressHydrationWarning no <body> por causa de extensões do browser
        (Grammarly e afins) que injetam atributos como
        `data-new-gr-c-s-check-loaded` antes de o React hidratar: o servidor
        nunca os escreveu, e o aviso resultante não corresponde a nenhum
        problema da aplicação. O aviso só é suprimido neste elemento — não se
        propaga aos filhos, por isso uma divergência real dentro da árvore
        continua a ser reportada.
      */}
      <body
        suppressHydrationWarning
        className={`${jakarta.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <AppShell>{children}</AppShell>
        <Analytics />
      </body>
    </html>
  );
}
