import type {
  Dimensoes,
  Etiologia,
  Exsudado,
  LocalizacaoAnatomica,
  ProfundidadeEstadiamento,
  SinaisInfecaoInput,
  TempoEvolucao,
  TipoTecidoLeito,
  ValorBordo,
  ValorPelePerilesional,
} from "./variaveis";

/**
 * Caso clínico — conjunto de valores das variáveis da Fase 1 v2 para uma
 * ferida concreta.
 *
 * `abpi`: ver nota de assunção em tipos/variaveis.ts. Só é relevante quando
 * `etiologia` é `venosa`, `arterial` ou `mista_arteriovenosa`; `undefined`
 * nas restantes etiologias.
 */
export interface CasoClinico {
  etiologia: Etiologia;
  tipo_tecido_leito: TipoTecidoLeito;
  exsudado: Exsudado;
  sinais_infecao: SinaisInfecaoInput;
  bordos: ValorBordo[];
  pele_perilesional: ValorPelePerilesional[];
  localizacao_anatomica: LocalizacaoAnatomica;
  profundidade_estadiamento: ProfundidadeEstadiamento;
  dimensoes: Dimensoes;
  dor: number;
  tempo_evolucao: TempoEvolucao;
  /** ABPI (índice tornozelo-braço) — ver nota de assunção. */
  abpi?: number;
}
