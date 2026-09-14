"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { TODOS_CASOS_TESTE } from "../../dados/casosTeste";
import { decidirCaso } from "../../algoritmo/motorDecisao";
import { LABEL_ETIOLOGIA } from "../../lib/etiquetas";
import { CONTEUDO_POR_CASO, dificuldadeHeuristica } from "../../lib/casosContent";
import { obterHistorico, type EntradaHistorico } from "../../lib/estado";
import { propsAtivavel } from "../../lib/acessibilidade";
import type { Etiologia } from "../../tipos/variaveis";

export default function CasosPage() {
  const router = useRouter();
  const [filtroEtiologia, setFiltroEtiologia] = useState<Etiologia | null>(null);
  const [historico, setHistorico] = useState<EntradaHistorico[]>([]);

  useEffect(() => {
    setHistorico(obterHistorico());
  }, []);

  const etiologiasPresentes = useMemo(
    () => Array.from(new Set(TODOS_CASOS_TESTE.map((c) => c.caso.etiologia))),
    [],
  );

  const melhorPorCaso = new Map<string, number>();
  for (const h of historico) {
    melhorPorCaso.set(h.casoId, Math.max(melhorPorCaso.get(h.casoId) ?? 0, h.pontuacaoFinal));
  }

  const casosFiltrados = TODOS_CASOS_TESTE.filter(
    (c) => !filtroEtiologia || c.caso.etiologia === filtroEtiologia,
  );

  return (
    <div className="animate-up">
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <h1 className="h1">Casos clínicos</h1>
        <button
          className="btn btn-p"
          style={{ marginLeft: "auto" }}
          onClick={() => router.push(`/casos/${TODOS_CASOS_TESTE[Math.floor(Math.random() * TODOS_CASOS_TESTE.length)].id}`)}
        >
          Caso aleatório
        </button>
      </div>

      <div className="wrapchips" style={{ marginTop: 18 }}>
        <button
          className="chip"
          style={filtroEtiologia === null ? { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--accent-ink)" } : undefined}
          onClick={() => setFiltroEtiologia(null)}
        >
          Todas as etiologias
        </button>
        {etiologiasPresentes.map((et) => (
          <button
            key={et}
            className="chip"
            style={filtroEtiologia === et ? { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--accent-ink)" } : undefined}
            onClick={() => setFiltroEtiologia(et)}
          >
            {LABEL_ETIOLOGIA[et]}
          </button>
        ))}
      </div>

      <div className="grelha-3" style={{ marginTop: 18 }}>
        {casosFiltrados.map((c) => {
          const decisao = decidirCaso(c.caso);
          const dificuldade = dificuldadeHeuristica(decisao.categoriasAplicaveis.length);
          const conteudo = CONTEUDO_POR_CASO[c.id];
          const melhor = melhorPorCaso.get(c.id);
          return (
            <div key={c.id} className="tile card" style={{ padding: 16 }} {...propsAtivavel(() => router.push(`/casos/${c.id}`))}>
              <div className="ph" style={{ height: 130 }}>
                {conteudo ? (
                  <Image
                    src={conteudo.fotografia}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  "fotografia da ferida"
                )}
              </div>
              <div className="wrapchips" style={{ marginTop: 14 }}>
                <div className="chip" style={{ padding: "6px 11px", fontSize: 11.5, cursor: "default" }}>{LABEL_ETIOLOGIA[c.caso.etiologia]}</div>
                <div className="chip" style={{ padding: "6px 11px", fontSize: 11.5, cursor: "default" }}>{dificuldade}</div>
                {melhor !== undefined ? (
                  <div className="chip" style={{ padding: "6px 11px", fontSize: 11.5, cursor: "default", borderColor: "var(--success-border)" }}>
                    Resolvido · {melhor}
                  </div>
                ) : null}
              </div>
              <div className="h3" style={{ marginTop: 12 }}>{c.titulo}</div>
              <div className="mu" style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.5 }}>{conteudo?.contexto}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
