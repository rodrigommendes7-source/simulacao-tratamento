/**
 * /api/consultas — histórico de consultas pontuais.
 *
 * Mesma forma que `/api/resultados`: o `payload` é o instantâneo completo
 * (variáveis preenchidas e recomendação obtida) tal como foi calculado, e
 * reabrir uma consulta antiga mostra esse instantâneo — não o que o motor
 * atual diria. `versao_regras` diz com que regras foi obtida.
 */
import type { ConsultaHistorico } from "../../../lib/consultas";
import { VERSAO_REGRAS } from "../../../lib/versaoRegras";
import { sql } from "../../../lib/servidor/bd";
import { corpoJson, erro, erroInterno, exigirSessao, ok } from "../../../lib/servidor/resposta";

export const runtime = "nodejs";

export async function GET() {
  const sessao = await exigirSessao();
  if ("erro" in sessao) return sessao.erro;

  try {
    const linhas = (await sql()`
      SELECT id, data, payload FROM consultas
      WHERE utilizador_id = ${sessao.utilizador.id}
      ORDER BY data ASC
    `) as { id: string; data: string; payload: Omit<ConsultaHistorico, "id" | "data"> }[];

    // O id e a data vêm das colunas, não do payload: são o que a base de
    // dados atribuiu, e é por eles que a interface identifica a consulta.
    return ok({
      consultas: linhas.map((l) => ({ ...l.payload, id: l.id, data: new Date(l.data).toISOString() })),
    });
  } catch (causa) {
    return erroInterno("ler consultas", causa);
  }
}

export async function POST(pedido: Request) {
  const sessao = await exigirSessao();
  if ("erro" in sessao) return sessao.erro;

  const corpo = await corpoJson(pedido);
  const entrada = corpo?.entrada as Omit<ConsultaHistorico, "id" | "data"> | undefined;
  if (!entrada || typeof entrada !== "object" || !entrada.caso || !entrada.decisao) {
    return erro("Consulta inválida.", 400);
  }

  const data = new Date().toISOString();

  try {
    const linhas = (await sql()`
      INSERT INTO consultas (utilizador_id, data, versao_regras, payload)
      VALUES (${sessao.utilizador.id}, ${data}, ${VERSAO_REGRAS}, ${JSON.stringify(entrada)})
      RETURNING id
    `) as { id: string }[];

    return ok({ consulta: { ...entrada, id: linhas[0].id, data } }, 201);
  } catch (causa) {
    return erroInterno("gravar consulta", causa);
  }
}

export async function DELETE() {
  const sessao = await exigirSessao();
  if ("erro" in sessao) return sessao.erro;

  try {
    await sql()`DELETE FROM consultas WHERE utilizador_id = ${sessao.utilizador.id}`;
    return ok({ ok: true });
  } catch (causa) {
    return erroInterno("apagar consultas", causa);
  }
}
