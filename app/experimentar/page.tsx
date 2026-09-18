"use client";

import Link from "next/link";
import CaseSolver from "../../components/CaseSolver";
import ThemeToggle from "../../components/ThemeToggle";
import { CASO_TEST_DRIVE, ORIGEM_TEST_DRIVE } from "../../lib/testDrive";

/**
 * Test drive: um caso real, sem registo.
 *
 * Quem abre o link pela primeira vez decide em menos de um minuto se volta.
 * Pedir registo antes de mostrar valor inverte a ordem — e é também a peça que
 * faz funcionar o contacto com peritos e docentes, que recebem um link e não
 * criam conta para o abrir.
 *
 * Página pública (ver `PUBLICAS` em components/AppShell.tsx), o que significa
 * que não leva a barra de navegação da aplicação: os destinos dessa barra
 * exigem sessão e levariam a pessoa direita ao ecrã de entrada.
 *
 * O caso é **fixo** — quem partilha o link tem de saber o que a outra pessoa
 * vai ver. Nada aqui é escrito na base de dados: não há sessão, e todas as
 * rotas de dados a exigem.
 */
export default function ExperimentarPage() {
  return (
    <div style={{ minHeight: "100vh" }}>
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
        <div
          className="barra-topo"
          style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 14 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800, letterSpacing: "-.02em", fontSize: 15 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50% 50% 50% 7px", background: "var(--accent)" }} />
            Simulador
          </div>
          <span className="chip" style={{ fontSize: 11.5, padding: "5px 11px" }}>
            A experimentar · sem conta
          </span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <ThemeToggle />
            <Link href={`/login?origem=${ORIGEM_TEST_DRIVE}`} className="btn btn-p" style={{ fontSize: 12.5 }}>
              Criar conta
            </Link>
          </div>
        </div>
      </div>

      <div className="conteudo" style={{ maxWidth: 1280, margin: "0 auto" }}>
        <CaseSolver id={CASO_TEST_DRIVE} modo="testDrive" />
      </div>
    </div>
  );
}
