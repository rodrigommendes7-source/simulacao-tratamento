import { describe, expect, it } from "vitest";
import { avaliarTecnicas, pontuacaoTecnicas } from "../algoritmo/avaliarTecnicas";
import { TODAS_TECNICAS } from "../dados/tecnicasAplicacao";
import { fabricarCasoBase } from "./utilidadesTeste";

describe("avaliarTecnicas", () => {
  it("devolve uma correspondência para cada uma das técnicas, mesmo sem seleção", () => {
    const caso = fabricarCasoBase();
    const resultado = avaliarTecnicas([], { caso, nivelInfecao: "sem_sinais" });
    expect(resultado).toHaveLength(TODAS_TECNICAS.length);
    expect(resultado.every((c) => !c.selecionada)).toBe(true);
  });

  it("penso simples protetor é sempre esperado (sem condição de indicação)", () => {
    const caso = fabricarCasoBase();
    const resultado = avaliarTecnicas([], { caso, nivelInfecao: "sem_sinais" });
    const pensoSimples = resultado.find((c) => c.tecnicaId === "penso_simples_protetor");
    expect(pensoSimples?.esperada).toBe(true);
  });

  it("marca 'selecionada' independentemente de ser ou não esperada", () => {
    const caso = fabricarCasoBase({ exsudado: { volume: "abundante", tipo: ["seroso"] } });
    // "penso_rapido" exige exsudado ausente/escasso — não deve ser esperado aqui.
    const resultado = avaliarTecnicas(["penso_rapido"], { caso, nivelInfecao: "sem_sinais" });
    const pensoRapido = resultado.find((c) => c.tecnicaId === "penso_rapido");
    expect(pensoRapido?.esperada).toBe(false);
    expect(pensoRapido?.selecionada).toBe(true);
  });

  it("terapia_compressiva_tecnica só é esperada dentro do intervalo de ABPI", () => {
    const dentro = avaliarTecnicas([], { caso: fabricarCasoBase({ abpi: 0.9 }), nivelInfecao: "sem_sinais" });
    const fora = avaliarTecnicas([], { caso: fabricarCasoBase({ abpi: 0.3 }), nivelInfecao: "sem_sinais" });
    expect(dentro.find((c) => c.tecnicaId === "terapia_compressiva_tecnica")?.esperada).toBe(true);
    expect(fora.find((c) => c.tecnicaId === "terapia_compressiva_tecnica")?.esperada).toBe(false);
  });
});

describe("pontuacaoTecnicas", () => {
  it("100% quando não há nenhuma técnica esperada", () => {
    expect(pontuacaoTecnicas([{ tecnicaId: "x", esperada: false, selecionada: false }])).toBe(100);
  });

  it("proporcional às técnicas esperadas selecionadas", () => {
    const correspondencias = [
      { tecnicaId: "a", esperada: true, selecionada: true },
      { tecnicaId: "b", esperada: true, selecionada: false },
      { tecnicaId: "c", esperada: false, selecionada: true },
    ];
    expect(pontuacaoTecnicas(correspondencias)).toBe(50);
  });
});
