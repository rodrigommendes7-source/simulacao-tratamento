"use client";

/**
 * A tentativa do test drive, enquanto não houver conta.
 *
 * Quem abre o link pela primeira vez resolve um caso real sem se registar. Não
 * há sessão, e portanto não há nada que possa ser escrito na base de dados —
 * todas as rotas de dados exigem sessão. O resultado tem de viver no cliente
 * até a pessoa decidir se quer ficar.
 *
 * Usa-se `sessionStorage` e não `localStorage`, de propósito: morre quando o
 * separador fecha, o que é exatamente a semântica prometida — "se se registar
 * a seguir, guardamos; caso contrário, perde-se". Não há recuperação tardia e
 * não deve haver: nada aqui sobrevive a fechar o browser.
 *
 * Guarda-se **uma** tentativa, de **um** caso. O conteúdo é um
 * `EntradaHistorico` já construído pelo mesmo código que grava os casos de
 * quem tem conta — é isso que torna o resultado migrado indistinguível de um
 * resolvido com sessão. Não há aqui dado pessoal nenhum: nesta fase ainda não
 * existe pessoa.
 */
import type { EntradaHistorico } from "../tipos/historico";

/**
 * O caso do test drive: deiscência cirúrgica.
 *
 * Fixo, nunca aleatório — quem partilha o link tem de saber o que a outra
 * pessoa vai ver. A escolha da etiologia é decisão de produto (ver CLAUDE.md):
 * é a mais reconhecível para um aluno de qualquer ano e não exige o raciocínio
 * vascular das venosas.
 */
export const CASO_TEST_DRIVE = "caso_2_deiscencia_cirurgica";

/** Marcador que autoriza a migração: só o registo iniciado a partir do resultado do test drive a traz. */
export const ORIGEM_TEST_DRIVE = "test-drive";

const CHAVE = "sf_tentativa";

/**
 * Teto de tamanho. Uma entrada de histórico ronda poucos KB; 64 KB é folga
 * larga e continua a ser um limite — sem ele, um estado inesperadamente grande
 * estoirava a quota do `sessionStorage` e levava o ecrã à frente.
 */
const MAX_BYTES = 64 * 1024;

interface TentativaGuardada {
  casoId: string;
  guardadaEm: string;
  entrada: EntradaHistorico;
}

/**
 * Guarda a tentativa acabada de concluir.
 *
 * Recusa em silêncio o que não for do caso do test drive: esta gaveta serve um
 * caso só, e aceitar outro abriria a porta a usá-la como armazenamento geral
 * de resultados sem conta.
 */
export function guardarTentativa(entrada: EntradaHistorico): void {
  if (typeof window === "undefined") return;
  if (entrada?.casoId !== CASO_TEST_DRIVE) return;

  try {
    const valor = JSON.stringify({
      casoId: entrada.casoId,
      guardadaEm: new Date().toISOString(),
      entrada,
    } satisfies TentativaGuardada);

    if (valor.length > MAX_BYTES) return;
    window.sessionStorage.setItem(CHAVE, valor);
  } catch {
    // Quota cheia ou armazenamento bloqueado (navegação privada). A pessoa vê
    // o resultado na mesma; só não o poderá migrar. Não vale partir o ecrã.
  }
}

/**
 * Lê a tentativa pendente, ou `null`.
 *
 * Valida a forma antes de a devolver: o que vier truncado, adulterado ou de
 * outro caso é tratado como inexistente. Quem chama isto vai a seguir escrever
 * na conta de alguém — não pode confiar no conteúdo só porque veio da gaveta
 * certa.
 */
export function lerTentativa(): EntradaHistorico | null {
  if (typeof window === "undefined") return null;

  try {
    const bruto = window.sessionStorage.getItem(CHAVE);
    if (!bruto || bruto.length > MAX_BYTES) return null;

    const valor = JSON.parse(bruto) as Partial<TentativaGuardada>;
    const entrada = valor?.entrada;
    if (!entrada || typeof entrada !== "object") return null;
    if (entrada.casoId !== CASO_TEST_DRIVE) return null;
    if (typeof entrada.pontuacaoFinal !== "number") return null;
    if (!Array.isArray(entrada.correspondenciaTratamento)) return null;

    return entrada;
  } catch {
    return null;
  }
}

/** Esquece a tentativa. Chamado depois de migrar, e sempre que a migração deixa de estar autorizada. */
export function limparTentativa(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(CHAVE);
  } catch {
    /* armazenamento indisponível — não havia nada a limpar. */
  }
}
