import type { RespostaAluno, ResultadoPortaoSistemico } from "../tipos/resultado";
import type { NivelInfecao } from "../tipos/variaveis";

/**
 * Reutiliza o teto de 40% fixado na secção 4 para este portão (secção 3.4)
 * — validado por Rodrigo em 2026-09-12, mesmo valor por consistência com o
 * checklist "causa tratada" (algoritmo/causaTratada.ts).
 */
export const TETO_PORTAO_SISTEMICO = 40;

/** Portão de referenciação obrigatória — secção 3.4. */
export function avaliarPortaoSistemico(
  nivelInfecao: NivelInfecao,
  resposta: RespostaAluno,
): ResultadoPortaoSistemico {
  const aplicavel = nivelInfecao === "infecao_propagacao_sistemica";
  if (!aplicavel) return { aplicavel: false };
  return {
    aplicavel: true,
    satisfeito: resposta.medidasCausais.referenciacaoMedicaSistemica === true,
    tetoPontuacao: TETO_PORTAO_SISTEMICO,
  };
}
