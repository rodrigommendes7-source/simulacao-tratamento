/**
 * Progressive disclosure do formulário da Consulta pontual — funções puras,
 * testáveis sem renderizar nada. `abpi` só faz sentido para etiologias
 * vasculares (taxonomia-variaveis-feridas.md); `profundidade_estadiamento`
 * usa a escala NPIAP só em `pressao`, escala genérica nas restantes
 * (taxonomia-variaveis-feridas.md, secção `profundidade_estadiamento`);
 * `exsudado.tipo` só é aplicável quando `exsudado.volume` ≠ `ausente`
 * (taxonomia-variaveis-feridas.md, secção `exsudado`).
 */
import type { Etiologia, VolumeExsudado } from "../tipos/variaveis";

export function precisaAbpi(etiologia: Etiologia): boolean {
  return etiologia === "venosa" || etiologia === "arterial" || etiologia === "mista_arteriovenosa";
}

export type EscalaProfundidade = "pressao" | "generica";

export function escalaProfundidade(etiologia: Etiologia): EscalaProfundidade {
  return etiologia === "pressao" ? "pressao" : "generica";
}

export function mostraTipoExsudado(volume: VolumeExsudado): boolean {
  return volume !== "ausente";
}
