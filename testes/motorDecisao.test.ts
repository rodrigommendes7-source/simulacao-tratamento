import { describe, expect, it } from "vitest";
import { decidirCaso } from "../algoritmo/motorDecisao";
import { fabricarCasoBase, tecidoDe } from "./utilidadesTeste";

describe("decidirCaso", () => {
  it("ferida com necrose seca torna desbridamento aplicável e cirúrgico válido", () => {
    const caso = fabricarCasoBase({
      tipo_tecido_leito: tecidoDe(["necrose_seca"]),
    });
    const decisao = decidirCaso(caso);
    expect(decisao.categoriasAplicaveis).toContain("desbridamento");
    const ids = decisao.tratamentosValidos.desbridamento?.map((t) => t.id) ?? [];
    expect(ids).toContain("desbridamento_cirurgico");
  });

  it("ferida sem tecido necrótico não torna desbridamento aplicável", () => {
    const caso = fabricarCasoBase({
      tipo_tecido_leito: tecidoDe(["granulacao"]),
    });
    const decisao = decidirCaso(caso);
    expect(decisao.categoriasAplicaveis).not.toContain("desbridamento");
  });

  it("exsudado abundante torna espuma/alginato/hidrofibra válidos e não hidrocoloide/filme", () => {
    const caso = fabricarCasoBase({ exsudado: { volume: "abundante", tipo: [] } });
    const decisao = decidirCaso(caso);
    const ids = decisao.tratamentosValidos.pensos_humidade?.map((t) => t.id) ?? [];
    expect(ids).toContain("penso_espuma");
    expect(ids).toContain("penso_alginato");
    expect(ids).toContain("penso_hidrofibra");
    expect(ids).not.toContain("penso_hidrocoloide");
    expect(ids).not.toContain("penso_filme_transparente");
  });

  it("antimicrobianos não aplicável quando sem_sinais (uso profilático não recomendado)", () => {
    const caso = fabricarCasoBase();
    const decisao = decidirCaso(caso);
    expect(decisao.nivelInfecao).toBe("sem_sinais");
    expect(decisao.categoriasAplicaveis).not.toContain("antimicrobianos");
  });

  it("antimicrobianos aplicável com sinais de infeção, prata sempre válida", () => {
    const caso = fabricarCasoBase({
      sinais_infecao: {
        ...fabricarCasoBase().sinais_infecao,
        eritema: "moderado",
      },
    });
    const decisao = decidirCaso(caso);
    expect(decisao.categoriasAplicaveis).toContain("antimicrobianos");
    const ids = decisao.tratamentosValidos.antimicrobianos?.map((t) => t.id) ?? [];
    expect(ids).toContain("antimicrobiano_prata");
  });

  it("terapia compressiva aplicável só dentro de ABPI 0,5-1,3 em venosa/mista", () => {
    const dentro = decidirCaso(fabricarCasoBase({ etiologia: "venosa", abpi: 0.9 }));
    expect(dentro.categoriasAplicaveis).toContain("terapia_compressiva");
    expect(
      dentro.tratamentosValidos.terapia_compressiva?.map((t) => t.id),
    ).toContain("compressao_alta_pressao");

    const foraBaixo = decidirCaso(fabricarCasoBase({ etiologia: "venosa", abpi: 0.3 }));
    expect(foraBaixo.categoriasAplicaveis).not.toContain("terapia_compressiva");

    const arterial = decidirCaso(fabricarCasoBase({ etiologia: "arterial", abpi: 0.9 }));
    expect(arterial.categoriasAplicaveis).not.toContain("terapia_compressiva");
  });
});
