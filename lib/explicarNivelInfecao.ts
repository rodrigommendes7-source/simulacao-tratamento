import type { Exsudado, NivelInfecao, SinaisInfecaoInput } from "../tipos/variaveis";

/**
 * Não recalcula `nivel_infecao` (isso é algoritmo/nivelInfecao.ts) — só lista
 * quais dos sinais concretos que o utilizador marcou pertencem a cada grupo
 * do continuum IWII (covert/overt/propagação), para explicar a
 * recomendação na Consulta pontual sem duplicar a lógica de derivação.
 */
export interface ExplicacaoNivelInfecao {
  nivel: NivelInfecao;
  sinaisPropagacao: string[];
  sinaisOvert: string[];
  sinaisCovert: string[];
}

export function explicarNivelInfecao(
  sinais: SinaisInfecaoInput,
  exsudado: Exsudado,
  hipergranulacaoPresente: boolean,
  nivel: NivelInfecao,
): ExplicacaoNivelInfecao {
  const sinaisPropagacao: string[] = [];
  if (sinais.celulite) sinaisPropagacao.push("Celulite");
  if (sinais.linfangite) sinaisPropagacao.push("Linfangite");
  if (sinais.abcesso) sinaisPropagacao.push("Abcesso");
  if (sinais.febre) sinaisPropagacao.push("Febre");
  if (sinais.leucocitose) sinaisPropagacao.push("Leucocitose");

  const sinaisOvert: string[] = [];
  if (sinais.eritema !== "ausente") sinaisOvert.push(`Eritema (${sinais.eritema})`);
  if (sinais.calor_local) sinaisOvert.push("Calor local");
  if (sinais.edema_local) sinaisOvert.push("Edema local");
  if (exsudado.tipo.includes("purulento")) sinaisOvert.push("Exsudado purulento");

  const sinaisCovert: string[] = [];
  if (sinais.dor_aumentada) sinaisCovert.push("Dor aumentada");
  if (sinais.tecido_friavel) sinaisCovert.push("Tecido friável");
  if (sinais.odor !== "ausente") sinaisCovert.push(`Odor (${sinais.odor})`);
  if (sinais.atraso_cicatrizacao) sinaisCovert.push("Atraso de cicatrização");
  if (hipergranulacaoPresente) sinaisCovert.push("Hipergranulação (tipo_tecido_leito)");
  if (sinais.quebra_ferida_nova) sinaisCovert.push("Quebra de ferida nova");

  return { nivel, sinaisPropagacao, sinaisOvert, sinaisCovert };
}
