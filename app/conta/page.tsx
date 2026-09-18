"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  alterarPalavraPasse,
  apagarConta,
  obterUtilizador,
  type UtilizadorAtual,
} from "../../lib/estado";
import { ErroApi } from "../../lib/api";
import { MAX_PALAVRA_PASSE, MIN_PALAVRA_PASSE, validarPalavraPasse } from "../../lib/contas";

/**
 * Gestão da conta: alterar a palavra-passe e apagar a conta.
 *
 * Apagar a conta tem de existir e tem de ser encontrável — é obrigação legal
 * e, sobretudo, é o que torna verdadeira a promessa que a página de
 * privacidade faz. A eliminação é efetiva e imediata: a linha do utilizador
 * desaparece e as chaves estrangeiras em cascata levam resultados, consultas,
 * rascunhos e sessões com ela.
 */
export default function ContaPage() {
  const router = useRouter();
  const [utilizador, setUtilizador] = useState<UtilizadorAtual | null>(null);

  useEffect(() => {
    obterUtilizador().then(setUtilizador);
  }, []);

  if (!utilizador) return null;

  return (
    <div className="animate-up" style={{ maxWidth: 620 }}>
      <h1 className="h1">A sua conta</h1>
      <p className="mu" style={{ fontSize: 13, marginTop: 6 }}>
        Com sessão iniciada como <strong>{utilizador.nomeApresentacao}</strong>.{" "}
        <Link href="/privacidade" style={{ color: "var(--accent)" }}>
          Como tratamos os seus dados
        </Link>
        .
      </p>

      <AlterarPalavraPasse />
      <ApagarConta onApagada={() => router.replace("/login")} />
    </div>
  );
}

const ESTILO_CAMPO: React.CSSProperties = {
  background: "var(--soft-alt)",
  border: "1px solid var(--line-strong)",
  borderRadius: 10,
  padding: "11px 13px",
  color: "var(--ink)",
  width: "100%",
  letterSpacing: ".3em",
  font: "500 17px/1 var(--font-jetbrains)",
};

function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "").slice(0, MAX_PALAVRA_PASSE);
}

function AlterarPalavraPasse() {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setFeito(false);

    const erroNova = validarPalavraPasse(nova);
    if (erroNova) return setErro(erroNova);
    if (nova !== confirmacao) return setErro("As palavras-passe novas não coincidem.");

    setOcupado(true);
    try {
      await alterarPalavraPasse(atual, nova);
      setFeito(true);
      setAtual("");
      setNova("");
      setConfirmacao("");
    } catch (causa) {
      setErro(causa instanceof ErroApi ? causa.message : "Não foi possível alterar a palavra-passe.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <form className="card" style={{ padding: 22, marginTop: 20 }} onSubmit={submeter}>
      <div className="lbl">Alterar a palavra-passe</div>
      <p className="mu" style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.6 }}>
        Entre {MIN_PALAVRA_PASSE} e {MAX_PALAVRA_PASSE} dígitos. Ao alterar, as sessões abertas noutros
        computadores terminam.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span className="lbl">Palavra-passe atual</span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={atual}
            onChange={(e) => setAtual(apenasDigitos(e.target.value))}
            style={ESTILO_CAMPO}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span className="lbl">Nova palavra-passe</span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            value={nova}
            onChange={(e) => setNova(apenasDigitos(e.target.value))}
            style={ESTILO_CAMPO}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span className="lbl">Confirmar nova palavra-passe</span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            value={confirmacao}
            onChange={(e) => setConfirmacao(apenasDigitos(e.target.value))}
            style={ESTILO_CAMPO}
          />
        </label>

        {erro ? (
          <div role="alert" style={{ color: "var(--danger)", fontSize: 12.5 }}>{erro}</div>
        ) : null}
        {feito ? (
          <div role="status" style={{ color: "var(--success)", fontSize: 12.5 }}>Palavra-passe alterada.</div>
        ) : null}
      </div>

      <button className="btn" style={{ marginTop: 14 }} type="submit" disabled={ocupado}>
        {ocupado ? "A alterar…" : "Alterar palavra-passe"}
      </button>
    </form>
  );
}

function ApagarConta({ onApagada }: { onApagada: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [palavraPasse, setPalavraPasse] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setOcupado(true);
    try {
      await apagarConta(palavraPasse);
      onApagada();
    } catch (causa) {
      setErro(causa instanceof ErroApi ? causa.message : "Não foi possível apagar a conta.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="card" style={{ padding: 22, marginTop: 16, borderColor: "var(--danger)" }}>
      <div className="lbl" style={{ color: "var(--danger)" }}>Apagar a conta</div>
      <p className="mu" style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.6 }}>
        Apaga a conta e tudo o que lhe está associado: casos resolvidos, consultas guardadas e rascunhos.
        É imediato e não há forma de voltar atrás — não guardamos cópia.
      </p>

      {aberto ? (
        <form onSubmit={submeter} style={{ marginTop: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="lbl">Escreva a palavra-passe para confirmar</span>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={palavraPasse}
              onChange={(e) => setPalavraPasse(apenasDigitos(e.target.value))}
              autoFocus
              style={ESTILO_CAMPO}
            />
          </label>

          {erro ? (
            <div role="alert" style={{ color: "var(--danger)", fontSize: 12.5, marginTop: 10 }}>{erro}</div>
          ) : null}

          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <button
              className="btn"
              type="submit"
              disabled={ocupado || !palavraPasse}
              style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
            >
              {ocupado ? "A apagar…" : "Apagar a conta definitivamente"}
            </button>
            <button className="btn" type="button" onClick={() => setAberto(false)}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          className="btn"
          style={{ marginTop: 14, borderColor: "var(--danger)", color: "var(--danger)" }}
          onClick={() => setAberto(true)}
        >
          Apagar a conta
        </button>
      )}
    </div>
  );
}
