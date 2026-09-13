import { TODOS_TRATAMENTOS } from "../dados/tratamentos";
import type { CasoClinico } from "../tipos/casoClinico";
import type {
  CorrespondenciaCategoria,
  RespostaAluno,
  ResultadoAvaliacao,
} from "../tipos/resultado";
import type { CategoriaTratamento } from "../tipos/tratamento";
import { avaliarCausaTratada } from "./causaTratada";
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

  let pontuacaoBase: number;
  if (isOncologica) {
    pontuacaoBase = oncologico?.pontuacaoPercentual ?? 100;
  } else {
    const comEsperados = correspondenciaPorCategoria.filter(
      (c) => c.pontuacaoPercentual !== null,
    );
    pontuacaoBase =
      comEsperados.length === 0
        ? 100
        : comEsperados.reduce((soma, c) => soma + (c.pontuacaoPercentual as number), 0) /
          comEsperados.length;
  }

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
    pontuacaoFinalPercentual,
    pontuacaoMaximaPossivel,
  };
}
