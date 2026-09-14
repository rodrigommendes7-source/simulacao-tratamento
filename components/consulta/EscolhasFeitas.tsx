"use client";

import type { Passo, RespostasConsulta } from "../../lib/sequenciaConsulta";

/**
 * Lista acumulada das escolhas, no topo do ecrã e sempre visível.
 *
 * Numa sequência de uma variável de cada vez o utilizador perde rapidamente a
 * noção do que já respondeu; mostrar as escolhas por ordem devolve esse
 * contexto. Cada entrada é clicável para voltar atrás e corrigir — sem isso,
 * um engano no primeiro passo obrigaria a recomeçar tudo.
 *
 * Sem `onVoltarA` a lista é só de leitura: é o caso do ecrã de resultado, onde
 * não há passo nenhum para onde voltar. Antes passava-se aí uma função vazia,
 * e os chips continuavam a parecer botões — levantavam-se ao passar o rato,
 * diziam "Voltar a este passo para corrigir" e não faziam nada.
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
  onVoltarA?: (indice: number) => void;
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
          const conteudo = (
            <>
              <span className="lbl">{passo.titulo}</span>
              <span style={{ color: "var(--ink)", fontWeight: 600 }}>
                {etiquetas.length ? etiquetas.join(", ") : "não avaliado"}
              </span>
            </>
          );

          return onVoltarA ? (
            <button
              key={passo.id}
              className="chip"
              onClick={() => onVoltarA(indice)}
              title="Voltar a este passo para corrigir"
              style={{ alignItems: "baseline" }}
            >
              {conteudo}
            </button>
          ) : (
            <span key={passo.id} className="chip chip-estatico" style={{ alignItems: "baseline" }}>
              {conteudo}
            </span>
          );
        })}
      </div>
    </div>
  );
}
