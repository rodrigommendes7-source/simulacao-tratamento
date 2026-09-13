import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * lib/contas.ts é "use client" e usa window.localStorage + Web Crypto. O
 * ambiente de testes é "node", por isso simula-se o localStorage; o
 * `crypto.subtle` do Node é o mesmo do browser, por isso o PBKDF2 corre a
 * sério — estes testes verificam a derivação real, não um substituto.
 */
function instalarLocalStorageFalso() {
  const dados = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (c: string) => (dados.has(c) ? dados.get(c)! : null),
      setItem: (c: string, v: string) => void dados.set(c, v),
      removeItem: (c: string) => void dados.delete(c),
      clear: () => dados.clear(),
    },
  });
  return dados;
}

describe("contas locais", () => {
  let dados: Map<string, string>;

  beforeEach(() => {
    vi.resetModules();
    dados = instalarLocalStorageFalso();
  });

  it("cria uma conta e permite entrar com ela", async () => {
    const { criarConta, autenticar } = await import("../lib/contas");
    expect((await criarConta("Ana Silva", "1234")).ok).toBe(true);
    expect((await autenticar("Ana Silva", "1234")).ok).toBe(true);
  });

  it("recusa a palavra-passe errada", async () => {
    const { criarConta, autenticar } = await import("../lib/contas");
    await criarConta("Ana Silva", "1234");
    const r = await autenticar("Ana Silva", "9999");
    expect(r.ok).toBe(false);
    expect(r.erro).toBe("Nome de utilizador ou palavra-passe incorretos.");
  });

  it("não revela se o nome existe — a mensagem é a mesma nos dois casos", async () => {
    const { criarConta, autenticar } = await import("../lib/contas");
    await criarConta("Ana Silva", "1234");
    const passeErrada = await autenticar("Ana Silva", "0000");
    const nomeInexistente = await autenticar("Zeca", "0000");
    expect(passeErrada.erro).toBe(nomeInexistente.erro);
  });

  describe("unicidade do nome", () => {
    it("recusa um nome já registado", async () => {
      const { criarConta } = await import("../lib/contas");
      expect((await criarConta("Ana Silva", "1234")).ok).toBe(true);
      const repetida = await criarConta("Ana Silva", "5678");
      expect(repetida.ok).toBe(false);
      expect(repetida.erro).toContain("Já existe uma conta");
    });

    it("trata maiúsculas e espaços a mais como o mesmo nome", async () => {
      const { criarConta, normalizarUtilizador } = await import("../lib/contas");
      await criarConta("Ana Silva", "1234");
      expect((await criarConta("  ANA   silva ", "5678")).ok).toBe(false);
      expect(normalizarUtilizador("  ANA   silva ")).toBe("ana silva");
    });

    it("entrar funciona independentemente de como o nome é escrito", async () => {
      const { criarConta, autenticar } = await import("../lib/contas");
      await criarConta("Ana Silva", "1234");
      expect((await autenticar("  ANA  SILVA ", "1234")).ok).toBe(true);
    });

    it("guarda o nome tal como foi escrito, para o mostrar na interface", async () => {
      const { criarConta } = await import("../lib/contas");
      const r = await criarConta("Ana Silva", "1234");
      expect(r.conta?.nomeApresentacao).toBe("Ana Silva");
      expect(r.conta?.utilizador).toBe("ana silva");
    });
  });

  describe("regras da palavra-passe", () => {
    it("aceita entre 4 e 6 dígitos", async () => {
      const { validarPalavraPasse } = await import("../lib/contas");
      for (const valida of ["1234", "12345", "123456"]) expect(validarPalavraPasse(valida)).toBeNull();
    });

    it("recusa mais de 6 dígitos", async () => {
      const { criarConta, validarPalavraPasse } = await import("../lib/contas");
      expect(validarPalavraPasse("1234567")).toBeTruthy();
      expect((await criarConta("Ana", "1234567")).ok).toBe(false);
    });

    it("recusa palavras-passe não numéricas", async () => {
      const { criarConta, validarPalavraPasse } = await import("../lib/contas");
      expect(validarPalavraPasse("12a4")).toBeTruthy();
      expect((await criarConta("Ana", "abcd")).ok).toBe(false);
    });

    it("recusa palavras-passe demasiado curtas", async () => {
      const { validarPalavraPasse } = await import("../lib/contas");
      expect(validarPalavraPasse("12")).toBeTruthy();
      expect(validarPalavraPasse("")).toBeTruthy();
    });
  });

  describe("regras do nome de utilizador", () => {
    it("recusa nomes demasiado curtos ou longos", async () => {
      const { validarUtilizador } = await import("../lib/contas");
      expect(validarUtilizador("ab")).toBeTruthy();
      expect(validarUtilizador("a".repeat(25))).toBeTruthy();
      expect(validarUtilizador("ana.silva")).toBeNull();
    });

    it("aceita acentos e recusa símbolos estranhos", async () => {
      const { validarUtilizador } = await import("../lib/contas");
      expect(validarUtilizador("Inês Gonçalves")).toBeNull();
      expect(validarUtilizador("ana<script>")).toBeTruthy();
    });
  });

  describe("armazenamento da palavra-passe", () => {
    it("nunca guarda a palavra-passe em claro", async () => {
      const { criarConta } = await import("../lib/contas");
      await criarConta("Ana Silva", "482913");
      const bruto = dados.get("sf_contas") ?? "";
      expect(bruto).not.toContain("482913");
      expect(bruto.length).toBeGreaterThan(0);
    });

    it("dá hashes diferentes à mesma palavra-passe em contas diferentes (sal por conta)", async () => {
      const { criarConta, lerContas } = await import("../lib/contas");
      await criarConta("Ana", "1234");
      await criarConta("Bruno", "1234");
      const contas = lerContas();
      expect(contas["ana"].salHex).not.toBe(contas["bruno"].salHex);
      expect(contas["ana"].hashHex).not.toBe(contas["bruno"].hashHex);
    });
  });

  it("permite alterar a palavra-passe mediante a atual", async () => {
    const { criarConta, alterarPalavraPasse, autenticar } = await import("../lib/contas");
    await criarConta("Ana Silva", "1234");

    expect((await alterarPalavraPasse("Ana Silva", "0000", "5678")).ok).toBe(false);
    expect((await alterarPalavraPasse("Ana Silva", "1234", "5678")).ok).toBe(true);

    expect((await autenticar("Ana Silva", "1234")).ok).toBe(false);
    expect((await autenticar("Ana Silva", "5678")).ok).toBe(true);
  });
});
