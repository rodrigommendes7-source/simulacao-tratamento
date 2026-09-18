/** POST /api/contas/sair — apaga a sessão no servidor e o cookie no browser. */
import { terminarSessao } from "../../../../lib/servidor/sessao";
import { erroInterno, ok } from "../../../../lib/servidor/resposta";

export const runtime = "nodejs";

export async function POST() {
  try {
    await terminarSessao();
    return ok({ ok: true });
  } catch (causa) {
    return erroInterno("sair", causa);
  }
}
