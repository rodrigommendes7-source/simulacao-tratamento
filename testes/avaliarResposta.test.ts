import { describe, expect, it } from "vitest";
import { avaliarResposta } from "../algoritmo/avaliarResposta";
import { TETO_CAUSA_NAO_TRATADA } from "../algoritmo/causaTratada";
import { fabricarCasoBase, fabricarRespostaVazia } from "./utilidadesTeste";

describe("avaliarResposta", () => {
  it("resposta perfeita numa etiologia sem teto atinge 100%", () => {
    const caso = fabricarCasoBase({
      etiologia: "traumatica",
      exsudado: { volume: "moderado", tipo: [] },
    });
    const resposta = fabricarRespostaVazia({
      // caso por omissão tem tipo_tecido_leito = granulacao, o que torna
      // pressao_negativa (NPWT) também aplicável — tem de ser incluído para 100%.
      // volume=moderado também torna hidrocoloide válido, além de espuma/hidrofibra.
      tratamentosSelecionados: [
        "penso_espuma",
        "penso_hidrofibra",
        "penso_hidrocoloide",
        "soro_fisiologico",
        "npwt",
      ],
    });
    const resultado = avaliarResposta(caso, resposta);
    expect(resultado.pontuacaoMaximaPossivel).toBe(100);
    expect(resultado.pontuacaoFinalPercentual).toBe(100);
  });

  it("venosa com tratamento tópico perfeito mas sem compressão fica limitada ao teto de 40%", () => {
    const caso = fabricarCasoBase({ etiologia: "venosa", exsudado: { volume: "moderado", tipo: [] } });
    const resposta = fabricarRespostaVazia({
      tratamentosSelecionados: ["penso_espuma", "penso_hidrofibra", "soro_fisiologico"],
    });
    const resultado = avaliarResposta(caso, resposta);
    expect(resultado.causaTratada?.itemPresente).toBe(false);
    expect(resultado.pontuacaoMaximaPossivel).toBe(TETO_CAUSA_NAO_TRATADA);
    expect(resultado.pontuacaoFinalPercentual).toBeLessThanOrEqual(TETO_CAUSA_NAO_TRATADA);
  });

  it("infecao_propagacao_sistemica sem referenciação limita a pontuação independentemente da qualidade tópica", () => {
    const caso = fabricarCasoBase({
      etiologia: "traumatica",
      sinais_infecao: { ...fabricarCasoBase().sinais_infecao, febre: true },
    });
    const decisaoTopicaPerfeita = fabricarRespostaVazia({
      tratamentosSelecionados: [
        "antimicrobiano_prata",
        "penso_espuma",
        "penso_hidrofibra",
        "soro_fisiologico",
        "antisseptico_limpeza",
      ],
    });
    const resultado = avaliarResposta(caso, decisaoTopicaPerfeita);
    expect(resultado.portaoSistemico.aplicavel).toBe(true);
    expect(resultado.portaoSistemico.satisfeito).toBe(false);
    expect(resultado.pontuacaoFinalPercentual).toBeLessThanOrEqual(
      resultado.pontuacaoMaximaPossivel,
    );
  });
});
