"use client";

/**
 * Camada única de acesso ao localStorage, com as chaves de dados separadas
 * por utilizador com sessão iniciada.
 *
 * Antes, o histórico de casos (`sf_historico`) e o de consultas
 * (`sf_consultas`) viviam em chaves globais e os dados eram partilhados por
 * todos. Agora cada utilizador tem o seu próprio espaço
 * (`sf_historico::ana silva`), por isso contas diferentes veem históricos
 * diferentes no mesmo browser.
 *
 * O espaço usa o nome **normalizado** (lib/contas.ts), o mesmo que garante a
 * unicidade da conta: assim "Ana Silva" e "ana silva" são o mesmo histórico,
 * e não dois.
 *
 * O utilizador ativo (`sf_utilizador`) fica numa chave global — é a sessão,
 * não um dado do aluno.
 */

export const CHAVE_UTILIZADOR = "sf_utilizador";

/** Espaço usado antes de haver sessão iniciada. */
const ESPACO_ANONIMO = "anon";

/** Nome normalizado do utilizador com sessão iniciada, ou null. */
export function obterUtilizador(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CHAVE_UTILIZADOR);
}

/** `sf_historico` → `sf_historico::ana silva`. */
export function chaveDoAluno(base: string, utilizador = obterUtilizador()): string {
  return `${base}::${utilizador ?? ESPACO_ANONIMO}`;
}

/**
 * Migração única das chaves globais antigas para o espaço do utilizador
 * atual. Só corre quando esse espaço ainda não existe, para nunca escrever
 * por cima de dados já separados; a chave antiga é removida a seguir, o que
 * impede que o mesmo histórico seja "herdado" por uma segunda conta.
 */
function migrarChaveGlobal(base: string): void {
  const antiga = window.localStorage.getItem(base);
  if (antiga === null) return;
  const nova = chaveDoAluno(base);
  if (window.localStorage.getItem(nova) === null) {
    window.localStorage.setItem(nova, antiga);
  }
  window.localStorage.removeItem(base);
}

export function lerLista<T>(base: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    migrarChaveGlobal(base);
    const raw = window.localStorage.getItem(chaveDoAluno(base));
    if (!raw) return [];
    const valor = JSON.parse(raw) as unknown;
    return Array.isArray(valor) ? (valor as T[]) : [];
  } catch {
    return [];
  }
}

export function escreverLista<T>(base: string, valor: T[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(chaveDoAluno(base), JSON.stringify(valor));
  } catch {
    /* quota cheia ou storage indisponível — o ecrã continua utilizável. */
  }
}

export function limparLista(base: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(chaveDoAluno(base));
  window.localStorage.removeItem(base);
}
