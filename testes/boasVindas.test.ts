import { describe, expect, it } from "vitest";
import { textoBoasVindas } from "../lib/boasVindas";
import { LIMIAR_BOM_DESEMPENHO } from "../lib/pontuacao";
import type { EntradaHistorico } from "../tipos/historico";

/**
 * O tom do ecrã principal conforme o que o aluno já resolveu.
 *
 * Quem se registava era recebido com "Bem-vindo(a) de volta", "0 caso(s)
 * resolvido(s)", "Continue a praticar" e uma pontuação média de "0%" — frases
 * que pressupõem um passado inexistente e um número que se lê como zero de
 * aproveitamento em vez de ausência de dados. São estes textos exatos que
 * estes testes fixam.
 */
function resolvido(casoId: string): EntradaHistorico {
  return { casoId, titulo: casoId, etiologia: "venosa", data: new Date().toISOString(), pontuacaoFinal: 80 } as EntradaHistorico;
}

describe("textoBoasVindas", () => {
  describe("sem histórico", () => {
    const b = textoBoasVindas([], 0);

    it("não diz 'de volta' a quem chega agora", () => {
      expect(b.etiqueta).toBe("Bem-vindo(a)");
    });

    it("convida a começar em vez de anunciar zero casos", () => {
      expect(b.titulo).toEqual(["Comece pelo primeiro caso."]);
      expect(b.titulo.join(" ")).not.toContain("0 caso");
      expect(b.titulo.join(" ")).not.toContain("Continue a praticar");
    });

    it("esconde a pontuação média", () => {
      // "0%" lê-se como zero de aproveitamento, não como ausência de dados.
      expect(b.mostrarMedia).toBe(false);
    });

    it("o cartão do caso aleatório convida a começar", () => {
      expect(b.subtituloCasoAleatorio).toBe("Comece por aqui");
    });
  });

  describe("com exatamente um caso", () => {
    // Estado que vai ser comum: o test drive previsto traz o aluno para aqui
    // com um caso resolvido.
    const b = textoBoasVindas([resolvido("a1")], 80);

    it("ainda não é um regresso", () => {
      expect(b.etiqueta).toBe("Bem-vindo(a)");
    });

    it("conta o caso e aponta ao seguinte", () => {
      expect(b.titulo).toEqual(["1 caso resolvido.", "Continue pelo próximo."]);
    });

    it("já mostra a pontuação média", () => {
      expect(b.mostrarMedia).toBe(true);
    });
  });

  describe("com dois ou mais casos", () => {
    const historico = [resolvido("a1"), resolvido("b1")];

    it("volta a ser um regresso", () => {
      expect(textoBoasVindas(historico, 80).etiqueta).toBe("Bem-vindo(a) de volta");
    });

    it("elogia acima do limiar e encoraja abaixo dele", () => {
      expect(textoBoasVindas(historico, LIMIAR_BOM_DESEMPENHO).titulo[1]).toBe("Bom desempenho até agora.");
      expect(textoBoasVindas(historico, LIMIAR_BOM_DESEMPENHO - 1).titulo[1]).toBe("Continue a praticar.");
    });

    it("conta casos distintos, não submissões", () => {
      // Resolver o mesmo caso duas vezes não são dois casos resolvidos.
      const repetido = [resolvido("a1"), resolvido("a1")];
      expect(textoBoasVindas(repetido, 80).titulo[0]).toBe("1 caso resolvido.");
      expect(textoBoasVindas(historico, 80).titulo[0]).toBe("2 caso(s) resolvido(s).");
    });
  });
});
