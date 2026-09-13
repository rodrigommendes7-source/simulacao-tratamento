"use client";

import { categoriasParaMostrar, mostrarNivelInfecao } from "../../lib/relevanciaResultado";
import { explicarNivelInfecao } from "../../lib/explicarNivelInfecao";
import { LABEL_CATEGORIA, LABEL_NIVEL_INFECAO } from "../../lib/etiquetas";
import type { CasoClinico } from "../../tipos/casoClinico";
import type {
  DecisaoCaso,
  ResultadoCausaTratada,
  ResultadoOncologico,
  ResultadoPortaoSistemico,
} from "../../tipos/resultado";
import type { CorrespondenciaTecnica } from "../../algoritmo/avaliarTecnicas";
import { TODAS_TECNICAS } from "../../dados/tecnicasAplicacao";

/** "A, B ou C" — a lista de indicados são alternativas, não uma receita a cumprir toda. */
function listaOu(itens: string[]): string {
  if (itens.length <= 1) return itens.join("");
  return `${itens.slice(0, -1).join(", ")} ou ${itens[itens.length - 1]}`;
}

/** "X, Y e Z" — os contraindicados acumulam-se todos. */
function listaE(itens: string[]): string {
  if (itens.length <= 1) return itens.join("");
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

const LABEL_DIMENSAO: Record<string, string> = {
  odor: "Odor",
  exsudado: "Exsudado",
  hemorragia: "Hemorragia",
  dor: "Dor",
};

export default function ResultadoConsulta({
  caso,
  decisao,
  tecnicas,
  causaTratada,
  portaoSistemico,
  oncologico,
}: {
  caso: CasoClinico;
  decisao: DecisaoCaso;
  tecnicas: CorrespondenciaTecnica[];
  causaTratada: ResultadoCausaTratada;
  portaoSistemico: ResultadoPortaoSistemico;
  oncologico?: ResultadoOncologico;
}) {
  const categorias = categoriasParaMostrar(caso, decisao);
  const tecnicasIndicadas = tecnicas.filter((t) => t.esperada);
  const mostraInfecao = mostrarNivelInfecao(caso);

  const explicacao = mostraInfecao
    ? explicarNivelInfecao(
        caso.sinais_infecao,
        caso.exsudado,
        caso.tipo_tecido_leito.some((z) => z.tipo === "granulacao_hipergranulada"),
        decisao.nivelInfecao,
      )
    : null;

  const dimensoesOncologicas = (oncologico?.dimensoes ?? []).filter((d) => d.aplicavel);
  const temRecomendacaoCausal =
    causaTratada.aplicavel || portaoSistemico.aplicavel || dimensoesOncologicas.length > 0;

  return (
    <div className="animate-up">
      {/* ── Nível de infeção: só quando os sinais foram efetivamente avaliados ── */}
      {mostraInfecao && explicacao ? (
        <section className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div className="lbl">Nível de infeção</div>
          <h2 className="h2" style={{ marginTop: 8 }}>{LABEL_NIVEL_INFECAO[decisao.nivelInfecao]}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
            {[
              ["Sinais de propagação", explicacao.sinaisPropagacao],
              ["Sinais clássicos (overt)", explicacao.sinaisOvert],
              ["Sinais subtis (covert)", explicacao.sinaisCovert],
            ]
              .filter(([, lista]) => (lista as string[]).length > 0)
              .map(([titulo, lista]) => (
                <div key={titulo as string} style={{ fontSize: 13, color: "var(--text-soft)" }}>
                  <span className="lbl">{titulo as string}:</span> {(lista as string[]).join(", ")}
                </div>
              ))}
          </div>
        </section>
      ) : null}

      {/* ── Tratamentos tópicos por categoria ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {categorias.length === 0 ? (
          <p className="mu" style={{ fontSize: 13.5 }}>
            Com as variáveis indicadas, nenhuma categoria de tratamento tópico tem indicação ou contraindicação a assinalar.
          </p>
        ) : (
          categorias.map((c) => (
            <section key={c.categoria} className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h3 className="h3">{LABEL_CATEGORIA[c.categoria]}</h3>
                {!c.aplicavel ? (
                  <span className="lbl" style={{ color: "var(--warning)" }}>não aplicável a este caso</span>
                ) : null}
              </div>

              {c.indicados.length ? (
                <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: "10px 0 0", color: "var(--text-soft)" }}>
                  <strong style={{ color: "var(--success)" }}>Tratamento indicado:</strong>{" "}
                  {listaOu(c.indicados.map((t) => t.nome))}.
                </p>
              ) : null}

              {c.contraindicados.length ? (
                <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: "8px 0 0", color: "var(--text-soft)" }}>
                  <strong style={{ color: "var(--danger)" }}>Contraindicado:</strong>{" "}
                  {listaE(c.contraindicados.map((t) => t.nome))}.
                </p>
              ) : null}
            </section>
          ))
        )}
      </div>

      {/* ── Técnica de aplicação ── */}
      {tecnicasIndicadas.length ? (
        <section className="card" style={{ padding: 18, marginTop: 12 }}>
          <h3 className="h3">Técnica de aplicação</h3>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: "10px 0 0", color: "var(--text-soft)" }}>
            <strong style={{ color: "var(--success)" }}>Indicada:</strong>{" "}
            {listaOu(
              tecnicasIndicadas.map((t) => TODAS_TECNICAS.find((x) => x.id === t.tecnicaId)?.nome ?? t.tecnicaId),
            )}
            .
          </p>
        </section>
      ) : null}

      {/*
        ── Tratamento da causa ──
        Separado dos tratamentos tópicos de propósito: é a medida que resolve a
        origem da ferida, e nenhum penso a substitui. Só aparece nas etiologias
        que têm este critério — cirúrgica, traumática e "outra" não têm.
      */}
      {temRecomendacaoCausal ? (
        <section
          className="card"
          style={{ padding: 20, marginTop: 16, borderColor: "var(--accent)" }}
        >
          <div className="lbl" style={{ color: "var(--accent)" }}>Recomendação final</div>
          <h2 className="h2" style={{ marginTop: 8 }}>Tratamento da causa</h2>
          <p className="mu" style={{ fontSize: 12.5, margin: "8px 0 0", lineHeight: 1.55 }}>
            Sem isto, o tratamento tópico não resolve a ferida.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
            {causaTratada.aplicavel && causaTratada.descricaoItem ? (
              <div style={{ display: "flex", gap: 10, fontSize: 13.5, lineHeight: 1.6, color: "var(--text-soft)" }}>
                <span style={{ color: "var(--accent)", flex: "none" }} aria-hidden="true">→</span>
                <span>{causaTratada.descricaoItem}</span>
              </div>
            ) : null}

            {portaoSistemico.aplicavel ? (
              <div style={{ display: "flex", gap: 10, fontSize: 13.5, lineHeight: 1.6, color: "var(--text-soft)" }}>
                <span style={{ color: "var(--danger)", flex: "none" }} aria-hidden="true">!</span>
                <span>
                  Há sinais de propagação sistémica — referenciação médica / antibioterapia sistémica é obrigatória.
                </span>
              </div>
            ) : null}

            {dimensoesOncologicas.length ? (
              <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text-soft)" }}>
                <span className="lbl">Dimensões a endereçar na ferida oncológica:</span>{" "}
                {listaE(dimensoesOncologicas.map((d) => LABEL_DIMENSAO[d.dimensao] ?? d.dimensao))}.
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
