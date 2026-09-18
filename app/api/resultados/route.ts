/**
 * /api/resultados — histórico de casos resolvidos do utilizador em sessão.
 *
 * O `payload` é a `EntradaHistorico` (tipos/historico.ts) tal como o motor de
 * decisão a produziu no momento da submissão. Guarda-se inteira e devolve-se
 * inteira: `lib/estatisticas.ts` só agrega, nunca recalcula, e reabrir um
 * resultado antigo deve mostrar o que foi calculado então — não o que as
 * regras de hoje diriam.
 *
 * `versao_regras` grava, ao lado, qual era a versão das regras clínicas
 * (lib/versaoRegras.ts) nesse momento.
 */
import type { EntradaHistorico } from "../../../tipos/historico";
import { VERSAO_REGRAS } from "../../../lib/versaoRegras";
import { sql } from "../../../lib/servidor/bd";
import { corpoJson, erro, erroInterno, exigirSessao, ok } from "../../../lib/servidor/resposta";

export const runtime = "nodejs";

export async function GET() {
  const sessao = await exigirSessao();
  if ("erro" in sessao) return sessao.erro;

  try {
    const linhas = (await sql()`
      SELECT payload FROM resultados
      WHERE utilizador_id = ${sessao.utilizador.id}
      ORDER BY data ASC
    `) as { payload: EntradaHistorico }[];

    return ok({ resultados: linhas.map((l) => l.payload) });
  } catch (causa) {
    return erroInterno("ler resultados", causa);
  }
}

export async function POST(pedido: Request) {
  const sessao = await exigirSessao();
  if ("erro" in sessao) return sessao.erro;

  const corpo = await corpoJson(pedido);
  const entrada = corpo?.entrada as EntradaHistorico | undefined;
  // Campos estruturais mínimos. Não se valida a forma completa: o corpo é
  // produzido pelo próprio algoritmo e uma validação exaustiva teria de ser
  // reescrita a cada alteração do motor de decisão.
  if (!entrada || typeof entrada.casoId !== "string" || typeof entrada.pontuacaoFinal !== "number") {
    return erro("Resultado inválido.", 400);
  }

  try {
    await sql()`
      INSERT INTO resultados (utilizador_id, caso_id, titulo, etiologia, data, pontuacao_final, versao_regras, payload)
      VALUES (
        ${sessao.utilizador.id}, ${entrada.casoId}, ${entrada.titulo ?? ""}, ${entrada.etiologia},
        ${entrada.data ?? new Date().toISOString()}, ${Math.round(entrada.pontuacaoFinal)},
        ${VERSAO_REGRAS}, ${JSON.stringify(entrada)}
      )
    `;
    return ok({ ok: true }, 201);
  } catch (causa) {
    return erroInterno("gravar resultado", causa);
  }
}

/** Apagar todo o histórico de casos, mantendo a conta. */
export async function DELETE() {
  const sessao = await exigirSessao();
  if ("erro" in sessao) return sessao.erro;

  try {
    await sql()`DELETE FROM resultados WHERE utilizador_id = ${sessao.utilizador.id}`;
    return ok({ ok: true });
  } catch (causa) {
    return erroInterno("apagar resultados", causa);
  }
}
