import type { CasoClinico } from "../tipos/casoClinico";
import type { RespostaIdentificacao, ResultadoIdentificacao, ResultadoPinTecido, ResultadoTecido } from "../tipos/identificacao";
import type { TipoTecido } from "../tipos/variaveis";
import { pontoDentroPoligono } from "./pontoNoPoligono";
import { derivarNivelInfecao } from "./nivelInfecao";

function conjuntosIguais<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size !== setB.size) return false;
  for (const v of setA) if (!setB.has(v)) return false;
  return true;
}

/**
 * Avalia os pins do aluno contra as zonas de referência (polígonos) do caso.
 *
 * A unidade de avaliação é o **tipo de tecido**, não o polígono: o aluno tem
 * de identificar cada tipo presente pelo menos uma vez, e um pin conta como
 * correto se cair dentro de *qualquer* polígono desse mesmo tipo. Um caso com
 * 2 polígonos de esfacelo e 1 de granulação pede 2 pins (um por tipo), não 3
 * — os polígonos múltiplos do mesmo tipo existem apenas porque as regiões
 * foram desenhadas à mão em separado.
 *
 * A pontuação continua a medir recall, agora sobre tipos: proporção dos tipos
 * presentes no caso que o aluno identificou.
 */
export function avaliarTecido(caso: CasoClinico, pins: RespostaIdentificacao["pins"]): ResultadoTecido {
  const pinAcerta = (pin: RespostaIdentificacao["pins"][number], tipo: TipoTecido): boolean =>
    pin.tipo === tipo &&
    caso.tipo_tecido_leito.some(
      (zona) => zona.tipo === tipo && pontoDentroPoligono({ x: pin.x, y: pin.y }, zona.poligono),
    );

  const resultadosPins: ResultadoPinTecido[] = pins.map((pin) => ({
    pin,
    correto: pinAcerta(pin, pin.tipo),
  }));

  // Tipos distintos, pela ordem em que aparecem no caso.
  const tiposEsperados: TipoTecido[] = [...new Set(caso.tipo_tecido_leito.map((z) => z.tipo))];
  const tiposEncontrados: TipoTecido[] = tiposEsperados.filter((tipo) =>
    pins.some((pin) => pinAcerta(pin, tipo)),
  );

  const pontuacaoPercentual =
    tiposEsperados.length === 0 ? 100 : (tiposEncontrados.length / tiposEsperados.length) * 100;

  return { pins: resultadosPins, tiposEncontrados, tiposEsperados, pontuacaoPercentual };
}

/**
 * Avalia a Fase 2 (Identificação) do ecrã de resolução de caso: tecido do
 * leito (pins vs. polígonos), exsudado, bordos, pele perilesional, e a
 * classificação de `nivel_infecao` proposta pelo aluno vs. a derivada pelo
 * motor (algoritmo/nivelInfecao.ts — reutilizada, não duplicada). Função
 * pura, ao mesmo nível de rigor que algoritmo/avaliarResposta.ts.
 */
export function avaliarIdentificacao(
  caso: CasoClinico,
  resposta: RespostaIdentificacao,
): ResultadoIdentificacao {
  const tecido = avaliarTecido(caso, resposta.pins);

  const exsudadoVolumeCorreto = resposta.exsudado.volume === caso.exsudado.volume;
  const exsudadoTipoCorreto = conjuntosIguais(resposta.exsudado.tipo, caso.exsudado.tipo);
  const bordosCorretos = conjuntosIguais(resposta.bordos, caso.bordos);
  const peleCorreta = conjuntosIguais(resposta.pele_perilesional, caso.pele_perilesional);

  const hipergranulacaoPresente = caso.tipo_tecido_leito.some((z) => z.tipo === "granulacao_hipergranulada");
  const nivelInfecaoReal = derivarNivelInfecao(caso.sinais_infecao, caso.exsudado, hipergranulacaoPresente);
  const nivelInfecaoCorreto = resposta.nivelInfecaoProposto === nivelInfecaoReal;

  const componentes = [
    tecido.pontuacaoPercentual,
    exsudadoVolumeCorreto ? 100 : 0,
    exsudadoTipoCorreto ? 100 : 0,
    bordosCorretos ? 100 : 0,
    peleCorreta ? 100 : 0,
    nivelInfecaoCorreto ? 100 : 0,
  ];
  const pontuacaoFinalPercentual = componentes.reduce((s, v) => s + v, 0) / componentes.length;

  return {
    tecido,
    exsudadoVolumeCorreto,
    exsudadoTipoCorreto,
    bordosCorretos,
    peleCorreta,
    nivelInfecaoCorreto,
    nivelInfecaoReal,
    pontuacaoFinalPercentual,
  };
}
