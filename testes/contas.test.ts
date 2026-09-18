import { describe, expect, it } from "vitest";
import {
  ERRO_CREDENCIAIS,
  MAX_PALAVRA_PASSE,
  MAX_UTILIZADOR,
  MIN_PALAVRA_PASSE,
  MIN_UTILIZADOR,
  nomeApresentacao,
  normalizarUtilizador,
  validarPalavraPasse,
  validarUtilizador,
} from "../lib/contas";

/**
 * `lib/contas.ts` deixou de guardar contas: as contas vivem na base de dados
 * e a palavra-passe é derivada no servidor (lib/servidor/palavraPasse.ts).
 * O que sobra aqui — e o que estes testes fixam — são as regras de validação
 * e, sobretudo, a forma canónica do nome, que é a coluna com restrição UNIQUE
 * e portanto a definição prática de "duas pessoas são a mesma conta".
 */
describe("normalizarUtilizador (forma canónica do nome)", () => {
  it("colapsa maiúsculas e espaços", () => {
    expect(normalizarUtilizador("  Ana   SILVA  ")).toBe("ana silva");
  });

  it("remove acentos — é isto que impede duas contas para a mesma pessoa", () => {
    // Sem isto, "Ana Antão" e "ana antao" passavam a restrição UNIQUE como
    // nomes diferentes e a mesma pessoa acabava com dois históricos.
    expect(normalizarUtilizador("Ana Antão")).toBe("ana antao");
    expect(normalizarUtilizador("JOÃO PIRES")).toBe(normalizarUtilizador("joao pires"));
    expect(normalizarUtilizador("Inês")).toBe(normalizarUtilizador("ines"));
    expect(normalizarUtilizador("Luís Gonçalves")).toBe("luis goncalves");
  });

  it("é idempotente — normalizar duas vezes dá o mesmo", () => {
    const uma = normalizarUtilizador(" Ãngela  SÓ ");
    expect(normalizarUtilizador(uma)).toBe(uma);
  });

  it("nomes genuinamente diferentes continuam diferentes", () => {
    expect(normalizarUtilizador("ana silva")).not.toBe(normalizarUtilizador("ana silvas"));
  });
});

describe("nomeApresentacao", () => {
  it("mantém a forma como a pessoa escreveu, só com os espaços arrumados", () => {
    expect(nomeApresentacao("  Ana   Antão ")).toBe("Ana Antão");
  });
});

describe("validarUtilizador", () => {
  it("aceita um nome normal", () => {
    expect(validarUtilizador("ana.silva")).toBeNull();
    expect(validarUtilizador("Ana Antão")).toBeNull();
  });

  it("recusa nomes curtos e longos de mais", () => {
    expect(validarUtilizador("ab")).toContain(String(MIN_UTILIZADOR));
    expect(validarUtilizador("a".repeat(MAX_UTILIZADOR + 1))).toContain(String(MAX_UTILIZADOR));
  });

  it("recusa símbolos fora do conjunto permitido", () => {
    expect(validarUtilizador("ana@silva")).not.toBeNull();
  });
});

describe("validarPalavraPasse", () => {
  it("aceita um PIN dentro dos limites", () => {
    expect(validarPalavraPasse("1234")).toBeNull();
    expect(validarPalavraPasse("482913")).toBeNull();
  });

  it("recusa o que não são dígitos", () => {
    expect(validarPalavraPasse("abcd")).not.toBeNull();
  });

  it("recusa comprimentos fora dos limites", () => {
    expect(validarPalavraPasse("1".repeat(MIN_PALAVRA_PASSE - 1))).not.toBeNull();
    expect(validarPalavraPasse("1".repeat(MAX_PALAVRA_PASSE + 1))).not.toBeNull();
  });
});

describe("mensagem de credenciais", () => {
  it("não distingue nome inexistente de palavra-passe errada", () => {
    // É uma constante única de propósito: sem email, saber que nomes existem
    // é metade do trabalho de quem tente entrar à força. Se alguém partir isto
    // em duas mensagens, este teste cai.
    expect(ERRO_CREDENCIAIS).toBe("Nome de utilizador ou palavra-passe incorretos.");
  });
});
