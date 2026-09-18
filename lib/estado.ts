"use client";

/**
 * Sessão e histórico de casos resolvidos — agora contra o servidor.
 *
 * Antes, isto era `localStorage`: a conta, a sessão e o histórico viviam todos
 * no browser e não saíam de lá. Passaram para a base de dados, através das
 * rotas em `app/api/`. As consequências práticas, que a interface tem de
 * refletir com honestidade: o aluno pode entrar de outro computador e
 * encontrar o seu histórico, e limpar os dados do browser deixou de apagar
 * seja o que for.
 *
 * A sessão é um cookie `httpOnly` que este código nunca vê. Por isso não há
 * aqui nenhuma função a "guardar o utilizador": quem está em sessão pergunta-se
 * ao servidor, com `obterUtilizador()`.
 */
import type { EntradaHistorico } from "../tipos/historico";
import { json, pedir } from "./api";

export type { EntradaHistorico };

export interface UtilizadorAtual {
  nomeApresentacao: string;
  nomeCanonico: string;
}

// ───────────────────────────── Sessão ─────────────────────────────

/** Quem está em sessão, ou `null`. Vai ao servidor — o cookie não é legível daqui. */
export async function obterUtilizador(): Promise<UtilizadorAtual | null> {
  try {
    const r = await pedir<{ utilizador: UtilizadorAtual | null }>("/api/contas/eu");
    return r.utilizador;
  } catch {
    // Servidor inacessível conta como "não há sessão": é melhor mandar a
    // pessoa para o ecrã de entrada do que deixá-la num ecrã sem dados
    // nenhuns e sem explicação.
    return null;
  }
}

export interface ResultadoEntrada {
  utilizador: UtilizadorAtual;
  /** Só no registo e na recuperação. Mostrado uma única vez — não há como o voltar a pedir. */
  codigoRecuperacao?: string;
}

export function entrar(nome: string, palavraPasse: string): Promise<ResultadoEntrada> {
  return pedir<ResultadoEntrada>("/api/contas/entrar", { method: "POST", ...json({ nome, palavraPasse }) });
}

export function registar(nome: string, palavraPasse: string): Promise<ResultadoEntrada> {
  return pedir<ResultadoEntrada>("/api/contas/registar", { method: "POST", ...json({ nome, palavraPasse }) });
}

export function recuperar(nome: string, codigo: string, novaPalavraPasse: string): Promise<ResultadoEntrada> {
  return pedir<ResultadoEntrada>("/api/contas/recuperar", {
    method: "POST",
    ...json({ nome, codigo, novaPalavraPasse }),
  });
}

export function alterarPalavraPasse(atual: string, nova: string): Promise<{ ok: true }> {
  return pedir<{ ok: true }>("/api/contas/palavra-passe", { method: "POST", ...json({ atual, nova }) });
}

/** Apaga a conta e todos os dados associados. Irreversível. */
export function apagarConta(palavraPasse: string): Promise<{ ok: true }> {
  return pedir<{ ok: true }>("/api/contas/apagar", { method: "DELETE", ...json({ palavraPasse }) });
}

export async function sair(): Promise<void> {
  try {
    await pedir("/api/contas/sair", { method: "POST" });
  } catch {
    // Já sem sessão, ou sem rede. De qualquer forma, quem chama isto vai a
    // seguir para o ecrã de entrada — não há nada de útil a dizer aqui.
  }
}

// ───────────────────────────── Histórico ─────────────────────────────

export async function obterHistorico(): Promise<EntradaHistorico[]> {
  const r = await pedir<{ resultados: EntradaHistorico[] }>("/api/resultados");
  return r.resultados;
}

export async function registarResultado(entrada: EntradaHistorico): Promise<void> {
  await pedir("/api/resultados", { method: "POST", ...json({ entrada }) });
}

export async function limparHistorico(): Promise<void> {
  await pedir("/api/resultados", { method: "DELETE" });
}

export function mediaPontuacao(historico: EntradaHistorico[]): number {
  if (historico.length === 0) return 0;
  return Math.round(historico.reduce((s, h) => s + h.pontuacaoFinal, 0) / historico.length);
}
