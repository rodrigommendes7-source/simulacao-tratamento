"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { iniciarSessao } from "../../lib/estado";
import {
  MAX_PALAVRA_PASSE,
  MAX_UTILIZADOR,
  MIN_PALAVRA_PASSE,
  autenticar,
  criarConta,
} from "../../lib/contas";
import ThemeToggle from "../../components/ThemeToggle";

type Modo = "entrar" | "criar";

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("entrar");
  const [nome, setNome] = useState("");
  const [palavraPasse, setPalavraPasse] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  /** O campo só aceita dígitos e trava no máximo — mais claro do que deixar escrever e recusar depois. */
  function escreverPin(valor: string, definir: (v: string) => void) {
    definir(valor.replace(/\D/g, "").slice(0, MAX_PALAVRA_PASSE));
  }

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setOcupado(true);
    try {
      if (modo === "criar" && palavraPasse !== confirmacao) {
        setErro("As palavras-passe não coincidem.");
        return;
      }
      const resultado =
        modo === "entrar" ? await autenticar(nome, palavraPasse) : await criarConta(nome, palavraPasse);

      if (!resultado.ok || !resultado.conta) {
        setErro(resultado.erro ?? "Não foi possível continuar.");
        return;
      }
      iniciarSessao(resultado.conta.utilizador);
      router.push("/");
    } catch {
      setErro("Não foi possível guardar a conta neste browser.");
    } finally {
      setOcupado(false);
    }
  }

  function trocarModo(novo: Modo) {
    setModo(novo);
    setErro(null);
    setPalavraPasse("");
    setConfirmacao("");
  }

  const estiloCampo: React.CSSProperties = {
    background: "var(--soft-alt)",
    border: "1px solid var(--line-strong)",
    borderRadius: 10,
    padding: "11px 13px",
    color: "var(--ink)",
    fontSize: 15,
    width: "100%",
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative", display: "flex", justifyContent: "center", alignItems: "center", padding: "40px 20px" }}>
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <ThemeToggle />
      </div>

      <div className="card animate-up" style={{ padding: 34, width: 460, maxWidth: "100%" }}>
        <div className="lbl">Identificação</div>
        <h1 className="h1" style={{ marginTop: 12 }}>
          {modo === "entrar" ? (
            <>
              Entrar com o seu
              <br />
              nome de utilizador.
            </>
          ) : (
            <>
              Criar a sua
              <br />
              conta de treino.
            </>
          )}
        </h1>

        {/* Alternar entre entrar e criar conta */}
        <div className="nav" style={{ marginTop: 20, display: "inline-flex" }} role="tablist">
          {(["entrar", "criar"] as Modo[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={modo === m}
              className={modo === m ? "nav-on" : ""}
              onClick={() => trocarModo(m)}
              type="button"
            >
              {m === "entrar" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        <form onSubmit={submeter}>
          <div className="soft" style={{ marginTop: 18, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="lbl">Nome de utilizador</span>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value.slice(0, MAX_UTILIZADOR))}
                placeholder="ex.: ana.silva"
                autoComplete="username"
                autoFocus
                style={estiloCampo}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="lbl">Palavra-passe ({MIN_PALAVRA_PASSE} a {MAX_PALAVRA_PASSE} dígitos)</span>
              <input
                value={palavraPasse}
                onChange={(e) => escreverPin(e.target.value, setPalavraPasse)}
                placeholder="••••••"
                type="password"
                inputMode="numeric"
                autoComplete={modo === "entrar" ? "current-password" : "new-password"}
                style={{ ...estiloCampo, letterSpacing: ".3em", font: "500 17px/1 var(--font-jetbrains)" }}
              />
            </label>

            {modo === "criar" ? (
              <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span className="lbl">Confirmar palavra-passe</span>
                <input
                  value={confirmacao}
                  onChange={(e) => escreverPin(e.target.value, setConfirmacao)}
                  placeholder="••••••"
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  style={{ ...estiloCampo, letterSpacing: ".3em", font: "500 17px/1 var(--font-jetbrains)" }}
                />
              </label>
            ) : null}

            {erro ? (
              <div role="alert" style={{ color: "var(--danger)", fontSize: 12.5, lineHeight: 1.5 }}>{erro}</div>
            ) : null}
          </div>

          <button className="btn btn-p" style={{ width: "100%", marginTop: 14 }} type="submit" disabled={ocupado}>
            {ocupado ? "A verificar…" : modo === "entrar" ? "Entrar" : "Criar conta e entrar"}
          </button>
        </form>

        <p className="mu" style={{ fontSize: 12, marginTop: 16, lineHeight: 1.6 }}>
          A conta fica guardada só neste dispositivo — não há servidor. Se limpar os dados do browser, ou entrar
          noutro computador, terá de criar a conta de novo. Não use uma palavra-passe que use noutro sítio.
        </p>
      </div>
    </div>
  );
}
