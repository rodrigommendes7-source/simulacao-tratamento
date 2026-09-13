import { TODAS_TECNICAS } from "../dados/tecnicasAplicacao";
import type { ContextoAvaliacao } from "./avaliarCondicao";
import { tecnicaValida } from "./tecnicaValida";

/**
 * Correspondência de uma técnica de aplicação (tecnicas-aplicacao.md) para
 * um caso concreto — mesmo padrão de `CorrespondenciaCategoria`
 * (tipos/resultado.ts) usado para as categorias de tratamento, mas sobre as
 * 6 técnicas. Ao contrário das categorias (só as aplicáveis aparecem em
 * `correspondenciaPorCategoria`), aqui devolvemos sempre as 6, com
 * `esperada` a indicar se é a técnica indicada para o caso — isto permite
 * às estatísticas (lib/estatisticas.ts) agregar a taxa de acerto por
 * técnica across casos sem perder as técnicas nunca esperadas num caso
 * concreto.
 */
export interface CorrespondenciaTecnica {
  tecnicaId: string;
  esperada: boolean;
  selecionada: boolean;
}

export function avaliarTecnicas(
  tecnicasSelecionadas: string[],
  contexto: ContextoAvaliacao,
): CorrespondenciaTecnica[] {
  return TODAS_TECNICAS.map((t) => ({
    tecnicaId: t.id,
    esperada: tecnicaValida(t, contexto),
    selecionada: tecnicasSelecionadas.includes(t.id),
  }));
}

/** Pontuação proporcional (recall sobre as técnicas esperadas) — mesmo princípio das categorias de tratamento em algoritmo/avaliarResposta.ts. 100 quando nenhuma técnica é esperada (vacuidade). */
export function pontuacaoTecnicas(correspondencias: CorrespondenciaTecnica[]): number {
  const esperadas = correspondencias.filter((c) => c.esperada);
  if (esperadas.length === 0) return 100;
  const corretas = esperadas.filter((c) => c.selecionada).length;
  return (corretas / esperadas.length) * 100;
}
