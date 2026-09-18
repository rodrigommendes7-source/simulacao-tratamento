import { describe, expect, it } from "vitest";
import { escolherProximoCaso } from "../lib/proximoCaso";
import { TODOS_CASOS_TESTE, type CasoTeste } from "../dados/casosTeste";
import type { EntradaHistorico } from "../tipos/historico";
import type { Etiologia } from "../tipos/variaveis";

/**
 * A ordem de preferência do "caso aleatório" do ecrã principal.
 *
 * O cartão promete "uma etiologia que ainda não resolveu". Antes, o filtro era
 * por `id` de caso — e como há mais do que um caso por etiologia, um aluno
 * podia receber uma segunda ferida venosa anunciada como etiologia nova. É
 * essa correspondência entre o que o cartão diz e o que faz que estes testes
 * fixam.
 *
 * Sorteio sempre determinístico (`() => 0`, o primeiro candidato): o que
 * interessa verificar é **de que conjunto** sai a escolha, não o acaso.
 */
const primeiro = () => 0;

function resolvido(casoId: string, etiologia: Etiologia): EntradaHistorico {
  return { casoId, etiologia, titulo: casoId, data: new Date().toISOString(), pontuacaoFinal: 80 } as EntradaHistorico;
}

function caso(id: string, etiologia: Etiologia): CasoTeste {
  return { id, titulo: id, caso: { etiologia } } as CasoTeste;
}

const CASOS = [
  caso("a1", "pressao"),
  caso("b1", "venosa"),
  caso("b2", "venosa"),
  caso("c1", "cirurgica"),
];

describe("escolherProximoCaso", () => {
  it("sem histórico, escolhe de entre todos", () => {
    expect(escolherProximoCaso(CASOS, [], primeiro)?.id).toBe("a1");
  });

  it("prefere uma etiologia ainda não coberta", () => {
    const escolhido = escolherProximoCaso(CASOS, [resolvido("a1", "pressao")], primeiro);
    expect(escolhido?.caso.etiologia).not.toBe("pressao");
  });

  it("não oferece um segundo caso da mesma etiologia como se fosse etiologia nova", () => {
    // É o bug que este lote corrigiu: "b2" é venosa, tal como "b1", que já foi
    // resolvido. Com o filtro por id, "b2" era elegível e aparecia sob a
    // promessa "uma etiologia que ainda não resolveu".
    const historico = [resolvido("b1", "venosa")];
    for (let i = 0; i < CASOS.length; i++) {
      const escolhido = escolherProximoCaso(CASOS, historico, () => i % CASOS.length);
      expect(escolhido?.caso.etiologia).not.toBe("venosa");
    }
  });

  it("com todas as etiologias cobertas, recua para casos por resolver", () => {
    const historico = [
      resolvido("a1", "pressao"),
      resolvido("b1", "venosa"),
      resolvido("c1", "cirurgica"),
    ];
    // Nenhuma etiologia nova resta, mas "b2" nunca foi resolvido.
    expect(escolherProximoCaso(CASOS, historico, primeiro)?.id).toBe("b2");
  });

  it("com tudo resolvido, recua para o conjunto completo em vez de não dar nada", () => {
    const historico = CASOS.map((c) => resolvido(c.id, c.caso.etiologia));
    const escolhido = escolherProximoCaso(CASOS, historico, primeiro);
    expect(escolhido).not.toBeNull();
    expect(CASOS.map((c) => c.id)).toContain(escolhido?.id);
  });

  it("não rebenta sem casos nenhuns", () => {
    expect(escolherProximoCaso([], [], primeiro)).toBeNull();
  });

  it("não altera o array de casos que recebe", () => {
    const copia = [...CASOS];
    escolherProximoCaso(CASOS, [resolvido("a1", "pressao")], primeiro);
    expect(CASOS).toEqual(copia);
  });

  describe("com os casos reais do projeto", () => {
    it("a cobertura etiológica fecha-se antes de os casos acabarem", () => {
      // 5 casos em 4 etiologias: ao quarto caso resolvido já não há etiologia
      // nova e é o degrau de recuo que passa a escolher. Não é hipótese
      // distante — acontece a qualquer aluno que resolva quatro casos.
      const etiologias = new Set(TODOS_CASOS_TESTE.map((c) => c.caso.etiologia));
      expect(etiologias.size).toBeLessThan(TODOS_CASOS_TESTE.length);
    });

    it("resolvida uma etiologia, nenhum caso dela é recomendado como nova", () => {
      const venosos = TODOS_CASOS_TESTE.filter((c) => c.caso.etiologia === "venosa");
      expect(venosos.length).toBeGreaterThan(1); // se deixar de ser verdade, este teste perde o sentido
      const historico = [resolvido(venosos[0].id, "venosa")];
      for (let i = 0; i < TODOS_CASOS_TESTE.length; i++) {
        expect(escolherProximoCaso(TODOS_CASOS_TESTE, historico, () => i)?.caso.etiologia).not.toBe("venosa");
      }
    });
  });
});
