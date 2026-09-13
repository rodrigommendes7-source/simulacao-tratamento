"use client";

import { useState } from "react";
import { REFERENCIAS } from "../../dados/referenciasCompletas";

/**
 * Bloco de referências no fim de uma página de detalhe.
 *
 * Antes, cada referência aparecia como o seu ID de registo ("R2", "R34") e só
 * revelava a citação depois de expandir — um ID solto não diz nada ao aluno.
 * Agora o que se vê é a palavra "Referências" com a contagem; ao expandir,
 * sai a lista de citações completas. Os IDs continuam a ser a chave de
 * ligação a `referencias.md` nos dados, mas deixam de aparecer no ecrã.
 */
export default function BlocoReferencias({ ids }: { ids: string[] }) {
  const [aberto, setAberto] = useState(false);
  if (ids.length === 0) return null;

  const referencias = ids.map((id) => ({ id, ref: REFERENCIAS[id] }));

  return (
    <section className="soft" style={{ marginTop: 22, padding: 0, overflow: "hidden" }}>
      <button
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        style={{
          width: "100%",
          textAlign: "left",
          background: "transparent",
          border: 0,
          cursor: "pointer",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "var(--ink)",
          font: "600 13.5px/1 inherit",
        }}
      >
        <span aria-hidden="true">📚</span>
        <span>Referências</span>
        <span className="lbl">{referencias.length}</span>
        <span className="lbl" style={{ marginLeft: "auto" }}>{aberto ? "recolher −" : "ver citações +"}</span>
      </button>

      {aberto ? (
        <ol style={{ margin: 0, padding: "0 18px 16px 34px", display: "flex", flexDirection: "column", gap: 10 }}>
          {referencias.map(({ id, ref }) => (
            <li key={id} style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--text-soft)" }}>
              {ref ? ref.citacao : "Referência não encontrada no registo do projeto."}
              {ref?.terciaria ? (
                <div className="mu" style={{ marginTop: 3, fontSize: 11.5 }}>
                  ⚠ Fonte terciária/comercial ou citação incompleta.
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
