"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TODOS_CASOS_TESTE } from "../dados/casosTeste";
import { decidirCaso } from "../algoritmo/motorDecisao";
import { LABEL_CATEGORIA } from "../lib/etiquetas";
import { obterHistorico, mediaPontuacao, type EntradaHistorico } from "../lib/estado";

export default function DashboardPage() {
  const router = useRouter();
  const [historico, setHistorico] = useState<EntradaHistorico[]>([]);

  useEffect(() => {
    setHistorico(obterHistorico());
  }, []);

  const media = mediaPontuacao(historico);
  const resolvidos = new Set(historico.map((h) => h.casoId));
  const etiologiasCobertas = new Set(historico.map((h) => h.etiologia));

  function irParaCasoAleatorio() {
    const disponiveis = TODOS_CASOS_TESTE.filter((c) => !resolvidos.has(c.id));
    const lista = disponiveis.length ? disponiveis : TODOS_CASOS_TESTE;
    const escolhido = lista[Math.floor(Math.random() * lista.length)];
    router.push(`/casos/${escolhido.id}`);
  }

  // Desempenho por categoria de tratamento, a partir do histórico real do aluno.
  const porCategoria = new Map<string, { acertos: number; total: number }>();
  for (const h of historico) {
    const c = TODOS_CASOS_TESTE.find((x) => x.id === h.casoId);
    if (!c) continue;
    const decisao = decidirCaso(c.caso);
    for (const categoria of decisao.categoriasAplicaveis) {
      const atual = porCategoria.get(categoria) ?? { acertos: 0, total: 0 };
      atual.total += 1;
      if (h.pontuacaoFinal >= 70) atual.acertos += 1;
      porCategoria.set(categoria, atual);
    }
  }

  return (
    <div className="animate-up">
      <div style={{ display: "flex", alignItems: "flex-end", gap: 20, flexWrap: "wrap" }}>
        <div>
          <div className="lbl">Bem-vindo(a) de volta</div>
          <h1 className="h1" style={{ marginTop: 10 }}>
            {resolvidos.size} caso(s) resolvido(s).
            <br />
            {media >= 70 ? "Bom desempenho até agora." : "Continue a praticar."}
          </h1>
        </div>
        <div className="card" style={{ padding: "18px 22px", marginLeft: "auto" }}>
          <div className="lbl">Pontuação média</div>
          <div style={{ font: "800 40px/1 inherit", color: "var(--accent)", marginTop: 8 }}>{media}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 16, marginTop: 22 }}>
        <div className="tile" style={{ background: "var(--accent)", color: "var(--accent-ink)" }} onClick={irParaCasoAleatorio}>
          <div style={{ display: "flex" }}>
            <div className="lbl" style={{ color: "var(--accent-ink)" }}>Recomendado</div>
            <div style={{ marginLeft: "auto", fontSize: 18 }}>→</div>
          </div>
          <div style={{ marginTop: 52, fontSize: 20, fontWeight: 800, letterSpacing: "-.02em" }}>Caso aleatório</div>
          {/* Sem opacity: a hierarquia já vem do tamanho e do peso, e esbater o texto sobre um fundo saturado deixava-o abaixo do mínimo legível. */}
          <div style={{ fontSize: 13, marginTop: 6 }}>Uma etiologia que ainda não resolveu</div>
        </div>
        {/* O texto deste tile é `--tile-alt-ink`, o par do fundo `--tile-alt`; `--accent-ink` é quase preto e só serve sobre o accent saturado. */}
        <div className="tile" style={{ background: "var(--tile-alt)", color: "var(--tile-alt-ink)" }} onClick={() => router.push("/casos")}>
          <div style={{ display: "flex" }}>
            <div className="lbl" style={{ color: "var(--tile-alt-ink)" }}>Biblioteca</div>
            <div style={{ marginLeft: "auto", fontSize: 18 }}>→</div>
          </div>
          <div style={{ marginTop: 52, fontSize: 20, fontWeight: 800, letterSpacing: "-.02em" }}>Escolher caso</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>{TODOS_CASOS_TESTE.length} casos disponíveis</div>
        </div>
        <div className="tile card" onClick={() => router.push("/estatisticas")}>
          <div className="lbl">Progresso</div>
          <div style={{ marginTop: 14, display: "flex", gap: 22 }}>
            <div>
              <div style={{ font: "800 22px/1 inherit" }}>{resolvidos.size}</div>
              <div className="mu" style={{ fontSize: 11.5 }}>casos</div>
            </div>
            <div>
              <div style={{ font: "800 22px/1 inherit" }}>{etiologiasCobertas.size}</div>
              <div className="mu" style={{ fontSize: 11.5 }}>etiologias</div>
            </div>
          </div>
          <div className="bar" style={{ marginTop: 16 }}>
            <div style={{ width: `${Math.min(100, (resolvidos.size / TODOS_CASOS_TESTE.length) * 100)}%`, height: "100%", background: "var(--accent)" }} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: 16, marginTop: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="lbl">Desempenho por categoria de tratamento</div>
          {porCategoria.size === 0 ? (
            <div className="mu" style={{ fontSize: 13, marginTop: 14 }}>
              Resolva casos para ver o seu desempenho por categoria.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
              {[...porCategoria.entries()].map(([categoria, v]) => {
                const pct = Math.round((v.acertos / v.total) * 100);
                return (
                  <div key={categoria}>
                    <div style={{ display: "flex", fontSize: 13 }}>
                      <span>{LABEL_CATEGORIA[categoria as keyof typeof LABEL_CATEGORIA]}</span>
                      <span style={{ marginLeft: "auto", color: "var(--muted)" }}>{pct}</span>
                    </div>
                    <div className="bar" style={{ marginTop: 6 }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: pct >= 70 ? "var(--accent)" : "var(--danger)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="lbl">Atalhos</div>
          <button className="btn" onClick={() => router.push("/aprender")}>Aprender</button>
          <button className="btn" onClick={() => router.push("/consulta")}>Consulta pontual</button>
          <button className="btn" onClick={() => router.push("/estatisticas")}>Estatísticas</button>
        </div>
      </div>
    </div>
  );
}
