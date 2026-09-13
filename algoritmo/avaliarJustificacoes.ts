import { JUSTIFICACOES_TRATAMENTO, JUSTIFICACOES_TECNICA } from "../dados/bancoJustificacoes";
import type { CategoriaTratamento } from "../tipos/tratamento";

export type TipoItemJustificacao = "tratamento" | "tecnica";

export interface ItemJustificacao {
  /** Chave estável usada para indexar a resposta do aluno (ex.: "tr:desbridamento", "tc:penso_rapido"). */
  chave: string;
  tipo: TipoItemJustificacao;
  /** Id da categoria de tratamento ou da técnica de aplicação. */
  id: string;
}

export interface CorrespondenciaJustificacao {
  chave: string;
  tipo: TipoItemJustificacao;
  id: string;
  respondida: boolean;
  /** false sempre que não respondida ou a opção escolhida não é a correta do banco de justificações. */
  correta: boolean;
}

/**
 * Avalia as respostas de justificação (Fase 5) contra o banco de
 * justificações (dados/bancoJustificacoes.ts) — cada item de tratamento ou
 * técnica escolhido na Fase 4 tem uma pergunta de escolha múltipla própria,
 * com uma única opção correta.
 */
export function avaliarJustificacoes(
  itens: ItemJustificacao[],
  respostas: Record<string, number>,
): CorrespondenciaJustificacao[] {
  return itens.map((item) => {
    const entrada =
      item.tipo === "tratamento"
        ? JUSTIFICACOES_TRATAMENTO[item.id as CategoriaTratamento]
        : JUSTIFICACOES_TECNICA[item.id];
    const respostaIndex = respostas[item.chave];
    const respondida = respostaIndex !== undefined;
    const correta = respondida && !!entrada && entrada.opcoes[respostaIndex]?.correta === true;
    return { chave: item.chave, tipo: item.tipo, id: item.id, respondida, correta };
  });
}

/** Pontuação proporcional (nº correto / nº de itens). null se não houve nenhum item (nada escolhido na Fase 4 com justificação disponível). */
export function pontuacaoJustificacoes(correspondencias: CorrespondenciaJustificacao[]): number | null {
  if (correspondencias.length === 0) return null;
  const corretas = correspondencias.filter((c) => c.correta).length;
  return (corretas / correspondencias.length) * 100;
}
