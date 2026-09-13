import { describe, expect, it } from "vitest";
import { explicarNivelInfecao } from "../lib/explicarNivelInfecao";
import type { SinaisInfecaoInput } from "../tipos/variaveis";

const SINAIS_NEUTROS: SinaisInfecaoInput = {
  dor_aumentada: false,
  tecido_friavel: false,
  odor: "ausente",
  atraso_cicatrizacao: false,
  quebra_ferida_nova: false,
  eritema: "ausente",
  calor_local: false,
  edema_local: false,
  celulite: false,
  linfangite: false,
  abcesso: false,
  febre: false,
  leucocitose: false,
};

describe("explicarNivelInfecao", () => {
  it("sem sinais presentes, as 3 listas ficam vazias", () => {
    const r = explicarNivelInfecao(SINAIS_NEUTROS, { volume: "ausente", tipo: [] }, false, "sem_sinais");
    expect(r.sinaisPropagacao).toEqual([]);
    expect(r.sinaisOvert).toEqual([]);
    expect(r.sinaisCovert).toEqual([]);
  });

  it("lista os sinais de propagação presentes", () => {
    const sinais: SinaisInfecaoInput = { ...SINAIS_NEUTROS, febre: true, celulite: true };
    const r = explicarNivelInfecao(sinais, { volume: "ausente", tipo: [] }, false, "infecao_propagacao_sistemica");
    expect(r.sinaisPropagacao).toEqual(["Celulite", "Febre"]);
  });

  it("inclui exsudado purulento como sinal overt por referência cruzada", () => {
    const r = explicarNivelInfecao(SINAIS_NEUTROS, { volume: "moderado", tipo: ["purulento"] }, false, "infecao_local_overt");
    expect(r.sinaisOvert).toContain("Exsudado purulento");
  });

  it("inclui eritema com o nível quando presente", () => {
    const sinais: SinaisInfecaoInput = { ...SINAIS_NEUTROS, eritema: "moderado" };
    const r = explicarNivelInfecao(sinais, { volume: "ausente", tipo: [] }, false, "infecao_local_overt");
    expect(r.sinaisOvert).toContain("Eritema (moderado)");
  });

  it("inclui hipergranulação como sinal covert por referência cruzada a tipo_tecido_leito", () => {
    const r = explicarNivelInfecao(SINAIS_NEUTROS, { volume: "ausente", tipo: [] }, true, "infecao_local_covert");
    expect(r.sinaisCovert).toContain("Hipergranulação (tipo_tecido_leito)");
  });

  it("devolve o nível tal como passado, sem recalcular", () => {
    const r = explicarNivelInfecao(SINAIS_NEUTROS, { volume: "ausente", tipo: [] }, false, "infecao_propagacao_sistemica");
    expect(r.nivel).toBe("infecao_propagacao_sistemica");
  });
});
