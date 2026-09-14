import { TODOS_TRATAMENTOS } from "../dados/tratamentos";
import type { CasoClinico } from "../tipos/casoClinico";
import type {
  CorrespondenciaCategoria,
  PenalizacaoFalsosPositivos,
  RespostaAluno,
  ResultadoAvaliacao,
} from "../tipos/resultado";
import type { CategoriaTratamento } from "../tipos/tratamento";
import { avaliarCausaTratada } from "./causaTratada";
import { PESO_FALSO_POSITIVO } from "./penalizacao";
import { decidirCaso } from "./motorDecisao";
import { avaliarOncologico } from "./oncologico";
import { avaliarPortaoSistemico } from "./portaoSistemico";

const CATEGORIA_POR_ID: ReadonlyMap<string, CategoriaTratamento> = new Map(
  TODOS_TRATAMENTOS.map((t) => [t.id, t.categoria]),
);

/**
 * Avalia a resposta de um aluno para um caso clínico: compara a resposta
 * submetida ao conjunto de tratamentos válidos (chave de referência do
 * motor de decisão) e aplica os portões/pontuação proporcional das secções
 * 3.2-3.4.
 *
 * A pontuação do plano tem duas metades, e é preciso as duas:
 *
 * - **Recall** — que fração das categorias aplicáveis o aluno endereçou. É o
 *   que sempre existiu.
 * - **Precisão** — quantas categorias o aluno escolheu que não se aplicam ao
 *   caso. Sem esta metade, escolher uma categoria a mais não custava nada (a
 *   categoria não aplicável não contribui com tratamentos para comparar), e
 *   "ticar tudo" dava 100 em qualquer caso. Cada falso positivo desconta
 *   `PESO_FALSO_POSITIVO` unidades de pontuação (ver algoritmo/penalizacao.ts),
 *   com piso em 0.
 *
 * O peso é uma decisão de desenho, não uma regra clínica: uma alternativa
 * defensável seria descontar proporcionalmente ao número de tratamentos da
 * categoria escolhida a mais, o que penalizaria mais as categorias "grandes".
 * Optou-se pelo peso por categoria porque a unidade de decisão que se está a
 * avaliar na Fase 4 é a categoria, não o tratamento.
 */
export function avaliarResposta(
  caso: CasoClinico,
  resposta: RespostaAluno,
): ResultadoAvaliacao {
  const decisao = decidirCaso(caso);

  const correspondenciaPorCategoria: CorrespondenciaCategoria[] = decisao.categoriasAplicaveis
    .filter((categoria) => categoria !== "paliativos_oncologicos")
    .map((categoria) => {
      const idsEsperados = (decisao.tratamentosValidos[categoria] ?? []).map((t) => t.id);
      const idsSelecionados = resposta.tratamentosSelecionados.filter(
        (id) => CATEGORIA_POR_ID.get(id) === categoria,
      );
      const idsCorretos = idsEsperados.filter((id) => idsSelecionados.includes(id));
      const pontuacaoPercentual =
        idsEsperados.length === 0 ? null : (idsCorretos.length / idsEsperados.length) * 100;
      return {
        categoria,
        idsEsperados,
        idsSelecionados,
        idsCorretos,
        pontuacaoPercentual,
      };
    });

  const isOncologica = caso.etiologia === "oncologica_maligna";

  const causaTratada = isOncologica
    ? undefined
    : avaliarCausaTratada(caso, resposta, decisao.categoriasAplicaveis);
  const oncologico = isOncologica
    ? avaliarOncologico(caso, resposta, decisao)
    : undefined;
  const portaoSistemico = avaliarPortaoSistemico(decisao.nivelInfecao, resposta);

  const comEsperados = correspondenciaPorCategoria.filter(
    (c) => c.pontuacaoPercentual !== null,
  );

  let pontuacaoBase: number;
  /** Unidades em que a pontuação base está repartida — é sobre elas que o desconto é medido. */
  let unidades: number;
  if (isOncologica) {
    pontuacaoBase = oncologico?.pontuacaoPercentual ?? 100;
    unidades = oncologico?.dimensoes.filter((d) => d.aplicavel).length ?? 0;
  } else {
    pontuacaoBase =
      comEsperados.length === 0
        ? 100
        : comEsperados.reduce((soma, c) => soma + (c.pontuacaoPercentual as number), 0) /
          comEsperados.length;
    unidades = comEsperados.length;
  }

  // Categorias escolhidas que não se aplicam ao caso. Um caso sem nenhuma
  // unidade avaliável não deixa de poder ter falsos positivos, por isso o
  // divisor tem piso em 1 — aí basta uma escolha a mais para zerar.
  const categoriasFalsoPositivo = (resposta.categoriasSelecionadas ?? []).filter(
    (categoria) => !decisao.categoriasAplicaveis.includes(categoria),
  );
  const valorDaUnidade = 100 / Math.max(unidades, 1);
  const pontosDescontados = Math.min(
    pontuacaoBase,
    categoriasFalsoPositivo.length * valorDaUnidade * PESO_FALSO_POSITIVO,
  );
  pontuacaoBase -= pontosDescontados;

  const falsosPositivos: PenalizacaoFalsosPositivos = {
    categorias: categoriasFalsoPositivo,
    unidades,
    pontosDescontados,
  };

  let pontuacaoMaximaPossivel = 100;
  if (causaTratada?.aplicavel && !causaTratada.itemPresente) {
    pontuacaoMaximaPossivel = Math.min(
      pontuacaoMaximaPossivel,
      causaTratada.tetoPontuacao ?? 100,
    );
  }
  if (portaoSistemico.aplicavel && !portaoSistemico.satisfeito) {
    pontuacaoMaximaPossivel = Math.min(
      pontuacaoMaximaPossivel,
      portaoSistemico.tetoPontuacao ?? 100,
    );
  }

  const pontuacaoFinalPercentual = Math.min(pontuacaoBase, pontuacaoMaximaPossivel);

  return {
    decisao,
    correspondenciaPorCategoria,
    causaTratada,
    oncologico,
    portaoSistemico,
    falsosPositivos,
    pontuacaoFinalPercentual,
    pontuacaoMaximaPossivel,
  };
}
