"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { obterHistorico } from "../../lib/estado";
import type { EntradaHistorico } from "../../tipos/historico";
import {
  calcularResumoGeral,
  calcularEvolucao,
  calcularDesempenhoPorFase,
  calcularDesempenhoPorEtiologia,
  calcularDesempenhoTratamentos,
  calcularCobertura,
  LIMIAR_ERRO_ALTO,
  type Tendencia,
} from "../../lib/estatisticas";

const ACC = "var(--accent)";

function corPontuacao(v: number): string {
  return v >= 70 ? "var(--success)" : v >= 50 ? "var(--warning)" : "var(--danger)";
}

const LABEL_TENDENCIA: Record<Tendencia, { texto: string; cor: string; seta: string }> = {
  subida: { texto: "Em subida", cor: "var(--success)", seta: "↑" },
  descida: { texto: "Em descida", cor: "var(--danger)", seta: "↓" },
  estavel: { texto: "Estável", cor: "var(--muted)", seta: "→" },
  insuficiente: { texto: "Ainda sem dados suficientes", cor: "var(--label)", seta: "·" },
};

export default function EstatisticasPage() {
  const [historico, setHistorico] = useState<EntradaHistorico[] | null>(null);

  useEffect(() => {
    setHistorico(obterHistorico());
  }, []);

  const resumo = useMemo(() => calcularResumoGeral(historico ?? []), [historico]);
  const evolucao = useMemo(() => calcularEvolucao(historico ?? []), [historico]);
  const porFase = useMemo(() => calcularDesempenhoPorFase(historico ?? []), [historico]);
  const porEtiologia = useMemo(() => calcularDesempenhoPorEtiologia(historico ?? []), [historico]);
  const porTratamento = useMemo(() => calcularDesempenhoTratamentos(historico ?? []), [historico]);
  const cobertura = useMemo(() => calcularCobertura(historico ?? []), [historico]);

  if (historico === null) return null;

  if (historico.length === 0) {
    return (
      <div className="animate-up">
        <h1 className="h1">Estatísticas</h1>
        <div className="card" style={{ padding: 40, marginTop: 20, textAlign: "center" }}>
          <div className="lbl">Ainda sem dados</div>
          <h2 className="h2" style={{ marginTop: 12 }}>Resolva o seu primeiro caso para começar a ver estatísticas.</h2>
          <p className="mu" style={{ fontSize: 13.5, marginTop: 10, maxWidth: "50ch", marginInline: "auto" }}>
            O histórico fica guardado apenas neste dispositivo — não há conta nem comparação com outros alunos.
          </p>
          <Link href="/casos" className="btn btn-p" style={{ marginTop: 20, display: "inline-flex" }}>
            Resolver um caso →
          </Link>
        </div>
      </div>
    );
  }

  const tendencia = LABEL_TENDENCIA[resumo.tendencia];
  const maxEvolucao = 100;

  return (
    <div className="animate-up">
      <h1 className="h1">Estatísticas</h1>
      <p className="mu" style={{ fontSize: 13, marginTop: 6 }}>
        Histórico guardado neste dispositivo — sem conta, sem comparação com outros alunos.
      </p>

      {/* 1. Resumo geral */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16, marginTop: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="lbl">Casos resolvidos</div>
          <div style={{ font: "800 34px/1 inherit", marginTop: 10 }}>{resumo.totalCasos}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="lbl">Média geral</div>
          <div style={{ font: "800 34px/1 inherit", marginTop: 10, color: ACC }}>{Math.round(resumo.mediaGeral)}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="lbl">Média — últimos {resumo.janelaRecente}</div>
          <div style={{ font: "800 34px/1 inherit", marginTop: 10 }}>{Math.round(resumo.mediaRecente)}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="lbl">Tendência</div>
          <div style={{ font: "800 20px/1.3 inherit", marginTop: 10, color: tendencia.cor }}>
            {tendencia.seta} {tendencia.texto}
          </div>
        </div>
      </div>

      {/* 2. Evolução ao longo do tempo */}
      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <div className="lbl">Evolução ao longo do tempo</div>
        <p className="mu" style={{ fontSize: 12.5, marginTop: 6 }}>Pontuação por caso, por ordem cronológica de resolução.</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 160, marginTop: 16, overflowX: "auto", paddingBottom: 4 }}>
          {evolucao.map((p) => (
            <div key={p.indice} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: "none", width: 34 }}>
              <div
                title={`${p.titulo} · ${new Date(p.data).toLocaleDateString("pt-PT")} · ${Math.round(p.pontuacao)}`}
                style={{
                  width: 18,
                  height: Math.max(4, (p.pontuacao / maxEvolucao) * 120),
                  borderRadius: 4,
                  background: corPontuacao(p.pontuacao),
                }}
              />
              <span className="lbl" style={{ fontSize: 9.5 }}>{p.indice}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Desempenho por fase */}
      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <div className="lbl">Desempenho por fase do fluxo de resolução</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginTop: 14 }}>
          <div className="soft" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <h3 className="h3">Identificação</h3>
              <span style={{ marginLeft: "auto", color: corPontuacao(porFase.identificacaoMedia ?? 0), fontWeight: 700 }}>
                {porFase.identificacaoMedia !== null ? Math.round(porFase.identificacaoMedia) : "—"}
              </span>
            </div>
            {porFase.identificacaoPorVariavel ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                <BarraVariavel label="Tecido do leito" valor={porFase.identificacaoPorVariavel.tecido} />
                <BarraVariavel label="Exsudado — volume" valor={porFase.identificacaoPorVariavel.exsudadoVolume} />
                <BarraVariavel label="Exsudado — tipo" valor={porFase.identificacaoPorVariavel.exsudadoTipo} />
                <BarraVariavel label="Bordos" valor={porFase.identificacaoPorVariavel.bordos} />
                <BarraVariavel label="Pele perilesional" valor={porFase.identificacaoPorVariavel.pele} />
                <BarraVariavel label="Nível de infeção" valor={porFase.identificacaoPorVariavel.nivelInfecao} />
              </div>
            ) : null}
          </div>
          <div className="soft" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <h3 className="h3">Plano terapêutico</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              <BarraVariavel label="Tratamento (categoria)" valor={porFase.tratamentoMedia ?? 0} />
              <BarraVariavel label="Técnica de aplicação" valor={porFase.tecnicaMedia ?? 0} />
            </div>
          </div>
          <div className="soft" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <h3 className="h3">Justificação</h3>
              <span style={{ marginLeft: "auto", color: porFase.justificacaoMedia !== null ? corPontuacao(porFase.justificacaoMedia) : "var(--label)", fontWeight: 700 }}>
                {porFase.justificacaoMedia !== null ? Math.round(porFase.justificacaoMedia) : "—"}
              </span>
            </div>
            <p className="mu" style={{ fontSize: 12, marginTop: 8 }}>
              {porFase.justificacaoMedia !== null
                ? "Percentagem de razões clínicas escolhidas corretamente, entre os tratamentos/técnicas justificados."
                : "Ainda não justificou nenhuma escolha."}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Desempenho por etiologia */}
      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <div className="lbl">Desempenho por etiologia</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
          {porEtiologia.map((e) => (
            <div key={e.etiologia}>
              <div style={{ display: "flex", fontSize: 13, alignItems: "center", gap: 8 }}>
                <Link href={`/aprender/${e.aprenderId}`} style={{ color: "var(--ink)" }}>{e.label}</Link>
                <span style={{ marginLeft: "auto", color: e.media !== null ? "var(--muted)" : "var(--label)" }}>
                  {e.media !== null ? Math.round(e.media) : "ainda não tentada"}
                </span>
              </div>
              <div className="bar" style={{ marginTop: 6 }}>
                <div style={{ height: "100%", width: `${e.media ?? 0}%`, background: e.media !== null ? corPontuacao(e.media) : "transparent" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Desempenho por categoria de tratamento / técnica */}
      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <div className="lbl">Desempenho por categoria de tratamento e técnica de aplicação</div>
        <p className="mu" style={{ fontSize: 12.5, marginTop: 6 }}>
          Taxa de acerto só entre os casos em que a categoria/técnica era aplicável. Sem dados quando nunca foi aplicável nos casos resolvidos.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 10, marginTop: 14 }}>
          {porTratamento.map((t) => {
            const erroAlto = t.taxaAcerto !== null && 100 - t.taxaAcerto >= LIMIAR_ERRO_ALTO;
            return (
              <div key={`${t.tipo}-${t.id}`} className="soft" style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="lbl" style={{ color: t.tipo === "categoria" ? ACC : "var(--success)" }}>
                    {t.tipo === "categoria" ? "Tratamento" : "Técnica"}
                  </span>
                  <span style={{ marginLeft: "auto", fontSize: 12.5, color: t.taxaAcerto !== null ? "var(--muted)" : "var(--label)" }}>
                    {t.taxaAcerto !== null ? `${Math.round(t.taxaAcerto)}%` : "sem dados"}
                  </span>
                </div>
                <div className="h3" style={{ marginTop: 6, fontSize: 13.5 }}>{t.label}</div>
                <div className="bar" style={{ marginTop: 8 }}>
                  <div style={{ height: "100%", width: `${t.taxaAcerto ?? 0}%`, background: t.taxaAcerto !== null ? corPontuacao(t.taxaAcerto) : "transparent" }} />
                </div>
                {erroAlto ? (
                  <Link href={`/aprender/${t.aprenderId}`} className="chip" style={{ marginTop: 10, fontSize: 11.5, padding: "6px 12px", borderColor: "var(--danger)" }}>
                    Taxa de erro alta · rever em Aprender →
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Cobertura de etiologias */}
      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <div className="lbl">Cobertura de etiologias</div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 14, flexWrap: "wrap" }}>
          <div style={{ font: "800 40px/1 inherit" }}>
            {cobertura.tentadas} <span className="mu" style={{ fontSize: 20, fontWeight: 600 }}>de {cobertura.total}</span>
          </div>
          <div className="bar" style={{ flex: 1, minWidth: 160 }}>
            <div style={{ height: "100%", width: `${cobertura.percentual}%`, background: ACC }} />
          </div>
        </div>
        {cobertura.etiologiasNaoTentadas.length ? (
          <p className="mu" style={{ fontSize: 12.5, marginTop: 12 }}>
            Ainda não tentadas: {cobertura.etiologiasNaoTentadas.join(", ")}.
          </p>
        ) : (
          <p className="mu" style={{ fontSize: 12.5, marginTop: 12, color: "var(--success)" }}>Já tentou casos de todas as etiologias.</p>
        )}
      </div>
    </div>
  );
}

function BarraVariavel({ label, valor }: { label: string; valor: number }) {
  return (
    <div>
      <div style={{ display: "flex", fontSize: 12 }}>
        <span className="mu">{label}</span>
        <span style={{ marginLeft: "auto", color: "var(--muted)" }}>{Math.round(valor)}</span>
      </div>
      <div className="bar" style={{ marginTop: 4, height: 5 }}>
        <div style={{ height: "100%", width: `${valor}%`, background: corPontuacao(valor) }} />
      </div>
    </div>
  );
}
