/**
 * DSL de condições — permite expressar as regras "indicado quando" /
 * "contraindicado quando" da Fase 3 como dados (não código), na notação
 * `variavel.campo = valor` / `variavel.campo contém valor` já usada nas
 * Fases 1-3.
 *
 * LIMITAÇÃO ASSUMIDA: só é possível codificar condições expressas sobre
 * campos que existem na taxonomia fixa (Fase 1 v2) + `abpi` (ver
 * tipos/variaveis.ts). Critérios em prosa livre não redutíveis a um campo
 * taxonómico (ex.: "falta de treino/certificação", "alergia a ovo/soja",
 * "feridas grandes >2cm", "proximidade de vasos major", "localização
 * facial") não são codificados como contraindicações automáticas do
 * algoritmo — ficam documentados em `notasNaoCodificadas` de cada entrada
 * de tratamento (dados/tratamentos.ts), tal como o próprio projeto já trata
 * o caso da "escara seca estável em isquemia" (nota informativa, não regra
 * automática — Fase 3, P3-F01). Esta é uma limitação estrutural da
 * taxonomia fixada na Fase 1, não uma alteração de regra clínica.
 */

/** Nomes de campo suportados pela DSL de condições. */
export type NomeCampo =
  | "etiologia"
  | "tipo_tecido_leito"
  | "exsudado.volume"
  | "exsudado.tipo"
  | "nivel_infecao"
  | "bordos"
  | "pele_perilesional"
  | "profundidade_estadiamento"
  | "dor"
  | "abpi";

export type OperadorIgualdade = "=" | "!=";
export type OperadorConjunto = "contem" | "nao_contem";
export type OperadorNumerico = ">" | ">=" | "<" | "<=";

export interface CondicaoIgualdade {
  tipo: "igualdade";
  campo: NomeCampo;
  operador: OperadorIgualdade;
  valor: string;
}

export interface CondicaoConjunto {
  tipo: "conjunto";
  campo: NomeCampo;
  operador: OperadorConjunto;
  valor: string;
}

export interface CondicaoNumerica {
  tipo: "numerica";
  campo: NomeCampo;
  operador: OperadorNumerico;
  valor: number;
}

export interface CondicaoE {
  tipo: "E";
  condicoes: Condicao[];
}

export interface CondicaoOu {
  tipo: "OU";
  condicoes: Condicao[];
}

export interface CondicaoNao {
  tipo: "NAO";
  condicao: Condicao;
}

export type Condicao =
  | CondicaoIgualdade
  | CondicaoConjunto
  | CondicaoNumerica
  | CondicaoE
  | CondicaoOu
  | CondicaoNao;

// Construtores de conveniência, para os dados ficarem legíveis.
export const igual = (campo: NomeCampo, valor: string): Condicao => ({
  tipo: "igualdade",
  campo,
  operador: "=",
  valor,
});

export const diferente = (campo: NomeCampo, valor: string): Condicao => ({
  tipo: "igualdade",
  campo,
  operador: "!=",
  valor,
});

export const contem = (campo: NomeCampo, valor: string): Condicao => ({
  tipo: "conjunto",
  campo,
  operador: "contem",
  valor,
});

export const naoContem = (campo: NomeCampo, valor: string): Condicao => ({
  tipo: "conjunto",
  campo,
  operador: "nao_contem",
  valor,
});

export const numerica = (
  campo: NomeCampo,
  operador: OperadorNumerico,
  valor: number,
): Condicao => ({ tipo: "numerica", campo, operador, valor });

export const e = (...condicoes: Condicao[]): Condicao => ({
  tipo: "E",
  condicoes,
});

export const ou = (...condicoes: Condicao[]): Condicao => ({
  tipo: "OU",
  condicoes,
});

export const nao = (condicao: Condicao): Condicao => ({
  tipo: "NAO",
  condicao,
});

/** Condição sempre verdadeira — usada quando não há critério de indicação codificável (ex.: passo sempre presente, como a irrigação com soro fisiológico). */
export const sempre = (): Condicao => ({ tipo: "E", condicoes: [] });
