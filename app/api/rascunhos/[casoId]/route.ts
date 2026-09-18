/**
 * /api/rascunhos/[casoId] — rascunho de um caso por terminar.
 *
 * Um rascunho por caso e por aluno: a chave primária composta
 * `(utilizador_id, caso_id)` faz do guardar um UPSERT, sem ter de se
 * perguntar antes se já existe.
 */
import type { RascunhoCaso } from "../../../../lib/rascunhoCaso";
import { sql } from "../../../../lib/servidor/bd";
import { corpoJson, erro, erroInterno, exigirSessao, ok } from "../../../../lib/servidor/resposta";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ casoId: string }> };

export async function GET(_pedido: Request, { params }: Contexto) {
  const sessao = await exigirSessao();
  if ("erro" in sessao) return sessao.erro;
  const { casoId } = await params;

  try {
    const linhas = (await sql()`
      SELECT payload FROM rascunhos
      WHERE utilizador_id = ${sessao.utilizador.id} AND caso_id = ${casoId}
      LIMIT 1
    `) as { payload: RascunhoCaso }[];

    return ok({ rascunho: linhas[0]?.payload ?? null });
  } catch (causa) {
    return erroInterno("ler rascunho", causa);
  }
}

export async function PUT(pedido: Request, { params }: Contexto) {
  const sessao = await exigirSessao();
  if ("erro" in sessao) return sessao.erro;
  const { casoId } = await params;

  const corpo = await corpoJson(pedido);
  const rascunho = corpo?.rascunho as RascunhoCaso | undefined;
  if (!rascunho || typeof rascunho.versaoDados !== "string" || !Array.isArray(rascunho.pins)) {
    return erro("Rascunho inválido.", 400);
  }

  try {
    await sql()`
      INSERT INTO rascunhos (utilizador_id, caso_id, guardado_em, payload)
      VALUES (${sessao.utilizador.id}, ${casoId}, now(), ${JSON.stringify(rascunho)})
      ON CONFLICT (utilizador_id, caso_id)
      DO UPDATE SET guardado_em = now(), payload = EXCLUDED.payload
    `;
    return ok({ ok: true });
  } catch (causa) {
    return erroInterno("gravar rascunho", causa);
  }
}

export async function DELETE(_pedido: Request, { params }: Contexto) {
  const sessao = await exigirSessao();
  if ("erro" in sessao) return sessao.erro;
  const { casoId } = await params;

  try {
    await sql()`
      DELETE FROM rascunhos WHERE utilizador_id = ${sessao.utilizador.id} AND caso_id = ${casoId}
    `;
    return ok({ ok: true });
  } catch (causa) {
    return erroInterno("apagar rascunho", causa);
  }
}
