import "server-only";

/**
 * Utilitários comuns às rotas de API: forma das respostas e leitura do corpo.
 *
 * O objetivo é que nenhuma rota tenha de decidir, sozinha, o que fazer com um
 * corpo mal formado ou com um pedido sem sessão — essas decisões devem ser
 * iguais em todas, e estar num sítio só é o que o garante.
 */
import { NextResponse } from "next/server";
import { utilizadorDaSessao, type UtilizadorSessao } from "./sessao";

export function ok<T>(dados: T, estado = 200): NextResponse {
  return NextResponse.json(dados, { status: estado });
}

export function erro(mensagem: string, estado: number, extras: Record<string, unknown> = {}): NextResponse {
  return NextResponse.json({ erro: mensagem, ...extras }, { status: estado });
}

/** Corpo JSON, ou `null` se vier ausente ou mal formado. */
export async function corpoJson(pedido: Request): Promise<Record<string, unknown> | null> {
  try {
    const valor = await pedido.json();
    return valor && typeof valor === "object" ? (valor as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function texto(corpo: Record<string, unknown> | null, campo: string): string {
  const v = corpo?.[campo];
  return typeof v === "string" ? v : "";
}

/**
 * Exige sessão iniciada. Devolve o utilizador ou uma resposta 401 já pronta —
 * a rota faz `if ("erro" in r) return r.erro;` e segue.
 */
export async function exigirSessao(): Promise<{ utilizador: UtilizadorSessao } | { erro: NextResponse }> {
  const utilizador = await utilizadorDaSessao();
  if (!utilizador) return { erro: erro("Sessão não iniciada.", 401) };
  return { utilizador };
}

/**
 * Converte um erro inesperado numa resposta 500 sem detalhes.
 *
 * A mensagem original vai para os registos do servidor, não para o browser:
 * mensagens de base de dados expõem nomes de tabelas e, por vezes, valores.
 */
export function erroInterno(contexto: string, causa: unknown): NextResponse {
  console.error(`[api] ${contexto}:`, causa);
  return erro("Ocorreu um erro no servidor. Tente novamente.", 500);
}
