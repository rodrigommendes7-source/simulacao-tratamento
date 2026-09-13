import { describe, expect, it } from "vitest";
import { precisaAbpi, escalaProfundidade, mostraTipoExsudado } from "../lib/formularioConsulta";
import { TODAS_ETIOLOGIAS } from "../tipos/variaveis";

describe("precisaAbpi (progressive disclosure — campo ABPI)", () => {
  it("mostra ABPI só nas 3 etiologias vasculares", () => {
    expect(precisaAbpi("venosa")).toBe(true);
    expect(precisaAbpi("arterial")).toBe(true);
    expect(precisaAbpi("mista_arteriovenosa")).toBe(true);
  });

  it("esconde ABPI nas restantes etiologias", () => {
    const naoVasculares = TODAS_ETIOLOGIAS.filter(
      (e) => e !== "venosa" && e !== "arterial" && e !== "mista_arteriovenosa",
    );
    for (const e of naoVasculares) {
      expect(precisaAbpi(e), `${e} não devia mostrar ABPI`).toBe(false);
    }
  });
});

describe("escalaProfundidade (progressive disclosure — escala NPIAP vs. genérica)", () => {
  it("usa a escala NPIAP só em etiologia pressão", () => {
    expect(escalaProfundidade("pressao")).toBe("pressao");
  });

  it("usa a escala genérica em todas as restantes etiologias", () => {
    const outras = TODAS_ETIOLOGIAS.filter((e) => e !== "pressao");
    for (const e of outras) {
      expect(escalaProfundidade(e), `${e} devia usar escala genérica`).toBe("generica");
    }
  });
});

describe("mostraTipoExsudado (progressive disclosure — exsudado.tipo)", () => {
  it("esconde o campo tipo quando o volume é ausente", () => {
    expect(mostraTipoExsudado("ausente")).toBe(false);
  });

  it("mostra o campo tipo para qualquer volume não-ausente", () => {
    expect(mostraTipoExsudado("escasso")).toBe(true);
    expect(mostraTipoExsudado("moderado")).toBe(true);
    expect(mostraTipoExsudado("abundante")).toBe(true);
  });
});
