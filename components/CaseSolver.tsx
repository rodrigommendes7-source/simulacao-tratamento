"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
import { ORIGEM_TEST_DRIVE, guardarTentativa, limparTentativa } from "../lib/testDrive";
import { propsAtivavel } from "../lib/acessibilidade";
import {
  apagarRascunho,
  guardarRascunho,
  lerRascunho,
  rascunhoVazio,
  versaoDadosDoCaso,
  type RascunhoCaso,
} from "../lib/rascunhoCaso";
import {
  dimensoesValidas,
  pontoDaImagem,
  pontoNoContentor,
  type Dimensoes,
} from "../lib/enquadramentoImagem";
import { ACC, SEL, Grupo, ChipUnico, ChipMulti, alternarConjunto } from "./CamposClinicos";
import { useDimensoesContentor } from "./useDimensoesContentor";
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
import type { EntradaHistorico } from "../tipos/historico";

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

/**
 * Em que condições o caso está a ser resolvido.
 *
 * `"conta"` é o percurso normal: há sessão, o rascunho é guardado no servidor
 * e o resultado entra no histórico.
 *
 * `"testDrive"` é quem chegou pelo link e ainda não se registou. As cinco
 * fases, a avaliação e o ecrã de resultado são **os mesmos** — não há versão
 * reduzida nem demonstração encenada, porque o valor demonstrado tem de ser o
 * valor real. O que muda é só o que toca em persistência: sem sessão não há
 * rascunho (a rota exige-a) e o resultado fica em `sessionStorage` até a
 * pessoa decidir se quer ficar.
 */
export type ModoResolucao = "conta" | "testDrive";

export default function CaseSolver({ id, modo = "conta" }: { id: string; modo?: ModoResolucao }) {
  const router = useRouter();
  const testDrive = modo === "testDrive";
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
  /**
   * A fotografia é pintada com `object-fit: cover`, por isso parte dela fica
   * cortada e as coordenadas do contentor não são as da imagem. Guardam-se as
   * duas medidas para converter nos dois sentidos (ver
   * lib/enquadramentoImagem.ts): o clique → coordenadas da imagem, e os pins
   * já colocados → píxeis do contentor.
   */
  const { ref: refFotografia, dimensoes: dimensoesFotografia } = useDimensoesContentor<HTMLDivElement>();
  const [naturalFotografia, setNaturalFotografia] = useState<Dimensoes | null>(null);
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

  const [resultado, setResultado] = useState<ResultadoAvaliacao | null>(null);
  const [resultadoIdentificacao, setResultadoIdentificacao] = useState<ResultadoIdentificacao | null>(null);

  // ─────────────────────────── Rascunho ───────────────────────────

  /** Versão dos dados deste caso — muda se a ficha clínica ou a decisão mudarem. */
  const versaoDados = useMemo(
    () => (casoTeste && decisao ? versaoDadosDoCaso(casoTeste.caso, decisao) : ""),
    [casoTeste, decisao],
  );
  /** Só se começa a gravar depois de ter lido o que já lá estava — senão o primeiro render escrevia um rascunho vazio por cima. */
  const [rascunhoLido, setRascunhoLido] = useState(false);
  /** Rascunho encontrado com uma versão de dados diferente: fica à espera da decisão do aluno. */
  const [rascunhoDesatualizado, setRascunhoDesatualizado] = useState<RascunhoCaso | null>(null);
  /** A gravação do resultado no servidor falhou? O aluno tem de saber que este caso não entrou nas estatísticas. */
  const [erroGravacao, setErroGravacao] = useState(false);

  const aplicarRascunho = useCallback((r: RascunhoCaso) => {
    setPhase(r.fase);
    setTecidoAtivo(r.tecidoAtivo);
    setPins(r.pins);
    setExVol(r.exsudadoVolume);
    setExTipo(new Set(r.exsudadoTipo));
    setBordos(new Set(r.bordos));
    setPele(new Set(r.pele));
    setNivelInfecaoProposto(r.nivelInfecaoProposto);
    setPerguntado(r.perguntado);
    setCategorias(new Set(r.categorias));
    setTecnicasSel(new Set(r.tecnicas));
    setMedidas(r.medidas);
    setJustRespostas(r.justRespostas);
    if (Object.keys(r.ordemOpcoes ?? {}).length) setOrdemOpcoes(r.ordemOpcoes);
  }, []);

  // Carregamento: corre uma vez por caso. A ordem sorteada das justificações é
  // gerada aqui (e não durante o render) porque é aleatória — o servidor e o
  // cliente produziriam ordens diferentes; um rascunho guardado substitui-a.
  useEffect(() => {
    if (!casoTeste) return;
    setOrdemOpcoes(baralharBancoJustificacoes());
    // Sem sessão não há rascunho: a rota exige-a, e o estado do test drive vive
    // só enquanto durar. Marca-se como lido para o efeito de gravação abaixo
    // saber que não tem nada por que esperar.
    if (testDrive) {
      setRascunhoLido(true);
      return;
    }
    let cancelado = false;
    // O rascunho vem agora do servidor, por isso a leitura é assíncrona.
    // `rascunhoLido` só fica verdadeiro no fim: enquanto não estiver, o efeito
    // de gravação não corre e não escreve um rascunho vazio por cima do que
    // ainda está a caminho.
    lerRascunho(casoTeste.id).then((guardado) => {
      if (cancelado) return;
      if (guardado) {
        if (guardado.versaoDados === versaoDados) aplicarRascunho(guardado);
        else setRascunhoDesatualizado(guardado);
      }
      setRascunhoLido(true);
    });
    return () => {
      cancelado = true;
    };
  }, [casoTeste, versaoDados, aplicarRascunho, testDrive]);

  // Gravação: a cada alteração, enquanto o caso não estiver submetido. Nada é
  // escrito enquanto houver um conflito de versão por resolver — isso
  // apagaria o rascunho antigo antes de o aluno escolher o que fazer com ele.
  useEffect(() => {
    if (testDrive) return;
    if (!casoTeste || !rascunhoLido || rascunhoDesatualizado || screen !== "solve") return;
    const rascunho: RascunhoCaso = {
      versaoDados,
      guardadoEm: new Date().toISOString(),
      fase: phase,
      tecidoAtivo,
      pins,
      exsudadoVolume: exVol,
      exsudadoTipo: [...exTipo],
      bordos: [...bordos],
      pele: [...pele],
      nivelInfecaoProposto,
      perguntado,
      categorias: [...categorias],
      tecnicas: [...tecnicasSel],
      medidas,
      justRespostas,
      ordemOpcoes,
    };
    if (rascunhoVazio(rascunho)) apagarRascunho(casoTeste.id);
    else guardarRascunho(casoTeste.id, rascunho);
  }, [
    testDrive, casoTeste, rascunhoLido, rascunhoDesatualizado, screen, versaoDados, phase, tecidoAtivo,
    pins, exVol, exTipo, bordos, pele, nivelInfecaoProposto, perguntado, categorias,
    tecnicasSel, medidas, justRespostas, ordemOpcoes,
  ]);

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

  /** Já se sabe o suficiente para compensar o corte do `object-fit: cover`? */
  const enquadramentoConhecido =
    dimensoesValidas(dimensoesFotografia) && dimensoesValidas(naturalFotografia);

  function aoClicarNaFotografia(e: React.MouseEvent<HTMLDivElement>) {
    if (phase !== 2 || !tecidoAtivo) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const noContentor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const contentor = { largura: rect.width, altura: rect.height };
    // Enquanto a imagem não carregou não há como saber o que está cortado;
    // cai-se no mapeamento direto, que é o que se fazia antes.
    const ponto = enquadramentoConhecido
      ? pontoDaImagem(noContentor, contentor, naturalFotografia!)
      : { x: noContentor.x / rect.width, y: noContentor.y / rect.height };
    if (ponto.x < 0 || ponto.y < 0 || ponto.x > 1 || ponto.y > 1) return;
    setPins((prev) => [...prev, { tipo: tecidoAtivo, x: ponto.x, y: ponto.y }]);
  }

  /** Posição de um pin na caixa visível — o inverso da conversão do clique. */
  function posicaoDoPin(pin: PinTecido): { left: string; top: string } {
    if (!enquadramentoConhecido) {
      return { left: `${pin.x * 100}%`, top: `${pin.y * 100}%` };
    }
    const p = pontoNoContentor(pin, dimensoesFotografia!, naturalFotografia!);
    return { left: `${p.x}px`, top: `${p.y}px` };
  }

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
    // `categoriasSelecionadas` inclui as que não se aplicam ao caso — é o que
    // permite à avaliação descontar os falsos positivos; `tratamentosSelecionados`
    // sozinho não os revela (uma categoria não aplicável não tem tratamentos
    // válidos a acrescentar).
    const resposta: RespostaAluno = {
      tratamentosSelecionados,
      categoriasSelecionadas: [...categorias],
      medidasCausais: medidas,
    };
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
    // A entrada é construída uma só vez, aqui, e é a mesma nos dois modos —
    // é isso que torna um resultado migrado do test drive indistinguível de um
    // resolvido com conta. Só o destino difere: a base de dados, ou a gaveta
    // do separador enquanto não houver conta.
    const entrada: EntradaHistorico = {
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
    };

    if (testDrive) {
      // Nada vai para a base de dados: não há sessão, e todas as rotas de
      // dados a exigem. Fica no separador até a pessoa decidir se quer ficar.
      guardarTentativa(entrada);
    } else {
      // A gravação no servidor não trava a passagem ao ecrã de resultado: a
      // avaliação já está feita e o aluno tem direito a vê-la. Se falhar, o
      // aviso aparece por cima do resultado — o que não pode acontecer é ficar
      // em silêncio e o caso desaparecer das estatísticas sem explicação.
      registarResultado(entrada).catch(() => setErroGravacao(true));
      // O resultado passou a viver no histórico; o rascunho deixou de ter função.
      apagarRascunho(casoTeste!.id);
    }
    setScreen("result");
    window.scrollTo({ top: 0 });
  }

  if (screen === "result" && resultado && resultadoIdentificacao) {
    const categoriasCorretas = [...categorias].filter((c) => decisao.categoriasAplicaveis.includes(c));
    // A lista vem da própria avaliação, para o que se mostra aqui e o que
    // desconta na pontuação não poderem divergir.
    const categoriasErradas = resultado.falsosPositivos.categorias;
    const descontoFalsosPositivos = Math.round(resultado.falsosPositivos.pontosDescontados);
    const categoriasFaltadas = decisao.categoriasAplicaveis.filter((c) => c !== "paliativos_oncologicos" && !categorias.has(c));
    const pontuacaoCombinada = (resultadoIdentificacao.pontuacaoFinalPercentual + resultado.pontuacaoFinalPercentual) / 2;

    return (
      <div className="animate-up">
        {erroGravacao ? (
          <div
            className="card"
            role="alert"
            style={{ padding: "14px 18px", marginBottom: 16, borderColor: "var(--danger)" }}
          >
            <div className="lbl" style={{ color: "var(--danger)" }}>Resultado não guardado</div>
            <p className="mu" style={{ fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
              A avaliação abaixo está correta, mas não foi possível guardá-la na sua conta — este caso não vai
              aparecer nas estatísticas. Verifique a ligação e resolva-o outra vez quando puder.
            </p>
          </div>
        ) : null}
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
            <div style={{ font: "800 64px/1 inherit", color: "var(--accent)" }}>{Math.round(pontuacaoCombinada)}%</div>
            {/* Sem "de 100": a percentagem no número já diz a escala, e "8% de 100" lia-se a dobrar. */}
            <div className="lbl" style={{ marginTop: 8 }}>média de identificação + plano terapêutico</div>
            <div className="bar" style={{ width: 200, marginTop: 12 }}>
              <div style={{ width: `${pontuacaoCombinada}%`, height: "100%", background: ACC }} />
            </div>
          </div>
        </div>

        <div className="grelha-2" style={{ marginTop: 16 }}>
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
              {categoriasErradas.length ? (
                <div style={{ color: "var(--warning)" }}>
                  ~ Não indicado para este caso: {categoriasErradas.map((c) => LABEL_CATEGORIA[c]).join(", ")}
                  {descontoFalsosPositivos > 0 ? ` (−${descontoFalsosPositivos} pontos no plano)` : null}
                </div>
              ) : null}
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

        {testDrive ? (
          /*
            O convite a registar é concreto, não genérico: o que se ganha é
            guardar *este* resultado e continuar a partir dele. O argumento
            "crie conta para aceder a funcionalidades" não diz nada a quem
            acabou de ver a avaliação do seu próprio trabalho.
          */
          <div className="card" style={{ padding: 24, marginTop: 16, borderColor: "var(--accent)" }}>
            <div className="lbl" style={{ color: "var(--accent)" }}>Este resultado ainda não está guardado</div>
            <h2 className="h2" style={{ marginTop: 10 }}>Quer guardar este caso na sua conta?</h2>
            <ul
              className="mu"
              style={{ fontSize: 13.5, lineHeight: 1.8, margin: "12px 0 0", paddingLeft: 20, maxWidth: "60ch" }}
            >
              <li>Guarda esta resolução com a pontuação categoria a categoria.</li>
              <li>Acompanha a evolução ao longo do curso, caso a caso.</li>
              <li>Dá acesso aos restantes {TODOS_CASOS_TESTE.length - 1} casos, à secção Aprender e à consulta pontual.</li>
            </ul>
            <p className="mu" style={{ fontSize: 12.5, marginTop: 14, lineHeight: 1.6 }}>
              Se sair sem criar conta, esta resolução perde-se — não fica guardada em lado nenhum.
              Não pedimos email.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <button
                className="btn btn-p"
                onClick={() => router.push(`/login?origem=${ORIGEM_TEST_DRIVE}`)}
              >
                Criar conta e guardar este resultado →
              </button>
              <button
                className="btn"
                onClick={() => {
                  // Sair é mesmo sair: o botão diz que a resolução se perde,
                  // e passaria a mentir se a deixasse ficar no separador.
                  limparTentativa();
                  router.push("/login");
                }}
              >
                Sair sem guardar
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn" onClick={() => router.push("/")}>Dashboard</button>
            <button className="btn btn-p" style={{ marginLeft: "auto" }} onClick={() => router.push("/casos")}>Próximo caso →</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-up">
      {/*
        A ficha clínica deste caso mudou desde que o rascunho foi criado. As
        marcações podem referir-se a polígonos que já não existem e as
        categorias escolhidas podem já não ser as aplicáveis — mas quem sabe
        isso é o aluno, não a aplicação: descartar em silêncio deitava fora
        trabalho feito, e carregar em silêncio dava respostas que já não
        correspondem ao caso. Pergunta-se.
      */}
      {rascunhoDesatualizado ? (
        <div
          className="card"
          role="alertdialog"
          aria-labelledby="rascunho-titulo"
          style={{ padding: 20, marginBottom: 18, borderColor: "var(--warning)" }}
        >
          <div className="lbl" style={{ color: "var(--warning)" }}>Rascunho de uma versão anterior</div>
          <h2 className="h2" id="rascunho-titulo" style={{ marginTop: 8 }}>
            Este caso mudou desde que começou a resolvê-lo.
          </h2>
          <p className="mu" style={{ fontSize: 13.5, lineHeight: 1.6, margin: "10px 0 0", maxWidth: "62ch" }}>
            Tem um rascunho de{" "}
            {new Date(rascunhoDesatualizado.guardadoEm).toLocaleString("pt-PT")}, guardado sobre uma
            versão anterior da ficha deste caso. Pode continuar de onde ficou — sabendo que algumas
            escolhas podem já não corresponder ao que está agora na fotografia e no enunciado — ou
            começar de novo.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <button
              className="btn btn-p"
              onClick={() => {
                aplicarRascunho(rascunhoDesatualizado);
                setRascunhoDesatualizado(null);
              }}
            >
              Continuar com o rascunho antigo
            </button>
            <button
              className="btn"
              onClick={() => {
                apagarRascunho(casoTeste.id);
                setRascunhoDesatualizado(null);
              }}
            >
              Recomeçar do zero
            </button>
          </div>
        </div>
      ) : null}

      <div style={{ display: "flex", alignItems: "flex-end", gap: 20, flexWrap: "wrap" }}>
        <div>
          <div className="lbl">{casoTeste.titulo} · {LABEL_ETIOLOGIA[caso.etiologia]}</div>
          <h1 className="h1" style={{ marginTop: 9 }}>{FASES[phase - 1]}</h1>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button
            className="btn"
            onClick={() => {
              // O botão diz "sem guardar": tem de apagar também o que tinha
              // sido gravado automaticamente até aqui. No test drive não há
              // rascunho nenhum para apagar — nada foi escrito.
              if (testDrive) {
                limparTentativa();
                router.push("/login");
                return;
              }
              apagarRascunho(casoTeste.id);
              router.push("/casos");
            }}
            title={
              testDrive
                ? "Abandona esta experiência. Nada fica guardado."
                : "Apaga o que preencheu neste caso, incluindo o rascunho guardado automaticamente."
            }
          >
            Sair sem guardar
          </button>
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

      <div className="grelha-2-larga" style={{ marginTop: 20 }}>
        <div className="card foto-fixa" style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="lbl">Fotografia da ferida</div>
            {phase === 2 ? (
              <div className="lbl" style={{ marginLeft: "auto", color: tecidoAtivo ? "var(--accent)" : "var(--label)" }}>
                {tecidoAtivo ? `clique para marcar ${LABEL_TECIDO[tecidoAtivo]}` : "escolha um tecido"}
              </div>
            ) : null}
          </div>
          <div className="ph" style={{ height: 360, marginTop: 14, position: "relative" }}>
            {!conteudo ? "fotografia da ferida" : null}
            {/*
              Camada interior do tamanho exato da área pintada (a borda de
              `.ph` não conta): é contra esta caixa que o clique é convertido
              em coordenadas da imagem e que os pins são posicionados.
            */}
            <div
              ref={refFotografia}
              style={{
                position: "absolute",
                inset: 0,
                cursor: phase === 2 && tecidoAtivo ? "crosshair" : "default",
              }}
              onClick={aoClicarNaFotografia}
            >
              {conteudo ? (
                <Image
                  src={conteudo.fotografia}
                  alt=""
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  style={{ objectFit: "cover", pointerEvents: "none" }}
                  onLoad={(e) =>
                    setNaturalFotografia({
                      largura: e.currentTarget.naturalWidth,
                      altura: e.currentTarget.naturalHeight,
                    })
                  }
                />
              ) : null}
              {pins.map((pin, i) => {
              const posicao = posicaoDoPin(pin);
              return (
              <div
                key={i}
                title={`${LABEL_TECIDO[pin.tipo]} — clique para remover`}
                onClick={(e) => {
                  e.stopPropagation();
                  setPins((prev) => prev.filter((_, j) => j !== i));
                }}
                style={{
                  position: "absolute",
                  left: posicao.left,
                  top: posicao.top,
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
              );
            })}
            </div>
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
                    <div
                      key={q.tag}
                      className="qa"
                      aria-expanded={asked && abertaPergunta === i}
                      {...propsAtivavel(() => {
                        setPerguntado((p) => ({ ...p, [i]: true }));
                        setAbertaPergunta(abertaPergunta === i && asked ? null : i);
                      })}
                    >
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
                <p className="mu" style={{ fontSize: 13, margin: "8px 0 14px" }}>
                  Categoria e mecanismo de ação. Escolha só as que se aplicam a esta ferida — uma
                  categoria não indicada desconta metade do que vale acertar numa indicada.
                </p>
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
                  pelas suas próprias condições, e várias podem ser válidas em conjunto. Escolher uma
                  técnica não indicada para este caso desconta pontos.
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
                        <div
                          style={{ display: "flex", alignItems: "center", gap: 12 }}
                          aria-expanded={open}
                          {...propsAtivavel(() => setJustAberto(open ? null : item.key))}
                        >
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
