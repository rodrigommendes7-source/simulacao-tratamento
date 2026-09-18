/**
 * Regras de validação de contas — partilhadas pelo cliente e pelo servidor.
 *
 * Este ficheiro não tem segredos nem acesso a dados: é só o vocabulário comum
 * sobre o que é um nome de utilizador válido e o que é a forma canónica desse
 * nome. O cliente usa-o para dar erro cedo, sem ida à rede; o servidor usa o
 * mesmo código para validar outra vez, porque validação do lado do cliente é
 * uma conveniência e nunca uma garantia.
 *
 * O que aqui **não** está, e é deliberado: a derivação da palavra-passe. Esta
 * corre exclusivamente no servidor (lib/servidor/palavraPasse.ts). Uma versão
 * anterior derivava o hash no browser com PBKDF2 e guardava-o no
 * `localStorage`; num modelo com servidor, enviar o hash tornaria o hash na
 * palavra-passe efetiva e uma fuga da base de dados abriria todas as contas.
 * O cliente envia a palavra-passe por HTTPS e nunca vê um hash.
 */

export const MIN_UTILIZADOR = 3;
export const MAX_UTILIZADOR = 24;
export const MIN_PALAVRA_PASSE = 4;
export const MAX_PALAVRA_PASSE = 6;

/** Letras (com acentos), dígitos, espaço e `.`/`_`/`-`. Sem símbolos que compliquem a leitura em voz alta. */
const CARACTERES_UTILIZADOR = /^[\p{L}\p{N} ._-]+$/u;

/** Só dígitos, entre `MIN_PALAVRA_PASSE` e `MAX_PALAVRA_PASSE`. */
export const FORMATO_PALAVRA_PASSE = new RegExp(`^\d{${MIN_PALAVRA_PASSE},${MAX_PALAVRA_PASSE}}$`);

/**
 * Forma canónica do nome — é esta que a base de dados guarda em
 * `utilizadores.nome_canonico`, com restrição UNIQUE.
 *
 * Minúsculas, espaços colapsados **e acentos removidos**: "Ana Antão",
 * "ana antao" e " ANA   ANTÃO " são a mesma pessoa e não podem dar três
 * contas. A remoção de acentos é feita aqui, na aplicação, e não com a
 * extensão `unaccent` do Postgres: assim é determinística, portável e
 * testável sem base de dados.
 *
 * `NFD` separa a letra do sinal diacrítico; o intervalo `\u0300-\u036f` é o
 * bloco dos sinais combinatórios, que fica de fora.
 */
export function normalizarUtilizador(nome: string): string {
  return nome
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-PT")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Como a pessoa escreveu o nome, só com os espaços arrumados — é assim que aparece na interface. */
export function nomeApresentacao(nome: string): string {
  return nome.trim().replace(/\s+/g, " ");
}

export function validarUtilizador(nome: string): string | null {
  const limpo = nomeApresentacao(nome);
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

/**
 * Mensagem única para credenciais erradas.
 *
 * É a mesma para nome inexistente e para palavra-passe errada, de propósito:
 * distinguir os dois casos diria a quem tenta quais os nomes que existem, e
 * sem email a lista de nomes é metade do trabalho de um ataque.
 */
export const ERRO_CREDENCIAIS = "Nome de utilizador ou palavra-passe incorretos.";
