import { beforeEach, describe, expect, it, vi } from "vitest";
import { decidirCaso } from "../algoritmo/motorDecisao";
import { TODOS_CASOS_TESTE } from "../dados/casosTeste";

/**
 * `lib/rascunhoCaso.ts` deixou de escrever no `localStorage`: os rascunhos
 * passaram para a base de dados, por conta, através de
 * `/api/rascunhos/[casoId]`. A separação por aluno deixou de ser um problema
 * do cliente — é a chave primária `(utilizador_id, caso_id)` que a garante, e
 * o cliente nem sabe quem está em sessão.
 *
 * O que estes testes fixam do lado do cliente: a rota chamada, o adiamento da
 * gravação (que evita um pedido por cada pin colocado) e o facto de apagar
 * cancelar uma gravação ainda por sair.
 */
interface ChamadaFetch {
  url: string;
  opcoes: RequestInit;
}

function instalarFetchFalso(corpo: unknown = {}) {
  const chamadas: ChamadaFetch[] = [];
  vi.stubGlobal("fetch", (url: string, opcoes: RequestInit = {}) => {
    chamadas.push({ url, opcoes });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(corpo) } as Response);
  });
  return chamadas;
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
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("não devolve nada quando a conta não tem rascunho deste caso", async () => {
    instalarFetchFalso({ rascunho: null });
    const { lerRascunho } = await import("../lib/rascunhoCaso");
    expect(await lerRascunho(CASO.id)).toBeNull();
  });

  it("lê o rascunho da rota do caso", async () => {
    const r = rascunhoBase("abc123");
    const chamadas = instalarFetchFalso({ rascunho: r });

    const { lerRascunho } = await import("../lib/rascunhoCaso");
    expect(await lerRascunho(CASO.id)).toEqual(r);
    expect(chamadas[0].url).toBe(`/api/rascunhos/${encodeURIComponent(CASO.id)}`);
  });

  it("ignora conteúdo sem os campos estruturais em vez de carregar um ecrã meio vazio", async () => {
    for (const lixo of [null, "texto", { semCamposEstruturais: 1 }, { versaoDados: "v1" }]) {
      vi.resetModules();
      instalarFetchFalso({ rascunho: lixo });
      const { lerRascunho } = await import("../lib/rascunhoCaso");
      expect(await lerRascunho(CASO.id)).toBeNull();
    }
  });

  it("não deixa uma falha de rede partir o ecrã — começa o caso do zero", async () => {
    // Perder o rascunho é perder conveniência, não dados submetidos.
    vi.stubGlobal("fetch", () => Promise.reject(new Error("sem rede")));
    const { lerRascunho } = await import("../lib/rascunhoCaso");
    expect(await lerRascunho(CASO.id)).toBeNull();
  });

  it("adia a gravação e junta as alterações seguidas num só pedido", async () => {
    // O ecrã de resolução chama guardarRascunho a cada alteração de estado.
    // Sem o adiamento, arrastar um pin pelo mapa da ferida dispararia dezenas
    // de pedidos.
    vi.useFakeTimers();
    const chamadas = instalarFetchFalso();
    const { guardarRascunho } = await import("../lib/rascunhoCaso");

    guardarRascunho(CASO.id, rascunhoBase("v1"));
    guardarRascunho(CASO.id, rascunhoBase("v2"));
    guardarRascunho(CASO.id, rascunhoBase("v3"));
    expect(chamadas).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(1000);
    expect(chamadas).toHaveLength(1);
    expect(chamadas[0].opcoes.method).toBe("PUT");
    expect(JSON.parse(chamadas[0].opcoes.body as string).rascunho.versaoDados).toBe("v3");
  });

  it("apagar cancela uma gravação ainda por sair", async () => {
    // Sem isto, a gravação adiada chegava ao servidor depois do apagar e
    // ressuscitava o rascunho que o aluno acabou de dispensar.
    vi.useFakeTimers();
    const chamadas = instalarFetchFalso();
    const { guardarRascunho, apagarRascunho } = await import("../lib/rascunhoCaso");

    guardarRascunho(CASO.id, rascunhoBase("v1"));
    apagarRascunho(CASO.id);
    await vi.advanceTimersByTimeAsync(1000);

    expect(chamadas.map((c) => c.opcoes.method)).toEqual(["DELETE"]);
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
