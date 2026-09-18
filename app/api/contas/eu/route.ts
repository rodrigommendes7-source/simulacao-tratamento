/**
 * GET /api/contas/eu — quem está em sessão.
 *
 * É o que substitui a leitura de `localStorage` que o AppShell fazia. Sem
 * sessão devolve 200 com `utilizador: null` em vez de 401: não ter sessão é
 * uma resposta normal a esta pergunta, não um erro, e o ecrã de entrada
 * chama-a antes de haver seja o que for.
 */
import { utilizadorDaSessao } from "../../../../lib/servidor/sessao";
import { erroInterno, ok } from "../../../../lib/servidor/resposta";

export const runtime = "nodejs";

export async function GET() {
  try {
    const utilizador = await utilizadorDaSessao();
    return ok({
      utilizador: utilizador
        ? { nomeApresentacao: utilizador.nomeApresentacao, nomeCanonico: utilizador.nomeCanonico }
        : null,
    });
  } catch (causa) {
    return erroInterno("eu", causa);
  }
}
