import "server-only";

/**
 * Derivação de palavras-passe e de códigos de recuperação — **só no servidor**.
 *
 * Isto substitui o PBKDF2 que corria no browser. A diferença não é de
 * afinação: se o cliente derivar o hash e o enviar, o hash passa a ser, para
 * todos os efeitos, a palavra-passe, e quem leia a base de dados entra em
 * todas as contas sem ter de partir nada. O cliente envia a palavra-passe em
 * claro sobre HTTPS e nunca vê nem manuseia um hash.
 *
 * Argon2id, porque resiste tanto a ataque com GPU como a ataque com muita
 * memória, ao contrário de PBKDF2 e de bcrypt. O `@node-rs/argon2` é um
 * binário nativo e exige o runtime Node (não corre em Edge) — por isso todas
 * as rotas que o usam declaram `runtime = "nodejs"`.
 *
 * Os parâmetros ficam gravados dentro do próprio hash, o que permite
 * aumentá-los mais tarde sem invalidar as contas existentes: o `verify` lê os
 * parâmetros do hash antigo e continua a funcionar.
 */
import { hash, verify, type Algorithm } from "@node-rs/argon2";

/**
 * OWASP (2024) recomenda, para Argon2id, um mínimo de 19 MiB de memória,
 * 2 iterações e paralelismo 1. Fica-se com folga acima disso: o custo é
 * pagar algumas dezenas de milissegundos por entrada, uma vez.
 */
const PARAMETROS = {
  // 2 = Argon2id. O enum `Algorithm` do pacote é um `const enum` ambiente e
  // não pode ser lido com `isolatedModules` ligado (ver tsconfig.json), por
  // isso usa-se o valor com o nome no comentário.
  algorithm: 2 as Algorithm,
  memoryCost: 47_104, // 46 MiB
  timeCost: 3,
  parallelism: 1,
} as const;

export function derivar(segredo: string): Promise<string> {
  return hash(segredo, PARAMETROS);
}

/**
 * Verifica um segredo contra o hash guardado.
 *
 * Um hash corrompido ou de formato desconhecido faz o `verify` atirar; aqui
 * isso conta como "não corresponde". Deixar a exceção subir transformaria um
 * registo estragado num 500 que denunciaria que a conta existe — precisamente
 * o que as mensagens genéricas de entrada evitam.
 */
export async function corresponde(segredo: string, hashGuardado: string): Promise<boolean> {
  try {
    return await verify(hashGuardado, segredo, PARAMETROS);
  } catch {
    return false;
  }
}
