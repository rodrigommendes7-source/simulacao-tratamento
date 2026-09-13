import type { CasoClinico } from "../tipos/casoClinico";
import type { RespostaAluno, ResultadoCausaTratada } from "../tipos/resultado";
import type { CategoriaTratamento } from "../tipos/tratamento";

/** Teto de pontuação fixado na secção 4 do pedido da Fase 4. */
export const TETO_CAUSA_NAO_TRATADA = 40;

const TRATAMENTOS_COMPRESSAO_IDS = [
  "compressao_alta_pressao",
  "compressao_reduzida",
  "meias_compressao_pos_cicatrizacao",
];

/**
 * Checklist "causa tratada" (teto de pontuação) — secção 3.2. Portão
 * binário, não soma pontos: se aplicável e o item não estiver presente na
 * resposta, a pontuação final desse caso é limitada a `TETO_CAUSA_NAO_TRATADA`.
 *
 * `categoriasAplicaveis` (do DecisaoCaso — algoritmo/motorDecisao.ts) é
 * necessário para `venosa`: quando ABPI está fora do intervalo 0,5-1,3 a
 * categoria `terapia_compressiva` fica não aplicável (ver
 * algoritmo/aplicabilidadeCategorias.ts) — nesse caso a resposta certa deixa
 * de ser "compressão" e passa a ser referenciação vascular, pelo mesmo
 * princípio já usado em arterial/mista_arteriovenosa. Extensão da regra
 * existente para ABPI fora de intervalo, validada por Rodrigo em
 * 2026-09-12 (casos de teste 4/5).
 */
export function avaliarCausaTratada(
  caso: CasoClinico,
  resposta: RespostaAluno,
  categoriasAplicaveis: CategoriaTratamento[],
): ResultadoCausaTratada {
  switch (caso.etiologia) {
    case "venosa": {
      const compressaoAplicavel = categoriasAplicaveis.includes("terapia_compressiva");
      const itemPresente = compressaoAplicavel
        ? resposta.tratamentosSelecionados.some((id) => TRATAMENTOS_COMPRESSAO_IDS.includes(id))
        : resposta.medidasCausais.referenciacaoVascular === true;
      return {
        aplicavel: true,
        itemPresente,
        descricaoItem: compressaoAplicavel
          ? "Alguma forma de compressão"
          : "Referenciação vascular / avaliação de perfusão (ABPI fora do intervalo que permite compressão)",
        tetoPontuacao: TETO_CAUSA_NAO_TRATADA,
      };
    }
    case "arterial":
    case "mista_arteriovenosa":
      return {
        aplicavel: true,
        itemPresente: resposta.medidasCausais.referenciacaoVascular === true,
        descricaoItem: "Referenciação vascular / avaliação de perfusão",
        tetoPontuacao: TETO_CAUSA_NAO_TRATADA,
      };
    case "pressao":
      return {
        aplicavel: true,
        itemPresente: resposta.medidasCausais.alivioPressao === true,
        descricaoItem: "Alívio de pressão / reposicionamento",
        tetoPontuacao: TETO_CAUSA_NAO_TRATADA,
      };
    case "pe_diabetico_neuropatico":
    case "pe_diabetico_neuroisquemico":
      return {
        aplicavel: true,
        itemPresente:
          resposta.medidasCausais.descargaOffloading === true &&
          resposta.medidasCausais.controloGlicemicoReferenciado === true,
        descricaoItem: "Descarga (offloading) + controlo glicémico referenciado",
        tetoPontuacao: TETO_CAUSA_NAO_TRATADA,
      };
    case "cirurgica":
    case "traumatica":
    case "outra":
      return { aplicavel: false };
    case "oncologica_maligna":
      // Não usa este checklist — ver algoritmo/oncologico.ts (secção 3.3).
      return { aplicavel: false };
  }
}
