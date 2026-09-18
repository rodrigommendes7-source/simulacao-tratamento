import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ConsultaHistorico } from "../lib/consultas";

/**
 * `lib/consultas.ts` deixou de escrever no `localStorage` e passou a falar com
 * `/api/consultas`. Estes testes simulam o `fetch` e verificam o contrato do
 * lado do cliente: que rota é chamada, com que método, e o que se faz com a
 * resposta.
 *
 * O que **não** se testa aqui é a gravação em si — isso é a rota de API e a
 * base de dados, e simular um Postgres para o afirmar não provaria nada.
 */
interface ChamadaFetch {
  url: string;
  opcoes: RequestInit;
}

function instalarFetchFalso(respostas: Record<string, unknown>) {
  const chamadas: ChamadaFetch[] = [];
  vi.stubGlobal("fetch", (url: string, opcoes: RequestInit = {}) => {
    chamadas.push({ url, opcoes });
    const chave = `${opcoes.method ?? "GET"} ${url}`;
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(respostas[chave] ?? {}),
    } as Response);
  });
  return chamadas;
}

const ENTRADA = {
  caso: { etiologia: "venosa" },
  decisao: { categoriasAplicaveis: [] },
  tecnicas: [],
  causaTratada: {},
  portaoSistemico: {},
} as unknown as Omit<ConsultaHistorico, "id" | "data">;

describe("lib/consultas.ts (histórico de consultas na conta)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("lê as consultas da rota, tal como o servidor as devolve", async () => {
    const guardada = { ...ENTRADA, id: "abc", data: "2026-01-01T10:00:00.000Z" };
    instalarFetchFalso({ "GET /api/consultas": { consultas: [guardada] } });

    const { obterConsultas } = await import("../lib/consultas");
    expect(await obterConsultas()).toEqual([guardada]);
  });

  it("começa vazio quando a conta ainda não tem consultas", async () => {
    instalarFetchFalso({ "GET /api/consultas": { consultas: [] } });
    const { obterConsultas } = await import("../lib/consultas");
    expect(await obterConsultas()).toEqual([]);
  });

  it("grava com POST e devolve a consulta com o id que o servidor atribuiu", async () => {
    // O id e a data vêm da base de dados, não do cliente: é a base de dados
    // que os atribui, e é por eles que a interface identifica a consulta.
    const criada = { ...ENTRADA, id: "gerado-pelo-servidor", data: "2026-01-01T10:00:00.000Z" };
    const chamadas = instalarFetchFalso({ "POST /api/consultas": { consulta: criada } });

    const { registarConsulta } = await import("../lib/consultas");
    const resultado = await registarConsulta(ENTRADA);

    expect(resultado).toEqual(criada);
    expect(chamadas[0].url).toBe("/api/consultas");
    expect(chamadas[0].opcoes.method).toBe("POST");
    expect(JSON.parse(chamadas[0].opcoes.body as string)).toEqual({ entrada: ENTRADA });
  });

  it("envia o instantâneo completo, sem o resumir", async () => {
    // Reabrir uma consulta antiga tem de mostrar o que foi calculado nessa
    // altura. Se o cliente só enviasse parte, não havia como o reconstruir.
    const chamadas = instalarFetchFalso({ "POST /api/consultas": { consulta: { ...ENTRADA, id: "x", data: "d" } } });
    const { registarConsulta } = await import("../lib/consultas");
    await registarConsulta(ENTRADA);

    const enviado = JSON.parse(chamadas[0].opcoes.body as string).entrada;
    expect(Object.keys(enviado).sort()).toEqual(Object.keys(ENTRADA).sort());
  });

  it("limparConsultas usa DELETE na mesma rota", async () => {
    const chamadas = instalarFetchFalso({ "DELETE /api/consultas": { ok: true } });
    const { limparConsultas } = await import("../lib/consultas");
    await limparConsultas();

    expect(chamadas[0].url).toBe("/api/consultas");
    expect(chamadas[0].opcoes.method).toBe("DELETE");
  });

  it("envia o cookie de sessão em todos os pedidos", async () => {
    // O cookie é httpOnly e é o browser que o envia — mas só se o pedido for
    // feito com credenciais. Sem isto, todos os pedidos davam 401.
    const chamadas = instalarFetchFalso({ "GET /api/consultas": { consultas: [] } });
    const { obterConsultas } = await import("../lib/consultas");
    await obterConsultas();

    expect(chamadas[0].opcoes.credentials).toBe("same-origin");
  });
});
