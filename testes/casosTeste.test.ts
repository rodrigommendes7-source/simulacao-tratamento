import { describe, expect, it } from "vitest";
import { avaliarResposta } from "../algoritmo/avaliarResposta";
import { avaliarIdentificacao } from "../algoritmo/avaliarIdentificacao";
import { decidirCaso } from "../algoritmo/motorDecisao";
import { TODOS_CASOS_TESTE } from "../dados/casosTeste";
import type { RespostaIdentificacao } from "../tipos/identificacao";
import { construirRespostaPerfeita, pontoInteriorPoligono } from "./utilidadesTeste";

describe("os 5 casos de teste (5-casos-teste-traduzidos.md)", () => {
  it.each(TODOS_CASOS_TESTE)(
    "$titulo: existe pelo menos uma resposta que atinge 100%",
    ({ caso }) => {
      const decisao = decidirCaso(caso);
      const resposta = construirRespostaPerfeita(caso, decisao);
      const resultado = avaliarResposta(caso, resposta);

      if (resultado.pontuacaoFinalPercentual !== 100) {
        // Reportar exatamente a falha, como pedido — não corrigir a regra aqui.
        console.error("FALHA DE COMPLETUDE NUM CASO CONCRETO:", {
          caso: caso.etiologia,
          categoriasAplicaveis: decisao.categoriasAplicaveis,
          correspondencia: resultado.correspondenciaPorCategoria,
          causaTratada: resultado.causaTratada,
          portaoSistemico: resultado.portaoSistemico,
        });
      }
      expect(resultado.pontuacaoMaximaPossivel).toBe(100);
      expect(resultado.pontuacaoFinalPercentual).toBe(100);
    },
  );

  it.each(TODOS_CASOS_TESTE)(
    "$titulo: existe uma resposta de identificação que atinge 100% (ponto 2 da correção pós-implementação)",
    ({ caso }) => {
      const nivelInfecaoProposto = decidirCaso(caso).nivelInfecao;
      const resposta: RespostaIdentificacao = {
        pins: caso.tipo_tecido_leito.map((zona) => ({ tipo: zona.tipo, ...pontoInteriorPoligono(zona.poligono) })),
        exsudado: caso.exsudado,
        bordos: caso.bordos,
        pele_perilesional: caso.pele_perilesional,
        nivelInfecaoProposto,
      };
      const resultado = avaliarIdentificacao(caso, resposta);
      expect(resultado.pontuacaoFinalPercentual).toBe(100);
    },
  );

  it("caso 1 (pressão): desbridamento e pensos de humidade aplicáveis, sem infeção", () => {
    const decisao = decidirCaso(TODOS_CASOS_TESTE[0].caso);
    expect(decisao.nivelInfecao).toBe("sem_sinais");
    expect(decisao.categoriasAplicaveis).toContain("desbridamento");
    expect(decisao.categoriasAplicaveis).toContain("pensos_humidade");
    expect(decisao.categoriasAplicaveis).not.toContain("antimicrobianos");
  });

  it("caso 4 (venosa, ABPI 0,45): terapia_compressiva fica NÃO aplicável, checklist aceita referenciação vascular", () => {
    const caso = TODOS_CASOS_TESTE[3].caso;
    expect(caso.abpi).toBe(0.45);
    const decisao = decidirCaso(caso);

    // Não "aplicável mas vazia" — não aplicável mesmo.
    expect(decisao.categoriasAplicaveis).not.toContain("terapia_compressiva");
    expect(decisao.tratamentosValidos.terapia_compressiva).toBeUndefined();

    const resultado = avaliarResposta(caso, {
      tratamentosSelecionados: [],
      medidasCausais: { referenciacaoVascular: true },
    });
    expect(resultado.causaTratada?.itemPresente).toBe(true);
    expect(resultado.causaTratada?.descricaoItem).toMatch(/[Rr]eferenciação vascular/);

    // Selecionar compressão aqui seria clinicamente errado (ABPI contraindica) e não deve satisfazer o checklist.
    const resultadoComCompressaoIndevida = avaliarResposta(caso, {
      tratamentosSelecionados: ["compressao_alta_pressao"],
      medidasCausais: {},
    });
    expect(resultadoComCompressaoIndevida.causaTratada?.itemPresente).toBe(false);
  });

  it("caso 5 (venosa, ABPI 0,9): compressão de alta pressão válida, nivel_infecao = infecao_local_overt", () => {
    const caso = TODOS_CASOS_TESTE[4].caso;
    expect(caso.abpi).toBe(0.9);
    const decisao = decidirCaso(caso);

    expect(decisao.nivelInfecao).toBe("infecao_local_overt");
    expect(decisao.categoriasAplicaveis).toContain("terapia_compressiva");
    const idsCompressao = decisao.tratamentosValidos.terapia_compressiva?.map((t) => t.id) ?? [];
    expect(idsCompressao).toContain("compressao_alta_pressao");
  });
});
