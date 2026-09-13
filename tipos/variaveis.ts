/**
 * Tipos das variáveis clínicas — Fase 1 v2 (taxonomia-variaveis-feridas.md).
 *
 * NOTA DE ASSUNÇÃO (a confirmar com Rodrigo): o campo `abpi` foi adicionado
 * ao caso clínico como extensão à Fase 1. A taxonomia validada não define
 * ABPI como variável, mas a Fase 3 (categoria 4 — terapia compressiva) e o
 * checklist de teto de `venosa`/`arterial`/`mista_arteriovenosa` (Fase 1)
 * dependem inteiramente do valor de ABPI. Sem este campo não é possível
 * implementar nem testar a categoria de compressão. Decisão validada por
 * Rodrigo em 2026-09-12 (opção "adicionar `abpi` como novo campo").
 */

export type Etiologia =
  | "venosa"
  | "arterial"
  | "mista_arteriovenosa"
  | "pressao"
  | "pe_diabetico_neuropatico"
  | "pe_diabetico_neuroisquemico"
  | "cirurgica"
  | "traumatica"
  | "oncologica_maligna"
  | "outra";

export const TODAS_ETIOLOGIAS: Etiologia[] = [
  "venosa",
  "arterial",
  "mista_arteriovenosa",
  "pressao",
  "pe_diabetico_neuropatico",
  "pe_diabetico_neuroisquemico",
  "cirurgica",
  "traumatica",
  "oncologica_maligna",
  "outra",
];

export type TipoTecido =
  | "granulacao"
  | "granulacao_hipergranulada"
  | "epitelizacao"
  | "esfacelo"
  | "necrose_seca"
  | "necrose_humida";

export const TODOS_TIPOS_TECIDO: TipoTecido[] = [
  "granulacao",
  "granulacao_hipergranulada",
  "epitelizacao",
  "esfacelo",
  "necrose_seca",
  "necrose_humida",
];

export interface Ponto2D {
  x: number;
  y: number;
}

/**
 * Zona de referência de um tipo de tecido no leito da ferida — polígono
 * normalizado (0-1 em x e y) desenhado manualmente sobre a fotografia do
 * caso, não visível ao aluno. Substitui o modelo anterior por percentagem
 * (ver especificacao-ecra-resolucao-caso.md, P-Design-04, e
 * taxonomia-variaveis-feridas.md v3 — `tipo_tecido_leito`).
 */
export interface ZonaTecido {
  tipo: TipoTecido;
  /** Vértices do polígono, coordenadas normalizadas 0-1 (relativas à imagem). */
  poligono: Ponto2D[];
}

/** `tipo_tecido_leito`: lista de zonas de referência {tipo, poligono}. Pode haver várias zonas do mesmo tipo. */
export type TipoTecidoLeito = ZonaTecido[];

/** Pin colocado pelo aluno sobre a fotografia — a resposta do aluno a `tipo_tecido_leito`. */
export interface PinTecido {
  tipo: TipoTecido;
  x: number;
  y: number;
}

export type VolumeExsudado = "ausente" | "escasso" | "moderado" | "abundante";

export const TODOS_VOLUMES_EXSUDADO: VolumeExsudado[] = [
  "ausente",
  "escasso",
  "moderado",
  "abundante",
];

export type TipoExsudado = "seroso" | "sanguinolento" | "purulento";

export const TODOS_TIPOS_EXSUDADO: TipoExsudado[] = [
  "seroso",
  "sanguinolento",
  "purulento",
];

export interface Exsudado {
  volume: VolumeExsudado;
  /** Só aplicável quando volume !== 'ausente'. */
  tipo: TipoExsudado[];
}

export type NivelOdorEritema = "ausente" | "ligeiro" | "moderado" | "forte";

/** Sinais de infeção — inputs brutos do continuum IWII (Fase 1 v2). */
export interface SinaisInfecaoInput {
  // covert (subtis)
  dor_aumentada: boolean;
  tecido_friavel: boolean;
  odor: NivelOdorEritema;
  atraso_cicatrizacao: boolean;
  quebra_ferida_nova: boolean;
  // overt (clássicos)
  eritema: NivelOdorEritema;
  calor_local: boolean;
  edema_local: boolean;
  // propagação/sistémica
  celulite: boolean;
  linfangite: boolean;
  abcesso: boolean;
  febre: boolean;
  leucocitose: boolean;
}

export type NivelInfecao =
  | "sem_sinais"
  | "infecao_local_covert"
  | "infecao_local_overt"
  | "infecao_propagacao_sistemica";

export const TODOS_NIVEIS_INFECAO: NivelInfecao[] = [
  "sem_sinais",
  "infecao_local_covert",
  "infecao_local_overt",
  "infecao_propagacao_sistemica",
];

export type ValorBordo =
  | "aderentes_planos"
  | "nao_aderentes_solto"
  | "enrolados_epibole"
  | "socavados_underminados"
  | "hiperqueratosicos"
  | "fibroticos";

export const TODOS_BORDOS: ValorBordo[] = [
  "aderentes_planos",
  "nao_aderentes_solto",
  "enrolados_epibole",
  "socavados_underminados",
  "hiperqueratosicos",
  "fibroticos",
];

export type ValorPelePerilesional =
  | "integra"
  | "macerada"
  | "seca_descamativa"
  | "eczematizada"
  | "hiperpigmentada"
  | "induracao_lipodermatosclerose"
  | "calo_hiperqueratose";

export const TODOS_PELE_PERILESIONAL: ValorPelePerilesional[] = [
  "integra",
  "macerada",
  "seca_descamativa",
  "eczematizada",
  "hiperpigmentada",
  "induracao_lipodermatosclerose",
  "calo_hiperqueratose",
];

export type LocalizacaoAnatomica =
  | "calcanhar"
  | "maleolo_medial"
  | "maleolo_lateral"
  | "dorso_pe"
  | "planta_pe"
  | "dedos_pe"
  | "perna_terco_distal"
  | "joelho"
  | "coxa"
  | "mao"
  | "antebraco"
  | "braco"
  | "sacro"
  | "isquion"
  | "trocanter"
  | "abdomen"
  | "torax"
  | "occipital_cabeca_pescoco"
  | "outra_cabeca_pescoco"
  | "outra";

export type ProfundidadeEstadiamentoPressao =
  | "estadio_1"
  | "estadio_2"
  | "estadio_3"
  | "estadio_4"
  | "nao_classificavel"
  | "lesao_tecidos_profundos_suspeita";

export const TODOS_ESTADIOS_PRESSAO: ProfundidadeEstadiamentoPressao[] = [
  "estadio_1",
  "estadio_2",
  "estadio_3",
  "estadio_4",
  "nao_classificavel",
  "lesao_tecidos_profundos_suspeita",
];

export type ProfundidadeEstadiamentoGenerica =
  | "superficial"
  | "espessura_parcial"
  | "espessura_total";

export const TODAS_PROFUNDIDADES_GENERICAS: ProfundidadeEstadiamentoGenerica[] =
  ["superficial", "espessura_parcial", "espessura_total"];

/** `profundidade_estadiamento`: condicional à etiologia — ver Fase 1 v2. */
export type ProfundidadeEstadiamento =
  | ProfundidadeEstadiamentoPressao
  | ProfundidadeEstadiamentoGenerica;

export interface Dimensoes {
  comprimento_cm: number;
  largura_cm: number;
  profundidade_cm?: number;
  /** Calculada automaticamente (comprimento × largura). */
  area_cm2: number;
}

export interface TempoEvolucao {
  duracao_semanas: number;
  /**
   * Derivada automaticamente. Threshold fixado em 6 semanas (aguda: < 6,
   * cronica: >= 6) — a documentação original falava em "4-6 semanas" sem
   * fixar um único valor; validado por Rodrigo em 2026-09-12 (fixar em 6
   * semanas, não "4-6", para remover a ambiguidade).
   */
  classificacao: "aguda" | "cronica";
}

export function calcularClassificacaoTempoEvolucao(
  duracao_semanas: number,
): "aguda" | "cronica" {
  return duracao_semanas < 6 ? "aguda" : "cronica";
}

export function calcularAreaCm2(comprimento_cm: number, largura_cm: number): number {
  return comprimento_cm * largura_cm;
}
