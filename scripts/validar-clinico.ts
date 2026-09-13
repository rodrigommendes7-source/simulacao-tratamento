/**
 * Verificação programática de completude — corre como parte do `prebuild`
 * (ver package.json) para que `npm run build` falhe explicitamente se
 * alguma combinação de variáveis ficar sem pelo menos uma resposta de
 * pontuação máxima (exigência original da secção 5 da Fase 4).
 *
 * Reutiliza tal e qual a lógica já testada em testes/completude.test.ts
 * (algoritmo/verificacaoCompletude.ts) — não duplica os geradores de
 * combinações nem a verificação em si, só formata o relatório de linha de
 * comandos.
 */
import { verificarCompletudeTotal } from "../algoritmo/verificacaoCompletude";

function main() {
  const resultados = verificarCompletudeTotal();
  let totalFalhas = 0;

  console.log("Verificação de completude clínica (secção 5, Fase 4)\n");

  for (const { categoria, aplicaveis, falhas } of resultados) {
    if (falhas.length === 0) {
      console.log(`  OK  ${categoria} — ${aplicaveis} combinação(ões) aplicável(eis), todas com tratamento válido`);
    } else {
      totalFalhas += falhas.length;
      console.error(`  FALHA  ${categoria} — ${falhas.length} de ${aplicaveis} combinação(ões) aplicável(eis) sem tratamento válido:`);
      for (const descricao of falhas) {
        console.error(`         - ${descricao}`);
      }
    }
  }

  console.log("");

  if (totalFalhas > 0) {
    console.error(
      `Verificação de completude falhou: ${totalFalhas} combinação(ões) sem resposta de pontuação máxima. Corrigir a regra de indicação/contraindicação da categoria assinalada em dados/tratamentos.ts.`,
    );
    process.exit(1);
  }

  console.log("Verificação de completude concluída sem falhas.");
}

main();
