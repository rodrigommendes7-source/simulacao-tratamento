/**
 * Agregação pura do histórico local (lib/estado.ts) para a rota
 * /estatisticas. Todas as funções aqui só agregam dados já calculados pelo
 * motor de decisão no momento da submissão de cada caso (guardados em
 * tipos/historico.ts) — nada é recalculado a partir do zero.
 */
import { TODAS_TECNICAS } from "../dados/tecnicasAplicacao";
import { LABEL_CATEGORIA, LABEL_ETIOLOGIA } from "./etiquetas";
import { APRENDER_ID_POR_CATEGORIA, APRENDER_ID_POR_ETIOLOGIA, APRENDER_ID_POR_TECNICA } from "./aprenderLinks";
import type { EntradaHistorico } from "../tipos/historico";
import type { CategoriaTratamento } from "../tipos/tratamento";
import type { Etiologia } from "../tipos/variaveis";
import { TODAS_ETIOLOGIAS } from "../tipos/variaveis";

const ETIOLOGIAS_COM_CONTEUDO = TODAS_ETIOLOGIAS.filter((e) => e !== "outra");

function ordenarPorData(historico: EntradaHistorico[]): EntradaHistorico[] {
  return [...historico].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
}

function media(valores: number[]): number {
  if (valores.length === 0) return 0;
  return valores.reduce((s, v) => s + v, 0) / valores.length;
}

// ───────────────────────── 1. Resumo geral ─────────────────────────

export type Tendencia = "subida" | "descida" | "estavel" | "insuficiente";

export interface ResumoGeral {
  totalCasos: number;
  mediaGeral: number;
  mediaRecente: number;
  /** Nº de casos considerados "recentes" — min(n, totalCasos). */
  janelaRecente: number;
  tendencia: Tendencia;
}

/**
 * Tendência = média dos últimos `n` casos vs. média histórica dos
 * restantes. "insuficiente" enquanto sobrarem menos de 2 casos fora da
 * janela recente — ou seja, até haver `n + 2` casos no total. Com menos do
 * que isso a "média histórica" seria um ou nenhum caso, e a comparação não
 * diria nada.
 */
export function calcularResumoGeral(historicoBruto: EntradaHistorico[], n = 5): ResumoGeral {
  const historico = ordenarPorData(historicoBruto);
  const totalCasos = historico.length;
  if (totalCasos === 0) {
    return { totalCasos: 0, mediaGeral: 0, mediaRecente: 0, janelaRecente: 0, tendencia: "insuficiente" };
  }

  const mediaGeral = media(historico.map((h) => h.pontuacaoFinal));
  const janelaRecente = Math.min(n, totalCasos);
  const recentes = historico.slice(-janelaRecente);
  const mediaRecente = media(recentes.map((h) => h.pontuacaoFinal));
  const anteriores = historico.slice(0, totalCasos - janelaRecente);

  let tendencia: Tendencia = "insuficiente";
  if (anteriores.length >= 2) {
    const mediaAnterior = media(anteriores.map((h) => h.pontuacaoFinal));
    const diferenca = mediaRecente - mediaAnterior;
    if (Math.abs(diferenca) < 3) tendencia = "estavel";
    else tendencia = diferenca > 0 ? "subida" : "descida";
  }

  return { totalCasos, mediaGeral, mediaRecente, janelaRecente, tendencia };
}

// ───────────────────────── 2. Evolução ao longo do tempo ─────────────────────────

export interface PontoEvolucao {
  indice: number;
  casoId: string;
  titulo: string;
  data: string;
  pontuacao: number;
}

/** Pontuação por caso, em ordem cronológica de resolução (não de etiologia nem de id). */
export function calcularEvolucao(historicoBruto: EntradaHistorico[]): PontoEvolucao[] {
  return ordenarPorData(historicoBruto).map((h, i) => ({
    indice: i + 1,
    casoId: h.casoId,
    titulo: h.titulo,
    data: h.data,
    pontuacao: h.pontuacaoFinal,
  }));
}

// ───────────────────────── 3. Desempenho por fase ─────────────────────────

export interface DesempenhoIdentificacaoPorVariavel {
  tecido: number;
  exsudadoVolume: number;
  exsudadoTipo: number;
  bordos: number;
  pele: number;
  nivelInfecao: number;
}

export interface DesempenhoPorFase {
  amostras: number;
  identificacaoMedia: number | null;
  identificacaoPorVariavel: DesempenhoIdentificacaoPorVariavel | null;
  tratamentoMedia: number | null;
  tecnicaMedia: number | null;
  /** null quando nenhum caso teve itens de justificação respondidos. */
  justificacaoMedia: number | null;
}

function percentualBooleano(historico: EntradaHistorico[], campo: (h: EntradaHistorico) => boolean): number {
  if (historico.length === 0) return 0;
  return (historico.filter(campo).length / historico.length) * 100;
}

export function calcularDesempenhoPorFase(historico: EntradaHistorico[]): DesempenhoPorFase {
  if (historico.length === 0) {
    return { amostras: 0, identificacaoMedia: null, identificacaoPorVariavel: null, tratamentoMedia: null, tecnicaMedia: null, justificacaoMedia: null };
  }

  const identificacaoMedia = media(historico.map((h) => h.identificacao.pontuacaoPercentual));
  const identificacaoPorVariavel: DesempenhoIdentificacaoPorVariavel = {
    tecido: media(historico.map((h) => h.identificacao.tecidoPercentual)),
    exsudadoVolume: percentualBooleano(historico, (h) => h.identificacao.exsudadoVolumeCorreto),
    exsudadoTipo: percentualBooleano(historico, (h) => h.identificacao.exsudadoTipoCorreto),
    bordos: percentualBooleano(historico, (h) => h.identificacao.bordosCorretos),
    pele: percentualBooleano(historico, (h) => h.identificacao.peleCorreta),
    nivelInfecao: percentualBooleano(historico, (h) => h.identificacao.nivelInfecaoCorreto),
  };
  const tratamentoMedia = media(historico.map((h) => h.pontuacaoTratamento));
  const tecnicaMedia = media(historico.map((h) => h.pontuacaoTecnicas));

  const justificacoesValidas = historico
    .map((h) => h.pontuacaoJustificacoes)
    .filter((p): p is number => p !== null);
  const justificacaoMedia = justificacoesValidas.length ? media(justificacoesValidas) : null;

  return { amostras: historico.length, identificacaoMedia, identificacaoPorVariavel, tratamentoMedia, tecnicaMedia, justificacaoMedia };
}

// ───────────────────────── 4. Desempenho por etiologia ─────────────────────────

export interface DesempenhoEtiologia {
  etiologia: Etiologia;
  label: string;
  tentativas: number;
  /** null quando nunca tentada. */
  media: number | null;
  aprenderId: string;
}

export function calcularDesempenhoPorEtiologia(historico: EntradaHistorico[]): DesempenhoEtiologia[] {
  return ETIOLOGIAS_COM_CONTEUDO.map((etiologia) => {
    const casos = historico.filter((h) => h.etiologia === etiologia);
    return {
      etiologia,
      label: LABEL_ETIOLOGIA[etiologia],
      tentativas: casos.length,
      media: casos.length ? media(casos.map((h) => h.pontuacaoFinal)) : null,
      aprenderId: APRENDER_ID_POR_ETIOLOGIA[etiologia],
    };
  });
}

// ───────────────────────── 5. Desempenho por categoria/técnica ─────────────────────────

export interface DesempenhoTratamentoOuTecnica {
  id: string;
  tipo: "categoria" | "tecnica";
  label: string;
  tentativas: number;
  taxaAcerto: number | null;
  aprenderId: string;
}

/** Limiar de taxa de erro (100 - taxaAcerto) acima do qual se destaca o link para Aprender. */
export const LIMIAR_ERRO_ALTO = 40;

export function calcularDesempenhoTratamentos(historico: EntradaHistorico[]): DesempenhoTratamentoOuTecnica[] {
  const categorias = Object.keys(LABEL_CATEGORIA) as CategoriaTratamento[];
  const porCategoria: DesempenhoTratamentoOuTecnica[] = categorias.map((categoria) => {
    const valores: number[] = [];
    for (const h of historico) {
      const corresp = h.correspondenciaTratamento.find((c) => c.categoria === categoria);
      if (corresp && corresp.pontuacaoPercentual !== null) valores.push(corresp.pontuacaoPercentual);
    }
    return {
      id: categoria,
      tipo: "categoria",
      label: LABEL_CATEGORIA[categoria],
      tentativas: valores.length,
      taxaAcerto: valores.length ? media(valores) : null,
      aprenderId: APRENDER_ID_POR_CATEGORIA[categoria],
    };
  });

  const porTecnica: DesempenhoTratamentoOuTecnica[] = TODAS_TECNICAS.map((tecnica) => {
    let esperadas = 0;
    let corretas = 0;
    for (const h of historico) {
      const corresp = h.correspondenciaTecnicas.find((c) => c.tecnicaId === tecnica.id);
      if (corresp?.esperada) {
        esperadas++;
        if (corresp.selecionada) corretas++;
      }
    }
    return {
      id: tecnica.id,
      tipo: "tecnica",
      label: tecnica.nome,
      tentativas: esperadas,
      taxaAcerto: esperadas ? (corretas / esperadas) * 100 : null,
      aprenderId: APRENDER_ID_POR_TECNICA[tecnica.id],
    };
  });

  return [...porCategoria, ...porTecnica];
}

// ───────────────────────── 6. Cobertura de etiologias ─────────────────────────

export interface CoberturaEtiologias {
  total: number;
  tentadas: number;
  percentual: number;
  etiologiasNaoTentadas: string[];
}

export function calcularCobertura(historico: EntradaHistorico[]): CoberturaEtiologias {
  const tentadas = new Set(historico.map((h) => h.etiologia));
  const naoTentadas = ETIOLOGIAS_COM_CONTEUDO.filter((e) => !tentadas.has(e));
  return {
    total: ETIOLOGIAS_COM_CONTEUDO.length,
    tentadas: tentadas.size,
    percentual: (tentadas.size / ETIOLOGIAS_COM_CONTEUDO.length) * 100,
    etiologiasNaoTentadas: naoTentadas.map((e) => LABEL_ETIOLOGIA[e]),
  };
}
