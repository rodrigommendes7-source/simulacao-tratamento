import type { Condicao, NomeCampo } from "../tipos/condicao";
import type { CasoClinico } from "../tipos/casoClinico";
import type { NivelInfecao } from "../tipos/variaveis";

/** Contexto necessário para avaliar uma condição: o caso + o nível de infeção já derivado. */
export interface ContextoAvaliacao {
  caso: CasoClinico;
  nivelInfecao: NivelInfecao;
}

function obterValor(contexto: ContextoAvaliacao, campo: NomeCampo): unknown {
  const { caso, nivelInfecao } = contexto;
  switch (campo) {
    case "etiologia":
      return caso.etiologia;
    case "tipo_tecido_leito":
      return caso.tipo_tecido_leito.map((c) => c.tipo);
    case "exsudado.volume":
      return caso.exsudado.volume;
    case "exsudado.tipo":
      return caso.exsudado.tipo;
    case "nivel_infecao":
      return nivelInfecao;
    case "bordos":
      return caso.bordos;
    case "pele_perilesional":
      return caso.pele_perilesional;
    case "profundidade_estadiamento":
      return caso.profundidade_estadiamento;
    case "dor":
      return caso.dor;
    case "abpi":
      return caso.abpi;
    default: {
      const _exaustivo: never = campo;
      throw new Error(`Campo desconhecido na DSL de condições: ${_exaustivo}`);
    }
  }
}

export function avaliarCondicao(
  condicao: Condicao,
  contexto: ContextoAvaliacao,
): boolean {
  switch (condicao.tipo) {
    case "igualdade": {
      const valorAtual = obterValor(contexto, condicao.campo);
      const igual = valorAtual === condicao.valor;
      return condicao.operador === "=" ? igual : !igual;
    }
    case "conjunto": {
      const valorAtual = obterValor(contexto, condicao.campo);
      if (!Array.isArray(valorAtual)) {
        throw new Error(
          `Operador de conjunto usado num campo não-lista: ${condicao.campo}`,
        );
      }
      const contem = valorAtual.includes(condicao.valor);
      return condicao.operador === "contem" ? contem : !contem;
    }
    case "numerica": {
      const valorAtual = obterValor(contexto, condicao.campo);
      if (typeof valorAtual !== "number") {
        // Campo numérico não aplicável a este caso (ex.: abpi ausente) — condição falha.
        return false;
      }
      switch (condicao.operador) {
        case ">":
          return valorAtual > condicao.valor;
        case ">=":
          return valorAtual >= condicao.valor;
        case "<":
          return valorAtual < condicao.valor;
        case "<=":
          return valorAtual <= condicao.valor;
      }
      return false;
    }
    case "E":
      return condicao.condicoes.every((c) => avaliarCondicao(c, contexto));
    case "OU":
      return condicao.condicoes.some((c) => avaliarCondicao(c, contexto));
    case "NAO":
      return !avaliarCondicao(condicao.condicao, contexto);
  }
}
