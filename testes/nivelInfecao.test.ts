import { describe, expect, it } from "vitest";
import { derivarNivelInfecao } from "../algoritmo/nivelInfecao";
import { fabricarCasoBase } from "./utilidadesTeste";

describe("derivarNivelInfecao", () => {
  it("sem_sinais quando nenhum sinal presente", () => {
    const caso = fabricarCasoBase();
    expect(derivarNivelInfecao(caso.sinais_infecao, caso.exsudado, false)).toBe("sem_sinais");
  });

  it("infecao_propagacao_sistemica tem prioridade sobre tudo o resto", () => {
    const caso = fabricarCasoBase({
      sinais_infecao: {
        ...fabricarCasoBase().sinais_infecao,
        febre: true,
        eritema: "forte",
        calor_local: true,
      },
    });
    expect(derivarNivelInfecao(caso.sinais_infecao, caso.exsudado, false)).toBe(
      "infecao_propagacao_sistemica",
    );
  });

  it("infecao_local_overt com eritema ligeiro", () => {
    const caso = fabricarCasoBase({
      sinais_infecao: { ...fabricarCasoBase().sinais_infecao, eritema: "ligeiro" },
    });
    expect(derivarNivelInfecao(caso.sinais_infecao, caso.exsudado, false)).toBe(
      "infecao_local_overt",
    );
  });

  it("infecao_local_overt via exsudado purulento", () => {
    const caso = fabricarCasoBase({ exsudado: { volume: "abundante", tipo: ["purulento"] } });
    expect(derivarNivelInfecao(caso.sinais_infecao, caso.exsudado, false)).toBe(
      "infecao_local_overt",
    );
  });

  it("infecao_local_covert com exatamente 2 sinais covert", () => {
    const caso = fabricarCasoBase({
      sinais_infecao: {
        ...fabricarCasoBase().sinais_infecao,
        dor_aumentada: true,
        tecido_friavel: true,
      },
    });
    expect(derivarNivelInfecao(caso.sinais_infecao, caso.exsudado, false)).toBe(
      "infecao_local_covert",
    );
  });

  it("sem_sinais com apenas 1 sinal covert (abaixo do threshold)", () => {
    const caso = fabricarCasoBase({
      sinais_infecao: { ...fabricarCasoBase().sinais_infecao, dor_aumentada: true },
    });
    expect(derivarNivelInfecao(caso.sinais_infecao, caso.exsudado, false)).toBe("sem_sinais");
  });

  it("hipergranulacao conta para o threshold covert (referência cruzada)", () => {
    const caso = fabricarCasoBase({
      sinais_infecao: { ...fabricarCasoBase().sinais_infecao, quebra_ferida_nova: true },
    });
    expect(derivarNivelInfecao(caso.sinais_infecao, caso.exsudado, true)).toBe(
      "infecao_local_covert",
    );
  });
});
