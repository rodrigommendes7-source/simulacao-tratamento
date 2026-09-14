import { TODAS_TECNICAS } from "../dados/tecnicasAplicacao";
import type { ContextoAvaliacao } from "./avaliarCondicao";
import { PESO_FALSO_POSITIVO } from "./penalizacao";
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

/**
 * Pontuação proporcional das técnicas — mesmo princípio das categorias de
 * tratamento em algoritmo/avaliarResposta.ts, incluindo a metade de precisão:
 * recall sobre as técnicas esperadas, menos `PESO_FALSO_POSITIVO` unidades por
 * cada técnica selecionada que não era esperada, com piso em 0.
 *
 * Só com recall, escolher as 6 técnicas dava 100 em qualquer caso — e o ecrã
 * até convida a escolher mais do que uma ("cada técnica é avaliada pelas suas
 * próprias condições"), o que tornava "escolher todas" a estratégia
 * dominante. 100 continua a ser dado por vacuidade quando nenhuma técnica é
 * esperada e nenhuma foi escolhida.
 */
export function pontuacaoTecnicas(correspondencias: CorrespondenciaTecnica[]): number {
  const esperadas = correspondencias.filter((c) => c.esperada);
  const corretas = esperadas.filter((c) => c.selecionada).length;
  const falsosPositivos = correspondencias.filter((c) => !c.esperada && c.selecionada).length;
  const desconto = falsosPositivos * PESO_FALSO_POSITIVO;

  if (esperadas.length === 0) {
    // Vacuidade: nada era esperado, por isso não há denominador natural e a
    // unidade vale os 100 pontos todos. Não escolher nada continua a valer
    // 100; escolher à mesma custa meia unidade por técnica, para o caso sem
    // técnica indicada não ser terreno livre.
    return Math.max(0, 100 - desconto * 100);
  }
  return Math.max(0, ((corretas - desconto) / esperadas.length) * 100);
}
