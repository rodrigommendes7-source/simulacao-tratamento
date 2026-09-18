/**
 * DELETE /api/contas/apagar — elimina a conta e todos os dados associados.
 *
 * Exige a palavra-passe atual: é irreversível, e um clique num botão não
 * chega para uma ação destas. A eliminação é efetiva — a linha de
 * `utilizadores` desaparece e as chaves estrangeiras em cascata levam
 * resultados, consultas, rascunhos e sessões com ela. Não fica nada marcado
 * como "apagado" à espera de ser limpo mais tarde.
 */
import { apagarUtilizador } from "../../../../lib/servidor/utilizadores";
import { terminarSessao } from "../../../../lib/servidor/sessao";
import { corpoJson, erro, erroInterno, exigirSessao, ok, texto } from "../../../../lib/servidor/resposta";

export const runtime = "nodejs";

export async function DELETE(pedido: Request) {
  const sessao = await exigirSessao();
  if ("erro" in sessao) return sessao.erro;

  const corpo = await corpoJson(pedido);
  const palavraPasse = texto(corpo, "palavraPasse");

  try {
    const apagada = await apagarUtilizador(sessao.utilizador.id, palavraPasse);
    if (!apagada) return erro("Palavra-passe incorreta.", 401);

    await terminarSessao();
    return ok({ ok: true });
  } catch (causa) {
    return erroInterno("apagar conta", causa);
  }
}
