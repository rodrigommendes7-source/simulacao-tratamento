"use client";

/**
 * Contas locais — nome de utilizador único + palavra-passe numérica.
 *
 * AVISO IMPORTANTE SOBRE O ÂMBITO: a aplicação não tem servidor. Isto não é
 * autenticação no sentido de segurança — é uma separação de perfis dentro de
 * um browser. Em concreto:
 *
 * - O "único" do nome de utilizador só vale neste browser. Duas pessoas em
 *   computadores diferentes podem registar o mesmo nome; não há nada que o
 *   possa impedir sem um servidor onde os nomes sejam reservados.
 * - Quem tiver acesso ao browser pode apagar o registo de contas pelas
 *   ferramentas de programador e criar outro. Não há aqui nenhuma fronteira
 *   de segurança a proteger.
 * - Uma palavra-passe de 6 dígitos tem, no máximo, um milhão de combinações:
 *   é resistente a alguém que espreite por cima do ombro, não a um ataque.
 *
 * O que mesmo assim se faz bem: a palavra-passe **nunca** é guardada em
 * claro. Guarda-se a derivação PBKDF2-SHA256 com sal próprio por conta, para
 * que ler o localStorage não revele o PIN — que as pessoas tendem a reutilizar
 * noutros sítios onde isso importa de facto.
 */

const CHAVE_CONTAS = "sf_contas";

/** Iterações do PBKDF2. Alto o suficiente para tornar lento testar um PIN de cada vez, sem se notar no ecrã de entrada. */
const ITERACOES = 150_000;
const BYTES_SAL = 16;
const BITS_CHAVE = 256;

export interface Conta {
  /** Chave única, normalizada (minúsculas, sem espaços a mais). */
  utilizador: string;
  /** Como a pessoa o escreveu — é assim que aparece na interface. */
  nomeApresentacao: string;
  salHex: string;
  hashHex: string;
  iteracoes: number;
  criadaEm: string;
}

// ───────────────────────────── Regras de validação ─────────────────────────────

export const MIN_UTILIZADOR = 3;
export const MAX_UTILIZADOR = 24;
/**
 * Mínimo de 4 dígitos: o pedido fixou só o máximo (6), e um PIN de 1 ou 2
 * dígitos não separa perfis de forma útil. Alterar aqui se preferir outro.
 */
export const MIN_PALAVRA_PASSE = 4;
export const MAX_PALAVRA_PASSE = 6;

/** Letras (com acentos), dígitos, espaço e `.`/`_`/`-`. Sem símbolos que compliquem a leitura em voz alta. */
const CARACTERES_UTILIZADOR = /^[\p{L}\p{N} ._-]+$/u;

/** Só dígitos, entre `MIN_PALAVRA_PASSE` e `MAX_PALAVRA_PASSE`. */
export const FORMATO_PALAVRA_PASSE = new RegExp(`^\\d{${MIN_PALAVRA_PASSE},${MAX_PALAVRA_PASSE}}$`);

/**
 * Forma canónica do nome: é esta que garante a unicidade e que nomeia o
 * espaço de dados. "Ana Silva", "ana silva" e " Ana  Silva " são a mesma
 * pessoa — sem isto, a mesma pessoa criaria históricos separados por escrever
 * o nome de maneira diferente.
 */
export function normalizarUtilizador(nome: string): string {
  return nome.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-PT");
}

export function validarUtilizador(nome: string): string | null {
  const limpo = nome.trim().replace(/\s+/g, " ");
  if (limpo.length < MIN_UTILIZADOR) return `O nome tem de ter pelo menos ${MIN_UTILIZADOR} caracteres.`;
  if (limpo.length > MAX_UTILIZADOR) return `O nome não pode ter mais de ${MAX_UTILIZADOR} caracteres.`;
  if (!CARACTERES_UTILIZADOR.test(limpo)) return "Use apenas letras, números, espaços, ponto, hífen ou underscore.";
  return null;
}

export function validarPalavraPasse(palavraPasse: string): string | null {
  if (!/^\d*$/.test(palavraPasse)) return "A palavra-passe só pode ter dígitos.";
  if (palavraPasse.length < MIN_PALAVRA_PASSE || palavraPasse.length > MAX_PALAVRA_PASSE) {
    return `A palavra-passe tem de ter entre ${MIN_PALAVRA_PASSE} e ${MAX_PALAVRA_PASSE} dígitos.`;
  }
  return null;
}

// ───────────────────────────── Derivação da palavra-passe ─────────────────────────────

function paraHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function deHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function subtle(): SubtleCrypto {
  const c = globalThis.crypto?.subtle;
  // Sem Web Crypto não há forma honesta de guardar isto — mais vale falhar do
  // que cair para texto em claro sem ninguém dar por isso.
  if (!c) throw new Error("Web Crypto indisponível: não é possível guardar a palavra-passe em segurança.");
  return c;
}

async function derivar(palavraPasse: string, sal: Uint8Array, iteracoes: number): Promise<string> {
  const material = await subtle().importKey("raw", new TextEncoder().encode(palavraPasse), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await subtle().deriveBits(
    { name: "PBKDF2", salt: sal as BufferSource, iterations: iteracoes, hash: "SHA-256" },
    material,
    BITS_CHAVE,
  );
  return paraHex(new Uint8Array(bits));
}

/** Comparação em tempo constante — não muda nada na prática aqui, mas é o hábito certo a ter num caminho de autenticação. */
function iguaisEmTempoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferenca === 0;
}

// ───────────────────────────── Registo de contas ─────────────────────────────

export function lerContas(): Record<string, Conta> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CHAVE_CONTAS);
    if (!raw) return {};
    const valor = JSON.parse(raw) as unknown;
    return valor && typeof valor === "object" ? (valor as Record<string, Conta>) : {};
  } catch {
    return {};
  }
}

function escreverContas(contas: Record<string, Conta>): void {
  window.localStorage.setItem(CHAVE_CONTAS, JSON.stringify(contas));
}

export function contaExiste(nome: string): boolean {
  return normalizarUtilizador(nome) in lerContas();
}

export function obterConta(nome: string): Conta | null {
  return lerContas()[normalizarUtilizador(nome)] ?? null;
}

export interface ResultadoConta {
  ok: boolean;
  erro?: string;
  conta?: Conta;
}

/** Cria uma conta nova. Falha se o nome já existir neste browser. */
export async function criarConta(nome: string, palavraPasse: string): Promise<ResultadoConta> {
  const erroNome = validarUtilizador(nome);
  if (erroNome) return { ok: false, erro: erroNome };
  const erroPasse = validarPalavraPasse(palavraPasse);
  if (erroPasse) return { ok: false, erro: erroPasse };

  const utilizador = normalizarUtilizador(nome);
  const contas = lerContas();
  if (utilizador in contas) return { ok: false, erro: "Já existe uma conta com esse nome neste dispositivo." };

  const sal = crypto.getRandomValues(new Uint8Array(BYTES_SAL));
  const conta: Conta = {
    utilizador,
    nomeApresentacao: nome.trim().replace(/\s+/g, " "),
    salHex: paraHex(sal),
    hashHex: await derivar(palavraPasse, sal, ITERACOES),
    iteracoes: ITERACOES,
    criadaEm: new Date().toISOString(),
  };

  escreverContas({ ...contas, [utilizador]: conta });
  return { ok: true, conta };
}

/**
 * Verifica as credenciais. A mensagem de erro é a mesma para nome inexistente
 * e palavra-passe errada — não vale a pena dizer a quem tenta quais os nomes
 * que existem.
 */
export async function autenticar(nome: string, palavraPasse: string): Promise<ResultadoConta> {
  const conta = obterConta(nome);
  if (!conta) return { ok: false, erro: "Nome de utilizador ou palavra-passe incorretos." };

  const hash = await derivar(palavraPasse, deHex(conta.salHex), conta.iteracoes ?? ITERACOES);
  if (!iguaisEmTempoConstante(hash, conta.hashHex)) {
    return { ok: false, erro: "Nome de utilizador ou palavra-passe incorretos." };
  }
  return { ok: true, conta };
}

/** Altera a palavra-passe, exigindo a atual. */
export async function alterarPalavraPasse(
  nome: string,
  atual: string,
  nova: string,
): Promise<ResultadoConta> {
  const verificacao = await autenticar(nome, atual);
  if (!verificacao.ok || !verificacao.conta) return { ok: false, erro: "Palavra-passe atual incorreta." };

  const erroNova = validarPalavraPasse(nova);
  if (erroNova) return { ok: false, erro: erroNova };

  const sal = crypto.getRandomValues(new Uint8Array(BYTES_SAL));
  const atualizada: Conta = {
    ...verificacao.conta,
    salHex: paraHex(sal),
    hashHex: await derivar(nova, sal, ITERACOES),
    iteracoes: ITERACOES,
  };
  escreverContas({ ...lerContas(), [atualizada.utilizador]: atualizada });
  return { ok: true, conta: atualizada };
}
