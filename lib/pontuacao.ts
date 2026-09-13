/**
 * Arredondamento único de pontuações.
 *
 * O motor calcula percentagens em vírgula flutuante (médias de componentes,
 * recall proporcional), mas ao aluno nunca se mostra uma casa decimal: "80",
 * nunca "80.5". Em vez de espalhar `Math.round` por cada sítio que imprime um
 * número — o que já tinha deixado passar pelo menos um caso (a etiqueta
 * "Resolvido · 82.5" na lista de casos) — arredonda-se **na origem**, quando o
 * resultado é guardado no histórico e quando as estatísticas o agregam.
 * Assim qualquer ecrã que leia estes dados mostra inteiros por construção.
 */

/** Arredonda uma pontuação para inteiro. Preserva null (usado quando uma pontuação não se aplica). */
export function arredondarPontuacao(valor: number): number;
export function arredondarPontuacao(valor: number | null): number | null;
export function arredondarPontuacao(valor: number | null): number | null {
  return valor === null ? null : Math.round(valor);
}
