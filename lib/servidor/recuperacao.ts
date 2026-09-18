import "server-only";

/**
 * Código de recuperação — a única forma de repor uma palavra-passe perdida.
 *
 * Como não há email (decisão deliberada de privacidade, não uma omissão),
 * não existe "enviar link de recuperação". O código é gerado pelo servidor no
 * registo, mostrado **uma única vez**, e guardado em Argon2id como se fosse
 * uma palavra-passe — porque é exatamente isso que é.
 *
 * Utilização única: quem o usar repõe a palavra-passe e recebe um código
 * novo, também mostrado uma só vez. Um código de recuperação que continuasse
 * válido depois de usado seria uma segunda palavra-passe permanente, escrita
 * num papel.
 */
import { randomInt } from "node:crypto";

/**
 * Alfabeto sem caracteres que se confundem ao ler em voz alta ou ao copiar de
 * um papel: sem O/0, I/1/L, S/5, B/8. O código vai ser escrito à mão por
 * alunos — a ambiguidade custava mais do que os poucos bits que se perdem.
 */
const ALFABETO = "ACDEFGHJKMNPQRTUVWXY2346789";
const COMPRIMENTO = 12;

/**
 * ~57 bits de entropia (27^12). Muito acima do que a limitação de tentativas
 * precisaria de aguentar, e é de graça.
 *
 * `randomInt` em vez de `Math.random`: é o gerador criptográfico, e o intervalo
 * é amostrado sem enviesamento pelo módulo.
 */
export function gerarCodigoRecuperacao(): string {
  let codigo = "";
  for (let i = 0; i < COMPRIMENTO; i++) codigo += ALFABETO[randomInt(ALFABETO.length)];
  // Em grupos de 4, para ser legível: "ACDE-FGHJ-KMNP".
  return (codigo.match(/.{1,4}/g) ?? []).join("-");
}

/**
 * Forma canónica para comparação: sem hífenes, sem espaços, em maiúsculas.
 * O aluno copia o código de onde o guardou e não deve falhar a entrada por
 * ter escrito os hífenes ao contrário ou em minúsculas.
 */
export function normalizarCodigoRecuperacao(codigo: string): string {
  return codigo.replace(/[\s-]/g, "").toUpperCase();
}
