import type { CorrespondenciaCategoria } from "./resultado";
import type { CorrespondenciaTecnica } from "../algoritmo/avaliarTecnicas";
import type { CorrespondenciaJustificacao } from "../algoritmo/avaliarJustificacoes";
import type { Etiologia } from "./variaveis";

/** Resumo do resultado de Identificação guardado no histórico — os campos booleanos/percentuais já devolvidos por algoritmo/avaliarIdentificacao.ts, sem os pins em bruto (não são necessários para estatísticas). */
export interface DesempenhoIdentificacaoResumo {
  pontuacaoPercentual: number;
  tecidoPercentual: number;
  exsudadoVolumeCorreto: boolean;
  exsudadoTipoCorreto: boolean;
  bordosCorretos: boolean;
  peleCorreta: boolean;
  nivelInfecaoCorreto: boolean;
}

/**
 * Uma entrada de histórico por caso resolvido — guardada na conta do aluno,
 * na base de dados (ver lib/estado.ts e app/api/resultados/route.ts), com a
 * versão das regras clínicas usadas ao lado. Guarda os resultados já devolvidos
 * pelo motor de decisão (algoritmo/avaliarResposta.ts,
 * algoritmo/avaliarIdentificacao.ts, algoritmo/avaliarTecnicas.ts,
 * algoritmo/avaliarJustificacoes.ts) tal como foram calculados no momento
 * da submissão — lib/estatisticas.ts só agrega, nunca recalcula.
 */
export interface EntradaHistorico {
  casoId: string;
  titulo: string;
  etiologia: Etiologia;
  data: string; // ISO
  /** Média de identificacao.pontuacaoPercentual e pontuacaoTratamento — a pontuação apresentada ao aluno no ecrã de resultado. */
  pontuacaoFinal: number;
  identificacao: DesempenhoIdentificacaoResumo;
  /** Cópia direta de ResultadoAvaliacao.correspondenciaPorCategoria (algoritmo/avaliarResposta.ts). */
  correspondenciaTratamento: CorrespondenciaCategoria[];
  pontuacaoTratamento: number;
  correspondenciaTecnicas: CorrespondenciaTecnica[];
  pontuacaoTecnicas: number;
  correspondenciaJustificacoes: CorrespondenciaJustificacao[];
  pontuacaoJustificacoes: number | null;
}
