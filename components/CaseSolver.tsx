"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TODOS_CASOS_TESTE } from "../dados/casosTeste";
import { TODOS_TRATAMENTOS } from "../dados/tratamentos";
import { TODAS_TECNICAS } from "../dados/tecnicasAplicacao";
import { JUSTIFICACOES_TRATAMENTO, JUSTIFICACOES_TECNICA } from "../dados/bancoJustificacoes";
import { decidirCaso } from "../algoritmo/motorDecisao";
import { avaliarResposta } from "../algoritmo/avaliarResposta";
import { avaliarIdentificacao } from "../algoritmo/avaliarIdentificacao";
import { avaliarTecnicas, pontuacaoTecnicas } from "../algoritmo/avaliarTecnicas";
import { avaliarJustificacoes, pontuacaoJustificacoes, type ItemJustificacao } from "../algoritmo/avaliarJustificacoes";
import { tecnicasValidas } from "../algoritmo/tecnicaValida";
import { CONTEUDO_POR_CASO, PERGUNTAS_DIALOGO } from "../lib/casosContent";
import { arredondarPontuacao } from "../lib/pontuacao";
import { baralharBancoJustificacoes } from "../lib/baralharJustificacoes";
import {
  LABEL_ETIOLOGIA,
  LABEL_TECIDO,
  LABEL_BORDO,
  LABEL_PELE,
  LABEL_VOLUME,
  LABEL_TIPO_EXSUDADO,
  LABEL_CATEGORIA,
  LABEL_NIVEL_INFECAO,
} from "../lib/etiquetas";
import { registarResultado } from "../lib/estado";
import { ACC, SEL, Grupo, ChipUnico, ChipMulti, alternarConjunto } from "./CamposClinicos";
import type {
  TipoTecido,
  ValorBordo,
  ValorPelePerilesional,
  VolumeExsudado,
  TipoExsudado,
  NivelInfecao,
  PinTecido,
} from "../tipos/variaveis";
import { TODOS_NIVEIS_INFECAO } from "../tipos/variaveis";
import type { RespostaIdentificacao, ResultadoIdentificacao } from "../tipos/identificacao";
import type { CategoriaTratamento } from "../tipos/tratamento";
import type { MedidasCausaisResposta, RespostaAluno, ResultadoAvaliacao } from "../tipos/resultado";

const FASES = ["Observação", "Identificação", "Diálogo", "Plano terapêutico", "Justificação"];

/** Cores dos pins por tipo de tecido — paleta fixa, decorativa (não são tokens de tema). */
const COR_PIN: Record<TipoTecido, string> = {
  granulacao: "#e0806f",
  granulacao_hipergranulada: "#c9628f",
  esfacelo: "#e5c267",
  necrose_seca: "#8d8f9a",
  necrose_humida: "#7b6f5e",
  epitelizacao: "#8fd6f0",
};

interface MedidaItem {
  key: keyof MedidasCausaisResposta;
  label: string;
}

function medidasRelevantes(etiologia: string, nivelInfecao: string): MedidaItem[] {
  const itens: MedidaItem[] = [];
  if (etiologia === "venosa" || etiologia === "arterial" || etiologia === "mista_arteriovenosa") {
    itens.push({ key: "referenciacaoVascular", label: "Referenciação vascular / avaliação de perfusão (ABPI)" });
  }
  if (etiologia === "pressao") {
    itens.push({ key: "alivioPressao", label: "Alívio de pressão / reposicionamento" });
  }
  if (etiologia === "pe_diabetico_neuropatico" || etiologia === "pe_diabetico_neuroisquemico") {
    itens.push({ key: "descargaOffloading", label: "Descarga (offloading) da zona de pressão" });
    itens.push({ key: "controloGlicemicoReferenciado", label: "Controlo glicémico referenciado" });
  }
  if (etiologia === "oncologica_maligna") {
    itens.push({ key: "gestaoDorConsiderada", label: "Gestão de dor multifatorial considerada" });
  }
  if (nivelInfecao === "infecao_propagacao_sistemica") {
    itens.push({ key: "referenciacaoMedicaSistemica", label: "Referenciação médica / antibioterapia sistémica" });
  }
  return itens;
}

export default function CaseSolver({ id }: { id: string }) {
  const router = useRouter();
  const casoTeste = TODOS_CASOS_TESTE.find((c) => c.id === id);
  const decisao = useMemo(() => (casoTeste ? decidirCaso(casoTeste.caso) : null), [casoTeste]);
  const conteudo = casoTeste ? CONTEUDO_POR_CASO[casoTeste.id] : undefined;
  const tecnicasCase = useMemo(
    () => (casoTeste && decisao ? tecnicasValidas({ caso: casoTeste.caso, nivelInfecao: decisao.nivelInfecao }) : []),
    [casoTeste, decisao],
  );

  const [screen, setScreen] = useState<"solve" | "result">("solve");
  const [phase, setPhase] = useState(1);

  // Fase 2 — Identificação
  const [tecidoAtivo, setTecidoAtivo] = useState<TipoTecido | null>(null);
  const [pins, setPins] = useState<PinTecido[]>([]);
  const [exVol, setExVol] = useState<VolumeExsudado | null>(null);
  const [exTipo, setExTipo] = useState<Set<TipoExsudado>>(new Set());
  const [bordos, setBordos] = useState<Set<ValorBordo>>(new Set());
  const [pele, setPele] = useState<Set<ValorPelePerilesional>>(new Set());
  const [nivelInfecaoProposto, setNivelInfecaoProposto] = useState<NivelInfecao | null>(null);

  // Fase 3 — Diálogo
  const [perguntado, setPerguntado] = useState<Record<number, boolean>>({});
  const [abertaPergunta, setAbertaPergunta] = useState<number | null>(null);

  // Fase 4 — Plano terapêutico
  const [categorias, setCategorias] = useState<Set<CategoriaTratamento>>(new Set());
  const [tecnicasSel, setTecnicasSel] = useState<Set<string>>(new Set());
  const [medidas, setMedidas] = useState<MedidasCausaisResposta>({});

  // Fase 5 — Justificação
  const [justRespostas, setJustRespostas] = useState<Record<string, number>>({});
  const [justAberto, setJustAberto] = useState<string | null>(null);
  /**
   * Ordem de apresentação das opções de cada pergunta. Preenchida só depois
   * da montagem, porque é sorteada — gerá-la durante o render faria o
   * servidor e o cliente produzirem ordens diferentes.
   */
  const [ordemOpcoes, setOrdemOpcoes] = useState<Record<string, number[]>>({});
  useEffect(() => {
    setOrdemOpcoes(baralharBancoJustificacoes());
  }, []);

  const [resultado, setResultado] = useState<ResultadoAvaliacao | null>(null);
  const [resultadoIdentificacao, setResultadoIdentificacao] = useState<ResultadoIdentificacao | null>(null);

  if (!casoTeste || !decisao) {
    return (
      <div className="card animate-up" style={{ padding: 24 }}>
        <h2 className="h2">Caso não encontrado</h2>
        <p className="mu">Só existem casos de teste reais para as 5 fichas já validadas.</p>
        <button className="btn" style={{ marginTop: 14 }} onClick={() => router.push("/casos")}>
          ← Voltar aos casos
        </button>
      </div>
    );
  }

  const caso = casoTeste.caso;
  const toggleSet = alternarConjunto;

  /** A unidade de identificação é o tipo de tecido, não o pin: marcar duas manchas do mesmo tecido não vale mais do que marcar uma. */
  const tiposMarcados = new Set(pins.map((p) => p.tipo));

  const itensJustificacao = [
    ...[...categorias].map((cat) => ({ tipo: "tratamento" as const, key: `tr:${cat}`, id: cat, entrada: JUSTIFICACOES_TRATAMENTO[cat], titulo: LABEL_CATEGORIA[cat] })),
    ...[...tecnicasSel].map((id) => ({ tipo: "tecnica" as const, key: `tc:${id}`, id, entrada: JUSTIFICACOES_TECNICA[id], titulo: TODAS_TECNICAS.find((t) => t.id === id)?.nome ?? id })),
  ].filter((i) => i.entrada);

  const justDone = itensJustificacao.filter((i) => justRespostas[i.key] !== undefined).length;

  const medidasItens = medidasRelevantes(caso.etiologia, decisao.nivelInfecao);

  function submeter() {
    const tratamentosSelecionados: string[] = [];
    for (const cat of categorias) {
      const validos = decisao!.tratamentosValidos[cat];
      if (validos) tratamentosSelecionados.push(...validos.map((t) => t.id));
    }
    const resposta: RespostaAluno = { tratamentosSelecionados, medidasCausais: medidas };
    const r = avaliarResposta(caso, resposta);

    const respostaIdentificacao: RespostaIdentificacao = {
      pins,
      exsudado: { volume: exVol ?? "ausente", tipo: [...exTipo] },
      bordos: [...bordos],
      pele_perilesional: [...pele],
      nivelInfecaoProposto: nivelInfecaoProposto ?? "sem_sinais",
    };
    const ri = avaliarIdentificacao(caso, respostaIdentificacao);

    const contexto = { caso, nivelInfecao: decisao!.nivelInfecao };
    const correspondenciaTecnicas = avaliarTecnicas([...tecnicasSel], contexto);

    const itensJustificacaoAvaliar: ItemJustificacao[] = itensJustificacao.map((i) => ({
      chave: i.key,
      tipo: i.tipo,
      id: i.id,
    }));
    const correspondenciaJustificacoes = avaliarJustificacoes(itensJustificacaoAvaliar, justRespostas);

    setResultado(r);
    setResultadoIdentificacao(ri);
    const pontuacaoCombinada = (ri.pontuacaoFinalPercentual + r.pontuacaoFinalPercentual) / 2;
    registarResultado({
      casoId: casoTeste!.id,
      titulo: casoTeste!.titulo,
      etiologia: caso.etiologia,
      data: new Date().toISOString(),
      pontuacaoFinal: arredondarPontuacao(pontuacaoCombinada),
      identificacao: {
        pontuacaoPercentual: arredondarPontuacao(ri.pontuacaoFinalPercentual),
        tecidoPercentual: arredondarPontuacao(ri.tecido.pontuacaoPercentual),
        exsudadoVolumeCorreto: ri.exsudadoVolumeCorreto,
        exsudadoTipoCorreto: ri.exsudadoTipoCorreto,
        bordosCorretos: ri.bordosCorretos,
        peleCorreta: ri.peleCorreta,
        nivelInfecaoCorreto: ri.nivelInfecaoCorreto,
      },
      correspondenciaTratamento: r.correspondenciaPorCategoria,
      pontuacaoTratamento: arredondarPontuacao(r.pontuacaoFinalPercentual),
      correspondenciaTecnicas,
      pontuacaoTecnicas: arredondarPontuacao(pontuacaoTecnicas(correspondenciaTecnicas)),
      correspondenciaJustificacoes,
      pontuacaoJustificacoes: arredondarPontuacao(pontuacaoJustificacoes(correspondenciaJustificacoes)),
    });
    setScreen("result");
    window.scrollTo({ top: 0 });
  }

  if (screen === "result" && resultado && resultadoIdentificacao) {
    const categoriasCorretas = [...categorias].filter((c) => decisao.categoriasAplicaveis.includes(c));
    const categoriasErradas = [...categorias].filter((c) => !decisao.categoriasAplicaveis.includes(c));
    const categoriasFaltadas = decisao.categoriasAplicaveis.filter((c) => c !== "paliativos_oncologicos" && !categorias.has(c));
    const pontuacaoCombinada = (resultadoIdentificacao.pontuacaoFinalPercentual + resultado.pontuacaoFinalPercentual) / 2;

    return (
      <div className="animate-up">
        <div className="card" style={{ padding: 26, display: "flex", gap: 26, alignItems: "center", flexWrap: "wrap", background: "linear-gradient(120deg,var(--surface-alt),var(--surface) 60%)" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="lbl">Resultado · {casoTeste.titulo}</div>
            <h1 className="h1" style={{ marginTop: 10 }}>
              {pontuacaoCombinada >= 70 ? "Boa resolução do caso." : "Há pontos a rever."}
            </h1>
            {resultado.pontuacaoMaximaPossivel < 100 ? (
              <p className="mu" style={{ fontSize: 13.5, maxWidth: "48ch", lineHeight: 1.6 }}>
                {resultado.causaTratada?.aplicavel && !resultado.causaTratada.itemPresente
                  ? `A causa da ferida não foi tratada (${resultado.causaTratada.descricaoItem}). Isto aplica um teto de pontuação de ${resultado.causaTratada.tetoPontuacao} ao plano terapêutico.`
                  : resultado.portaoSistemico.aplicavel && !resultado.portaoSistemico.satisfeito
                    ? `Há sinais de propagação sistémica sem referenciação médica registada. Isto aplica um teto de pontuação de ${resultado.portaoSistemico.tetoPontuacao} ao plano terapêutico.`
                    : ""}
              </p>
            ) : null}
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ font: "800 64px/1 inherit", color: "var(--accent)" }}>{Math.round(pontuacaoCombinada)}</div>
            <div className="lbl" style={{ marginTop: 8 }}>de 100 · média de identificação + plano terapêutico</div>
            <div className="bar" style={{ width: 200, marginTop: 12 }}>
              <div style={{ width: `${pontuacaoCombinada}%`, height: "100%", background: ACC }} />
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, marginTop: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="lbl" style={{ color: "var(--success)" }}>Identificação</div>
              <div className="lbl" style={{ marginLeft: "auto" }}>{Math.round(resultadoIdentificacao.pontuacaoFinalPercentual)} / 100</div>
            </div>
            <h3 className="h3" style={{ marginTop: 9 }}>Comparação com o caso</h3>
            <div style={{ fontSize: 13, lineHeight: 1.8, marginTop: 8 }}>
              <LinhaComparacao
                label="Tecido do leito"
                ok={resultadoIdentificacao.tecido.pontuacaoPercentual === 100}
              >
                {resultadoIdentificacao.tecido.tiposEncontrados.length} de {resultadoIdentificacao.tecido.tiposEsperados.length} tipo(s) de tecido identificado(s)
                {" · "}esperado: {caso.tipo_tecido_leito.map((t) => LABEL_TECIDO[t.tipo]).join(", ")}
              </LinhaComparacao>
              <LinhaComparacao label="Exsudado — volume" ok={resultadoIdentificacao.exsudadoVolumeCorreto}>
                Esperado: {LABEL_VOLUME[caso.exsudado.volume]}
              </LinhaComparacao>
              <LinhaComparacao label="Exsudado — tipo" ok={resultadoIdentificacao.exsudadoTipoCorreto}>
                Esperado: {caso.exsudado.tipo.map((t) => LABEL_TIPO_EXSUDADO[t]).join(" + ") || "—"}
              </LinhaComparacao>
              <LinhaComparacao label="Bordos" ok={resultadoIdentificacao.bordosCorretos}>
                Esperado: {caso.bordos.map((b) => LABEL_BORDO[b]).join(", ") || "—"}
              </LinhaComparacao>
              <LinhaComparacao label="Pele perilesional" ok={resultadoIdentificacao.peleCorreta}>
                Esperado: {caso.pele_perilesional.map((p) => LABEL_PELE[p]).join(", ")}
              </LinhaComparacao>
              <LinhaComparacao label="Nível de infeção" ok={resultadoIdentificacao.nivelInfecaoCorreto}>
                Esperado: {LABEL_NIVEL_INFECAO[resultadoIdentificacao.nivelInfecaoReal]}
              </LinhaComparacao>
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="lbl" style={{ color: ACC }}>Plano terapêutico</div>
              <div className="lbl" style={{ marginLeft: "auto" }}>{Math.round(resultado.pontuacaoFinalPercentual)} / 100</div>
            </div>
            <h3 className="h3" style={{ marginTop: 9 }}>Categorias de tratamento</h3>
            <div style={{ fontSize: 13, lineHeight: 1.8, marginTop: 8 }}>
              {categoriasCorretas.length ? <div style={{ color: "var(--success)" }}>✓ Acertou: {categoriasCorretas.map((c) => LABEL_CATEGORIA[c]).join(", ")}</div> : null}
              {categoriasFaltadas.length ? <div style={{ color: "var(--danger)" }}>✗ Faltou: {categoriasFaltadas.map((c) => LABEL_CATEGORIA[c]).join(", ")}</div> : null}
              {categoriasErradas.length ? <div style={{ color: "var(--warning)" }}>~ Não indicado para este caso: {categoriasErradas.map((c) => LABEL_CATEGORIA[c]).join(", ")}</div> : null}
              {!categoriasFaltadas.length && !categoriasErradas.length ? <div style={{ color: "var(--success)" }}>Selecionou exatamente as categorias indicadas.</div> : null}
            </div>
            {medidasItens.length ? (
              <div className="soft" style={{ marginTop: 12, padding: "12px 14px", fontSize: 12.5 }}>
                <div className="lbl">Medidas da causa</div>
                <div style={{ marginTop: 6, color: "var(--text-soft)" }}>
                  {medidasItens.map((m) => (
                    <div key={m.key}>{medidas[m.key] ? "✓" : "✗"} {m.label}</div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button className="btn" onClick={() => router.push("/")}>Dashboard</button>
          <button className="btn btn-p" style={{ marginLeft: "auto" }} onClick={() => router.push("/casos")}>Próximo caso →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-up">
      <div style={{ display: "flex", alignItems: "flex-end", gap: 20, flexWrap: "wrap" }}>
        <div>
          <div className="lbl">{casoTeste.titulo} · {LABEL_ETIOLOGIA[caso.etiologia]}</div>
          <h1 className="h1" style={{ marginTop: 9 }}>{FASES[phase - 1]}</h1>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button className="btn" onClick={() => router.push("/casos")}>Guardar e sair</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20, padding: "16px 20px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        {FASES.map((label, i) => (
          <button
            key={label}
            onClick={() => setPhase(i + 1)}
            style={{
              border: 0,
              cursor: "pointer",
              font: "600 12.5px/1 inherit",
              padding: "10px 14px",
              borderRadius: 999,
              background: phase === i + 1 ? ACC : i + 1 < phase ? "var(--selected)" : "transparent",
              color: phase === i + 1 ? "var(--accent-ink)" : i + 1 < phase ? "var(--accent)" : "var(--label)",
            }}
          >
            {i + 1} · {label}
          </button>
        ))}
        <div style={{ flex: 1, minWidth: 140 }} className="bar">
          <div style={{ height: "100%", width: `${(phase / 5) * 100}%`, background: ACC }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(0,1fr)", gap: 20, marginTop: 20, alignItems: "start" }}>
        <div className="card" style={{ padding: 18, position: "sticky", top: 96 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="lbl">Fotografia da ferida</div>
            {phase === 2 ? (
              <div className="lbl" style={{ marginLeft: "auto", color: tecidoAtivo ? "var(--accent)" : "var(--label)" }}>
                {tecidoAtivo ? `clique para marcar ${LABEL_TECIDO[tecidoAtivo]}` : "escolha um tecido"}
              </div>
            ) : null}
          </div>
          <div
            className="ph"
            style={{ height: 360, marginTop: 14, position: "relative", cursor: phase === 2 && tecidoAtivo ? "crosshair" : "default" }}
            onClick={(e) => {
              if (phase !== 2 || !tecidoAtivo) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width;
              const y = (e.clientY - rect.top) / rect.height;
              if (x < 0 || y < 0 || x > 1 || y > 1) return;
              setPins((prev) => [...prev, { tipo: tecidoAtivo, x, y }]);
            }}
          >
            {conteudo ? <img src={conteudo.fotografia} alt="" style={{ pointerEvents: "none" }} /> : "fotografia da ferida"}
            {pins.map((pin, i) => (
              <div
                key={i}
                title={`${LABEL_TECIDO[pin.tipo]} — clique para remover`}
                onClick={(e) => {
                  e.stopPropagation();
                  setPins((prev) => prev.filter((_, j) => j !== i));
                }}
                style={{
                  position: "absolute",
                  left: `${pin.x * 100}%`,
                  top: `${pin.y * 100}%`,
                  transform: "translate(-50%,-50%)",
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: COR_PIN[pin.tipo],
                  border: "2px solid rgba(0,0,0,.55)",
                  boxShadow: "0 4px 12px -4px rgba(0,0,0,.7)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  font: "700 11px/1 inherit",
                  color: "#101613",
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div className="soft" style={{ marginTop: 14, padding: "14px 16px" }}>
            <div className="lbl">Contexto do doente</div>
            <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-soft)" }}>{conteudo?.contexto}</div>
          </div>
          {conteudo?.observacoes.map((bloco) => (
            <div key={bloco.titulo} className="soft" style={{ marginTop: 12, padding: "14px 16px" }}>
              <div className="lbl">{bloco.titulo}</div>
              <div style={{ marginTop: 8, fontSize: 13.5, lineHeight: 1.6, color: "var(--text-soft)" }}>{bloco.texto}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {phase === 1 ? (
            <div className="card" style={{ padding: 22 }}>
              <h2 className="h2">Leia o caso antes de avançar</h2>
              <p className="mu" style={{ fontSize: 13.5, lineHeight: 1.6, margin: "10px 0 0" }}>
                Esta fase é informativa e não é avaliada. Ao lado tem a observação repartida por tema — o líquido da
                ferida, o cheiro, o tamanho. Está descrita tal como a veria na prática, em linguagem corrente: é na fase
                seguinte que terá de a traduzir para a classificação clínica correta, de memória.
              </p>
              <button className="btn btn-p" style={{ marginTop: 18 }} onClick={() => setPhase(2)}>
                Começar identificação →
              </button>
            </div>
          ) : null}

          {phase === 2 ? (
            <>
              <div className="card" style={{ padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <h2 className="h2">Tecido do leito</h2>
                  <div className="lbl" style={{ marginLeft: "auto" }}>
                    {tiposMarcados.size} tipo(s) marcado(s)
                  </div>
                </div>
                <p className="mu" style={{ fontSize: 13, margin: "8px 0 14px" }}>
                  Escolha um tipo de tecido e clique na fotografia onde o observa. Basta <strong>um pin por
                  tipo de tecido</strong> presente — não é preciso marcar todas as manchas do mesmo tecido.
                </p>
                <div className="wrapchips">
                  {(Object.keys(LABEL_TECIDO) as TipoTecido[]).map((t) => (
                    <button key={t} className="chip" style={tecidoAtivo === t ? SEL : undefined} onClick={() => setTecidoAtivo(t)}>
                      {LABEL_TECIDO[t]}
                      <span
                        style={{
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: COR_PIN[t],
                        }}
                      />
                    </button>
                  ))}
                </div>
                <div className="soft" style={{ marginTop: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 13, color: "var(--text-soft)" }}>
                    {tiposMarcados.size
                      ? `Tecidos marcados: ${[...tiposMarcados].map((t) => LABEL_TECIDO[t]).join(" · ")}`
                      : "Nenhum tecido marcado. Escolha um tecido e clique na fotografia."}
                  </div>
                  <button className="chip" style={{ marginLeft: "auto" }} onClick={() => setPins([])}>
                    Limpar pins
                  </button>
                </div>
              </div>
              <div className="card" style={{ padding: 22 }}>
                <h2 className="h2">Classificação</h2>
                <Grupo titulo="Exsudado — volume">
                  <ChipUnico opcoes={["ausente", "escasso", "moderado", "abundante"] as const} labels={LABEL_VOLUME} valor={exVol} onChange={setExVol} />
                </Grupo>
                <Grupo titulo="Exsudado — tipo">
                  <ChipMulti opcoes={["seroso", "sanguinolento", "purulento"] as const} labels={LABEL_TIPO_EXSUDADO} valor={exTipo} onChange={(v) => toggleSet(setExTipo, v)} />
                </Grupo>
                <Grupo titulo="Bordos">
                  <ChipMulti opcoes={Object.keys(LABEL_BORDO) as ValorBordo[]} labels={LABEL_BORDO} valor={bordos} onChange={(v) => toggleSet(setBordos, v)} />
                </Grupo>
                <Grupo titulo="Pele perilesional">
                  <ChipMulti opcoes={Object.keys(LABEL_PELE) as ValorPelePerilesional[]} labels={LABEL_PELE} valor={pele} onChange={(v) => toggleSet(setPele, v)} />
                </Grupo>
                <Grupo titulo="Nível de infeção">
                  <ChipUnico opcoes={TODOS_NIVEIS_INFECAO} labels={LABEL_NIVEL_INFECAO} valor={nivelInfecaoProposto} onChange={setNivelInfecaoProposto} />
                </Grupo>
                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button className="btn" onClick={() => setPhase(1)}>← Observação</button>
                  <button className="btn btn-p" style={{ marginLeft: "auto" }} onClick={() => setPhase(3)}>Avançar para o diálogo →</button>
                </div>
              </div>
            </>
          ) : null}

          {phase === 3 ? (
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h2 className="h2">Diálogo com o doente</h2>
                <div className="lbl" style={{ marginLeft: "auto" }}>{Object.keys(perguntado).length} / {PERGUNTAS_DIALOGO.length}</div>
              </div>
              <p className="mu" style={{ fontSize: 13, margin: "8px 0 16px" }}>Clique numa pergunta para a colocar.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {PERGUNTAS_DIALOGO.map((q, i) => {
                  const asked = !!perguntado[i];
                  return (
                    <div key={q.tag} className="qa" onClick={() => { setPerguntado((p) => ({ ...p, [i]: true })); setAbertaPergunta(abertaPergunta === i && asked ? null : i); }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="lbl" style={{ color: asked ? ACC : "var(--label)" }}>{q.tag}</div>
                        <div className="h3" style={{ flex: 1 }}>{q.pergunta}</div>
                        <div style={{ font: "600 11.5px/1 inherit", color: asked ? ACC : "var(--label)" }}>{asked ? "✓" : "perguntar"}</div>
                      </div>
                      {asked && abertaPergunta === i ? (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)", display: "flex", gap: 12 }}>
                          <div className="lbl" style={{ color: ACC, flex: "none", paddingTop: 2 }}>Doente</div>
                          <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text-soft)" }}>{q.resposta(caso)}</div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button className="btn" onClick={() => setPhase(2)}>← Identificação</button>
                <button className="btn btn-p" style={{ marginLeft: "auto" }} onClick={() => setPhase(4)}>Plano terapêutico →</button>
              </div>
            </div>
          ) : null}

          {phase === 4 ? (
            <>
              <div className="card" style={{ padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 99, background: ACC }} />
                  <h2 className="h2">Tratamento</h2>
                  <div className="lbl" style={{ marginLeft: "auto" }}>{categorias.size} escolhido(s)</div>
                </div>
                <p className="mu" style={{ fontSize: 13, margin: "8px 0 14px" }}>Categoria e mecanismo de ação.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {(Object.keys(LABEL_CATEGORIA) as CategoriaTratamento[]).map((cat) => {
                    const on = categorias.has(cat);
                    const exemplos = TODOS_TRATAMENTOS.filter((t) => t.categoria === cat).map((t) => t.nome).join(", ");
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleSet(setCategorias, cat)}
                        style={{
                          width: "100%", textAlign: "left", cursor: "pointer", padding: "15px 17px", borderRadius: 18,
                          background: on ? "var(--selected)" : "var(--soft)", border: `1px solid ${on ? ACC : "var(--line)"}`, color: "var(--ink)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                          <div style={{ width: 16, height: 16, borderRadius: "50%", flex: "none", border: `2px solid ${on ? ACC : "var(--line-strong)"}`, background: on ? ACC : "transparent" }} />
                          <div className="h3" style={{ flex: 1, textAlign: "left" }}>{LABEL_CATEGORIA[cat]}</div>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "left", marginTop: 6, lineHeight: 1.5 }}>{exemplos}</div>
                      </button>
                    );
                  })}
                </div>
                {medidasItens.length ? (
                  <div className="soft" style={{ marginTop: 16, padding: "14px 16px" }}>
                    <div className="lbl">Medidas da causa</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                      {medidasItens.map((m) => (
                        <label key={m.key} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={!!medidas[m.key]}
                            onChange={(e) => setMedidas((prev) => ({ ...prev, [m.key]: e.target.checked }))}
                          />
                          {m.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="card" style={{ padding: 22, borderColor: "var(--success-border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 99, background: "var(--success)" }} />
                  <h2 className="h2">Técnica de aplicação</h2>
                  <div className="lbl" style={{ marginLeft: "auto" }}>{tecnicasSel.size} escolhida(s)</div>
                </div>
                <p className="mu" style={{ fontSize: 13, margin: "8px 0 14px" }}>
                  Como se fixa e protege o penso. Pode escolher mais do que uma — cada técnica é avaliada
                  pelas suas próprias condições, e várias podem ser válidas em conjunto.
                </p>
                <div className="wrapchips">
                  {TODAS_TECNICAS.map((t) => (
                    <button key={t.id} className="chip" style={tecnicasSel.has(t.id) ? SEL : undefined} onClick={() => toggleSet(setTecnicasSel, t.id)}>
                      {t.nome}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button className="btn" onClick={() => setPhase(3)}>← Diálogo</button>
                  <button className="btn btn-p" style={{ marginLeft: "auto" }} onClick={() => setPhase(5)}>Justificar escolhas →</button>
                </div>
              </div>
            </>
          ) : null}

          {phase === 5 ? (
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h2 className="h2">Justificação</h2>
                <div className="lbl" style={{ marginLeft: "auto" }}>{justDone} / {itensJustificacao.length}</div>
              </div>
              <p className="mu" style={{ fontSize: 13, margin: "8px 0 16px" }}>
                Para cada escolha da fase anterior, indique a razão clínica.
              </p>
              {itensJustificacao.length === 0 ? (
                <p className="mu" style={{ fontSize: 13 }}>Volte à fase 4 e escolha pelo menos um tratamento ou técnica.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {itensJustificacao.map((item) => {
                    const answered = justRespostas[item.key] !== undefined;
                    const open = justAberto === item.key;
                    return (
                      <div key={item.key} className="qa">
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }} onClick={() => setJustAberto(open ? null : item.key)}>
                          <div className="lbl" style={{ color: item.tipo === "tratamento" ? ACC : "var(--success)", flex: "none" }}>
                            {item.tipo === "tratamento" ? "Tratamento" : "Técnica"}
                          </div>
                          <div className="h3" style={{ flex: 1 }}>{item.titulo}</div>
                          <div style={{ font: "600 11.5px/1 inherit", color: answered ? ACC : "var(--label)" }}>{answered ? "respondido ✓" : "expandir"}</div>
                        </div>
                        {open ? (
                          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 10 }}>{item.entrada!.pergunta}</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {/* Ordem sorteada; `oi` continua a ser o índice original do banco, que é o que se guarda e avalia. */}
                              {(ordemOpcoes[item.key] ?? item.entrada!.opcoes.map((_, i) => i)).map((oi) => {
                                const op = item.entrada!.opcoes[oi];
                                return (
                                <button
                                  key={oi}
                                  onClick={() => setJustRespostas((prev) => ({ ...prev, [item.key]: oi }))}
                                  style={{
                                    width: "100%", textAlign: "left", cursor: "pointer", padding: "13px 15px", borderRadius: 14,
                                    font: "500 13px/1.45 inherit",
                                    background: justRespostas[item.key] === oi ? "var(--selected)" : "var(--surface)",
                                    border: `1px solid ${justRespostas[item.key] === oi ? ACC : "var(--line)"}`,
                                    color: "var(--text-soft)",
                                  }}
                                >
                                  {op.texto}
                                </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="soft" style={{ marginTop: 18, padding: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div>
                  <div className="h3">{justDone === itensJustificacao.length && itensJustificacao.length > 0 ? "Tudo justificado" : "Justificações em falta"}</div>
                  <div className="mu" style={{ fontSize: 12.5, marginTop: 4 }}>
                    {justDone} de {itensJustificacao.length} escolhas justificadas · {Object.keys(perguntado).length} de {PERGUNTAS_DIALOGO.length} perguntas colocadas
                  </div>
                </div>
                <button className="btn btn-p" style={{ marginLeft: "auto" }} onClick={submeter}>Submeter caso</button>
              </div>
              <div style={{ marginTop: 14 }}>
                <button className="btn" onClick={() => setPhase(4)}>← Plano terapêutico</button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LinhaComparacao({ label, ok, children }: { label: string; ok: boolean; children: React.ReactNode }) {
  return (
    <div>
      <span style={{ color: ok ? "var(--success)" : "var(--danger)" }}>{ok ? "✓" : "✗"}</span> {label}: <span className="mu">{children}</span>
    </div>
  );
}
