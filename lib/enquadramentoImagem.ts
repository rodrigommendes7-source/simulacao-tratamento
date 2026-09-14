/**
 * Conversão entre coordenadas do contentor e coordenadas da imagem, quando a
 * imagem é desenhada com `object-fit: cover`.
 *
 * Os polígonos de referência dos casos (`dados/casosTeste.ts`) estão
 * normalizados 0-1 sobre a **imagem inteira**. Na interface, essas imagens são
 * pintadas dentro de uma caixa de proporções diferentes com `object-fit:
 * cover` (`.ph img` em app/globals.css), o que escala a imagem até cobrir a
 * caixa e corta o que sobra — verticalmente ou horizontalmente, consoante as
 * proporções.
 *
 * Tratar as coordenadas do contentor como se fossem as da imagem, que era o
 * que se fazia, tem duas consequências: um pin colocado por clique não cai no
 * ponto da fotografia onde a pessoa clicou, e o desvio muda com a largura da
 * janela (porque a fatia cortada depende da proporção da caixa, não da
 * imagem). Com as fotos atuais (proporções 1,26-1,48 numa caixa de ~1,54) o
 * erro chega a ~9% da altura nos extremos.
 *
 * Funções puras, sem DOM, para a geometria poder ser testada sem renderizar
 * nada.
 */
import type { Ponto2D } from "../tipos/variaveis";

export interface Dimensoes {
  largura: number;
  altura: number;
}

/**
 * A caixa efetivamente pintada pela imagem, em píxeis e relativa à origem do
 * contentor. Com `cover` é sempre maior ou igual ao contentor, e os
 * deslocamentos são ≤ 0 — é essa a parte que fica cortada.
 */
export interface CaixaPintada {
  escala: number;
  largura: number;
  altura: number;
  esquerda: number;
  topo: number;
}

/** Há dimensões utilizáveis para fazer contas? (imagem ainda por carregar, contentor ainda por medir) */
export function dimensoesValidas(d: Dimensoes | null | undefined): d is Dimensoes {
  return !!d && d.largura > 0 && d.altura > 0;
}

/**
 * Geometria de `object-fit: cover` com `object-position: 50% 50%` (o valor por
 * omissão): escala-se pelo maior fator necessário para cobrir a caixa e
 * centra-se o excesso.
 */
export function caixaPintadaCover(contentor: Dimensoes, natural: Dimensoes): CaixaPintada {
  const escala = Math.max(contentor.largura / natural.largura, contentor.altura / natural.altura);
  const largura = natural.largura * escala;
  const altura = natural.altura * escala;
  return {
    escala,
    largura,
    altura,
    esquerda: (contentor.largura - largura) / 2,
    topo: (contentor.altura - altura) / 2,
  };
}

/**
 * Ponto do contentor (px, relativo ao canto superior esquerdo) → ponto da
 * imagem normalizado 0-1. É o mapeamento a usar para transformar um clique
 * em coordenadas comparáveis com os polígonos do caso.
 */
export function pontoDaImagem(
  pontoNoContentor: Ponto2D,
  contentor: Dimensoes,
  natural: Dimensoes,
): Ponto2D {
  const caixa = caixaPintadaCover(contentor, natural);
  return {
    x: (pontoNoContentor.x - caixa.esquerda) / caixa.largura,
    y: (pontoNoContentor.y - caixa.topo) / caixa.altura,
  };
}

/**
 * Inverso de `pontoDaImagem`: ponto normalizado da imagem → píxeis do
 * contentor. É o mapeamento a usar para desenhar por cima da fotografia (os
 * pins já colocados, o polígono destacado).
 */
export function pontoNoContentor(
  pontoNaImagem: Ponto2D,
  contentor: Dimensoes,
  natural: Dimensoes,
): Ponto2D {
  const caixa = caixaPintadaCover(contentor, natural);
  return {
    x: caixa.esquerda + pontoNaImagem.x * caixa.largura,
    y: caixa.topo + pontoNaImagem.y * caixa.altura,
  };
}
