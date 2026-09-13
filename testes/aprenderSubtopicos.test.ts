import { describe, expect, it } from "vitest";
import { PAGINAS_APRENDER, obterPagina } from "../dados/aprender";
import { REFERENCIAS } from "../dados/referenciasCompletas";
import { entradasDaPagina, estruturarPagina, obterEntrada, obterEstrutura, todosOsSubtopicos } from "../lib/aprenderSubtopicos";
import { imagensDoSubtopico, imagensEmFalta } from "../lib/aprenderImagens";

describe("derivação de subtópicos para o drill-down", () => {
  it("parte os tecidos do leito nos 6 tipos navegáveis", () => {
    const estrutura = obterEstrutura("tema-tecido-leito");
    expect(estrutura?.subtopicos.map((s) => s.id)).toEqual([
      "granulacao",
      "granulacao-hipergranulada",
      "epitelizacao",
      "esfacelo",
      "necrose-seca",
      "necrose-humida",
    ]);
  });

  it("não reescreve o conteúdo clínico — o texto dos subtópicos reconstrói o detalhe original", () => {
    for (const pagina of PAGINAS_APRENDER) {
      const { preambulo, nota, subtopicos } = estruturarPagina(pagina);
      if (subtopicos.length === 0) continue;
      const reconstruido = [preambulo, ...subtopicos.map((s) => `${s.titulo} — ${s.detalhe}`), nota]
        .filter(Boolean)
        .join("\n\n");
      expect(reconstruido).toBe(pagina.detalheClinico.trim());
    }
  });

  it("não trata frases com pontuação interna como títulos de subtópico", () => {
    // "Apresentação típica: combina sinais de ambas — …" é texto corrido,
    // não um bloco nomeado; a página fica sem camada intermédia.
    expect(obterEstrutura("etio-mista-arteriovenosa")?.subtopicos).toEqual([]);
  });

  it("os slugs são únicos dentro de cada página", () => {
    for (const pagina of PAGINAS_APRENDER) {
      const ids = estruturarPagina(pagina).subtopicos.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("todas as páginas têm pelo menos uma entrada navegável", () => {
    for (const pagina of PAGINAS_APRENDER) {
      expect(entradasDaPagina(estruturarPagina(pagina)).length).toBeGreaterThan(0);
    }
  });

  it("páginas de texto corrido ganham camada de secções em vez de subtópicos", () => {
    const estrutura = obterEstrutura("etio-venosa")!;
    expect(estrutura.subtopicos).toEqual([]);
    const ids = entradasDaPagina(estrutura).map((e) => e.id);
    expect(ids).toContain("detalhe-clinico");
    expect(ids).toContain("erros-frequentes");
  });

  it("cada entrada é resolúvel pela rota /aprender/[id]/[sub]", () => {
    for (const pagina of PAGINAS_APRENDER) {
      for (const entrada of entradasDaPagina(estruturarPagina(pagina))) {
        expect(obterEntrada(pagina.id, entrada.id)?.entrada.titulo).toBe(entrada.titulo);
      }
    }
  });

  it("uma entrada inexistente devolve null em vez de rebentar", () => {
    expect(obterEntrada("tema-tecido-leito", "nao-existe")).toBeNull();
    expect(obterEstrutura("pagina-que-nao-existe")).toBeNull();
  });
});

describe("fotografias do Aprender", () => {
  it("ilustra o esfacelo com um caso de teste onde está anotado", () => {
    const imagens = imagensDoSubtopico("tema-tecido-leito", "esfacelo");
    expect(imagens.length).toBeGreaterThan(0);
    expect(imagens[0].pendente).toBeFalsy();
    expect(imagens[0].src).toBe("/caso1.jpg");
    expect(imagens[0].destaque?.length).toBeGreaterThan(2);
  });

  it("assinala explicitamente os tecidos sem fotografia disponível", () => {
    expect(imagensEmFalta().map((i) => i.slug).sort()).toEqual([
      "epitelizacao",
      "granulacao-hipergranulada",
      "necrose-humida",
      "necrose-seca",
    ]);
    const pendente = imagensDoSubtopico("tema-tecido-leito", "necrose-seca");
    expect(pendente[0].pendente).toBe(true);
    expect(pendente[0].notaPendente).toBeTruthy();
  });

  it("os polígonos de destaque ficam dentro da caixa normalizada da imagem", () => {
    for (const { pagina, subtopico } of todosOsSubtopicos()) {
      for (const img of imagensDoSubtopico(pagina.id, subtopico.id, pagina.casosRelacionados ?? [])) {
        for (const p of img.destaque ?? []) {
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(1);
          expect(p.y).toBeGreaterThanOrEqual(0);
          expect(p.y).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});

describe("referências", () => {
  it("todos os IDs referidos pelo Aprender existem no registo, para nunca sair um ID solto no ecrã", () => {
    for (const pagina of PAGINAS_APRENDER) {
      for (const id of pagina.referencias) {
        expect(REFERENCIAS[id], `${pagina.id} → ${id}`).toBeTruthy();
        expect(REFERENCIAS[id].citacao.length).toBeGreaterThan(10);
      }
    }
  });

  it("as páginas relacionadas apontam para páginas existentes", () => {
    for (const pagina of PAGINAS_APRENDER) {
      for (const id of pagina.relacionados) {
        expect(obterPagina(id), `${pagina.id} → ${id}`).toBeTruthy();
      }
    }
  });
});
