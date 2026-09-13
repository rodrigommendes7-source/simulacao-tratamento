import { TODOS_TRATAMENTOS } from "../dados/tratamentos";
import type { CasoClinico } from "../tipos/casoClinico";
import type { DecisaoCaso } from "../tipos/resultado";
import type { CategoriaTratamento, EntradaTratamento } from "../tipos/tratamento";
import { categoriaAplicavel, TODAS_CATEGORIAS } from "./aplicabilidadeCategorias";
import { avaliarCondicao, type ContextoAvaliacao } from "./avaliarCondicao";
import { derivarNivelInfecao } from "./nivelInfecao";

/** Verifica se um tratamento é válido para o caso: todas as condições "indicado quando" satisfeitas e nenhuma "contraindicado quando" aplicável. */
export function tratamentoValido(
  tratamento: EntradaTratamento,
  contexto: ContextoAvaliacao,
): boolean {
  const indicado = avaliarCondicao(tratamento.indicadoQuando, contexto);
  if (!indicado) return false;
  const algumaContraindicacao = tratamento.contraindicadoQuando.some((c) =>
    avaliarCondicao(c, contexto),
  );
  return !algumaContraindicacao;
}

/**
 * Motor de decisão — função pura: dado um caso clínico, devolve o nível de
 * infeção derivado, as categorias aplicáveis e os tratamentos válidos por
 * categoria. Não depende de nenhuma resposta de aluno (ver
 * algoritmo/avaliarResposta.ts para a comparação com a resposta).
 */
export function decidirCaso(caso: CasoClinico): DecisaoCaso {
  const hipergranulacaoPresente = caso.tipo_tecido_leito.some(
    (c) => c.tipo === "granulacao_hipergranulada",
  );
  const nivelInfecao = derivarNivelInfecao(
    caso.sinais_infecao,
    caso.exsudado,
    hipergranulacaoPresente,
  );
  const contexto: ContextoAvaliacao = { caso, nivelInfecao };

  const categoriasAplicaveis: CategoriaTratamento[] = TODAS_CATEGORIAS.filter((cat) =>
    categoriaAplicavel(cat, contexto),
  );

  const tratamentosValidos: Partial<Record<CategoriaTratamento, EntradaTratamento[]>> = {};
  for (const categoria of categoriasAplicaveis) {
    tratamentosValidos[categoria] = TODOS_TRATAMENTOS.filter(
      (t) => t.categoria === categoria && tratamentoValido(t, contexto),
    );
  }

  return { nivelInfecao, categoriasAplicaveis, tratamentosValidos };
}
