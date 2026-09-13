import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EntradaHistorico } from "../tipos/historico";

/**
 * Regressão do bug em que a identificação do aluno não tinha efeito nenhum:
 * era guardada como etiqueta, mas o histórico vivia numa chave global
 * (`sf_historico`), por isso qualquer pessoa via sempre os mesmos dados.
 * Estes testes fixam o comportamento esperado — cada conta tem o seu próprio
 * espaço no mesmo browser.
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
  return armazenamento;
}

function entrada(casoId: string): EntradaHistorico {
  return { casoId, titulo: casoId, data: new Date().toISOString(), pontuacaoFinal: 80 } as EntradaHistorico;
}

describe("histórico separado por utilizador", () => {
  let armazenamento: Map<string, string>;

  beforeEach(() => {
    vi.resetModules();
    armazenamento = instalarLocalStorageFalso();
  });

  it("dois utilizadores diferentes veem históricos diferentes no mesmo browser", async () => {
    const { iniciarSessao, registarResultado, obterHistorico } = await import("../lib/estado");

    iniciarSessao("ana silva");
    registarResultado(entrada("caso_1_lesao_pressao"));
    expect(obterHistorico()).toHaveLength(1);

    iniciarSessao("bruno costa");
    expect(obterHistorico()).toEqual([]);

    registarResultado(entrada("caso_2_deiscencia_cirurgica"));
    expect(obterHistorico().map((h) => h.casoId)).toEqual(["caso_2_deiscencia_cirurgica"]);

    // Voltar ao primeiro utilizador devolve os dados dele, intactos.
    iniciarSessao("ana silva");
    expect(obterHistorico().map((h) => h.casoId)).toEqual(["caso_1_lesao_pressao"]);
  });

  it("as consultas pontuais seguem a mesma separação", async () => {
    const { iniciarSessao } = await import("../lib/estado");
    const { registarConsulta, obterConsultas } = await import("../lib/consultas");

    const consulta = {
      caso: { etiologia: "venosa" } as never,
      decisao: { nivelInfecao: "sem_sinais", categoriasAplicaveis: [], tratamentosValidos: {} } as never,
      tecnicas: [],
      causaTratada: { aplicavel: false } as never,
      portaoSistemico: { aplicavel: false } as never,
    };

    iniciarSessao("ana silva");
    registarConsulta(consulta);
    expect(obterConsultas()).toHaveLength(1);

    iniciarSessao("carla dias");
    expect(obterConsultas()).toEqual([]);
  });

  it("terminar sessão não apaga os dados do utilizador", async () => {
    const { iniciarSessao, registarResultado, obterHistorico, sair } = await import("../lib/estado");

    iniciarSessao("ana silva");
    registarResultado(entrada("caso_1_lesao_pressao"));
    sair();
    iniciarSessao("ana silva");

    expect(obterHistorico()).toHaveLength(1);
  });

  it("limpar o histórico só afeta o utilizador com sessão iniciada", async () => {
    const { iniciarSessao, registarResultado, obterHistorico, limparHistorico } = await import("../lib/estado");

    iniciarSessao("ana silva");
    registarResultado(entrada("caso_1_lesao_pressao"));
    iniciarSessao("bruno costa");
    registarResultado(entrada("caso_2_deiscencia_cirurgica"));

    limparHistorico();
    expect(obterHistorico()).toEqual([]);

    iniciarSessao("ana silva");
    expect(obterHistorico()).toHaveLength(1);
  });

  it("migra o histórico global antigo para o espaço do utilizador ativo, uma só vez", async () => {
    const { iniciarSessao, obterHistorico } = await import("../lib/estado");

    // Estado deixado por uma versão anterior da aplicação.
    armazenamento.set("sf_historico", JSON.stringify([entrada("caso_antigo")]));

    iniciarSessao("ana silva");
    expect(obterHistorico().map((h) => h.casoId)).toEqual(["caso_antigo"]);
    expect(armazenamento.has("sf_historico")).toBe(false);

    // Uma segunda conta não pode herdar o mesmo histórico.
    iniciarSessao("bruno costa");
    expect(obterHistorico()).toEqual([]);
  });

  it("o nome é normalizado, para a mesma pessoa não gerar dois espaços", async () => {
    const { iniciarSessao, registarResultado, obterHistorico } = await import("../lib/estado");

    iniciarSessao("  Ana   SILVA  ");
    registarResultado(entrada("caso_1_lesao_pressao"));
    iniciarSessao("ana silva");

    expect(obterHistorico()).toHaveLength(1);
  });
});
