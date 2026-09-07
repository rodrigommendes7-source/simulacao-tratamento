import type { Metadata } from "next";
import { newsreader, ibmPlexSans, ibmPlexMono } from "./fonts";
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
    <html lang="pt-PT">
      <body
        className={`${newsreader.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
