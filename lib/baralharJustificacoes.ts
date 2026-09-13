"use client";

/**
 * Ordem de apresentação das opções de justificação (Fase 5).
 *
 * No banco (dados/bancoJustificacoes.ts) a opção correta está sempre escrita
 * em primeiro lugar, o que é legível para quem mantém os dados mas tornava a
 * resposta óbvia no ecrã: bastava escolher sempre a primeira. Aqui gera-se uma
 * permutação por item, usada só para *mostrar* as opções — a resposta do aluno
 * continua a ser guardada com o índice original do banco, por isso
 * algoritmo/avaliarJustificacoes.ts não muda e continua a ser a única fonte de
 * verdade sobre o que está certo.
 *
 * A permutação é gerada no cliente depois da montagem (nunca durante o render
 * do servidor), para não haver divergência de hidratação entre a ordem que o
 * servidor escreveu e a que o browser sorteia.
 */
import { JUSTIFICACOES_TECNICA, JUSTIFICACOES_TRATAMENTO } from "../dados/bancoJustificacoes";

/** Fisher-Yates. */
function baralhar(n: number): number[] {
  const indices = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

/**
 * Uma permutação por item do banco, com as mesmas chaves que a UI usa
 * (`tr:<categoria>` / `tc:<tecnica>`). Gera-se o banco inteiro de uma vez
 * porque o conjunto de itens só fica conhecido no fim da Fase 4, e assim a
 * ordem fica fixa durante a resolução do caso — as opções não saltam de sítio
 * se o aluno fechar e reabrir a pergunta.
 */
export function baralharBancoJustificacoes(): Record<string, number[]> {
  const ordem: Record<string, number[]> = {};
  for (const [categoria, entrada] of Object.entries(JUSTIFICACOES_TRATAMENTO)) {
    if (entrada) ordem[`tr:${categoria}`] = baralhar(entrada.opcoes.length);
  }
  for (const [tecnica, entrada] of Object.entries(JUSTIFICACOES_TECNICA)) {
    if (entrada) ordem[`tc:${tecnica}`] = baralhar(entrada.opcoes.length);
  }
  return ordem;
}
