import { describe, expect, it } from "vitest";
import { avaliarPortaoSistemico, TETO_PORTAO_SISTEMICO } from "../algoritmo/portaoSistemico";
import { fabricarRespostaVazia } from "./utilidadesTeste";

describe("avaliarPortaoSistemico", () => {
  it("não aplicável fora de infecao_propagacao_sistemica", () => {
    expect(avaliarPortaoSistemico("infecao_local_overt", fabricarRespostaVazia()).aplicavel).toBe(
      false,
    );
  });

  it("aplicável e não satisfeito sem referenciação -> teto", () => {
    const resultado = avaliarPortaoSistemico(
      "infecao_propagacao_sistemica",
      fabricarRespostaVazia(),
    );
    expect(resultado.aplicavel).toBe(true);
    expect(resultado.satisfeito).toBe(false);
    expect(resultado.tetoPontuacao).toBe(TETO_PORTAO_SISTEMICO);
  });

  it("satisfeito com referenciação médica sistémica presente", () => {
    const resultado = avaliarPortaoSistemico(
      "infecao_propagacao_sistemica",
      fabricarRespostaVazia({ medidasCausais: { referenciacaoMedicaSistemica: true } }),
    );
    expect(resultado.satisfeito).toBe(true);
  });
});
