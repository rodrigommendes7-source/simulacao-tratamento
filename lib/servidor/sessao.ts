import "server-only";

/**
 * Sessão por cookie.
 *
 * O token de sessão vive num cookie `httpOnly` — nunca em `localStorage`, que
 * é legível por qualquer script na página e, portanto, por qualquer XSS. Na
 * base de dados guarda-se apenas o SHA-256 do token: quem consiga ler a
 * tabela `sessoes` não fica com sessões utilizáveis, só com resumos.
 */
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { sql } from "./bd";

export const NOME_COOKIE = "sf_sessao";

/** 30 dias. O simulador é usado ao longo de um semestre; obrigar a entrar de novo a cada semana só criava atrito sem ganho real. */
const DURACAO_DIAS = 30;

function resumo(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * A ligação deste pedido é HTTPS?
 *
 * Decide o atributo `Secure` do cookie, e decide-o a partir do **protocolo do
 * pedido**, não de uma bandeira que alguém tenha de lembrar-se de ligar. Uma
 * bandeira manual falha nos dois sentidos: esquecida em produção, deixa o
 * cookie viajar em claro; ligada por engano em desenvolvimento, o browser
 * nunca o envia por `http://localhost` e a sessão deixa de funcionar sem
 * qualquer mensagem de erro.
 *
 * Atrás de um proxy — que é o caso na Vercel — o protocolo original vem em
 * `x-forwarded-proto`; a primeira entrada da lista é a do cliente. Sem esse
 * cabeçalho, não há proxy à frente e basta olhar para o ambiente.
 */
async function ligacaoSegura(): Promise<boolean> {
  const protocolo = (await headers()).get("x-forwarded-proto");
  if (protocolo) return protocolo.split(",")[0].trim().toLowerCase() === "https";
  return process.env.NODE_ENV === "production";
}

/** Cria a sessão na base de dados e escreve o cookie. */
export async function criarSessao(utilizadorId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expira = new Date(Date.now() + DURACAO_DIAS * 24 * 60 * 60 * 1000);

  await sql()`
    INSERT INTO sessoes (utilizador_id, token_hash, expira_em)
    VALUES (${utilizadorId}, ${resumo(token)}, ${expira.toISOString()})
  `;

  (await cookies()).set(NOME_COOKIE, token, {
    httpOnly: true,
    secure: await ligacaoSegura(),
    sameSite: "lax",
    path: "/",
    expires: expira,
  });
}

export interface UtilizadorSessao {
  id: string;
  nomeApresentacao: string;
  nomeCanonico: string;
}

/**
 * Utilizador da sessão atual, ou `null`. A consulta junta a verificação de
 * validade (`expira_em > now()`) para que uma sessão caducada seja
 * indistinguível de uma inexistente.
 */
export async function utilizadorDaSessao(): Promise<UtilizadorSessao | null> {
  const token = (await cookies()).get(NOME_COOKIE)?.value;
  if (!token) return null;

  const linhas = (await sql()`
    SELECT u.id, u.nome_apresentacao, u.nome_canonico
    FROM sessoes s JOIN utilizadores u ON u.id = s.utilizador_id
    WHERE s.token_hash = ${resumo(token)} AND s.expira_em > now()
    LIMIT 1
  `) as { id: string; nome_apresentacao: string; nome_canonico: string }[];

  if (linhas.length === 0) return null;
  return {
    id: linhas[0].id,
    nomeApresentacao: linhas[0].nome_apresentacao,
    nomeCanonico: linhas[0].nome_canonico,
  };
}

/** Termina a sessão atual: apaga o registo e o cookie. */
export async function terminarSessao(): Promise<void> {
  const frasco = await cookies();
  const token = frasco.get(NOME_COOKIE)?.value;
  if (token) await sql()`DELETE FROM sessoes WHERE token_hash = ${resumo(token)}`;
  frasco.delete(NOME_COOKIE);
}

/** Todas as sessões de um utilizador — usado ao alterar a palavra-passe e ao recuperá-la. */
export async function terminarTodasAsSessoes(utilizadorId: string): Promise<void> {
  await sql()`DELETE FROM sessoes WHERE utilizador_id = ${utilizadorId}`;
}
