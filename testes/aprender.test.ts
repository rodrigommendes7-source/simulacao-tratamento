import { describe, expect, it } from "vitest";
import { PAGINAS_APRENDER } from "../dados/aprender";
import { REFERENCIAS } from "../dados/referenciasCompletas";
import { TODOS_CASOS_TESTE } from "../dados/casosTeste";

describe("integridade do conteúdo de Aprender", () => {
  const idsValidos = new Set(PAGINAS_APRENDER.map((p) => p.id));
  const idsCasos = new Set(TODOS_CASOS_TESTE.map((c) => c.id));

  it("não há ids de página duplicados", () => {
    expect(idsValidos.size).toBe(PAGINAS_APRENDER.length);
  });

  it.each(PAGINAS_APRENDER)("$id: todos os 'relacionados' apontam para páginas existentes", (pagina) => {
    for (const id of pagina.relacionados) {
      expect(idsValidos.has(id), `"${pagina.id}" relaciona com "${id}", que não existe`).toBe(true);
    }
  });

  it.each(PAGINAS_APRENDER)("$id: não se relaciona consigo própria", (pagina) => {
    expect(pagina.relacionados).not.toContain(pagina.id);
  });

  it.each(PAGINAS_APRENDER)("$id: todas as referências têm entrada no registo", (pagina) => {
    for (const id of pagina.referencias) {
      expect(Object.prototype.hasOwnProperty.call(REFERENCIAS, id), `"${pagina.id}" cita "${id}", que não está em REFERENCIAS`).toBe(true);
    }
  });

  it.each(PAGINAS_APRENDER)("$id: todos os casos relacionados existem em TODOS_CASOS_TESTE", (pagina) => {
    for (const id of pagina.casosRelacionados ?? []) {
      expect(idsCasos.has(id), `"${pagina.id}" relaciona com o caso "${id}", que não existe`).toBe(true);
    }
  });

  it("cada um dos 3 eixos tem pelo menos uma página", () => {
    const eixos = new Set(PAGINAS_APRENDER.map((p) => p.eixo));
    expect(eixos).toEqual(new Set(["tema_clinico", "tratamento", "etiologia"]));
  });

  it("só páginas do eixo tratamento têm apositosExemplo", () => {
    for (const pagina of PAGINAS_APRENDER) {
      if (pagina.eixo !== "tratamento") {
        expect(pagina.apositosExemplo, `"${pagina.id}" não é do eixo tratamento mas tem apositosExemplo`).toBeUndefined();
      }
    }
  });
});
