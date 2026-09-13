import type { CasoClinico } from "../tipos/casoClinico";
import type {
  DecisaoCaso,
  DimensaoOncologica,
  RespostaAluno,
  ResultadoDimensaoOncologica,
  ResultadoOncologico,
} from "../tipos/resultado";

/** Threshold fixado na secção 4 do pedido da Fase 4 (dimensão "dor"). */
export const THRESHOLD_DOR_ONCOLOGICA = 4;

function nivelAtingeOuUltrapassaLigeiro(
  valor: "ausente" | "ligeiro" | "moderado" | "forte",
): boolean {
  return valor !== "ausente";
}

/**
 * Pontuação proporcional por dimensão sintomática — secção 3.3, exclusiva
 * de `etiologia = oncologica_maligna`. Não usa o checklist 3.2.
 */
export function avaliarOncologico(
  caso: CasoClinico,
  resposta: RespostaAluno,
  decisao: DecisaoCaso,
): ResultadoOncologico {
  const dimensoes: ResultadoDimensaoOncologica[] = [];

  // 1. Odor
  const odorAplicavel = nivelAtingeOuUltrapassaLigeiro(caso.sinais_infecao.odor);
  dimensoes.push({
    dimensao: "odor",
    aplicavel: odorAplicavel,
    correta: odorAplicavel
      ? resposta.tratamentosSelecionados.includes("paliativo_odor")
      : undefined,
  });

  // 2. Exsudado — sempre aplicável; correto se o penso escolhido (categoria 2) for compatível.
  const idsPensosValidos = (decisao.tratamentosValidos.pensos_humidade ?? []).map(
    (t) => t.id,
  );
  dimensoes.push({
    dimensao: "exsudado",
    aplicavel: true,
    correta: resposta.tratamentosSelecionados.some((id) => idsPensosValidos.includes(id)),
  });

  // 3. Hemorragia
  const hemorragiaAplicavel = caso.exsudado.tipo.includes("sanguinolento");
  dimensoes.push({
    dimensao: "hemorragia",
    aplicavel: hemorragiaAplicavel,
    correta: hemorragiaAplicavel
      ? resposta.tratamentosSelecionados.includes("paliativo_hemorragia") ||
        resposta.tratamentosSelecionados.includes("nitrato_prata")
      : undefined,
  });

  // 4. Dor
  const dorAplicavel = caso.dor >= THRESHOLD_DOR_ONCOLOGICA;
  dimensoes.push({
    dimensao: "dor",
    aplicavel: dorAplicavel,
    correta: dorAplicavel ? resposta.medidasCausais.gestaoDorConsiderada === true : undefined,
  });

  const aplicaveis = dimensoes.filter((d) => d.aplicavel);
  const pontuacaoPercentual =
    aplicaveis.length === 0
      ? null
      : (aplicaveis.filter((d) => d.correta === true).length / aplicaveis.length) * 100;

  return { dimensoes, pontuacaoPercentual };
}

export const DIMENSOES_ONCOLOGICAS: DimensaoOncologica[] = [
  "odor",
  "exsudado",
  "hemorragia",
  "dor",
];
