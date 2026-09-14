import { describe, expect, it } from "vitest";
import {
  caixaPintadaCover,
  dimensoesValidas,
  pontoDaImagem,
  pontoNoContentor,
} from "../lib/enquadramentoImagem";

/** Proporções reais em jogo: as fotos dos casos são ~1,26-1,48 e a caixa ~1,54. */
const CONTENTOR = { largura: 554, altura: 360 };
const FOTO_ESTREITA = { largura: 560, altura: 443 }; // caso 1, rácio 1,26
const FOTO_LARGA = { largura: 560, altura: 379 }; // caso 4, rácio 1,48

describe("caixaPintadaCover", () => {
  it("escala para cobrir e corta na vertical quando a imagem é mais alta que a caixa", () => {
    const caixa = caixaPintadaCover(CONTENTOR, FOTO_ESTREITA);
    expect(caixa.largura).toBeCloseTo(CONTENTOR.largura, 6);
    expect(caixa.altura).toBeGreaterThan(CONTENTOR.altura);
    expect(caixa.esquerda).toBeCloseTo(0, 6);
    expect(caixa.topo).toBeLessThan(0); // o excesso é repartido pelos dois lados
    expect(caixa.topo).toBeCloseTo((CONTENTOR.altura - caixa.altura) / 2, 6);
  });

  it("corta na horizontal quando a imagem é mais larga que a caixa", () => {
    const caixa = caixaPintadaCover({ largura: 300, altura: 300 }, FOTO_LARGA);
    expect(caixa.altura).toBeCloseTo(300, 6);
    expect(caixa.largura).toBeGreaterThan(300);
    expect(caixa.topo).toBeCloseTo(0, 6);
    expect(caixa.esquerda).toBeLessThan(0);
  });

  it("não corta nada quando as proporções coincidem", () => {
    const caixa = caixaPintadaCover({ largura: 560, altura: 443 }, FOTO_ESTREITA);
    expect(caixa.esquerda).toBeCloseTo(0, 6);
    expect(caixa.topo).toBeCloseTo(0, 6);
    expect(caixa.escala).toBeCloseTo(1, 6);
  });
});

describe("pontoDaImagem / pontoNoContentor", () => {
  it("o centro do contentor é o centro da imagem", () => {
    const centro = pontoDaImagem(
      { x: CONTENTOR.largura / 2, y: CONTENTOR.altura / 2 },
      CONTENTOR,
      FOTO_ESTREITA,
    );
    expect(centro.x).toBeCloseTo(0.5, 6);
    expect(centro.y).toBeCloseTo(0.5, 6);
  });

  it("são inversas uma da outra", () => {
    for (const foto of [FOTO_ESTREITA, FOTO_LARGA]) {
      for (const p of [{ x: 0.1, y: 0.2 }, { x: 0.5, y: 0.5 }, { x: 0.9, y: 0.77 }]) {
        const ida = pontoNoContentor(p, CONTENTOR, foto);
        const volta = pontoDaImagem(ida, CONTENTOR, foto);
        expect(volta.x).toBeCloseTo(p.x, 9);
        expect(volta.y).toBeCloseTo(p.y, 9);
      }
    }
  });

  it("o topo do contentor não é o topo da imagem quando há corte vertical", () => {
    // É exatamente o erro que existia: tratar o contentor como a imagem.
    const topo = pontoDaImagem({ x: 0, y: 0 }, CONTENTOR, FOTO_ESTREITA);
    expect(topo.y).toBeGreaterThan(0.08); // ~9% cortados em cima
    expect(topo.x).toBeCloseTo(0, 6);
  });

  it("o mesmo ponto da imagem cai em píxeis diferentes conforme a largura da janela", () => {
    // E é por isso que a conversão não pode ser feita uma vez só: o desvio
    // depende das proporções da caixa, que mudam com o ecrã.
    const largo = pontoNoContentor({ x: 0.5, y: 0.2 }, { largura: 554, altura: 360 }, FOTO_ESTREITA);
    const estreito = pontoNoContentor({ x: 0.5, y: 0.2 }, { largura: 343, altura: 360 }, FOTO_ESTREITA);
    expect(largo.y).not.toBeCloseTo(estreito.y, 1);
  });

  it("dimensoesValidas rejeita medidas em falta ou a zero", () => {
    expect(dimensoesValidas(null)).toBe(false);
    expect(dimensoesValidas({ largura: 0, altura: 300 })).toBe(false);
    expect(dimensoesValidas({ largura: 300, altura: 300 })).toBe(true);
  });
});
