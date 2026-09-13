"use client";

/**
 * Persistência local (sem backend) — sessão do utilizador + histórico de casos
 * resolvidos. As chaves de dados são separadas por utilizador (ver
 * lib/armazenamento.ts): duas contas no mesmo browser veem históricos
 * diferentes. As contas em si vivem em lib/contas.ts.
 */
import type { EntradaHistorico } from "../tipos/historico";
import { CHAVE_UTILIZADOR, escreverLista, lerLista, limparLista, obterUtilizador } from "./armazenamento";
import { normalizarUtilizador } from "./contas";

export type { EntradaHistorico };
export { obterUtilizador };

const CHAVE_HISTORICO = "sf_historico";

/**
 * Inicia sessão para um utilizador já autenticado (lib/contas.ts). Guarda-se
 * o nome normalizado, que é o que nomeia o espaço de dados — gravar aqui a
 * forma como foi escrita faria "Ana Silva" e "ana silva" abrirem históricos
 * separados.
 */
export function iniciarSessao(nome: string): void {
  window.localStorage.setItem(CHAVE_UTILIZADOR, normalizarUtilizador(nome));
}

/** Termina a sessão. Os dados do utilizador ficam guardados e voltam a aparecer quando ele entrar outra vez. */
export function sair(): void {
  window.localStorage.removeItem(CHAVE_UTILIZADOR);
}

export function obterHistorico(): EntradaHistorico[] {
  return lerLista<EntradaHistorico>(CHAVE_HISTORICO);
}

export function registarResultado(entrada: EntradaHistorico): void {
  escreverLista(CHAVE_HISTORICO, [...obterHistorico(), entrada]);
}

export function limparHistorico(): void {
  limparLista(CHAVE_HISTORICO);
}

export function mediaPontuacao(historico: EntradaHistorico[]): number {
  if (historico.length === 0) return 0;
  return Math.round(historico.reduce((s, h) => s + h.pontuacaoFinal, 0) / historico.length);
}
