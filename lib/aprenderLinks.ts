import type { CategoriaTratamento } from "../tipos/tratamento";

/**
 * Mapeamento de categorias de tratamento / técnicas de aplicação para o id
 * da página correspondente em dados/aprender.ts — usado pelas Estatísticas
 * (secção 5) para linkar diretamente quando a taxa de erro é alta.
 * `terapia_compressiva` não tem página própria no eixo "tratamento" —
 * moveu-se para técnica de aplicação (ver especificacao-ecra-resolucao-caso.md,
 * P-Design-02) e por isso aponta para "tc-terapia-compressiva".
 */
export const APRENDER_ID_POR_CATEGORIA: Record<CategoriaTratamento, string> = {
  desbridamento: "tr-desbridamento",
  pensos_humidade: "tr-pensos-humidade",
  antimicrobianos: "tr-antimicrobianos",
  terapia_compressiva: "tc-terapia-compressiva",
  pressao_negativa: "tr-pressao-negativa",
  bordos_problematicos: "tr-bordos-problematicos",
  paliativos_oncologicos: "tr-paliativos-oncologicos",
  limpeza_irrigacao: "tr-limpeza-irrigacao",
  interfaces_silicone: "tr-interfaces-silicone",
};

export const APRENDER_ID_POR_TECNICA: Record<string, string> = {
  penso_rapido: "tc-penso-rapido",
  penso_simples_protetor: "tc-penso-simples-protetor",
  ligadura: "tc-ligadura",
  penso_impermeavel: "tc-penso-impermeavel",
  terapia_compressiva_tecnica: "tc-terapia-compressiva",
  sem_protecao: "tc-sem-protecao",
};

export const APRENDER_ID_POR_ETIOLOGIA: Record<string, string> = {
  venosa: "etio-venosa",
  arterial: "etio-arterial",
  mista_arteriovenosa: "etio-mista-arteriovenosa",
  pressao: "etio-pressao",
  pe_diabetico_neuropatico: "etio-pe-diabetico-neuropatico",
  pe_diabetico_neuroisquemico: "etio-pe-diabetico-neuroisquemico",
  cirurgica: "etio-cirurgica",
  traumatica: "etio-traumatica",
  oncologica_maligna: "etio-oncologica-maligna",
};
