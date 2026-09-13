"use client";

import { useEffect, useState } from "react";
import { aplicarTema, obterTema, type Tema } from "../lib/tema";

export default function ThemeToggle() {
  const [tema, setTema] = useState<Tema | null>(null);

  useEffect(() => {
    setTema(obterTema());
  }, []);

  if (!tema) return null;

  function alternar() {
    const novo: Tema = tema === "dark" ? "light" : "dark";
    aplicarTema(novo);
    setTema(novo);
  }

  return (
    <button
      className="soft"
      onClick={alternar}
      title={tema === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
      aria-label="Alternar tema"
      style={{
        width: 36,
        height: 36,
        borderRadius: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        border: "1px solid var(--line)",
        color: "var(--ink)",
        fontSize: 16,
        lineHeight: 1,
      }}
    >
      {tema === "dark" ? "☀︎" : "☾"}
    </button>
  );
}
