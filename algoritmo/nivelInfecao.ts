import type { Exsudado, NivelInfecao, SinaisInfecaoInput } from "../tipos/variaveis";

const ORDEM_NIVEL: Record<string, number> = {
  ausente: 0,
  ligeiro: 1,
  moderado: 2,
  forte: 3,
};

function nivelAtingeOuUltrapassa(
  valor: "ausente" | "ligeiro" | "moderado" | "forte",
  minimo: "ausente" | "ligeiro" | "moderado" | "forte",
): boolean {
  return ORDEM_NIVEL[valor] >= ORDEM_NIVEL[minimo];
}

/**
 * Deriva `nivel_infecao` (continuum IWII) — regra fixada na secção 3.1 do
 * pedido da Fase 4: avaliada por ordem (propagação → overt → covert →
 * sem_sinais), parando na primeira que se aplicar. O threshold "≥2 sinais
 * covert" para `infecao_local_covert` está explicitamente definido no
 * pedido (secção 3.1) — não é uma suposição desta implementação.
 *
 * `hipergranulacaoPresente` é a referência cruzada a `tipo_tecido_leito
 * contém granulacao_hipergranulada` (Fase 1 v2) — resolvida pelo chamador
 * porque não faz parte de `SinaisInfecaoInput`.
 */
export function derivarNivelInfecao(
  sinais: SinaisInfecaoInput,
  exsudado: Exsudado,
  hipergranulacaoPresente: boolean,
): NivelInfecao {
  const propagacao =
    sinais.celulite ||
    sinais.linfangite ||
    sinais.abcesso ||
    sinais.febre ||
    sinais.leucocitose;
  if (propagacao) return "infecao_propagacao_sistemica";

  const exsudadoPurulento = exsudado.tipo.includes("purulento");
  const overt =
    nivelAtingeOuUltrapassa(sinais.eritema, "ligeiro") ||
    sinais.calor_local ||
    sinais.edema_local ||
    exsudadoPurulento;
  if (overt) return "infecao_local_overt";

  const sinaisCovertPresentes = [
    sinais.dor_aumentada,
    sinais.tecido_friavel,
    nivelAtingeOuUltrapassa(sinais.odor, "ligeiro"),
    sinais.atraso_cicatrizacao,
    hipergranulacaoPresente,
    sinais.quebra_ferida_nova,
  ].filter(Boolean).length;

  if (sinaisCovertPresentes >= 2) return "infecao_local_covert";

  return "sem_sinais";
}
