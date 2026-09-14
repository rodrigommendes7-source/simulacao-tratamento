"use client";

/**
 * Rascunho de um caso por terminar.
 *
 * Até aqui, sair a meio de um caso deitava fora as cinco fases: nada era
 * escrito enquanto o caso não fosse submetido. Agora o estado do ecrã de
 * resolução é guardado no armazenamento local, numa chave por **caso e
 * aluno** — dois alunos no mesmo browser têm rascunhos independentes, pela
 * mesma razão que já têm históricos independentes (lib/armazenamento.ts).
 *
 * O rascunho é deliberadamente curto de vida. É apagado quando o caso é
 * submetido (o resultado passa a viver no histórico) e quando o aluno carrega
 * em "Sair sem guardar" — esse botão diz o que faz, e passaria a mentir se
 * deixasse ficar para trás o que tinha sido guardado automaticamente.
 *
 * `versaoDados` resolve o problema de um rascunho sobreviver a uma alteração
 * da ficha clínica: um rascunho feito sobre a versão antiga de um caso pode
 * já não fazer sentido (os tecidos marcados podem referir-se a polígonos que
 * mudaram, as categorias escolhidas podem já não ser as aplicáveis). Em vez
 * de o descartar ou de o manter em silêncio, guarda-se a versão dos dados com
 * que foi criado e, quando não coincide, pergunta-se ao aluno.
 */
import type {
  NivelInfecao,
  PinTecido,
  TipoExsudado,
  TipoTecido,
  ValorBordo,
  ValorPelePerilesional,
  VolumeExsudado,
} from "../tipos/variaveis";
import type { CategoriaTratamento } from "../tipos/tratamento";
import type { MedidasCausaisResposta } from "../tipos/resultado";
import { chaveDoAluno } from "./armazenamento";

const BASE_CHAVE = "sf_rascunho_caso";

/**
 * Estado do ecrã de resolução, em forma serializável. Os `Set` do componente
 * viajam como arrays; os `Record` ficam como estão.
 *
 * Fica de fora o que é puramente de apresentação e não custa nada refazer:
 * qual das perguntas ou justificações está expandida no momento.
 */
export interface RascunhoCaso {
  /** Impressão digital dos dados do caso quando o rascunho foi criado. */
  versaoDados: string;
  guardadoEm: string;
  fase: number;
  tecidoAtivo: TipoTecido | null;
  pins: PinTecido[];
  exsudadoVolume: VolumeExsudado | null;
  exsudadoTipo: TipoExsudado[];
  bordos: ValorBordo[];
  pele: ValorPelePerilesional[];
  nivelInfecaoProposto: NivelInfecao | null;
  perguntado: Record<number, boolean>;
  categorias: CategoriaTratamento[];
  tecnicas: string[];
  medidas: MedidasCausaisResposta;
  justRespostas: Record<string, number>;
  /** Ordem sorteada das opções de justificação — guardada para as opções não saltarem de sítio ao recarregar. */
  ordemOpcoes: Record<string, number[]>;
}

/**
 * Impressão digital determinística (FNV-1a, 32 bits em hexadecimal).
 *
 * Não é criptográfica nem precisa de ser: só tem de mudar quando os dados do
 * caso mudam. Colisões dariam um rascunho carregado sem aviso — o custo é o
 * aluno ver um rascunho desatualizado, não perda de dados.
 */
export function impressaoDigital(texto: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/**
 * Versão dos dados de um caso: a própria ficha clínica **e** o que o motor de
 * decisão conclui a partir dela. Incluir a decisão faz com que uma alteração
 * nas regras (uma categoria que deixa de ser aplicável, um tratamento que
 * deixa de ser válido) também conte como mudança — é exatamente o tipo de
 * alteração que pode invalidar as escolhas já feitas no rascunho.
 */
export function versaoDadosDoCaso(caso: unknown, decisao: unknown): string {
  return impressaoDigital(JSON.stringify({ caso, decisao }));
}

function chave(casoId: string): string {
  return chaveDoAluno(`${BASE_CHAVE}:${casoId}`);
}

export function lerRascunho(casoId: string): RascunhoCaso | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = window.localStorage.getItem(chave(casoId));
    if (!bruto) return null;
    const valor = JSON.parse(bruto) as unknown;
    if (!valor || typeof valor !== "object") return null;
    const r = valor as Partial<RascunhoCaso>;
    // Um rascunho sem os campos estruturais não é aproveitável; mais vale
    // ignorá-lo do que deixar o ecrã carregar com `undefined` por todo o lado.
    if (typeof r.versaoDados !== "string" || !Array.isArray(r.pins)) return null;
    return r as RascunhoCaso;
  } catch {
    return null;
  }
}

export function guardarRascunho(casoId: string, rascunho: RascunhoCaso): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(chave(casoId), JSON.stringify(rascunho));
  } catch {
    /* quota cheia ou armazenamento indisponível — perder o rascunho não pode partir o ecrã. */
  }
}

export function apagarRascunho(casoId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(chave(casoId));
}

/**
 * O rascunho não tem nada que valha a pena guardar?
 *
 * Abrir um caso e sair sem lhe tocar não deve deixar lixo no armazenamento —
 * e, mais importante, não deve criar um rascunho que depois "restaure" um
 * ecrã vazio por cima de nada.
 */
export function rascunhoVazio(r: RascunhoCaso): boolean {
  return (
    r.fase <= 1 &&
    r.pins.length === 0 &&
    r.exsudadoVolume === null &&
    r.exsudadoTipo.length === 0 &&
    r.bordos.length === 0 &&
    r.pele.length === 0 &&
    r.nivelInfecaoProposto === null &&
    Object.keys(r.perguntado).length === 0 &&
    r.categorias.length === 0 &&
    r.tecnicas.length === 0 &&
    !Object.values(r.medidas).some(Boolean) &&
    Object.keys(r.justRespostas).length === 0
  );
}
