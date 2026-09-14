"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { obterUtilizador, sair } from "../lib/estado";
import { obterConta } from "../lib/contas";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/casos", label: "Casos" },
  { href: "/aprender", label: "Aprender" },
  { href: "/estatisticas", label: "Estatísticas" },
  { href: "/consulta", label: "Consulta pontual" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [utilizador, setUtilizador] = useState<string | null>(null);
  /**
   * Como a pessoa escreveu o nome ("Ana Silva"), não a chave normalizada
   * que nomeia o espaço de dados ("ana silva"). A conta guarda as duas
   * (lib/contas.ts) precisamente para a interface poder mostrar a primeira.
   */
  const [nomeVisivel, setNomeVisivel] = useState<string | null>(null);

  useEffect(() => {
    const u = obterUtilizador();
    if (!u && pathname !== "/login") {
      router.replace("/login");
      return;
    }
    setUtilizador(u);
    // Contas criadas antes de haver `nomeApresentacao`, ou um registo
    // entretanto limpo, caem na chave — é sempre melhor do que ficar vazio.
    setNomeVisivel(u ? (obterConta(u)?.nomeApresentacao ?? u) : null);
  }, [pathname, router]);

  if (pathname === "/login") return <>{children}</>;
  if (!utilizador) return null;

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 70 }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          backdropFilter: "blur(14px)",
          background: "var(--nav-bg-translucent)",
          borderBottom: "1px solid var(--nav-line)",
        }}
      >
        {/*
          `flexWrap` + `gap`: em ecrãs estreitos a marca, a navegação e os
          controlos passam a ocupar mais do que uma linha em vez de forçarem a
          barra a ser mais larga do que o ecrã.
        */}
        <div
          className="barra-topo"
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontWeight: 800,
              letterSpacing: "-.02em",
              fontSize: 15,
              color: "var(--ink)",
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50% 50% 50% 7px",
                background: "var(--accent)",
              }}
            />
            Simulador
          </Link>
          <nav className="nav nav-principal">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={pathname === n.href ? "nav-on" : ""}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <ThemeToggle />
            <button
              className="soft"
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                font: "500 12px/1 var(--font-jetbrains)",
                color: "var(--muted)",
                border: "1px solid var(--line)",
                cursor: "pointer",
              }}
              onClick={() => {
                sair();
                router.replace("/login");
              }}
              title="Terminar sessão"
            >
              {nomeVisivel ?? utilizador}
            </button>
          </div>
        </div>
      </div>
      <div className="conteudo" style={{ maxWidth: 1280, margin: "0 auto" }}>{children}</div>
    </div>
  );
}
