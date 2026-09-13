import type { CategoriaTratamento, EntradaTratamento } from "./tratamento";
import type { NivelInfecao } from "./variaveis";

/**
 * Saída pura do motor de decisão (algoritmo/motorDecisao.ts) — depende
 * apenas do caso clínico, não de nenhuma resposta de aluno. Funciona como
 * "chave de correção" de referência.
 */
export interface DecisaoCaso {
  nivelInfecao: NivelInfecao;
  categoriasAplicaveis: CategoriaTratamento[];
  /** Só contém entradas para as categorias em `categoriasAplicaveis`. */
  tratamentosValidos: Partial<Record<CategoriaTratamento, EntradaTratamento[]>>;
}

/**
 * Medidas causais/de referenciação que a Fase 3 decidiu manter fora do
 * catálogo de tratamentos (offloading, referenciação vascular/médica,
 * controlo glicémico, gestão de dor) — ver nota de arquitetura em
 * taxonomia-variaveis-feridas.md.
 */
export interface MedidasCausaisResposta {
  referenciacaoVascular?: boolean;
  alivioPressao?: boolean;
  descargaOffloading?: boolean;
  controloGlicemicoReferenciado?: boolean;
  referenciacaoMedicaSistemica?: boolean;
  gestaoDorConsiderada?: boolean;
}

/** Resposta submetida pelo aluno para um caso clínico. */
export interface RespostaAluno {
  /** IDs de EntradaTratamento (dados/tratamentos.ts) escolhidos, de qualquer categoria. */
  tratamentosSelecionados: string[];
  medidasCausais: MedidasCausaisResposta;
}

export interface ResultadoCausaTratada {
  /** false quando a etiologia não tem teto (cirurgica/traumatica/outra) ou é oncologica_maligna. */
  aplicavel: boolean;
  itemPresente?: boolean;
  descricaoItem?: string;
  /** Teto de pontuação (%) a aplicar se `itemPresente` for false. Fixo em 40 (secção 4). */
  tetoPontuacao?: number;
}

export type DimensaoOncologica = "odor" | "exsudado" | "hemorragia" | "dor";

export interface ResultadoDimensaoOncologica {
  dimensao: DimensaoOncologica;
  aplicavel: boolean;
  correta?: boolean;
}

export interface ResultadoOncologico {
  dimensoes: ResultadoDimensaoOncologica[];
  /** (nº de dimensões aplicáveis corretamente endereçadas) / (nº de dimensões aplicáveis) × 100. null se nenhuma dimensão aplicável. */
  pontuacaoPercentual: number | null;
}

export interface ResultadoPortaoSistemico {
  /** true quando nivel_infecao (derivado do caso) = infecao_propagacao_sistemica. */
  aplicavel: boolean;
  satisfeito?: boolean;
  /** Teto de pontuação (%) a aplicar se não satisfeito. ASSUNÇÃO: reutiliza os 40% da secção 4 — não foi dado um valor próprio no pedido; a confirmar com Rodrigo. */
  tetoPontuacao?: number;
}

export interface CorrespondenciaCategoria {
  categoria: CategoriaTratamento;
  idsEsperados: string[];
  idsSelecionados: string[];
  idsCorretos: string[];
  /** null quando idsEsperados está vazio (categoria aplicável sem tratamento válido — buraco de dados a corrigir na Fase 3). */
  pontuacaoPercentual: number | null;
}

/** Saída da avaliação de uma resposta de aluno para um caso concreto. */
export interface ResultadoAvaliacao {
  decisao: DecisaoCaso;
  correspondenciaPorCategoria: CorrespondenciaCategoria[];
  causaTratada?: ResultadoCausaTratada;
  oncologico?: ResultadoOncologico;
  portaoSistemico: ResultadoPortaoSistemico;
  pontuacaoFinalPercentual: number;
  pontuacaoMaximaPossivel: number;
}
