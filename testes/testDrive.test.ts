import { beforeEach, describe, expect, it, vi } from "vitest";
import { CASO_TEST_DRIVE } from "../lib/testDrive";
import type { EntradaHistorico } from "../tipos/historico";

/**
 * A gaveta onde a tentativa do test drive espera pela decisão de se registar.
 *
 * O que interessa fixar aqui é sobretudo o que ela **recusa**: só um caso, só
 * uma tentativa, e nada que não venha com a forma certa. Quem lê isto vai a
 * seguir escrever no histórico de uma conta — não pode confiar no conteúdo só
 * porque veio da gaveta certa.
 */
function instalarSessionStorageFalso() {
  const dados = new Map<string, string>();
  vi.stubGlobal("window", {
    sessionStorage: {
      getItem: (c: string) => (dados.has(c) ? dados.get(c)! : null),
      setItem: (c: string, v: string) => void dados.set(c, v),
      removeItem: (c: string) => void dados.delete(c),
      clear: () => dados.clear(),
    },
  });
  return dados;
}

function entrada(overrides: Partial<EntradaHistorico> = {}): EntradaHistorico {
  return {
    casoId: CASO_TEST_DRIVE,
    titulo: "Deiscência cirúrgica",
    etiologia: "cirurgica",
    data: new Date().toISOString(),
    pontuacaoFinal: 78,
    correspondenciaTratamento: [
      { categoria: "limpeza_irrigacao", idsEsperados: ["a"], idsSelecionados: ["a"], idsCorretos: ["a"], pontuacaoPercentual: 100 },
    ],
    correspondenciaTecnicas: [],
    correspondenciaJustificacoes: [],
    ...overrides,
  } as EntradaHistorico;
}

describe("tentativa do test drive", () => {
  let dados: Map<string, string>;

  beforeEach(() => {
    vi.resetModules();
    dados = instalarSessionStorageFalso();
  });

  it("guarda e devolve a tentativa inteira", async () => {
    const { guardarTentativa, lerTentativa } = await import("../lib/testDrive");
    const e = entrada();
    guardarTentativa(e);
    // Tem de voltar intacta: é isto que vai ser gravado na conta nova, e o
    // resultado tem de ficar indistinguível de um resolvido com sessão.
    expect(lerTentativa()).toEqual(e);
  });

  it("preserva a pontuação por categoria", async () => {
    const { guardarTentativa, lerTentativa } = await import("../lib/testDrive");
    guardarTentativa(entrada());
    expect(lerTentativa()?.correspondenciaTratamento[0].pontuacaoPercentual).toBe(100);
  });

  it("começa vazia", async () => {
    const { lerTentativa } = await import("../lib/testDrive");
    expect(lerTentativa()).toBeNull();
  });

  it("guarda uma só tentativa — a última substitui a anterior", async () => {
    const { guardarTentativa, lerTentativa } = await import("../lib/testDrive");
    guardarTentativa(entrada({ pontuacaoFinal: 40 }));
    guardarTentativa(entrada({ pontuacaoFinal: 90 }));
    expect(lerTentativa()?.pontuacaoFinal).toBe(90);
    expect(dados.size).toBe(1);
  });

  it("recusa um caso que não seja o do test drive", async () => {
    // Esta gaveta serve um caso só. Aceitar outro abria a porta a usá-la como
    // armazenamento geral de resultados sem conta.
    const { guardarTentativa, lerTentativa } = await import("../lib/testDrive");
    guardarTentativa(entrada({ casoId: "caso_1_lesao_pressao" }));
    expect(lerTentativa()).toBeNull();
    expect(dados.size).toBe(0);
  });

  it("limpar esquece a tentativa", async () => {
    const { guardarTentativa, lerTentativa, limparTentativa } = await import("../lib/testDrive");
    guardarTentativa(entrada());
    limparTentativa();
    expect(lerTentativa()).toBeNull();
  });

  describe("conteúdo que não é de confiança", () => {
    it("ignora lixo, truncados e formas inesperadas", async () => {
      const { lerTentativa } = await import("../lib/testDrive");
      const validos = [
        "{{{",
        '"texto"',
        "null",
        JSON.stringify({ entrada: null }),
        JSON.stringify({ entrada: { casoId: CASO_TEST_DRIVE } }), // sem pontuação
        JSON.stringify({ entrada: { casoId: "outro_caso", pontuacaoFinal: 80, correspondenciaTratamento: [] } }),
        JSON.stringify({ entrada: { casoId: CASO_TEST_DRIVE, pontuacaoFinal: "80", correspondenciaTratamento: [] } }),
        JSON.stringify({ entrada: { casoId: CASO_TEST_DRIVE, pontuacaoFinal: 80 } }), // sem categorias
      ];
      for (const lixo of validos) {
        dados.set("sf_tentativa", lixo);
        expect(lerTentativa()).toBeNull();
      }
    });

    it("recusa conteúdo acima do teto de tamanho", async () => {
      const { lerTentativa } = await import("../lib/testDrive");
      dados.set("sf_tentativa", "x".repeat(64 * 1024 + 1));
      expect(lerTentativa()).toBeNull();
    });

    it("não guarda uma entrada absurdamente grande", async () => {
      const { guardarTentativa, lerTentativa } = await import("../lib/testDrive");
      guardarTentativa(entrada({ titulo: "x".repeat(100 * 1024) }));
      expect(lerTentativa()).toBeNull();
    });
  });

  it("aguenta armazenamento bloqueado sem rebentar", async () => {
    // Navegação privada ou política do browser. A pessoa vê o resultado na
    // mesma; só não o poderá migrar.
    vi.stubGlobal("window", {
      get sessionStorage(): Storage {
        throw new Error("armazenamento bloqueado");
      },
    });
    const { guardarTentativa, lerTentativa, limparTentativa } = await import("../lib/testDrive");
    expect(() => guardarTentativa(entrada())).not.toThrow();
    expect(() => limparTentativa()).not.toThrow();
    expect(lerTentativa()).toBeNull();
  });

  it("não usa localStorage — a tentativa morre com o separador", async () => {
    // Se isto passasse a localStorage, passaria a haver "recupera a tua
    // tentativa de ontem", que é exatamente o que foi excluído.
    const { guardarTentativa } = await import("../lib/testDrive");
    const local = new Map<string, string>();
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: (c: string) => dados.get(c) ?? null,
        setItem: (c: string, v: string) => void dados.set(c, v),
        removeItem: (c: string) => void dados.delete(c),
      },
      localStorage: {
        getItem: () => null,
        setItem: (c: string, v: string) => void local.set(c, v),
        removeItem: () => {},
      },
    });
    guardarTentativa(entrada());
    expect(local.size).toBe(0);
    expect(dados.size).toBe(1);
  });
});
