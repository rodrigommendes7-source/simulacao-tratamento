import { describe, expect, it } from "vitest";
import { avaliarResposta } from "../algoritmo/avaliarResposta";
import { decidirCaso } from "../algoritmo/motorDecisao";
import { TETO_CAUSA_NAO_TRATADA } from "../algoritmo/causaTratada";
import { PESO_FALSO_POSITIVO } from "../algoritmo/penalizacao";
import { LABEL_CATEGORIA } from "../lib/etiquetas";
import type { CategoriaTratamento } from "../tipos/tratamento";
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

  it("uma categoria não aplicável escolhida desconta meia unidade de pontuação", () => {
    const caso = fabricarCasoBase({
      etiologia: "traumatica",
      exsudado: { volume: "moderado", tipo: [] },
    });
    const decisao = decidirCaso(caso);
    const aplicaveis = decisao.categoriasAplicaveis;
    const naoAplicavel = (Object.keys(LABEL_CATEGORIA) as CategoriaTratamento[]).find(
      (c) => !aplicaveis.includes(c),
    )!;
    const tratamentosPerfeitos = [
      "penso_espuma",
      "penso_hidrofibra",
      "penso_hidrocoloide",
      "soro_fisiologico",
      "npwt",
    ];

    const certo = avaliarResposta(
      caso,
      fabricarRespostaVazia({
        tratamentosSelecionados: tratamentosPerfeitos,
        categoriasSelecionadas: aplicaveis,
      }),
    );
    expect(certo.pontuacaoFinalPercentual).toBe(100);
    expect(certo.falsosPositivos.categorias).toEqual([]);

    const comExtra = avaliarResposta(
      caso,
      fabricarRespostaVazia({
        tratamentosSelecionados: tratamentosPerfeitos,
        categoriasSelecionadas: [...aplicaveis, naoAplicavel],
      }),
    );
    expect(comExtra.falsosPositivos.categorias).toEqual([naoAplicavel]);
    // Peso assimétrico: um falso positivo custa metade do que vale acertar
    // numa categoria aplicável.
    const valorDaUnidade = 100 / comExtra.falsosPositivos.unidades;
    expect(PESO_FALSO_POSITIVO).toBe(0.5);
    expect(comExtra.pontuacaoFinalPercentual).toBeCloseTo(
      100 - valorDaUnidade * PESO_FALSO_POSITIVO,
      6,
    );
    // Um erro isolado tem de continuar a doer o suficiente para se ver.
    expect(comExtra.pontuacaoFinalPercentual).toBeLessThan(95);
  });

  it("escolher todas as categorias deixa de dar 100 e nunca desce abaixo de 0", () => {
    const caso = fabricarCasoBase({
      etiologia: "traumatica",
      exsudado: { volume: "moderado", tipo: [] },
    });
    const todas = Object.keys(LABEL_CATEGORIA) as CategoriaTratamento[];
    const decisao = decidirCaso(caso);
    const resultado = avaliarResposta(
      caso,
      fabricarRespostaVazia({
        tratamentosSelecionados: decisao.categoriasAplicaveis.flatMap((c) =>
          (decisao.tratamentosValidos[c] ?? []).map((t) => t.id),
        ),
        categoriasSelecionadas: todas,
      }),
    );
    expect(resultado.falsosPositivos.categorias.length).toBeGreaterThan(0);
    expect(resultado.pontuacaoFinalPercentual).toBeLessThan(100);
    expect(resultado.pontuacaoFinalPercentual).toBeGreaterThanOrEqual(0);
  });

  it("sem categoriasSelecionadas não há falsos positivos a considerar", () => {
    // Os chamadores informativos (Consulta pontual) não preenchem o campo.
    const caso = fabricarCasoBase({ etiologia: "traumatica" });
    const resultado = avaliarResposta(caso, fabricarRespostaVazia());
    expect(resultado.falsosPositivos.categorias).toEqual([]);
    expect(resultado.falsosPositivos.pontosDescontados).toBe(0);
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
