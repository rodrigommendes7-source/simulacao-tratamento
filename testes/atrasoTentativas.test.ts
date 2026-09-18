import { describe, expect, it } from "vitest";
import { ATRASO_MAXIMO_MS, LIMIAR_ATRASO, atrasoParaFalhas } from "../lib/servidor/atrasoTentativas";

/**
 * A escala do atraso progressivo que substituiu o bloqueio de conta.
 *
 * É o único pedaço desta lógica que se testa sem base de dados — e é o que
 * interessa fixar, porque é aqui que se decide quanto custa errar. O resto
 * (o incremento, a expiração) é SQL e é verificado contra um PostgreSQL a
 * sério no ensaio de fluxo completo.
 */
describe("atrasoParaFalhas", () => {
  it("não cobra nada pelas primeiras falhas", () => {
    // Enganar-se uma ou duas vezes a escrever um PIN é normal. Se isso já
    // custasse tempo, o atraso deixava de distinguir engano de ataque.
    expect(atrasoParaFalhas(0)).toBe(0);
    expect(atrasoParaFalhas(1)).toBe(0);
    expect(atrasoParaFalhas(2)).toBe(0);
  });

  it("começa a atrasar a partir da terceira falha", () => {
    expect(atrasoParaFalhas(LIMIAR_ATRASO)).toBeGreaterThan(0);
    expect(atrasoParaFalhas(LIMIAR_ATRASO - 1)).toBe(0);
  });

  it("cresce a cada falha seguida", () => {
    const escala = [3, 4, 5].map(atrasoParaFalhas);
    expect(escala).toEqual([500, 1000, 2000]);
    for (let i = 1; i < escala.length; i++) expect(escala[i]).toBeGreaterThan(escala[i - 1]);
  });

  it("nunca passa do teto de 5 segundos", () => {
    // O teto existe para o atraso não se tornar, na prática, um bloqueio: há
    // sempre um tempo de espera finito ao fim do qual a pessoa entra.
    for (const falhas of [6, 10, 50, 1000]) {
      expect(atrasoParaFalhas(falhas)).toBe(ATRASO_MAXIMO_MS);
    }
    expect(ATRASO_MAXIMO_MS).toBe(5_000);
  });

  it("é monótona — mais falhas nunca dão menos espera", () => {
    for (let n = 1; n <= 30; n++) {
      expect(atrasoParaFalhas(n)).toBeGreaterThanOrEqual(atrasoParaFalhas(n - 1));
    }
  });

  it("aguenta valores inesperados sem devolver lixo", () => {
    expect(atrasoParaFalhas(-1)).toBe(0);
  });
});
