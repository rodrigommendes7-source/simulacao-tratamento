import { describe, expect, it } from "vitest";
import { decidirCaso } from "../algoritmo/motorDecisao";
import { avaliarOncologico, THRESHOLD_DOR_ONCOLOGICA } from "../algoritmo/oncologico";
import { fabricarCasoBase, fabricarRespostaVazia } from "./utilidadesTeste";

describe("avaliarOncologico", () => {
  it("nenhuma dimensão aplicável além de exsudado -> pontuação depende só do penso", () => {
    const caso = fabricarCasoBase({
      etiologia: "oncologica_maligna",
      exsudado: { volume: "moderado", tipo: [] },
      dor: 0,
    });
    const decisao = decidirCaso(caso);
    const resultado = avaliarOncologico(caso, fabricarRespostaVazia(), decisao);
    const aplicaveis = resultado.dimensoes.filter((d) => d.aplicavel);
    expect(aplicaveis.map((d) => d.dimensao)).toEqual(["exsudado"]);
    expect(resultado.pontuacaoPercentual).toBe(0);
  });

  it("todas as 4 dimensões aplicáveis e todas corretas -> 100%", () => {
    const caso = fabricarCasoBase({
      etiologia: "oncologica_maligna",
      sinais_infecao: { ...fabricarCasoBase().sinais_infecao, odor: "moderado" },
      exsudado: { volume: "moderado", tipo: ["sanguinolento"] },
      dor: THRESHOLD_DOR_ONCOLOGICA,
    });
    const decisao = decidirCaso(caso);
    const idPensoValido = decisao.tratamentosValidos.pensos_humidade?.[0]?.id;
    expect(idPensoValido).toBeTruthy();
    const resposta = fabricarRespostaVazia({
      tratamentosSelecionados: ["paliativo_odor", "paliativo_hemorragia", idPensoValido!],
      medidasCausais: { gestaoDorConsiderada: true },
    });
    const resultado = avaliarOncologico(caso, resposta, decisao);
    expect(resultado.dimensoes.every((d) => !d.aplicavel || d.correta)).toBe(true);
    expect(resultado.pontuacaoPercentual).toBe(100);
  });

  it("2 de 4 dimensões aplicáveis, só 1 correta -> 50%", () => {
    const caso = fabricarCasoBase({
      etiologia: "oncologica_maligna",
      sinais_infecao: { ...fabricarCasoBase().sinais_infecao, odor: "forte" },
      exsudado: { volume: "moderado", tipo: [] },
      dor: THRESHOLD_DOR_ONCOLOGICA,
    });
    const decisao = decidirCaso(caso);
    // Dimensões aplicáveis: odor, exsudado (sempre), dor. Hemorragia não (sem sanguinolento).
    const resposta = fabricarRespostaVazia({
      tratamentosSelecionados: ["paliativo_odor"],
    });
    const resultado = avaliarOncologico(caso, resposta, decisao);
    const aplicaveis = resultado.dimensoes.filter((d) => d.aplicavel);
    expect(aplicaveis).toHaveLength(3); // odor, exsudado, dor
    expect(resultado.pontuacaoPercentual).toBeCloseTo((1 / 3) * 100);
  });

  it("dor abaixo do threshold não é dimensão aplicável", () => {
    const caso = fabricarCasoBase({
      etiologia: "oncologica_maligna",
      dor: THRESHOLD_DOR_ONCOLOGICA - 1,
    });
    const decisao = decidirCaso(caso);
    const resultado = avaliarOncologico(caso, fabricarRespostaVazia(), decisao);
    const dimensaoDor = resultado.dimensoes.find((d) => d.dimensao === "dor");
    expect(dimensaoDor?.aplicavel).toBe(false);
  });
});
