"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PAGINAS_APRENDER } from "../../dados/aprender";
import { entradasDaPagina, estruturarPagina, todosOsSubtopicos } from "../../lib/aprenderSubtopicos";
import type { EixoAprender } from "../../tipos/aprender";

const LABEL_EIXO: Record<EixoAprender, string> = {
  tema_clinico: "Tema clínico",
  tratamento: "Tratamento",
  etiologia: "Etiologia",
};

const EIXOS: EixoAprender[] = ["tema_clinico", "tratamento", "etiologia"];

const ACC = "var(--accent)";
const SEL: React.CSSProperties = { background: ACC, borderColor: ACC, color: "var(--accent-ink)" };

/** Contagem de tópicos por categoria, para o cartão dizer ao aluno o que vai encontrar lá dentro. */
const RESUMO_POR_PAGINA = new Map(
  PAGINAS_APRENDER.map((p) => {
    const estrutura = estruturarPagina(p);
    return [p.id, { subtopicos: estrutura.subtopicos.length, entradas: entradasDaPagina(estrutura).length }];
  }),
);

export default function AprenderIndexPage() {
  const [query, setQuery] = useState("");
  const [eixo, setEixo] = useState<EixoAprender | null>(null);

  const q = query.trim().toLowerCase();

  const resultados = useMemo(
    () =>
      PAGINAS_APRENDER.filter((p) => {
        if (eixo && p.eixo !== eixo) return false;
        if (!q) return true;
        return p.titulo.toLowerCase().includes(q) || p.resumo.toLowerCase().includes(q);
      }),
    [q, eixo],
  );

  /**
   * Com o conteúdo repartido por camadas, uma pesquisa que só olhasse para os
   * títulos das categorias esconderia tudo o que está um nível abaixo
   * ("esfacelo" está dentro de "Tecido do leito"). Por isso pesquisa-se também
   * nos subtópicos e mostra-se o atalho direto para o ecrã de cada um.
   */
  const subtopicosEncontrados = useMemo(() => {
    if (!q) return [];
    return todosOsSubtopicos()
      .filter(({ pagina, subtopico }) => {
        if (eixo && pagina.eixo !== eixo) return false;
        return subtopico.titulo.toLowerCase().includes(q) || subtopico.detalhe.toLowerCase().includes(q);
      })
      .slice(0, 12);
  }, [q, eixo]);

  const grupos = EIXOS.map((e) => ({ eixo: e, itens: resultados.filter((p) => p.eixo === e) })).filter(
    (g) => g.itens.length > 0,
  );

  return (
    <div className="animate-up">
      <h1 className="h1">Aprender</h1>
      <p className="mu" style={{ fontSize: 13.5 }}>
        Manual de estudo — consulta livre, sem avaliação. Escolha uma categoria, depois o tópico concreto.
      </p>

      <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar categoria ou tópico (ex.: esfacelo)…"
          aria-label="Pesquisar no Aprender"
          style={{
            flex: "1 1 280px",
            background: "var(--soft-alt)",
            border: "1px solid var(--line-strong)",
            borderRadius: 999,
            padding: "11px 18px",
            color: "var(--ink)",
            fontSize: 13.5,
          }}
        />
        <div className="wrapchips">
          <button className="chip" style={eixo === null ? SEL : undefined} onClick={() => setEixo(null)}>
            Todos os eixos
          </button>
          {EIXOS.map((e) => (
            <button key={e} className="chip" style={eixo === e ? SEL : undefined} onClick={() => setEixo(e)}>
              {LABEL_EIXO[e]}
            </button>
          ))}
        </div>
      </div>

      {subtopicosEncontrados.length ? (
        <div style={{ marginTop: 22 }}>
          <div className="lbl">Tópicos · {subtopicosEncontrados.length}</div>
          <div className="wrapchips" style={{ marginTop: 10 }}>
            {subtopicosEncontrados.map(({ pagina, subtopico }) => (
              <Link key={`${pagina.id}/${subtopico.id}`} href={`/aprender/${pagina.id}/${subtopico.id}`} className="chip">
                {subtopico.titulo} <span className="lbl">· {pagina.titulo}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {grupos.length === 0 && subtopicosEncontrados.length === 0 ? (
        <p className="mu" style={{ marginTop: 24, fontSize: 13.5 }}>Sem resultados para essa pesquisa.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 22 }}>
          {grupos.map((g) => (
            <div key={g.eixo}>
              <div className="lbl" style={{ marginBottom: 10 }}>
                {LABEL_EIXO[g.eixo]} · {g.itens.length}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
                {g.itens.map((p) => {
                  const contagem = RESUMO_POR_PAGINA.get(p.id);
                  return (
                    <Link key={p.id} href={`/aprender/${p.id}`} className="card tile" style={{ padding: 18, display: "block" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h3 className="h3" style={{ flex: 1 }}>{p.titulo}</h3>
                        <span className="lbl" aria-hidden="true">→</span>
                      </div>
                      <p className="mu" style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.5 }}>{p.resumo}</p>
                      <div className="lbl" style={{ marginTop: 10 }}>
                        {contagem?.subtopicos
                          ? `${contagem.subtopicos} tópicos`
                          : `${contagem?.entradas ?? 0} secções`}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
