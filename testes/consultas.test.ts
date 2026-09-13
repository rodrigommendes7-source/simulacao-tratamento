import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * lib/consultas.ts é "use client" e lê window.localStorage — o ambiente de
 * testes por omissão deste projeto é "node" (sem DOM), por isso simulamos
 * aqui um localStorage mínimo em memória, tal como o browser o exporia.
 */
function instalarLocalStorageFalso() {
  const armazenamento = new Map<string, string>();
  const localStorageFalso = {
    getItem: (chave: string) => (armazenamento.has(chave) ? armazenamento.get(chave)! : null),
    setItem: (chave: string, valor: string) => {
      armazenamento.set(chave, valor);
    },
    removeItem: (chave: string) => {
      armazenamento.delete(chave);
    },
    clear: () => armazenamento.clear(),
  };
  vi.stubGlobal("window", { localStorage: localStorageFalso });
  return localStorageFalso;
}

describe("lib/consultas.ts (histórico local de consultas pontuais)", () => {
  beforeEach(() => {
    vi.resetModules();
    instalarLocalStorageFalso();
  });

  it("começa vazio quando não há nada guardado", async () => {
    const { obterConsultas } = await import("../lib/consultas");
    expect(obterConsultas()).toEqual([]);
  });

  it("regista uma consulta e atribui id e data automaticamente", async () => {
    const { obterConsultas, registarConsulta } = await import("../lib/consultas");
    const entrada = {
      caso: { etiologia: "venosa" } as never,
      decisao: { nivelInfecao: "sem_sinais", categoriasAplicaveis: [], tratamentosValidos: {} } as never,
      tecnicas: [],
      causaTratada: { aplicavel: false } as never,
      portaoSistemico: { aplicavel: false } as never,
    };
    const guardada = registarConsulta(entrada);
    expect(guardada.id).toBeTruthy();
    expect(guardada.data).toBeTruthy();

    const todas = obterConsultas();
    expect(todas).toHaveLength(1);
    expect(todas[0].id).toBe(guardada.id);
  });

  it("acumula várias consultas em ordem de registo", async () => {
    const { obterConsultas, registarConsulta } = await import("../lib/consultas");
    const base = {
      caso: { etiologia: "venosa" } as never,
      decisao: { nivelInfecao: "sem_sinais", categoriasAplicaveis: [], tratamentosValidos: {} } as never,
      tecnicas: [],
      causaTratada: { aplicavel: false } as never,
      portaoSistemico: { aplicavel: false } as never,
    };
    registarConsulta(base);
    registarConsulta({ ...base, caso: { etiologia: "pressao" } as never });
    const todas = obterConsultas();
    expect(todas).toHaveLength(2);
    expect(todas[0].caso.etiologia).toBe("venosa");
    expect(todas[1].caso.etiologia).toBe("pressao");
  });

  it("cada consulta guardada preserva o snapshot completo passado (decisão incluída)", async () => {
    const { obterConsultas, registarConsulta } = await import("../lib/consultas");
    const decisaoSnapshot = { nivelInfecao: "infecao_local_overt", categoriasAplicaveis: ["antimicrobianos"], tratamentosValidos: {} } as never;
    registarConsulta({
      caso: { etiologia: "venosa" } as never,
      decisao: decisaoSnapshot,
      tecnicas: [{ tecnicaId: "penso_rapido", esperada: false, selecionada: false }],
      causaTratada: { aplicavel: true, itemPresente: false, tetoPontuacao: 40 } as never,
      portaoSistemico: { aplicavel: false } as never,
    });
    const [guardada] = obterConsultas();
    expect(guardada.decisao).toEqual(decisaoSnapshot);
    expect(guardada.causaTratada).toEqual({ aplicavel: true, itemPresente: false, tetoPontuacao: 40 });
  });

  it("limparConsultas esvazia o histórico", async () => {
    const { obterConsultas, registarConsulta, limparConsultas } = await import("../lib/consultas");
    registarConsulta({
      caso: { etiologia: "venosa" } as never,
      decisao: { nivelInfecao: "sem_sinais", categoriasAplicaveis: [], tratamentosValidos: {} } as never,
      tecnicas: [],
      causaTratada: { aplicavel: false } as never,
      portaoSistemico: { aplicavel: false } as never,
    });
    expect(obterConsultas()).toHaveLength(1);
    limparConsultas();
    expect(obterConsultas()).toEqual([]);
  });
});
