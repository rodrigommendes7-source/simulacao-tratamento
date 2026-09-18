"use client";

import { useState } from "react";

/**
 * O código de recuperação, mostrado **uma única vez**.
 *
 * Sem email, este código é a única forma de repor uma palavra-passe perdida.
 * O servidor guarda apenas o hash — ninguém, nem o servidor, o consegue voltar
 * a mostrar. Daí o ecrã inteiro para uma coisa só, e daí o botão de continuar
 * ficar travado atrás de uma confirmação explícita: um botão "Continuar"
 * carregado por reflexo deixaria a pessoa sem caminho de volta se perdesse a
 * palavra-passe.
 */
export default function CodigoRecuperacao({
  codigo,
  onContinuar,
}: {
  codigo: string;
  onContinuar: () => void;
}) {
  const [confirmado, setConfirmado] = useState(false);
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
    } catch {
      // Sem permissão para a área de transferência (acontece em alguns
      // browsers fora de HTTPS). O código está à vista e pode ser copiado à
      // mão — não vale a pena fazer disto um erro.
    }
  }

  return (
    <div>
      <div className="lbl">Guarde este código</div>
      <h1 className="h1" style={{ marginTop: 12 }}>
        Só lhe mostramos
        <br />
        este código uma vez.
      </h1>

      <div
        className="soft"
        style={{ marginTop: 18, padding: 20, textAlign: "center", border: "1px solid var(--line-strong)" }}
      >
        <div
          style={{
            font: "700 22px/1.4 var(--font-jetbrains)",
            letterSpacing: ".12em",
            wordBreak: "break-all",
            color: "var(--ink)",
          }}
        >
          {codigo}
        </div>
        <button className="chip" type="button" style={{ marginTop: 14 }} onClick={copiar} aria-live="polite">
          {copiado ? "Copiado ✓" : "Copiar código"}
        </button>
      </div>

      <p className="mu" style={{ fontSize: 12.5, marginTop: 16, lineHeight: 1.6 }}>
        Como não pedimos email, este código é a <strong>única</strong> forma de repor a palavra-passe se a
        perder. Escreva-o num sítio onde o volte a encontrar — no telemóvel, num caderno, onde quiser.
        Quando o usar, receberá outro no lugar deste.
      </p>

      <label
        className="soft"
        style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 16, padding: 14, cursor: "pointer" }}
      >
        <input
          type="checkbox"
          checked={confirmado}
          onChange={(e) => setConfirmado(e.target.checked)}
          style={{ marginTop: 2 }}
        />
        <span style={{ fontSize: 13, lineHeight: 1.5 }}>Guardei o código num sítio seguro.</span>
      </label>

      <button
        className="btn btn-p"
        style={{ width: "100%", marginTop: 14 }}
        type="button"
        disabled={!confirmado}
        onClick={onContinuar}
      >
        Continuar para o simulador
      </button>
    </div>
  );
}
