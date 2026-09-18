/**
 * POST /api/contas/entrar — verifica credenciais e inicia sessão.
 *
 * Duas coisas a não mexer sem pensar:
 *
 * 1. A mensagem de erro é sempre `ERRO_CREDENCIAIS`, igual para nome
 *    inexistente e para palavra-passe errada. Sem email, a lista de nomes
 *    existentes é metade do trabalho de quem ataque.
 * 2. Uma tentativa falhada faz o servidor esperar antes de responder, cada vez
 *    mais (lib/servidor/atrasoTentativas.ts). Nunca é recusada: não existe
 *    estado de "bloqueado" e nenhum aluno pode ficar impedido de entrar. Nada
 *    na resposta revela que houve atraso — dizê-lo só ajudaria quem estivesse
 *    a medir.
 */
import { ERRO_CREDENCIAIS, normalizarUtilizador } from "../../../../lib/contas";
import { verificarCredenciais } from "../../../../lib/servidor/utilizadores";
import { criarSessao } from "../../../../lib/servidor/sessao";
import { limparFalhas, registarFalhaEAtrasar } from "../../../../lib/servidor/atrasoTentativas";
import { corpoJson, erro, erroInterno, ok, texto } from "../../../../lib/servidor/resposta";

export const runtime = "nodejs";

export async function POST(pedido: Request) {
  const corpo = await corpoJson(pedido);
  const nome = texto(corpo, "nome");
  const palavraPasse = texto(corpo, "palavraPasse");
  const nomeCanonico = normalizarUtilizador(nome);

  try {
    // Um corpo vazio ou incompleto conta como tentativa falhada. Se não
    // contasse, seria uma forma gratuita de manter o contador a zero.
    if (!nome || !palavraPasse) {
      await registarFalhaEAtrasar(nomeCanonico);
      return erro(ERRO_CREDENCIAIS, 401);
    }

    const utilizador = await verificarCredenciais(nome, palavraPasse);
    if (!utilizador) {
      await registarFalhaEAtrasar(nomeCanonico);
      return erro(ERRO_CREDENCIAIS, 401);
    }

    // Credenciais certas são sempre aceites de imediato, mesmo que a tentativa
    // anterior tenha sido atrasada, e o contador desaparece.
    await limparFalhas(nomeCanonico);
    await criarSessao(utilizador.id);
    return ok({
      utilizador: {
        nomeApresentacao: utilizador.nomeApresentacao,
        nomeCanonico: utilizador.nomeCanonico,
      },
    });
  } catch (causa) {
    return erroInterno("entrar", causa);
  }
}
