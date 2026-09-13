import { describe, expect, it } from "vitest";
import { pontoDentroPoligono } from "../algoritmo/pontoNoPoligono";
import { avaliarIdentificacao, avaliarTecido } from "../algoritmo/avaliarIdentificacao";
import { derivarNivelInfecao } from "../algoritmo/nivelInfecao";
import type { RespostaIdentificacao } from "../tipos/identificacao";
import { fabricarCasoBase } from "./utilidadesTeste";

const QUADRADO: { x: number; y: number }[] = [
  { x: 0.1, y: 0.1 },
  { x: 0.5, y: 0.1 },
  { x: 0.5, y: 0.5 },
  { x: 0.1, y: 0.5 },
];

// "L" côncavo — cobre (0,0)-(1,0.5) e (0,0.5)-(0.5,1), exclui o quadrante (0.5,0.5)-(1,1).
const POLIGONO_L: { x: number; y: number }[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 0.5 },
  { x: 0.5, y: 0.5 },
  { x: 0.5, y: 1 },
  { x: 0, y: 1 },
];

describe("pontoDentroPoligono", () => {
  it("ponto claramente dentro de um quadrado", () => {
    expect(pontoDentroPoligono({ x: 0.3, y: 0.3 }, QUADRADO)).toBe(true);
  });

  it("ponto claramente fora de um quadrado", () => {
    expect(pontoDentroPoligono({ x: 0.9, y: 0.9 }, QUADRADO)).toBe(false);
  });

  it("polígono côncavo (L): ponto no reentrante fica fora", () => {
    expect(pontoDentroPoligono({ x: 0.75, y: 0.75 }, POLIGONO_L)).toBe(false);
  });

  it("polígono côncavo (L): pontos nos dois braços ficam dentro", () => {
    expect(pontoDentroPoligono({ x: 0.9, y: 0.2 }, POLIGONO_L)).toBe(true);
    expect(pontoDentroPoligono({ x: 0.2, y: 0.9 }, POLIGONO_L)).toBe(true);
  });

  it("polígono degenerado (menos de 3 vértices) nunca contém nada", () => {
    expect(pontoDentroPoligono({ x: 0.5, y: 0.5 }, [{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe(false);
  });
});

describe("avaliarTecido", () => {
  const caso = fabricarCasoBase({
    tipo_tecido_leito: [
      { tipo: "esfacelo", poligono: [{ x: 0, y: 0 }, { x: 0.5, y: 0 }, { x: 0.5, y: 1 }, { x: 0, y: 1 }] },
      { tipo: "granulacao", poligono: [{ x: 0.5, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0.5, y: 1 }] },
    ],
  });

  it("100% quando há um pin correto por zona", () => {
    const resultado = avaliarTecido(caso, [
      { tipo: "esfacelo", x: 0.2, y: 0.5 },
      { tipo: "granulacao", x: 0.8, y: 0.5 },
    ]);
    expect(resultado.pontuacaoPercentual).toBe(100);
    expect(resultado.tiposEncontrados).toEqual(["esfacelo", "granulacao"]);
  });

  it("50% quando só uma das duas zonas é encontrada", () => {
    const resultado = avaliarTecido(caso, [{ tipo: "esfacelo", x: 0.2, y: 0.5 }]);
    expect(resultado.pontuacaoPercentual).toBe(50);
    expect(resultado.tiposEncontrados).toEqual(["esfacelo"]);
  });

  it("pin do tipo errado na zona certa não conta (tipo tem de coincidir com o polígono)", () => {
    const resultado = avaliarTecido(caso, [{ tipo: "granulacao", x: 0.2, y: 0.5 }]);
    expect(resultado.pontuacaoPercentual).toBe(0);
    expect(resultado.pins[0].correto).toBe(false);
  });

  it("pin fora de qualquer zona é marcado como incorreto", () => {
    const resultado = avaliarTecido(caso, [{ tipo: "esfacelo", x: 0.8, y: 0.5 }]);
    expect(resultado.pins[0].correto).toBe(false);
  });

  it("sem zonas esperadas dá 100% por vacuidade", () => {
    const semZonas = fabricarCasoBase({ tipo_tecido_leito: [] });
    expect(avaliarTecido(semZonas, []).pontuacaoPercentual).toBe(100);
  });
});

describe("avaliarIdentificacao", () => {
  const caso = fabricarCasoBase({
    tipo_tecido_leito: [{ tipo: "esfacelo", poligono: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }] }],
    exsudado: { volume: "moderado", tipo: ["seroso"] },
    bordos: ["nao_aderentes_solto"],
    pele_perilesional: ["macerada"],
  });
  const nivelInfecaoReal = derivarNivelInfecao(caso.sinais_infecao, caso.exsudado, false);

  function respostaPerfeita(): RespostaIdentificacao {
    return {
      pins: [{ tipo: "esfacelo", x: 0.5, y: 0.5 }],
      exsudado: { volume: "moderado", tipo: ["seroso"] },
      bordos: ["nao_aderentes_solto"],
      pele_perilesional: ["macerada"],
      nivelInfecaoProposto: nivelInfecaoReal,
    };
  }

  it("resposta perfeita atinge 100%", () => {
    const resultado = avaliarIdentificacao(caso, respostaPerfeita());
    expect(resultado.pontuacaoFinalPercentual).toBe(100);
    expect(resultado.nivelInfecaoCorreto).toBe(true);
    expect(resultado.exsudadoVolumeCorreto).toBe(true);
    expect(resultado.exsudadoTipoCorreto).toBe(true);
    expect(resultado.bordosCorretos).toBe(true);
    expect(resultado.peleCorreta).toBe(true);
  });

  it("volume de exsudado errado reduz a pontuação mas não afeta os outros componentes", () => {
    const resposta = { ...respostaPerfeita(), exsudado: { volume: "escasso" as const, tipo: ["seroso" as const] } };
    const resultado = avaliarIdentificacao(caso, resposta);
    expect(resultado.exsudadoVolumeCorreto).toBe(false);
    expect(resultado.bordosCorretos).toBe(true);
    expect(resultado.pontuacaoFinalPercentual).toBeCloseTo((5 / 6) * 100, 5);
  });

  it("tipo de exsudado é comparado como conjunto, independente da ordem", () => {
    const resposta = { ...respostaPerfeita(), exsudado: { volume: "moderado" as const, tipo: ["seroso" as const] } };
    expect(avaliarIdentificacao(caso, resposta).exsudadoTipoCorreto).toBe(true);
  });

  it("bordos/pele com elementos a mais ou a menos são incorretos", () => {
    const comExtra = avaliarIdentificacao(caso, {
      ...respostaPerfeita(),
      bordos: ["nao_aderentes_solto", "fibroticos"],
    });
    expect(comExtra.bordosCorretos).toBe(false);

    const semNenhum = avaliarIdentificacao(caso, { ...respostaPerfeita(), pele_perilesional: [] });
    expect(semNenhum.peleCorreta).toBe(false);
  });

  it("nível de infeção proposto errado é detetado", () => {
    const errado = nivelInfecaoReal === "sem_sinais" ? "infecao_local_overt" : "sem_sinais";
    const resultado = avaliarIdentificacao(caso, { ...respostaPerfeita(), nivelInfecaoProposto: errado });
    expect(resultado.nivelInfecaoCorreto).toBe(false);
  });

  it("resposta totalmente errada não atinge 100%", () => {
    const resposta: RespostaIdentificacao = {
      pins: [],
      exsudado: { volume: "abundante", tipo: ["purulento"] },
      bordos: ["fibroticos"],
      pele_perilesional: ["integra"],
      nivelInfecaoProposto: "infecao_propagacao_sistemica",
    };
    const resultado = avaliarIdentificacao(caso, resposta);
    expect(resultado.pontuacaoFinalPercentual).toBeLessThan(100);
  });
});

/**
 * Regressão: antes, cada polígono contava como uma unidade a identificar, por
 * isso um caso com 2 manchas de esfacelo + 1 de granulação exigia 3 pins e dava
 * 67% a quem marcasse corretamente os dois tecidos presentes. A unidade certa é
 * o tipo de tecido.
 */
describe("avaliarTecido — vários polígonos do mesmo tipo contam como um só tecido", () => {
  const casoDoisEsfacelos = fabricarCasoBase({
    tipo_tecido_leito: [
      { tipo: "esfacelo", poligono: [{ x: 0, y: 0 }, { x: 0.3, y: 0 }, { x: 0.3, y: 1 }, { x: 0, y: 1 }] },
      { tipo: "esfacelo", poligono: [{ x: 0.35, y: 0 }, { x: 0.6, y: 0 }, { x: 0.6, y: 1 }, { x: 0.35, y: 1 }] },
      { tipo: "granulacao", poligono: [{ x: 0.65, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0.65, y: 1 }] },
    ],
  });

  it("espera um tipo por tecido presente, não um por polígono", () => {
    const resultado = avaliarTecido(casoDoisEsfacelos, []);
    expect(resultado.tiposEsperados).toEqual(["esfacelo", "granulacao"]);
  });

  it("dois pins (um por tipo) dão 100%, mesmo havendo três polígonos", () => {
    const resultado = avaliarTecido(casoDoisEsfacelos, [
      { tipo: "esfacelo", x: 0.15, y: 0.5 },
      { tipo: "granulacao", x: 0.8, y: 0.5 },
    ]);
    expect(resultado.pontuacaoPercentual).toBe(100);
    expect(resultado.tiposEncontrados).toEqual(["esfacelo", "granulacao"]);
  });

  it("o pin de esfacelo conta em qualquer um dos polígonos desse tipo", () => {
    const noSegundo = avaliarTecido(casoDoisEsfacelos, [
      { tipo: "esfacelo", x: 0.45, y: 0.5 },
      { tipo: "granulacao", x: 0.8, y: 0.5 },
    ]);
    expect(noSegundo.pontuacaoPercentual).toBe(100);
    expect(noSegundo.pins.every((p) => p.correto)).toBe(true);
  });

  it("marcar as duas manchas do mesmo tecido não vale mais do que marcar uma", () => {
    const umaMancha = avaliarTecido(casoDoisEsfacelos, [{ tipo: "esfacelo", x: 0.15, y: 0.5 }]);
    const duasManchas = avaliarTecido(casoDoisEsfacelos, [
      { tipo: "esfacelo", x: 0.15, y: 0.5 },
      { tipo: "esfacelo", x: 0.45, y: 0.5 },
    ]);
    expect(umaMancha.pontuacaoPercentual).toBe(50);
    expect(duasManchas.pontuacaoPercentual).toBe(50);
  });
});
