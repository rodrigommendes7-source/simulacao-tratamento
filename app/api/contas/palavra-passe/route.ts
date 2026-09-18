/**
 * POST /api/contas/palavra-passe — alterar a palavra-passe, exigindo a atual.
 *
 * As outras sessões são terminadas e a atual é recriada: alterar a
 * palavra-passe deve expulsar quem esteja noutro sítio, senão não serve de
 * nada quando é isso que se pretende.
 */
import { validarPalavraPasse } from "../../../../lib/contas";
import { alterarPalavraPasse } from "../../../../lib/servidor/utilizadores";
import { criarSessao, terminarTodasAsSessoes } from "../../../../lib/servidor/sessao";
import { corpoJson, erro, erroInterno, exigirSessao, ok, texto } from "../../../../lib/servidor/resposta";

export const runtime = "nodejs";

export async function POST(pedido: Request) {
  const sessao = await exigirSessao();
  if ("erro" in sessao) return sessao.erro;

  const corpo = await corpoJson(pedido);
  const atual = texto(corpo, "atual");
  const nova = texto(corpo, "nova");

  const erroNova = validarPalavraPasse(nova);
  if (erroNova) return erro(erroNova, 400);

  try {
    const alterada = await alterarPalavraPasse(sessao.utilizador.id, atual, nova);
    if (!alterada) return erro("Palavra-passe atual incorreta.", 401);

    await terminarTodasAsSessoes(sessao.utilizador.id);
    await criarSessao(sessao.utilizador.id);
    return ok({ ok: true });
  } catch (causa) {
    return erroInterno("alterar palavra-passe", causa);
  }
}
