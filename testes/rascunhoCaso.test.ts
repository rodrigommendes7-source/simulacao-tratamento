import { beforeEach, describe, expect, it, vi } from "vitest";
import { decidirCaso } from "../algoritmo/motorDecisao";
import { TODOS_CASOS_TESTE } from "../dados/casosTeste";

/**
 * `lib/rascunhoCaso.ts` é "use client" e lê `window.localStorage`; o ambiente
 * de testes deste projeto é "node" (sem DOM), por isso simula-se aqui um
 * localStorage em memória, tal como já se faz em testes/consultas.test.ts.
 */
function instalarLocalStorageFalso() {
  const dados = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => (dados.has(k) ? dados.get(k)! : null),
      setItem: (k: string, v: string) => void dados.set(k, v),
      removeItem: (k: string) => void dados.delete(k),
      clear: () => dados.clear(),
    },
  });
  return dados;
}

const CASO = TODOS_CASOS_TESTE[0];

function rascunhoBase(versaoDados: string) {
  return {
    versaoDados,
    guardadoEm: new Date().toISOString(),
    fase: 2,
    tecidoAtivo: "esfacelo" as const,
    pins: [{ tipo: "esfacelo" as const, x: 0.4, y: 0.5 }],
    exsudadoVolume: "moderado" as const,
    exsudadoTipo: ["seroso" as const],
    bordos: ["aderentes_planos" as const],
    pele: ["integra" as const],
    nivelInfecaoProposto: "sem_sinais" as const,
    perguntado: { 0: true },
    categorias: ["desbridamento" as const],
    tecnicas: ["penso_simples_protetor"],
    medidas: { alivioPressao: true },
    justRespostas: { "tr:desbridamento": 1 },
    ordemOpcoes: { "tr:desbridamento": [2, 0, 1] },
  };
}

describe("lib/rascunhoCaso.ts", () => {
  let dados: Map<string, string>;
  beforeEach(() => {
    vi.resetModules();
    dados = instalarLocalStorageFalso();
  });

  it("não devolve nada quando não há rascunho guardado", async () => {
    const { lerRascunho } = await import("../lib/rascunhoCaso");
    expect(lerRascunho(CASO.id)).toBeNull();
  });

  it("guarda e lê de volta o estado todo, com os Set já convertidos", async () => {
    const { guardarRascunho, lerRascunho } = await import("../lib/rascunhoCaso");
    const r = rascunhoBase("abc123");
    guardarRascunho(CASO.id, r);
    expect(lerRascunho(CASO.id)).toEqual(r);
  });

  it("separa rascunhos por caso e por aluno", async () => {
    const { guardarRascunho, lerRascunho } = await import("../lib/rascunhoCaso");
    window.localStorage.setItem("sf_utilizador", "ana silva");
    guardarRascunho("caso_a", rascunhoBase("v1"));
    expect(lerRascunho("caso_b")).toBeNull(); // outro caso

    window.localStorage.setItem("sf_utilizador", "rui dias");
    expect(lerRascunho("caso_a")).toBeNull(); // outro aluno

    window.localStorage.setItem("sf_utilizador", "ana silva");
    expect(lerRascunho("caso_a")?.versaoDados).toBe("v1");
  });

  it("apagar deixa de devolver o rascunho", async () => {
    const { guardarRascunho, lerRascunho, apagarRascunho } = await import("../lib/rascunhoCaso");
    guardarRascunho(CASO.id, rascunhoBase("v1"));
    apagarRascunho(CASO.id);
    expect(lerRascunho(CASO.id)).toBeNull();
  });

  it("ignora conteúdo corrompido ou de forma inesperada em vez de rebentar", async () => {
    const { lerRascunho } = await import("../lib/rascunhoCaso");
    const { chaveDoAluno } = await import("../lib/armazenamento");
    const k = chaveDoAluno(`sf_rascunho_caso:${CASO.id}`);
    for (const lixo of ["{{{", '"texto"', "null", '{"semCamposEstruturais":1}']) {
      window.localStorage.setItem(k, lixo);
      expect(lerRascunho(CASO.id)).toBeNull();
    }
    expect(dados.size).toBeGreaterThan(0); // não apagou nada à socapa
  });

  describe("versão dos dados do caso", () => {
    it("é estável para o mesmo caso e muda quando a ficha clínica muda", async () => {
      const { versaoDadosDoCaso } = await import("../lib/rascunhoCaso");
      const decisao = decidirCaso(CASO.caso);
      const v1 = versaoDadosDoCaso(CASO.caso, decisao);
      expect(versaoDadosDoCaso(CASO.caso, decisao)).toBe(v1);

      const alterado = { ...CASO.caso, dor: CASO.caso.dor + 1 };
      expect(versaoDadosDoCaso(alterado, decisao)).not.toBe(v1);
    });

    it("muda também quando só a decisão do motor muda", async () => {
      // É o que apanha uma alteração das regras que não toca na ficha: uma
      // categoria que deixa de ser aplicável invalida escolhas do rascunho.
      const { versaoDadosDoCaso } = await import("../lib/rascunhoCaso");
      const decisao = decidirCaso(CASO.caso);
      const outraDecisao = {
        ...decisao,
        categoriasAplicaveis: decisao.categoriasAplicaveis.slice(1),
      };
      expect(versaoDadosDoCaso(CASO.caso, outraDecisao)).not.toBe(
        versaoDadosDoCaso(CASO.caso, decisao),
      );
    });

    it("distingue casos diferentes", async () => {
      const { versaoDadosDoCaso } = await import("../lib/rascunhoCaso");
      const vistas = new Set(
        TODOS_CASOS_TESTE.map((c) => versaoDadosDoCaso(c.caso, decidirCaso(c.caso))),
      );
      expect(vistas.size).toBe(TODOS_CASOS_TESTE.length);
    });
  });

  describe("rascunhoVazio", () => {
    it("considera vazio um caso aberto e não tocado", async () => {
      const { rascunhoVazio } = await import("../lib/rascunhoCaso");
      expect(
        rascunhoVazio({
          versaoDados: "v1",
          guardadoEm: "",
          fase: 1,
          tecidoAtivo: null,
          pins: [],
          exsudadoVolume: null,
          exsudadoTipo: [],
          bordos: [],
          pele: [],
          nivelInfecaoProposto: null,
          perguntado: {},
          categorias: [],
          tecnicas: [],
          medidas: {},
          justRespostas: {},
          ordemOpcoes: { "tr:desbridamento": [1, 0] },
        }),
      ).toBe(true);
    });

    it("qualquer progresso real conta como não vazio", async () => {
      const { rascunhoVazio } = await import("../lib/rascunhoCaso");
      const vazio = {
        versaoDados: "v1", guardadoEm: "", fase: 1, tecidoAtivo: null, pins: [],
        exsudadoVolume: null, exsudadoTipo: [], bordos: [], pele: [],
        nivelInfecaoProposto: null, perguntado: {}, categorias: [], tecnicas: [],
        medidas: {}, justRespostas: {}, ordemOpcoes: {},
      };
      const progressos = [
        { fase: 3 },
        { pins: [{ tipo: "esfacelo" as const, x: 0.1, y: 0.1 }] },
        { exsudadoVolume: "escasso" as const },
        { bordos: ["fibroticos" as const] },
        { categorias: ["desbridamento" as const] },
        { tecnicas: ["ligadura"] },
        { medidas: { alivioPressao: true } },
        { justRespostas: { "tr:desbridamento": 0 } },
        { perguntado: { 2: true } },
      ];
      for (const p of progressos) {
        expect(rascunhoVazio({ ...vazio, ...p })).toBe(false);
      }
    });

    it("medidas todas a false continuam a ser vazio", async () => {
      const { rascunhoVazio } = await import("../lib/rascunhoCaso");
      expect(
        rascunhoVazio({
          versaoDados: "v1", guardadoEm: "", fase: 1, tecidoAtivo: null, pins: [],
          exsudadoVolume: null, exsudadoTipo: [], bordos: [], pele: [],
          nivelInfecaoProposto: null, perguntado: {}, categorias: [], tecnicas: [],
          medidas: { alivioPressao: false }, justRespostas: {}, ordemOpcoes: {},
        }),
      ).toBe(true);
    });
  });
});
