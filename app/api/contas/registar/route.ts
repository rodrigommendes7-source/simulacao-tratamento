/**
 * POST /api/contas/registar — cria conta e inicia sessão.
 *
 * A resposta traz o código de recuperação em claro. É a **única** vez que ele
 * é devolvido: o que fica na base de dados é o hash, e não há como o voltar a
 * mostrar. O ecrã de registo tem de o pôr à frente da pessoa com instrução
 * explícita para o guardar.
 */
import { validarPalavraPasse, validarUtilizador } from "../../../../lib/contas";
import { criarUtilizador } from "../../../../lib/servidor/utilizadores";
import { criarSessao } from "../../../../lib/servidor/sessao";
import { corpoJson, erro, erroInterno, ok, texto } from "../../../../lib/servidor/resposta";

// Argon2id é um binário nativo: não corre no runtime Edge.
export const runtime = "nodejs";

export async function POST(pedido: Request) {
  const corpo = await corpoJson(pedido);
  const nome = texto(corpo, "nome");
  const palavraPasse = texto(corpo, "palavraPasse");

  // Validar outra vez no servidor. O cliente já valida, mas essa validação é
  // uma conveniência para dar erro sem ida à rede — não é uma garantia.
  const erroNome = validarUtilizador(nome);
  if (erroNome) return erro(erroNome, 400);
  const erroPasse = validarPalavraPasse(palavraPasse);
  if (erroPasse) return erro(erroPasse, 400);

  try {
    const resultado = await criarUtilizador(nome, palavraPasse);
    // Aqui, ao contrário da entrada, a mensagem é específica de propósito: a
    // pessoa está a escolher um nome e tem de perceber por que razão não pode
    // ficar com aquele. Não revela nada que uma tentativa de registo não
    // revelasse de qualquer maneira.
    if (!resultado) {
      return erro("Já existe uma conta com esse nome. Escolha outro.", 409);
    }

    await criarSessao(resultado.utilizador.id);
    return ok(
      {
        utilizador: {
          nomeApresentacao: resultado.utilizador.nomeApresentacao,
          nomeCanonico: resultado.utilizador.nomeCanonico,
        },
        codigoRecuperacao: resultado.codigoRecuperacao,
      },
      201,
    );
  } catch (causa) {
    return erroInterno("registar", causa);
  }
}
