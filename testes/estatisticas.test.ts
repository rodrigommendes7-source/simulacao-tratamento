import { describe, expect, it } from "vitest";
import {
  calcularResumoGeral,
  calcularEvolucao,
  calcularDesempenhoPorFase,
  calcularDesempenhoPorEtiologia,
  calcularDesempenhoTratamentos,
  calcularCobertura,
} from "../lib/estatisticas";
import type { EntradaHistorico } from "../tipos/historico";
import type { Etiologia } from "../tipos/variaveis";

function entrada(overrides: Partial<EntradaHistorico> & { pontuacaoFinal: number }): EntradaHistorico {
  return {
    casoId: "caso_x",
    titulo: "Caso X",
    etiologia: "venosa",
    data: new Date().toISOString(),
    identificacao: {
      pontuacaoPercentual: overrides.pontuacaoFinal,
      tecidoPercentual: 100,
      exsudadoVolumeCorreto: true,
      exsudadoTipoCorreto: true,
      bordosCorretos: true,
      peleCorreta: true,
      nivelInfecaoCorreto: true,
    },
    correspondenciaTratamento: [],
    pontuacaoTratamento: overrides.pontuacaoFinal,
    correspondenciaTecnicas: [],
    pontuacaoTecnicas: 100,
    correspondenciaJustificacoes: [],
    pontuacaoJustificacoes: null,
    ...overrides,
  };
}

describe("calcularResumoGeral", () => {
  it("histórico vazio devolve tendência insuficiente e zeros", () => {
    const r = calcularResumoGeral([]);
    expect(r).toEqual({ totalCasos: 0, mediaGeral: 0, mediaRecente: 0, janelaRecente: 0, tendencia: "insuficiente" });
  });

  it("com poucos casos (menos que 2×n), tendência é insuficiente mas as médias são calculadas", () => {
    const historico = [entrada({ pontuacaoFinal: 80 }), entrada({ pontuacaoFinal: 60 })];
    const r = calcularResumoGeral(historico, 5);
    expect(r.totalCasos).toBe(2);
    expect(r.mediaGeral).toBe(70);
    expect(r.tendencia).toBe("insuficiente");
  });

  it("deteta subida quando a média recente é claramente maior que a anterior", () => {
    const antigos = Array.from({ length: 3 }, () => entrada({ pontuacaoFinal: 40, data: "2026-01-01T00:00:00.000Z" }));
    const recentes = Array.from({ length: 3 }, () => entrada({ pontuacaoFinal: 90, data: "2026-02-01T00:00:00.000Z" }));
    const r = calcularResumoGeral([...antigos, ...recentes], 3);
    expect(r.tendencia).toBe("subida");
    expect(r.mediaRecente).toBe(90);
  });

  it("deteta descida quando a média recente é claramente menor", () => {
    const antigos = Array.from({ length: 3 }, () => entrada({ pontuacaoFinal: 90, data: "2026-01-01T00:00:00.000Z" }));
    const recentes = Array.from({ length: 3 }, () => entrada({ pontuacaoFinal: 40, data: "2026-02-01T00:00:00.000Z" }));
    const r = calcularResumoGeral([...antigos, ...recentes], 3);
    expect(r.tendencia).toBe("descida");
  });

  it("considera estável quando a diferença é pequena", () => {
    const antigos = Array.from({ length: 3 }, () => entrada({ pontuacaoFinal: 70, data: "2026-01-01T00:00:00.000Z" }));
    const recentes = Array.from({ length: 3 }, () => entrada({ pontuacaoFinal: 71, data: "2026-02-01T00:00:00.000Z" }));
    const r = calcularResumoGeral([...antigos, ...recentes], 3);
    expect(r.tendencia).toBe("estavel");
  });
});

describe("calcularEvolucao", () => {
  it("ordena por data crescente, independentemente da ordem de entrada no array", () => {
    const historico = [
      entrada({ pontuacaoFinal: 50, data: "2026-03-01T00:00:00.000Z", titulo: "Terceiro" }),
      entrada({ pontuacaoFinal: 90, data: "2026-01-01T00:00:00.000Z", titulo: "Primeiro" }),
      entrada({ pontuacaoFinal: 70, data: "2026-02-01T00:00:00.000Z", titulo: "Segundo" }),
    ];
    const evolucao = calcularEvolucao(historico);
    expect(evolucao.map((e) => e.titulo)).toEqual(["Primeiro", "Segundo", "Terceiro"]);
    expect(evolucao.map((e) => e.indice)).toEqual([1, 2, 3]);
  });
});

describe("calcularDesempenhoPorFase", () => {
  it("histórico vazio devolve tudo null", () => {
    const r = calcularDesempenhoPorFase([]);
    expect(r.amostras).toBe(0);
    expect(r.identificacaoMedia).toBeNull();
    expect(r.justificacaoMedia).toBeNull();
  });

  it("agrega médias de identificação, tratamento e técnica corretamente", () => {
    const historico = [
      entrada({ pontuacaoFinal: 80, pontuacaoTratamento: 100, pontuacaoTecnicas: 50 }),
      entrada({ pontuacaoFinal: 60, pontuacaoTratamento: 0, pontuacaoTecnicas: 100 }),
    ];
    const r = calcularDesempenhoPorFase(historico);
    expect(r.tratamentoMedia).toBe(50);
    expect(r.tecnicaMedia).toBe(75);
  });

  it("ignora entradas sem pontuacaoJustificacoes ao calcular a média de justificação", () => {
    const historico = [
      entrada({ pontuacaoFinal: 80, pontuacaoJustificacoes: null }),
      entrada({ pontuacaoFinal: 80, pontuacaoJustificacoes: 60 }),
      entrada({ pontuacaoFinal: 80, pontuacaoJustificacoes: 100 }),
    ];
    const r = calcularDesempenhoPorFase(historico);
    expect(r.justificacaoMedia).toBe(80);
  });

  it("calcula a percentagem de acerto por variável de identificação como percentagem de casos corretos", () => {
    const historico = [
      entrada({ pontuacaoFinal: 80, identificacao: { pontuacaoPercentual: 80, tecidoPercentual: 100, exsudadoVolumeCorreto: true, exsudadoTipoCorreto: true, bordosCorretos: false, peleCorreta: true, nivelInfecaoCorreto: true } }),
      entrada({ pontuacaoFinal: 80, identificacao: { pontuacaoPercentual: 80, tecidoPercentual: 50, exsudadoVolumeCorreto: false, exsudadoTipoCorreto: true, bordosCorretos: false, peleCorreta: true, nivelInfecaoCorreto: true } }),
    ];
    const r = calcularDesempenhoPorFase(historico);
    expect(r.identificacaoPorVariavel?.tecido).toBe(75);
    expect(r.identificacaoPorVariavel?.exsudadoVolume).toBe(50);
    expect(r.identificacaoPorVariavel?.bordos).toBe(0);
    expect(r.identificacaoPorVariavel?.pele).toBe(100);
  });
});

describe("calcularDesempenhoPorEtiologia", () => {
  it("inclui todas as 9 etiologias mesmo sem nenhuma tentativa", () => {
    const r = calcularDesempenhoPorEtiologia([]);
    expect(r).toHaveLength(9);
    expect(r.every((e) => e.tentativas === 0 && e.media === null)).toBe(true);
  });

  it("não omite etiologias nunca tentadas quando há histórico noutras", () => {
    const historico = [entrada({ pontuacaoFinal: 80, etiologia: "venosa" as Etiologia })];
    const r = calcularDesempenhoPorEtiologia(historico);
    const arterial = r.find((e) => e.etiologia === "arterial");
    expect(arterial?.tentativas).toBe(0);
    expect(arterial?.media).toBeNull();
    const venosa = r.find((e) => e.etiologia === "venosa");
    expect(venosa?.tentativas).toBe(1);
    expect(venosa?.media).toBe(80);
  });
});

describe("calcularDesempenhoTratamentos", () => {
  it("agrega a taxa de acerto por categoria a partir de correspondenciaTratamento", () => {
    const historico = [
      entrada({
        pontuacaoFinal: 80,
        correspondenciaTratamento: [
          { categoria: "desbridamento", idsEsperados: ["a"], idsSelecionados: ["a"], idsCorretos: ["a"], pontuacaoPercentual: 100 },
        ],
      }),
      entrada({
        pontuacaoFinal: 80,
        correspondenciaTratamento: [
          { categoria: "desbridamento", idsEsperados: ["a"], idsSelecionados: [], idsCorretos: [], pontuacaoPercentual: 0 },
        ],
      }),
    ];
    const r = calcularDesempenhoTratamentos(historico);
    const desbridamento = r.find((t) => t.id === "desbridamento");
    expect(desbridamento?.tentativas).toBe(2);
    expect(desbridamento?.taxaAcerto).toBe(50);
  });

  it("categorias nunca aplicáveis no histórico ficam sem dados (null), não omitidas", () => {
    const r = calcularDesempenhoTratamentos([]);
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((t) => t.taxaAcerto === null && t.tentativas === 0)).toBe(true);
  });

  it("agrega a taxa de acerto por técnica a partir de correspondenciaTecnicas, só contando quando esperada", () => {
    const historico = [
      entrada({
        pontuacaoFinal: 80,
        correspondenciaTecnicas: [{ tecnicaId: "penso_rapido", esperada: true, selecionada: true }],
      }),
      entrada({
        pontuacaoFinal: 80,
        correspondenciaTecnicas: [{ tecnicaId: "penso_rapido", esperada: false, selecionada: true }],
      }),
    ];
    const r = calcularDesempenhoTratamentos(historico);
    const pensoRapido = r.find((t) => t.id === "penso_rapido");
    // só a primeira entrada conta (esperada:true) — 1/1 correta = 100%.
    expect(pensoRapido?.tentativas).toBe(1);
    expect(pensoRapido?.taxaAcerto).toBe(100);
  });

  it("inclui um id de página do Aprender para cada categoria/técnica", () => {
    const r = calcularDesempenhoTratamentos([]);
    expect(r.every((t) => typeof t.aprenderId === "string" && t.aprenderId.length > 0)).toBe(true);
  });
});

describe("calcularCobertura", () => {
  it("0 de 9 quando o histórico está vazio", () => {
    const r = calcularCobertura([]);
    expect(r.tentadas).toBe(0);
    expect(r.total).toBe(9);
    expect(r.etiologiasNaoTentadas).toHaveLength(9);
  });

  it("conta etiologias distintas, não casos", () => {
    const historico = [
      entrada({ pontuacaoFinal: 80, etiologia: "venosa" as Etiologia }),
      entrada({ pontuacaoFinal: 80, etiologia: "venosa" as Etiologia }),
      entrada({ pontuacaoFinal: 80, etiologia: "pressao" as Etiologia }),
    ];
    const r = calcularCobertura(historico);
    expect(r.tentadas).toBe(2);
    expect(r.etiologiasNaoTentadas).toHaveLength(7);
  });
});
