import "server-only";

/**
 * Operações sobre contas, do lado do servidor.
 *
 * Nenhuma destas funções escreve cookies nem lê o pedido — isso é trabalho das
 * rotas. Aqui ficam só as regras: criar, verificar, alterar, recuperar, apagar.
 */
import { sql } from "./bd";
import { corresponde, derivar } from "./palavraPasse";
import { gerarCodigoRecuperacao, normalizarCodigoRecuperacao } from "./recuperacao";
import { nomeApresentacao, normalizarUtilizador } from "../contas";

export interface RegistoUtilizador {
  id: string;
  nomeApresentacao: string;
  nomeCanonico: string;
}

/** Código do Postgres para violação de restrição UNIQUE. */
const VIOLACAO_UNICIDADE = "23505";

export interface ResultadoRegisto {
  utilizador: RegistoUtilizador;
  /** Em claro, e só aqui: é a única vez que alguém o vê. O que fica guardado é o hash. */
  codigoRecuperacao: string;
}

/**
 * Cria uma conta.
 *
 * A unicidade não é verificada com um SELECT prévio — é a restrição UNIQUE de
 * `nome_canonico` que decide, e a violação é apanhada aqui. Um SELECT antes do
 * INSERT tem uma janela entre os dois em que dois registos simultâneos com o
 * mesmo nome passam ambos; a restrição não tem essa janela.
 *
 * Devolve `null` quando o nome já existe, para a rota poder dar a mensagem
 * clara que o registo (ao contrário da entrada) deve mesmo dar.
 */
export async function criarUtilizador(
  nome: string,
  palavraPasse: string,
): Promise<ResultadoRegisto | null> {
  const codigo = gerarCodigoRecuperacao();
  const [hashPasse, hashCodigo] = await Promise.all([
    derivar(palavraPasse),
    derivar(normalizarCodigoRecuperacao(codigo)),
  ]);

  try {
    const linhas = (await sql()`
      INSERT INTO utilizadores (nome_apresentacao, nome_canonico, palavra_passe_hash, recuperacao_hash)
      VALUES (${nomeApresentacao(nome)}, ${normalizarUtilizador(nome)}, ${hashPasse}, ${hashCodigo})
      RETURNING id, nome_apresentacao, nome_canonico
    `) as { id: string; nome_apresentacao: string; nome_canonico: string }[];

    return {
      utilizador: {
        id: linhas[0].id,
        nomeApresentacao: linhas[0].nome_apresentacao,
        nomeCanonico: linhas[0].nome_canonico,
      },
      codigoRecuperacao: codigo,
    };
  } catch (erro) {
    if ((erro as { code?: string }).code === VIOLACAO_UNICIDADE) return null;
    throw erro;
  }
}

interface LinhaUtilizador {
  id: string;
  nome_apresentacao: string;
  nome_canonico: string;
  palavra_passe_hash: string;
  recuperacao_hash: string;
}

async function porNomeCanonico(nomeCanonico: string): Promise<LinhaUtilizador | null> {
  const linhas = (await sql()`
    SELECT id, nome_apresentacao, nome_canonico, palavra_passe_hash, recuperacao_hash
    FROM utilizadores WHERE nome_canonico = ${nomeCanonico} LIMIT 1
  `) as LinhaUtilizador[];
  return linhas[0] ?? null;
}

/**
 * Hash descartável, usado quando o nome não existe.
 *
 * Sem isto, um nome inexistente respondia de imediato e um nome existente
 * demorava as dezenas de milissegundos do Argon2id — a diferença de tempo
 * diria exatamente o que a mensagem genérica de erro se esforça por não
 * dizer. Verificar contra um hash real iguala os dois caminhos.
 */
let hashFalso: Promise<string> | null = null;
function hashDescartavel(): Promise<string> {
  hashFalso ??= derivar("palavra-passe-que-nao-existe");
  return hashFalso;
}

/** Verifica credenciais. `null` tanto para nome inexistente como para palavra-passe errada. */
export async function verificarCredenciais(
  nome: string,
  palavraPasse: string,
): Promise<RegistoUtilizador | null> {
  const linha = await porNomeCanonico(normalizarUtilizador(nome));
  if (!linha) {
    await corresponde(palavraPasse, await hashDescartavel());
    return null;
  }
  if (!(await corresponde(palavraPasse, linha.palavra_passe_hash))) return null;
  return {
    id: linha.id,
    nomeApresentacao: linha.nome_apresentacao,
    nomeCanonico: linha.nome_canonico,
  };
}

/** Altera a palavra-passe, exigindo a atual. */
export async function alterarPalavraPasse(
  utilizadorId: string,
  atual: string,
  nova: string,
): Promise<boolean> {
  const linhas = (await sql()`
    SELECT palavra_passe_hash FROM utilizadores WHERE id = ${utilizadorId} LIMIT 1
  `) as { palavra_passe_hash: string }[];
  if (!linhas[0] || !(await corresponde(atual, linhas[0].palavra_passe_hash))) return false;

  await sql()`
    UPDATE utilizadores SET palavra_passe_hash = ${await derivar(nova)} WHERE id = ${utilizadorId}
  `;
  return true;
}

export interface ResultadoRecuperacao {
  utilizador: RegistoUtilizador;
  /** Código novo, também mostrado uma única vez. O anterior deixa de servir. */
  novoCodigoRecuperacao: string;
}

/**
 * Repõe a palavra-passe com o código de recuperação.
 *
 * O código é de utilização única: a mesma instrução que grava a palavra-passe
 * nova grava também o hash de um código novo, pelo que o antigo deixa de
 * servir no instante em que é usado. Um código que continuasse válido seria
 * uma segunda palavra-passe permanente, escrita num papel.
 */
export async function recuperarPalavraPasse(
  nome: string,
  codigo: string,
  novaPalavraPasse: string,
): Promise<ResultadoRecuperacao | null> {
  const linha = await porNomeCanonico(normalizarUtilizador(nome));
  if (!linha) {
    await corresponde(codigo, await hashDescartavel());
    return null;
  }
  if (!(await corresponde(normalizarCodigoRecuperacao(codigo), linha.recuperacao_hash))) return null;

  const novoCodigo = gerarCodigoRecuperacao();
  const [hashPasse, hashCodigo] = await Promise.all([
    derivar(novaPalavraPasse),
    derivar(normalizarCodigoRecuperacao(novoCodigo)),
  ]);

  await sql()`
    UPDATE utilizadores
    SET palavra_passe_hash = ${hashPasse},
        recuperacao_hash = ${hashCodigo},
        recuperacao_usada_em = now()
    WHERE id = ${linha.id}
  `;

  return {
    utilizador: {
      id: linha.id,
      nomeApresentacao: linha.nome_apresentacao,
      nomeCanonico: linha.nome_canonico,
    },
    novoCodigoRecuperacao: novoCodigo,
  };
}

/**
 * Apaga a conta e tudo o que lhe pertence.
 *
 * Basta apagar a linha de `utilizadores`: as chaves estrangeiras de
 * `sessoes`, `resultados`, `consultas` e `rascunhos` são todas
 * `ON DELETE CASCADE`, por isso a eliminação é mesmo efetiva e não deixa
 * registos órfãos a apontar para uma conta que já não existe.
 */
export async function apagarUtilizador(utilizadorId: string, palavraPasse: string): Promise<boolean> {
  const linhas = (await sql()`
    SELECT palavra_passe_hash FROM utilizadores WHERE id = ${utilizadorId} LIMIT 1
  `) as { palavra_passe_hash: string }[];
  if (!linhas[0] || !(await corresponde(palavraPasse, linhas[0].palavra_passe_hash))) return false;

  await sql()`DELETE FROM utilizadores WHERE id = ${utilizadorId}`;
  return true;
}
