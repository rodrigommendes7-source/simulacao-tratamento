import { TODAS_TECNICAS, type EntradaTecnica } from "../dados/tecnicasAplicacao";
import { avaliarCondicao, type ContextoAvaliacao } from "./avaliarCondicao";

export function tecnicaValida(tecnica: EntradaTecnica, contexto: ContextoAvaliacao): boolean {
  if (!avaliarCondicao(tecnica.indicadoQuando, contexto)) return false;
  return !tecnica.contraindicadoQuando.some((c) => avaliarCondicao(c, contexto));
}

export function tecnicasValidas(contexto: ContextoAvaliacao): EntradaTecnica[] {
  return TODAS_TECNICAS.filter((t) => tecnicaValida(t, contexto));
}
