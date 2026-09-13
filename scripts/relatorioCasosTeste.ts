/**
 * Relatório de execução dos 5 casos de teste através do motor de decisão —
 * para revisão de Rodrigo. Não faz parte da suite de testes (essa vive em
 * testes/casosTeste.test.ts); este script só imprime o resultado completo.
 *
 * Correr com: npx tsx scripts/relatorioCasosTeste.ts
 */
import { avaliarResposta } from "../algoritmo/avaliarResposta";
import { decidirCaso } from "../algoritmo/motorDecisao";
import { TODOS_CASOS_TESTE } from "../dados/casosTeste";
import { construirRespostaPerfeita } from "../testes/utilidadesTeste";

for (const { titulo, caso } of TODOS_CASOS_TESTE) {
  const decisao = decidirCaso(caso);
  const resposta = construirRespostaPerfeita(caso, decisao);
  const resultado = avaliarResposta(caso, resposta);

  console.log("=".repeat(80));
  console.log(titulo);
  console.log("=".repeat(80));
  console.log(`etiologia: ${caso.etiologia}${caso.abpi !== undefined ? ` (abpi=${caso.abpi})` : ""}`);
  console.log(`nivel_infecao derivado: ${decisao.nivelInfecao}`);
  console.log(`categorias aplicáveis: ${decisao.categoriasAplicaveis.join(", ")}`);
  console.log("tratamentos válidos por categoria:");
  for (const categoria of decisao.categoriasAplicaveis) {
    const ids = (decisao.tratamentosValidos[categoria] ?? []).map((t) => t.nome);
    console.log(`  - ${categoria}: ${ids.length ? ids.join(", ") : "(nenhum)"}`);
  }
  if (resultado.causaTratada) {
    console.log(
      `checklist "causa tratada": aplicável=${resultado.causaTratada.aplicavel}` +
        (resultado.causaTratada.aplicavel
          ? ` item="${resultado.causaTratada.descricaoItem}" presente=${resultado.causaTratada.itemPresente} tetoSeAusente=${resultado.causaTratada.tetoPontuacao}%`
          : ""),
    );
  }
  console.log(
    `portão sistémico: aplicável=${resultado.portaoSistemico.aplicavel}` +
      (resultado.portaoSistemico.aplicavel
        ? ` satisfeito=${resultado.portaoSistemico.satisfeito}`
        : ""),
  );
  console.log(
    `resposta "perfeita" testada -> pontuação final: ${resultado.pontuacaoFinalPercentual}% ` +
      `(máximo possível: ${resultado.pontuacaoMaximaPossivel}%)`,
  );
  console.log("");
}
