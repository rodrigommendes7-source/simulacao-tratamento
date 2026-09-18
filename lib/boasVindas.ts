import type { EntradaHistorico } from "../tipos/historico";
import { LIMIAR_BOM_DESEMPENHO } from "./pontuacao";

/**
 * O que o ecrã principal diz a cada aluno, consoante o que já resolveu.
 *
 * Havia aqui um problema de tom: quem acabava de se registar era recebido com
 * "Bem-vindo(a) de volta", "0 caso(s) resolvido(s)" e "Continue a praticar" —
 * três frases que pressupõem um passado que essa pessoa não tem, e um "0%" de
 * pontuação média que se lê como zero de aproveitamento em vez de ausência de
 * dados.
 *
 * É uma tabela de decisão pequena mas com três ramos e texto exato, por isso
 * vive fora do componente: assim pode ser fixada em testes sem montar um DOM.
 * O título vem em linhas para o componente as separar com `<br/>`.
 */
export interface BoasVindas {
  etiqueta: string;
  /** Linhas do título, na ordem em que aparecem. */
  titulo: string[];
  /** Com histórico vazio esconde-se o cartão: "0%" seria uma má notícia a quem ainda não fez nada. */
  mostrarMedia: boolean;
  subtituloCasoAleatorio: string;
}

export function textoBoasVindas(historico: readonly EntradaHistorico[], media: number): BoasVindas {
  const casosResolvidos = new Set(historico.map((h) => h.casoId)).size;

  if (casosResolvidos === 0) {
    return {
      etiqueta: "Bem-vindo(a)",
      titulo: ["Comece pelo primeiro caso."],
      mostrarMedia: false,
      subtituloCasoAleatorio: "Comece por aqui",
    };
  }

  // Um caso resolvido vai ser um estado comum, não uma passagem rápida: o test
  // drive previsto traz o aluno para aqui com exatamente um caso feito.
  if (casosResolvidos === 1) {
    return {
      etiqueta: "Bem-vindo(a)",
      titulo: ["1 caso resolvido.", "Continue pelo próximo."],
      mostrarMedia: true,
      subtituloCasoAleatorio: "Uma etiologia que ainda não resolveu",
    };
  }

  return {
    etiqueta: "Bem-vindo(a) de volta",
    titulo: [
      `${casosResolvidos} caso(s) resolvido(s).`,
      media >= LIMIAR_BOM_DESEMPENHO ? "Bom desempenho até agora." : "Continue a praticar.",
    ],
    mostrarMedia: true,
    subtituloCasoAleatorio: "Uma etiologia que ainda não resolveu",
  };
}
