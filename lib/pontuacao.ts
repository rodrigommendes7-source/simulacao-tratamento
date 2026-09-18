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

/**
 * Limiar de bom desempenho, em percentagem.
 *
 * É o valor a partir do qual a interface trata uma pontuação como boa: a
 * frase de abertura do ecrã principal e a cor da barra de cada categoria.
 * Estava repetido em código, sem nome e sem justificação em lado nenhum —
 * dois números 70 soltos que ninguém sabia se eram a mesma decisão.
 *
 * É uma decisão clínica/pedagógica: **não alterar sem validação do Rodrigo.**
 *
 * Nota: o ecrã de Estatísticas usa este mesmo 70 e ainda um 50 para o estado
 * intermédio (`corPontuacao` em app/estatisticas/page.tsx). Esse segundo
 * limiar nunca foi declarado como decisão e fica por rever num lote próprio —
 * a conversa aí é sobre o que os dois limiares significam, não sobre onde
 * vivem as constantes.
 */
export const LIMIAR_BOM_DESEMPENHO = 70;

/** Arredonda uma pontuação para inteiro. Preserva null (usado quando uma pontuação não se aplica). */
export function arredondarPontuacao(valor: number): number;
export function arredondarPontuacao(valor: number | null): number | null;
export function arredondarPontuacao(valor: number | null): number | null {
  return valor === null ? null : Math.round(valor);
}
