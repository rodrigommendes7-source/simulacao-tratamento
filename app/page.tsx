"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TODOS_CASOS_TESTE } from "../dados/casosTeste";
import { calcularDesempenhoTratamentos } from "../lib/estatisticas";
import { escolherProximoCaso } from "../lib/proximoCaso";
import { textoBoasVindas } from "../lib/boasVindas";
import { LIMIAR_BOM_DESEMPENHO } from "../lib/pontuacao";
import { obterHistorico, mediaPontuacao, type EntradaHistorico } from "../lib/estado";
import { propsAtivavel } from "../lib/acessibilidade";

export default function DashboardPage() {
  const router = useRouter();
  const [historico, setHistorico] = useState<EntradaHistorico[]>([]);

  useEffect(() => {
    // O histórico vem do servidor. Falhar aqui deixa o ecrã no estado de quem
    // ainda não resolveu nada — o AppShell trata do caso de não haver sessão.
    obterHistorico()
      .then(setHistorico)
      .catch(() => setHistorico([]));
  }, []);

  const media = mediaPontuacao(historico);
  const resolvidos = new Set(historico.map((h) => h.casoId));
  const etiologiasCobertas = new Set(historico.map((h) => h.etiologia));

  /** A ordem de preferência e os seus recuos vivem em lib/proximoCaso.ts, para poderem ser testados. */
  function irParaCasoAleatorio() {
    const escolhido = escolherProximoCaso(TODOS_CASOS_TESTE, historico);
    if (escolhido) router.push(`/casos/${escolhido.id}`);
  }

  /**
   * Desempenho por categoria de tratamento.
   *
   * Usa a mesma função que alimenta o ecrã de Estatísticas, e por duas razões.
   *
   * A primeira é correção: este bloco atribuía a `pontuacaoFinal` do caso a
   * todas as categorias aplicáveis, pelo que um aluno com 75 % aparecia com
   * 100 % em todas — inclusive naquela que tinha errado por completo e
   * compensado nas outras. O painel cuja função é dizer onde se está fraco era
   * o que menos o conseguia dizer. A pontuação real por categoria já vinha
   * gravada no histórico (`correspondenciaTratamento`, uma entrada por
   * categoria aplicável com a sua própria percentagem); faltava lê-la.
   *
   * A segunda é que o cálculo antigo chamava `decidirCaso` para redescobrir as
   * categorias aplicáveis — ou seja, aplicava as regras clínicas de hoje a
   * respostas avaliadas com as regras de então. Agregar o que foi gravado é o
   * que a coluna `versao_regras` existe para tornar possível.
   *
   * Mostram-se só as categorias que o aluno já encontrou. `taxaAcerto` a
   * `null` significa ausência de dado, nunca zero: um caso sem detalhe para
   * uma categoria não pode puxar a média dela para baixo.
   */
  const desempenhoCategorias = useMemo(
    () =>
      calcularDesempenhoTratamentos(historico).filter(
        (d) => d.tipo === "categoria" && d.tentativas > 0 && d.taxaAcerto !== null,
      ),
    [historico],
  );

  /** Etiqueta, título e estados vazios do cabeçalho — tabela de decisão em lib/boasVindas.ts. */
  const boasVindas = textoBoasVindas(historico, media);

  return (
    <div className="animate-up">
      <div style={{ display: "flex", alignItems: "flex-end", gap: 20, flexWrap: "wrap" }}>
        <div>
          <div className="lbl">{boasVindas.etiqueta}</div>
          <h1 className="h1" style={{ marginTop: 10 }}>
            {boasVindas.titulo.map((linha, i) => (
              <span key={linha}>
                {i > 0 ? <br /> : null}
                {linha}
              </span>
            ))}
          </h1>
        </div>
        {boasVindas.mostrarMedia ? (
          <div className="card" style={{ padding: "18px 22px", marginLeft: "auto" }}>
            <div className="lbl">Pontuação média</div>
            <div style={{ font: "800 40px/1 inherit", color: "var(--accent)", marginTop: 8 }}>{media}%</div>
          </div>
        ) : null}
      </div>

      <div className="grelha-3" style={{ marginTop: 22 }}>
        <div className="tile" style={{ background: "var(--accent)", color: "var(--accent-ink)" }} {...propsAtivavel(irParaCasoAleatorio)}>
          <div style={{ display: "flex" }}>
            <div className="lbl" style={{ color: "var(--accent-ink)" }}>Recomendado</div>
            <div style={{ marginLeft: "auto", fontSize: 18 }}>→</div>
          </div>
          <div style={{ marginTop: 52, fontSize: 20, fontWeight: 800, letterSpacing: "-.02em" }}>Caso aleatório</div>
          {/* Sem opacity: a hierarquia já vem do tamanho e do peso, e esbater o texto sobre um fundo saturado deixava-o abaixo do mínimo legível. */}
          <div style={{ fontSize: 13, marginTop: 6 }}>{boasVindas.subtituloCasoAleatorio}</div>
        </div>
        {/* O texto deste tile é `--tile-alt-ink`, o par do fundo `--tile-alt`; `--accent-ink` é quase preto e só serve sobre o accent saturado. */}
        <div className="tile" style={{ background: "var(--tile-alt)", color: "var(--tile-alt-ink)" }} {...propsAtivavel(() => router.push("/casos"))}>
          <div style={{ display: "flex" }}>
            <div className="lbl" style={{ color: "var(--tile-alt-ink)" }}>Biblioteca</div>
            <div style={{ marginLeft: "auto", fontSize: 18 }}>→</div>
          </div>
          <div style={{ marginTop: 52, fontSize: 20, fontWeight: 800, letterSpacing: "-.02em" }}>Escolher caso</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>{TODOS_CASOS_TESTE.length} casos disponíveis</div>
        </div>
        <div className="tile card" {...propsAtivavel(() => router.push("/estatisticas"))}>
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

      <div className="grelha-2-desigual" style={{ marginTop: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="lbl">Desempenho por categoria de tratamento</div>
          {desempenhoCategorias.length === 0 ? (
            <div className="mu" style={{ fontSize: 13, marginTop: 14 }}>
              Resolva casos para ver o seu desempenho por categoria.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
              {desempenhoCategorias.map((d) => {
                // O filtro acima já garantiu que não é null.
                const pct = Math.round(d.taxaAcerto as number);
                return (
                  <div key={d.id}>
                    <div style={{ display: "flex", fontSize: 13 }}>
                      <span>{d.label}</span>
                      <span style={{ marginLeft: "auto", color: "var(--muted)" }}>{pct}%</span>
                    </div>
                    <div className="bar" style={{ marginTop: 6 }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: pct >= LIMIAR_BOM_DESEMPENHO ? "var(--accent)" : "var(--danger)",
                        }}
                      />
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
