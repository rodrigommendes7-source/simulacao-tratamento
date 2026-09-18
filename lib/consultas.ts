"use client";

/**
 * Histórico de consultas pontuais — guardado na conta, no servidor.
 *
 * Cada entrada guarda o instantâneo completo das variáveis preenchidas e da
 * recomendação obtida nesse momento. Reabrir uma consulta antiga mostra esse
 * instantâneo tal como foi calculado, sem recalcular com a versão atual do
 * motor — para não dar a ilusão de que o histórico mudou sozinho quando a
 * lógica clínica evoluir. O servidor grava, ao lado, a versão das regras em
 * vigor na altura (lib/versaoRegras.ts).
 */
import type { CasoClinico } from "../tipos/casoClinico";
import type { DecisaoCaso, ResultadoCausaTratada, ResultadoOncologico, ResultadoPortaoSistemico } from "../tipos/resultado";
import type { CorrespondenciaTecnica } from "../algoritmo/avaliarTecnicas";
import { json, pedir } from "./api";

export interface ConsultaHistorico {
  /** Atribuído pela base de dados, não pelo cliente. */
  id: string;
  data: string; // ISO
  caso: CasoClinico;
  decisao: DecisaoCaso;
  tecnicas: CorrespondenciaTecnica[];
  causaTratada: ResultadoCausaTratada;
  portaoSistemico: ResultadoPortaoSistemico;
  oncologico?: ResultadoOncologico;
}

export async function obterConsultas(): Promise<ConsultaHistorico[]> {
  const r = await pedir<{ consultas: ConsultaHistorico[] }>("/api/consultas");
  return r.consultas;
}

export async function registarConsulta(
  entrada: Omit<ConsultaHistorico, "id" | "data">,
): Promise<ConsultaHistorico> {
  const r = await pedir<{ consulta: ConsultaHistorico }>("/api/consultas", {
    method: "POST",
    ...json({ entrada }),
  });
  return r.consulta;
}

export async function limparConsultas(): Promise<void> {
  await pedir("/api/consultas", { method: "DELETE" });
}
