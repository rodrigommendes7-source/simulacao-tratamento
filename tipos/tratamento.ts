import type { Condicao } from "./condicao";

/** As 9 categorias de tratamento da Fase 3 v2. */
export type CategoriaTratamento =
  | "desbridamento"
  | "pensos_humidade"
  | "antimicrobianos"
  | "terapia_compressiva"
  | "pressao_negativa"
  | "bordos_problematicos"
  | "paliativos_oncologicos"
  | "limpeza_irrigacao"
  | "interfaces_silicone";

export type NivelEvidencia = "forte" | "moderada" | "limitada" | "mista";

export interface EntradaTratamento {
  id: string;
  categoria: CategoriaTratamento;
  nome: string;
  mecanismo: string;
  /** Condição composta — TODAS as sub-condições "indicado quando" que foram codificáveis. */
  indicadoQuando: Condicao;
  /** Se QUALQUER uma se aplicar, o tratamento não é válido. Vazio se não há contraindicação codificável. */
  contraindicadoQuando: Condicao[];
  /** Texto "Indicado quando" tal como está em fase3-base-dados-tratamentos.md — mostrado na explicação da recomendação (Consulta pontual), não gerado a partir da DSL. */
  indicadoQuandoTexto: string;
  /** Texto "Contraindicado quando" tal como está no documento de origem. */
  contraindicadoQuandoTexto: string;
  nivelEvidencia: NivelEvidencia;
  notasAplicacao: string;
  /** Critérios em prosa citados na Fase 3 que não são redutíveis à DSL de condições — ver tipos/condicao.ts. */
  notasNaoCodificadas?: string[];
  referencias: string[];
}
