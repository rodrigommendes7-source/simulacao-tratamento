import { describe, expect, it } from "vitest";
import { decidirCaso } from "../algoritmo/motorDecisao";
import { avaliarCausaTratada } from "../algoritmo/causaTratada";
import { categoriaRelevante, categoriasParaMostrar, mostrarNivelInfecao, sinaisInfecaoPreenchidos } from "../lib/relevanciaResultado";
import { SINAIS_NEUTROS, casoDaConsulta } from "../lib/casoDaConsulta";
import { construirPassos, indiceProximoPasso, limparRespostasObsoletas, sequenciaCompleta } from "../lib/sequenciaConsulta";
import type { RespostasConsulta } from "../lib/sequenciaConsulta";

function resultado(respostas: RespostasConsulta) {
  const caso = casoDaConsulta(respostas);
  return { caso, categorias: categoriasParaMostrar(caso, decidirCaso(caso)) };
}

const LESAO_PRESSAO: RespostasConsulta = {
  etiologia: ["pressao"],
  tecidos: ["esfacelo"],
  exsudado_volume: ["moderado"],
  exsudado_tipo: ["seroso"],
  bordos: ["aderentes_planos"],
  pele: ["integra"],
  profundidade: ["estadio_3"],
  dor: ["4"],
  sinais_infecao: [],
};

const VENOSA_ABPI_BAIXO: RespostasConsulta = {
  ...LESAO_PRESSAO,
  etiologia: ["venosa"],
  abpi: ["0.4"],
  profundidade: ["espessura_parcial"],
};

const VENOSA_ABPI_NORMAL: RespostasConsulta = { ...VENOSA_ABPI_BAIXO, abpi: ["0.95"] };

describe("relevância: categorias que não dizem respeito à ferida são omitidas", () => {
  it("a compressão não é mencionada numa lesão por pressão, nem como contraindicada", () => {
    const { caso, categorias } = resultado(LESAO_PRESSAO);
    expect(categoriaRelevante("terapia_compressiva", caso)).toBe(false);
    expect(categorias.map((c) => c.categoria)).not.toContain("terapia_compressiva");
  });

  it("a compressão é mencionada numa úlcera venosa com ABPI adequado", () => {
    const { caso, categorias } = resultado(VENOSA_ABPI_NORMAL);
    expect(categoriaRelevante("terapia_compressiva", caso)).toBe(true);
    const compressao = categorias.find((c) => c.categoria === "terapia_compressiva");
    expect(compressao?.aplicavel).toBe(true);
    expect(compressao?.indicados.length).toBeGreaterThan(0);
  });

  it("numa úlcera venosa com ABPI baixo a compressão continua relevante, mas como aviso", () => {
    const { caso, categorias } = resultado(VENOSA_ABPI_BAIXO);
    expect(categoriaRelevante("terapia_compressiva", caso)).toBe(true);
    const compressao = categorias.find((c) => c.categoria === "terapia_compressiva");
    // Relevante para a etiologia, mas não aplicável com este ABPI: se aparecer,
    // é para dizer que está contraindicada — nunca como indicada.
    expect(compressao?.aplicavel ?? false).toBe(false);
    expect(compressao?.indicados ?? []).toEqual([]);
  });

  it("os cuidados paliativos oncológicos só aparecem em ferida oncológica", () => {
    expect(categoriaRelevante("paliativos_oncologicos", resultado(LESAO_PRESSAO).caso)).toBe(false);
    const oncologica = resultado({ ...LESAO_PRESSAO, etiologia: ["oncologica_maligna"], profundidade: ["espessura_parcial"] });
    expect(categoriaRelevante("paliativos_oncologicos", oncologica.caso)).toBe(true);
  });
});

describe("relevância: infeção só se alguém a tiver avaliado", () => {
  it("sem sinais preenchidos não se fala de antimicrobianos nem de nível de infeção", () => {
    const { caso, categorias } = resultado(LESAO_PRESSAO);
    expect(sinaisInfecaoPreenchidos(caso.sinais_infecao)).toBe(false);
    expect(mostrarNivelInfecao(caso)).toBe(false);
    expect(categorias.map((c) => c.categoria)).not.toContain("antimicrobianos");
  });

  it("o passo de sinais deixado em branco não é o mesmo que 'sem sinais'", () => {
    // Ambos produzem o mesmo caso estrutural; a diferença está em não afirmar nada.
    expect(casoDaConsulta({ ...LESAO_PRESSAO, sinais_infecao: [] }).sinais_infecao).toEqual(SINAIS_NEUTROS);
    expect(mostrarNivelInfecao(casoDaConsulta({ ...LESAO_PRESSAO, sinais_infecao: [] }))).toBe(false);
  });

  it("com pelo menos um sinal marcado, o nível de infeção passa a ser mostrado", () => {
    const { caso } = resultado({ ...LESAO_PRESSAO, sinais_infecao: ["eritema", "calor_local"] });
    expect(sinaisInfecaoPreenchidos(caso.sinais_infecao)).toBe(true);
    expect(mostrarNivelInfecao(caso)).toBe(true);
  });

  it("com sinais de infeção, os antimicrobianos passam a ser mencionados", () => {
    const { categorias } = resultado({ ...LESAO_PRESSAO, sinais_infecao: ["eritema", "calor_local", "edema_local"] });
    expect(categorias.map((c) => c.categoria)).toContain("antimicrobianos");
  });
});

describe("categorias mostradas", () => {
  it("nunca se mostra uma categoria sem nada a dizer", () => {
    for (const respostas of [LESAO_PRESSAO, VENOSA_ABPI_BAIXO, VENOSA_ABPI_NORMAL]) {
      for (const c of resultado(respostas).categorias) {
        expect(c.indicados.length + c.contraindicados.length).toBeGreaterThan(0);
      }
    }
  });

  it("um tratamento nunca aparece ao mesmo tempo como indicado e contraindicado", () => {
    for (const respostas of [LESAO_PRESSAO, VENOSA_ABPI_BAIXO, VENOSA_ABPI_NORMAL]) {
      for (const c of resultado(respostas).categorias) {
        const indicados = new Set(c.indicados.map((t) => t.id));
        for (const contra of c.contraindicados) expect(indicados.has(contra.id)).toBe(false);
      }
    }
  });

  it("o desbridamento só aparece quando há tecido desvitalizado", () => {
    const comEsfacelo = resultado(LESAO_PRESSAO).categorias.map((c) => c.categoria);
    expect(comEsfacelo).toContain("desbridamento");
    const soGranulacao = resultado({ ...LESAO_PRESSAO, tecidos: ["granulacao"] }).categorias;
    const desbridamento = soGranulacao.find((c) => c.categoria === "desbridamento");
    expect(desbridamento?.aplicavel ?? false).toBe(false);
  });
});

describe("sequência guiada", () => {
  it("segue a ordem pedida", () => {
    const passos = construirPassos({ etiologia: ["pressao"], exsudado_volume: ["moderado"] });
    expect(passos.map((p) => p.id)).toEqual([
      "etiologia",
      "tecidos",
      "exsudado_volume",
      "exsudado_tipo",
      "bordos",
      "pele",
      "profundidade",
      "dor",
      "sinais_infecao",
    ]);
  });

  it("pergunta o ABPI nas etiologias vasculares, logo a seguir à etiologia", () => {
    const passos = construirPassos({ etiologia: ["venosa"] });
    expect(passos.map((p) => p.id).slice(0, 2)).toEqual(["etiologia", "abpi"]);
    expect(construirPassos({ etiologia: ["pressao"] }).map((p) => p.id)).not.toContain("abpi");
  });

  it("salta o tipo de exsudado quando não há exsudado", () => {
    const passos = construirPassos({ etiologia: ["pressao"], exsudado_volume: ["ausente"] });
    expect(passos.map((p) => p.id)).not.toContain("exsudado_tipo");
  });

  it("usa a escala NPIAP na lesão por pressão e a genérica nas restantes", () => {
    const pressao = construirPassos({ etiologia: ["pressao"] }).find((p) => p.id === "profundidade");
    expect(pressao?.titulo).toBe("Estadiamento");
    expect(pressao?.opcoes.map((o) => o.valor)).toContain("estadio_3");

    const venosa = construirPassos({ etiologia: ["venosa"] }).find((p) => p.id === "profundidade");
    expect(venosa?.opcoes.map((o) => o.valor)).toContain("espessura_parcial");
  });

  it("marca como múltiplos os passos que aceitam mais do que uma escolha", () => {
    const passos = construirPassos({ etiologia: ["pressao"], exsudado_volume: ["moderado"] });
    const multiplos = passos.filter((p) => p.multiplo).map((p) => p.id);
    expect(multiplos).toEqual(["tecidos", "exsudado_tipo", "bordos", "pele", "sinais_infecao"]);
  });

  it("só os sinais de infeção podem ficar por responder", () => {
    const passos = construirPassos({ etiologia: ["pressao"], exsudado_volume: ["moderado"] });
    expect(passos.filter((p) => p.opcional).map((p) => p.id)).toEqual(["sinais_infecao"]);
  });

  it("avança passo a passo e só fica completa no fim", () => {
    let respostas: RespostasConsulta = {};
    let passos = construirPassos(respostas);
    expect(indiceProximoPasso(passos, respostas)).toBe(0);
    expect(sequenciaCompleta(passos, respostas)).toBe(false);

    for (let guarda = 0; guarda < 20; guarda++) {
      passos = construirPassos(respostas);
      const i = indiceProximoPasso(passos, respostas);
      if (i === passos.length) break;
      respostas = { ...respostas, [passos[i].id]: [passos[i].opcoes[0].valor] };
    }
    passos = construirPassos(respostas);
    expect(sequenciaCompleta(passos, respostas)).toBe(true);
  });

  it("mudar de etiologia vascular para pressão descarta o ABPI já respondido", () => {
    const comAbpi: RespostasConsulta = { etiologia: ["venosa"], abpi: ["0.95"], tecidos: ["esfacelo"] };
    const passosDepois = construirPassos({ ...comAbpi, etiologia: ["pressao"] });
    const limpas = limparRespostasObsoletas(passosDepois, { ...comAbpi, etiologia: ["pressao"] });
    expect(limpas.abpi).toBeUndefined();
    expect(limpas.tecidos).toEqual(["esfacelo"]);
  });
});

describe("tratamento da causa como recomendação final", () => {
  const base: RespostasConsulta = {
    tecidos: ["esfacelo"],
    exsudado_volume: ["moderado"],
    exsudado_tipo: ["seroso"],
    bordos: ["aderentes_planos"],
    pele: ["integra"],
    profundidade: ["espessura_parcial"],
    dor: ["4"],
    sinais_infecao: [],
  };

  function causa(etiologia: string, extra: Partial<RespostasConsulta> = {}) {
    const caso = casoDaConsulta({ ...base, etiologia: [etiologia], ...extra });
    return avaliarCausaTratada(caso, { tratamentosSelecionados: [], medidasCausais: {} }, decidirCaso(caso).categoriasAplicaveis);
  }

  it("não se aplica a ferida cirúrgica, traumática nem oncológica", () => {
    expect(causa("cirurgica").aplicavel).toBe(false);
    expect(causa("traumatica").aplicavel).toBe(false);
    // A oncológica tem modelo próprio (4 dimensões), não este checklist.
    expect(causa("oncologica_maligna").aplicavel).toBe(false);
  });

  it("aplica-se às etiologias que têm causa a tratar, com o item concreto", () => {
    expect(causa("pressao", { profundidade: ["estadio_3"] })).toMatchObject({
      aplicavel: true,
      descricaoItem: "Alívio de pressão / reposicionamento",
    });
    expect(causa("venosa", { abpi: ["0.95"] })).toMatchObject({
      aplicavel: true,
      descricaoItem: "Alguma forma de compressão",
    });
    // Com ABPI fora do intervalo a resposta certa deixa de ser compressão.
    expect(causa("venosa", { abpi: ["0.4"] }).descricaoItem).toContain("Referenciação vascular");
    expect(causa("pe_diabetico_neuropatico").aplicavel).toBe(true);
  });
});
