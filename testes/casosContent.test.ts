import { describe, expect, it } from "vitest";
import { CONTEUDO_POR_CASO } from "../lib/casosContent";
import { TODOS_CASOS_TESTE } from "../dados/casosTeste";
import { baralharBancoJustificacoes } from "../lib/baralharJustificacoes";
import { JUSTIFICACOES_TECNICA, JUSTIFICACOES_TRATAMENTO } from "../dados/bancoJustificacoes";
import { arredondarPontuacao } from "../lib/pontuacao";

/**
 * A Fase 1 é observação: o aluno vê e descreve, e só classifica na Fase 2.
 * Se a narrativa usar o vocabulário do modelo de dados ("exsudado seroso"),
 * entrega a resposta da fase seguinte — daí este teste tratar esses termos
 * como proibidos na apresentação, sem mexer nos valores estruturados.
 */
const TERMOS_TECNICOS = [
  "exsudado",
  "seroso",
  "sanguinolento",
  "purulento",
  "escasso",
  "abundante",
  "esfacelo",
  "granulação",
  "epitelização",
  "necrose",
  "epíbole",
  "macerada",
  "perilesional",
  "estadio",
  "estádio",
  "eritema",
  "hiperqueratos",
  "underminad",
];

describe("narrativa da Fase 1 (observação)", () => {
  it("todos os casos de teste têm conteúdo narrativo", () => {
    for (const caso of TODOS_CASOS_TESTE) {
      expect(CONTEUDO_POR_CASO[caso.id], caso.id).toBeTruthy();
    }
  });

  it("não usa termos técnicos do modelo de dados", () => {
    for (const [id, conteudo] of Object.entries(CONTEUDO_POR_CASO)) {
      const texto = conteudo.observacoes.map((b) => `${b.titulo} ${b.texto}`).join(" ").toLowerCase();
      for (const termo of TERMOS_TECNICOS) {
        expect(texto.includes(termo), `${id} usa o termo técnico "${termo}"`).toBe(false);
      }
    }
  });

  it("a observação está repartida por categoria, com título próprio", () => {
    for (const [id, conteudo] of Object.entries(CONTEUDO_POR_CASO)) {
      expect(conteudo.observacoes.length, id).toBeGreaterThanOrEqual(3);
      for (const bloco of conteudo.observacoes) {
        expect(bloco.titulo.trim().length, id).toBeGreaterThan(0);
        expect(bloco.texto.trim().length, id).toBeGreaterThan(0);
      }
    }
  });

  it("cobre sempre líquido, cheiro e tamanho — a informação necessária à Fase 2", () => {
    for (const [id, conteudo] of Object.entries(CONTEUDO_POR_CASO)) {
      const titulos = conteudo.observacoes.map((b) => b.titulo.toLowerCase());
      expect(titulos.some((t) => t.includes("líquido")), id).toBe(true);
      expect(titulos.some((t) => t.includes("cheiro")), id).toBe(true);
      expect(titulos.some((t) => t.includes("tamanho")), id).toBe(true);
    }
  });

  /**
   * A Fase 1 não pode descrever variáveis que a Fase 2 pede ao aluno para
   * identificar. Um bloco "Pele à volta" chegou a existir e entregava
   * `pele_perilesional` (e, no caso 5, também calor local e eritema) antes de
   * a fase de identificação a pedir.
   */
  it("não descreve a pele perilesional — é identificada na Fase 2", () => {
    const TERMOS_PELE = ["pele à volta", "pele em redor", "pele à roda", "pele circundante", "pele vizinha", "pele em torno"];
    for (const [id, conteudo] of Object.entries(CONTEUDO_POR_CASO)) {
      const texto = conteudo.observacoes.map((b) => `${b.titulo} ${b.texto}`).join(" ").toLowerCase();
      for (const termo of TERMOS_PELE) {
        expect(texto.includes(termo), `${id} descreve a pele perilesional ("${termo}")`).toBe(false);
      }
    }
  });

  it("só usa as categorias permitidas na Fase 1", () => {
    // Localização/tempo são enquadramento (não avaliados); líquido, cheiro e
    // tamanho são o que a Fase 1 deve dar. Tudo o resto — tecido, bordos,
    // pele, sinais de infeção — pertence à Fase 2.
    const PERMITIDOS = ["Onde fica e há quanto tempo", "Líquido da ferida", "Cheiro", "Tamanho"];
    for (const [id, conteudo] of Object.entries(CONTEUDO_POR_CASO)) {
      for (const bloco of conteudo.observacoes) {
        expect(PERMITIDOS, `${id}: categoria inesperada "${bloco.titulo}"`).toContain(bloco.titulo);
      }
    }
  });
});

describe("ordem das opções de justificação", () => {
  it("é uma permutação completa das opções de cada item", () => {
    const ordem = baralharBancoJustificacoes();
    for (const [categoria, entrada] of Object.entries(JUSTIFICACOES_TRATAMENTO)) {
      if (!entrada) continue;
      const permutacao = ordem[`tr:${categoria}`];
      expect(permutacao, categoria).toBeTruthy();
      expect([...permutacao].sort((a, b) => a - b)).toEqual(entrada.opcoes.map((_, i) => i));
    }
    for (const [tecnica, entrada] of Object.entries(JUSTIFICACOES_TECNICA)) {
      if (!entrada) continue;
      const permutacao = ordem[`tc:${tecnica}`];
      expect(permutacao, tecnica).toBeTruthy();
      expect([...permutacao].sort((a, b) => a - b)).toEqual(entrada.opcoes.map((_, i) => i));
    }
  });

  it("a opção correta deixa de estar sempre em primeiro lugar", () => {
    // No banco a correta é sempre o índice 0. Ao longo de várias gerações, a
    // posição em que ela aparece tem de variar — caso contrário a ordem não
    // está mesmo a ser sorteada.
    const posicoes = new Set<number>();
    for (let i = 0; i < 60; i++) {
      posicoes.add(baralharBancoJustificacoes()["tr:desbridamento"].indexOf(0));
    }
    expect(posicoes.size).toBeGreaterThan(1);
  });

  it("o banco continua a ter a opção correta no índice 0 (a avaliação depende disso)", () => {
    for (const entrada of Object.values(JUSTIFICACOES_TRATAMENTO)) {
      if (entrada) expect(entrada.opcoes.filter((o) => o.correta)).toHaveLength(1);
    }
  });
});

describe("arredondamento de pontuações", () => {
  it("arredonda para inteiro e preserva null", () => {
    expect(arredondarPontuacao(80.5)).toBe(81);
    expect(arredondarPontuacao(66.66666)).toBe(67);
    expect(arredondarPontuacao(100)).toBe(100);
    expect(arredondarPontuacao(null)).toBeNull();
  });
});
