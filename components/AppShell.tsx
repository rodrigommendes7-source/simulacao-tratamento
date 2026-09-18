"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { obterUtilizador, sair, type UtilizadorAtual } from "../lib/estado";
import { limparDadosAntigos } from "../lib/dadosAntigos";
import ThemeToggle from "./ThemeToggle";

/**
 * Páginas que se podem ver sem sessão iniciada.
 *
 * Renderizam sem a barra de navegação: os destinos dessa barra exigem sessão e
 * levariam a pessoa direita ao ecrã de entrada. `/experimentar` é o test drive
 * e traz a sua própria barra, mais curta.
 */
const PUBLICAS = ["/login", "/privacidade", "/experimentar"];

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
  /**
   * O utilizador em sessão, tal como o servidor o devolve. Mostra-se o
   * `nomeApresentacao` — como a pessoa escreveu o nome ("Ana Silva") — e não a
   * forma canónica que garante a unicidade na base de dados ("ana silva").
   */
  const [utilizador, setUtilizador] = useState<UtilizadorAtual | null>(null);
  /** Só há decisão de encaminhamento a tomar depois de o servidor responder. */
  const [sessaoLida, setSessaoLida] = useState(false);
  const [aviso, setAviso] = useState(false);

  // Limpeza única do armazenamento da versão local, antes de mais nada. Se lá
  // havia histórico, o aluno tem de saber por que razão desapareceu — ver
  // lib/dadosAntigos.ts.
  useEffect(() => {
    setAviso(limparDadosAntigos().haviaDados);
  }, []);

  const publica = PUBLICAS.includes(pathname);

  useEffect(() => {
    let cancelado = false;
    // A sessão é um cookie httpOnly: não é legível daqui, pergunta-se ao
    // servidor. `cancelado` evita escrever estado depois de a rota mudar.
    obterUtilizador().then((u) => {
      if (cancelado) return;
      setUtilizador(u);
      setSessaoLida(true);
      if (!u && !publica) router.replace("/login");
    });
    return () => {
      cancelado = true;
    };
  }, [pathname, publica, router]);

  if (publica) return <>{children}</>;
  if (!sessaoLida || !utilizador) return null;

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
              onClick={() => router.push("/conta")}
              title="Gerir a conta"
            >
              {utilizador.nomeApresentacao}
            </button>
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
              onClick={async () => {
                await sair();
                router.replace("/login");
              }}
              title="Terminar sessão"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
      <div className="conteudo" style={{ maxWidth: 1280, margin: "0 auto" }}>
        {aviso ? (
          <div
            className="card"
            role="status"
            style={{ padding: "14px 18px", marginBottom: 16, borderColor: "var(--warning)" }}
          >
            <div className="lbl">Mudámos a forma de guardar os dados</div>
            <p className="mu" style={{ fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
              Até agora, a conta e o histórico ficavam guardados apenas neste browser. Passaram a ficar na
              sua conta, no servidor, para poder entrar a partir de qualquer computador. O que estava
              guardado só neste browser não transitou — recomeça do zero, com a conta nova.{" "}
              <Link href="/privacidade" style={{ color: "var(--accent)" }}>
                Como tratamos os seus dados
              </Link>
              .
            </p>
            <button className="chip" style={{ marginTop: 10 }} onClick={() => setAviso(false)}>
              Compreendi
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
