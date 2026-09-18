import "server-only";

/**
 * Atraso progressivo nas tentativas de autenticação falhadas.
 *
 * Substitui o bloqueio de conta que existia antes. A razão é de produto: isto
 * é uma plataforma educativa e **nenhum aluno pode ficar impedido de entrar**.
 * Um bloqueio à N.ª tentativa transforma um esquecimento numa porta fechada
 * que só passa com o tempo — ou, pior, com alguém a limpar estado à mão.
 *
 * O que fica no lugar: quem erra várias vezes seguidas espera cada vez mais
 * pela resposta, até um teto de 5 segundos. Nunca é recusado. Uma tentativa
 * correta é aceite de imediato, mesmo que a anterior tenha sido atrasada, e
 * zera o contador.
 *
 * Contra força bruta continua a servir: com um PIN de 4 dígitos e 5 segundos
 * por tentativa, varrer as dez mil combinações leva mais de catorze horas de
 * pedidos ininterruptos contra uma única conta — e o contador não caduca
 * enquanto as tentativas continuarem.
 *
 * Deliberadamente **não há limitação por IP**. Numa escola, uma turma inteira
 * sai pelo mesmo endereço: um contador por IP penalizaria exatamente as
 * pessoas que o simulador existe para servir.
 */
import { sql } from "./bd";

/** Falhas consecutivas toleradas sem qualquer atraso. */
export const LIMIAR_ATRASO = 3;

/** Teto do atraso, em milissegundos. */
export const ATRASO_MAXIMO_MS = 5_000;

/** Sem tentativas durante este tempo, o contador recomeça do zero sozinho. */
const EXPIRACAO_MINUTOS = 15;

/**
 * Escala do atraso, indexada pelo número de falhas consecutivas **já
 * contando com a atual**. Abaixo do limiar não há atraso nenhum: enganar-se
 * uma ou duas vezes a escrever um PIN é normal e não deve custar nada.
 */
const ESCALA_MS: ReadonlyArray<{ apartirDe: number; ms: number }> = [
  { apartirDe: 6, ms: ATRASO_MAXIMO_MS },
  { apartirDe: 5, ms: 2_000 },
  { apartirDe: 4, ms: 1_000 },
  { apartirDe: LIMIAR_ATRASO, ms: 500 },
];

/**
 * Atraso correspondente a um número de falhas consecutivas.
 *
 * Função pura e exportada para poder ser testada sem base de dados — é a
 * única parte desta lógica que vale a pena fixar com testes.
 */
export function atrasoParaFalhas(falhas: number): number {
  return ESCALA_MS.find((n) => falhas >= n.apartirDe)?.ms ?? 0;
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Regista uma falha e espera o que a escala mandar, antes de a rota responder.
 *
 * O atraso é **do lado do servidor**: um atraso no cliente não trava nada,
 * porque quem ataca não usa o nosso cliente.
 *
 * O `ON CONFLICT` faz o incremento e a expiração numa só ida à base de dados.
 * Duas tentativas em simultâneo não podem perder uma contagem uma da outra,
 * porque quem decide é a instrução e não uma leitura anterior.
 */
export async function registarFalhaEAtrasar(nomeCanonico: string): Promise<void> {
  const limite = new Date(Date.now() - EXPIRACAO_MINUTOS * 60_000).toISOString();

  const linhas = (await sql()`
    INSERT INTO tentativas_login (chave, falhas, ultima_em)
    VALUES (${chaveNome(nomeCanonico)}, 1, now())
    ON CONFLICT (chave) DO UPDATE SET
      falhas = CASE WHEN tentativas_login.ultima_em < ${limite} THEN 1
                    ELSE tentativas_login.falhas + 1 END,
      ultima_em = now()
    RETURNING falhas
  `) as { falhas: number }[];

  await esperar(atrasoParaFalhas(linhas[0]?.falhas ?? 1));
}

/**
 * Autenticação bem sucedida: o contador desaparece.
 *
 * Aproveita-se para varrer as linhas já expiradas. Sem isto, a tabela
 * acumularia contadores de nomes que ninguém voltou a tentar — e a regra
 * deste lote é não deixar estado que precise de alguém para o limpar.
 */
export async function limparFalhas(nomeCanonico: string): Promise<void> {
  const limite = new Date(Date.now() - EXPIRACAO_MINUTOS * 60_000).toISOString();
  await sql()`
    DELETE FROM tentativas_login
    WHERE chave = ${chaveNome(nomeCanonico)} OR ultima_em < ${limite}
  `;
}

function chaveNome(nomeCanonico: string): string {
  return `u:${nomeCanonico}`;
}
