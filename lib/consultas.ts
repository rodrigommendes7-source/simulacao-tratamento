"use client";

/**
 * Histórico local de consultas pontuais — mesmo mecanismo local-first do
 * histórico de casos resolvidos (lib/estado.ts), sem backend/conta, e tal
 * como esse separado por código de aluno (lib/armazenamento.ts). Cada
 * entrada guarda o snapshot completo das variáveis preenchidas e da
 * recomendação obtida nesse momento — reabrir uma consulta antiga mostra
 * esse snapshot tal como foi calculado, sem recalcular com a versão atual
 * do motor (para não dar a ilusão de que o histórico mudou se a lógica
 * evoluir depois).
 */
import type { CasoClinico } from "../tipos/casoClinico";
import type { DecisaoCaso, ResultadoCausaTratada, ResultadoOncologico, ResultadoPortaoSistemico } from "../tipos/resultado";
import type { CorrespondenciaTecnica } from "../algoritmo/avaliarTecnicas";
import { escreverLista, lerLista, limparLista } from "./armazenamento";

const CHAVE_CONSULTAS = "sf_consultas";

export interface ConsultaHistorico {
  id: string;
  data: string; // ISO
  caso: CasoClinico;
  decisao: DecisaoCaso;
  tecnicas: CorrespondenciaTecnica[];
  causaTratada: ResultadoCausaTratada;
  portaoSistemico: ResultadoPortaoSistemico;
  oncologico?: ResultadoOncologico;
}

function gerarId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function obterConsultas(): ConsultaHistorico[] {
  return lerLista<ConsultaHistorico>(CHAVE_CONSULTAS);
}

export function registarConsulta(entrada: Omit<ConsultaHistorico, "id" | "data">): ConsultaHistorico {
  const completa: ConsultaHistorico = { ...entrada, id: gerarId(), data: new Date().toISOString() };
  escreverLista(CHAVE_CONSULTAS, [...obterConsultas(), completa]);
  return completa;
}

export function limparConsultas(): void {
  limparLista(CHAVE_CONSULTAS);
}
