/**
 * POST /api/contas/recuperar — repor a palavra-passe com o código de recuperação.
 *
 * Sem email, este é o único caminho de reposição, e por isso é também uma
 * porta de ataque: partilha com a entrada o mesmo atraso progressivo e a mesma
 * mensagem genérica. Tal como lá, nunca recusa a tentativa — só demora mais a
 * responder a quem falha várias vezes seguidas.
 *
 * Em caso de sucesso, todas as sessões abertas dessa conta são terminadas —
 * quem repõe a palavra-passe pode estar a fazê-lo precisamente por suspeitar
 * que outra pessoa lhe entrou na conta.
 */
import { ERRO_CREDENCIAIS, normalizarUtilizador, validarPalavraPasse } from "../../../../lib/contas";
import { recuperarPalavraPasse } from "../../../../lib/servidor/utilizadores";
import { criarSessao, terminarTodasAsSessoes } from "../../../../lib/servidor/sessao";
import { limparFalhas, registarFalhaEAtrasar } from "../../../../lib/servidor/atrasoTentativas";
import { corpoJson, erro, erroInterno, ok, texto } from "../../../../lib/servidor/resposta";

export const runtime = "nodejs";

export async function POST(pedido: Request) {
  const corpo = await corpoJson(pedido);
  const nome = texto(corpo, "nome");
  const codigo = texto(corpo, "codigo");
  const novaPalavraPasse = texto(corpo, "novaPalavraPasse");
  const nomeCanonico = normalizarUtilizador(nome);

  const erroPasse = validarPalavraPasse(novaPalavraPasse);
  if (erroPasse) return erro(erroPasse, 400);

  try {
    const resultado = await recuperarPalavraPasse(nome, codigo, novaPalavraPasse);
    if (!resultado) {
      await registarFalhaEAtrasar(nomeCanonico);
      return erro(ERRO_CREDENCIAIS, 401);
    }

    await limparFalhas(nomeCanonico);
    await terminarTodasAsSessoes(resultado.utilizador.id);
    await criarSessao(resultado.utilizador.id);

    return ok({
      utilizador: {
        nomeApresentacao: resultado.utilizador.nomeApresentacao,
        nomeCanonico: resultado.utilizador.nomeCanonico,
      },
      // O código anterior acabou de ser invalidado. Este é novo e, tal como o
      // primeiro, só aparece aqui.
      codigoRecuperacao: resultado.novoCodigoRecuperacao,
    });
  } catch (causa) {
    return erroInterno("recuperar", causa);
  }
}
