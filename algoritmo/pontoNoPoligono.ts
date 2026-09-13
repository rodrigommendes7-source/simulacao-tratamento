import type { Ponto2D } from "../tipos/variaveis";

/**
 * Point-in-polygon por ray casting (algoritmo par-ímpar). Funciona para
 * polígonos simples (convexos ou côncavos, sem auto-interseção), que é a
 * forma como os polígonos de referência são desenhados manualmente sobre a
 * fotografia de cada caso. Um ponto exatamente sobre uma aresta pode ser
 * classificado de qualquer um dos lados — não é um caso relevante aqui
 * (pins são colocados por clique, não por coordenada exata da aresta).
 */
export function pontoDentroPoligono(ponto: Ponto2D, poligono: Ponto2D[]): boolean {
  if (poligono.length < 3) return false;
  let dentro = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const { x: xi, y: yi } = poligono[i];
    const { x: xj, y: yj } = poligono[j];
    const intersecta = yi > ponto.y !== yj > ponto.y && ponto.x < ((xj - xi) * (ponto.y - yi)) / (yj - yi) + xi;
    if (intersecta) dentro = !dentro;
  }
  return dentro;
}
