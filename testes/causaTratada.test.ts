import { describe, expect, it } from "vitest";
import { avaliarCausaTratada, TETO_CAUSA_NAO_TRATADA } from "../algoritmo/causaTratada";
import type { CategoriaTratamento } from "../tipos/tratamento";
import { fabricarCasoBase, fabricarRespostaVazia } from "./utilidadesTeste";

const COM_COMPRESSAO: CategoriaTratamento[] = ["terapia_compressiva"];
const SEM_COMPRESSAO: CategoriaTratamento[] = [];

describe("avaliarCausaTratada", () => {
  it("venosa (compressão aplicável) sem compressão selecionada fica limitada ao teto", () => {
    const caso = fabricarCasoBase({ etiologia: "venosa" });
    const resultado = avaliarCausaTratada(caso, fabricarRespostaVazia(), COM_COMPRESSAO);
    expect(resultado.aplicavel).toBe(true);
    expect(resultado.itemPresente).toBe(false);
    expect(resultado.tetoPontuacao).toBe(TETO_CAUSA_NAO_TRATADA);
  });

  it("venosa (compressão aplicável) com compressão selecionada satisfaz o checklist", () => {
    const caso = fabricarCasoBase({ etiologia: "venosa" });
    const resposta = fabricarRespostaVazia({
      tratamentosSelecionados: ["compressao_alta_pressao"],
    });
    expect(avaliarCausaTratada(caso, resposta, COM_COMPRESSAO).itemPresente).toBe(true);
  });

  it("venosa com ABPI fora de intervalo (terapia_compressiva não aplicável) aceita referenciação vascular em vez de compressão", () => {
    const caso = fabricarCasoBase({ etiologia: "venosa", abpi: 0.45 });
    const semReferenciacao = avaliarCausaTratada(caso, fabricarRespostaVazia(), SEM_COMPRESSAO);
    expect(semReferenciacao.itemPresente).toBe(false);
    // Selecionar compressão aqui não deveria satisfazer o checklist — não é a resposta certa quando ABPI a contraindica.
    const comCompressaoIndevida = avaliarCausaTratada(
      caso,
      fabricarRespostaVazia({ tratamentosSelecionados: ["compressao_alta_pressao"] }),
      SEM_COMPRESSAO,
    );
    expect(comCompressaoIndevida.itemPresente).toBe(false);
    const comReferenciacao = avaliarCausaTratada(
      caso,
      fabricarRespostaVazia({ medidasCausais: { referenciacaoVascular: true } }),
      SEM_COMPRESSAO,
    );
    expect(comReferenciacao.itemPresente).toBe(true);
  });

  it("arterial/mista exige referenciacaoVascular", () => {
    const caso = fabricarCasoBase({ etiologia: "arterial" });
    expect(avaliarCausaTratada(caso, fabricarRespostaVazia(), SEM_COMPRESSAO).itemPresente).toBe(
      false,
    );
    expect(
      avaliarCausaTratada(
        caso,
        fabricarRespostaVazia({ medidasCausais: { referenciacaoVascular: true } }),
        SEM_COMPRESSAO,
      ).itemPresente,
    ).toBe(true);
  });

  it("pé diabético exige descarga E controlo glicémico em conjunto", () => {
    const caso = fabricarCasoBase({ etiologia: "pe_diabetico_neuropatico" });
    expect(
      avaliarCausaTratada(
        caso,
        fabricarRespostaVazia({ medidasCausais: { descargaOffloading: true } }),
        SEM_COMPRESSAO,
      ).itemPresente,
    ).toBe(false);
    expect(
      avaliarCausaTratada(
        caso,
        fabricarRespostaVazia({
          medidasCausais: { descargaOffloading: true, controloGlicemicoReferenciado: true },
        }),
        SEM_COMPRESSAO,
      ).itemPresente,
    ).toBe(true);
  });

  it("cirurgica/traumatica/outra não têm teto", () => {
    for (const etiologia of ["cirurgica", "traumatica", "outra"] as const) {
      expect(
        avaliarCausaTratada(fabricarCasoBase({ etiologia }), fabricarRespostaVazia(), SEM_COMPRESSAO)
          .aplicavel,
      ).toBe(false);
    }
  });

  it("oncologica_maligna não usa este checklist", () => {
    expect(
      avaliarCausaTratada(
        fabricarCasoBase({ etiologia: "oncologica_maligna" }),
        fabricarRespostaVazia(),
        SEM_COMPRESSAO,
      ).aplicavel,
    ).toBe(false);
  });
});
