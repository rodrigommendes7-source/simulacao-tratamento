import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `lib/dadosAntigos.ts` substituiu a separação de dados por utilizador dentro
 * do `localStorage`, que deixou de existir: contas, histórico, consultas e
 * rascunhos passaram para a base de dados.
 *
 * O que sobra é a limpeza das chaves antigas, e é isso que estes testes
 * fixam. Importa sobretudo que `sf_contas` desapareça mesmo — continha
 * derivações de PINs que as pessoas tendem a reutilizar noutros sítios, e não
 * há razão nenhuma para ficarem lá esquecidas.
 */
function instalarLocalStorageFalso(inicial: Record<string, string> = {}) {
  const dados = new Map<string, string>(Object.entries(inicial));
  vi.stubGlobal("window", {
    localStorage: {
      get length() {
        return dados.size;
      },
      key: (i: number) => [...dados.keys()][i] ?? null,
      getItem: (c: string) => (dados.has(c) ? dados.get(c)! : null),
      setItem: (c: string, v: string) => void dados.set(c, v),
      removeItem: (c: string) => void dados.delete(c),
      clear: () => dados.clear(),
    },
  });
  return dados;
}

describe("limparDadosAntigos", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("apaga todas as chaves sf_* da versão local", async () => {
    const dados = instalarLocalStorageFalso({
      sf_contas: "{}",
      "sf_historico::ana silva": "[]",
      "sf_consultas::ana silva": "[]",
      "sf_rascunho_caso:caso_1::ana silva": "{}",
      sf_utilizador: "ana silva",
      outra_app: "fica",
    });

    const { limparDadosAntigos } = await import("../lib/dadosAntigos");
    limparDadosAntigos();

    expect(dados.has("sf_contas")).toBe(false);
    expect(dados.has("sf_historico::ana silva")).toBe(false);
    expect(dados.has("sf_consultas::ana silva")).toBe(false);
    expect(dados.has("sf_rascunho_caso:caso_1::ana silva")).toBe(false);
    expect(dados.has("sf_utilizador")).toBe(false);
    // Chaves de outras aplicações no mesmo domínio não são nossas para apagar.
    expect(dados.get("outra_app")).toBe("fica");
  });

  it("sinaliza que havia dados do aluno, para a interface poder explicar", async () => {
    instalarLocalStorageFalso({ "sf_historico::ana silva": "[{}]" });
    const { limparDadosAntigos } = await import("../lib/dadosAntigos");
    expect(limparDadosAntigos().haviaDados).toBe(true);
  });

  it("não avisa quando só lá estava a sessão antiga", async () => {
    // `sf_utilizador` sozinho é a sessão, não histórico: ninguém perdeu nada
    // e um aviso a dizer que sim seria falso.
    instalarLocalStorageFalso({ sf_utilizador: "ana silva" });
    const { limparDadosAntigos } = await import("../lib/dadosAntigos");
    expect(limparDadosAntigos().haviaDados).toBe(false);
  });

  it("não avisa num browser que nunca teve a versão local", async () => {
    instalarLocalStorageFalso();
    const { limparDadosAntigos } = await import("../lib/dadosAntigos");
    expect(limparDadosAntigos().haviaDados).toBe(false);
  });

  it("só corre uma vez — a segunda chamada já não encontra nem avisa nada", async () => {
    const dados = instalarLocalStorageFalso({ "sf_historico::ana silva": "[{}]" });
    const { limparDadosAntigos } = await import("../lib/dadosAntigos");

    expect(limparDadosAntigos().haviaDados).toBe(true);
    // O aviso é para ser dado uma vez. Se voltasse a aparecer a cada arranque,
    // passava de explicação a incómodo.
    expect(limparDadosAntigos().haviaDados).toBe(false);
    expect(dados.has("sf_aviso_migracao_visto")).toBe(true);
  });

  it("aguenta um localStorage indisponível sem rebentar", async () => {
    // Navegação privada ou política do browser: o acessor atira. Isto corre no
    // arranque da aplicação — não pode ser o que impede o ecrã de aparecer.
    vi.stubGlobal("window", {
      get localStorage(): Storage {
        throw new Error("armazenamento bloqueado");
      },
    });
    const { limparDadosAntigos } = await import("../lib/dadosAntigos");
    expect(() => limparDadosAntigos()).not.toThrow();
    expect(limparDadosAntigos().haviaDados).toBe(false);
  });
});
