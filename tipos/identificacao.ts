import type { Exsudado, NivelInfecao, PinTecido, TipoTecido, ValorBordo, ValorPelePerilesional } from "./variaveis";

/** Resposta do aluno à Fase 2 (Identificação) do ecrã de resolução de caso. */
export interface RespostaIdentificacao {
  pins: PinTecido[];
  exsudado: Exsudado;
  bordos: ValorBordo[];
  pele_perilesional: ValorPelePerilesional[];
  /** Classificação de `nivel_infecao` proposta pelo aluno — comparada com a derivada pelo motor. */
  nivelInfecaoProposto: NivelInfecao;
}

export interface ResultadoPinTecido {
  pin: PinTecido;
  /** true se o pin cai dentro de alguma zona de referência do mesmo tipo. */
  correto: boolean;
}

export interface ResultadoTecido {
  pins: ResultadoPinTecido[];
  /**
   * Tipos de tecido que o aluno identificou — um tipo conta como encontrado
   * quando existe pelo menos um pin desse tipo dentro de *alguma* zona de
   * referência desse mesmo tipo.
   */
  tiposEncontrados: TipoTecido[];
  /**
   * Tipos de tecido distintos presentes no caso. Deliberadamente por tipo e
   * não por polígono: várias zonas do mesmo tipo existem só porque as
   * regiões foram desenhadas à mão separadamente, não porque sejam tecidos
   * diferentes a identificar um a um.
   */
  tiposEsperados: TipoTecido[];
  pontuacaoPercentual: number;
}

export interface ResultadoIdentificacao {
  tecido: ResultadoTecido;
  exsudadoVolumeCorreto: boolean;
  exsudadoTipoCorreto: boolean;
  bordosCorretos: boolean;
  peleCorreta: boolean;
  nivelInfecaoCorreto: boolean;
  nivelInfecaoReal: NivelInfecao;
  /** Média simples dos 6 componentes (tecido, exsudado.volume, exsudado.tipo, bordos, pele, nível de infeção). */
  pontuacaoFinalPercentual: number;
}
