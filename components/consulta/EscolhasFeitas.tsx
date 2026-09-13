"use client";

import type { Passo, RespostasConsulta } from "../../lib/sequenciaConsulta";

/**
 * Lista acumulada das escolhas, no topo do ecrã e sempre visível.
 *
 * Numa sequência de uma variável de cada vez o utilizador perde rapidamente a
 * noção do que já respondeu; mostrar as escolhas por ordem devolve esse
 * contexto. Cada entrada é clicável para voltar atrás e corrigir — sem isso,
 * um engano no primeiro passo obrigaria a recomeçar tudo.
 */
export default function EscolhasFeitas({
  passos,
  respostas,
  indiceAtual,
  onVoltarA,
}: {
  passos: Passo[];
  respostas: RespostasConsulta;
  indiceAtual: number;
  onVoltarA: (indice: number) => void;
}) {
  const feitas = passos
    .map((passo, indice) => ({ passo, indice, valores: respostas[passo.id] }))
    .filter((e) => e.valores !== undefined && e.indice < indiceAtual);

  if (feitas.length === 0) return null;

  return (
    <div className="soft" style={{ padding: "14px 16px" }}>
      <div className="lbl">Escolhas feitas · {feitas.length}</div>
      <div className="wrapchips" style={{ marginTop: 10 }}>
        {feitas.map(({ passo, indice, valores }) => {
          const etiquetas = (valores ?? []).map(
            (v) => passo.opcoes.find((o) => o.valor === v)?.label ?? v,
          );
          return (
            <button
              key={passo.id}
              className="chip"
              onClick={() => onVoltarA(indice)}
              title="Voltar a este passo para corrigir"
              style={{ alignItems: "baseline" }}
            >
              <span className="lbl">{passo.titulo}</span>
              <span style={{ color: "var(--ink)", fontWeight: 600 }}>
                {etiquetas.length ? etiquetas.join(", ") : "não avaliado"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
