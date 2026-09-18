/**
 * Versão das regras clínicas em vigor.
 *
 * É gravada em cada resultado e em cada consulta guardada (ver
 * `lib/servidor/bd.ts`, colunas `versao_regras`). Nada a lê ainda — existe
 * para que, quando o algoritmo de decisão mudar, seja possível distinguir os
 * resultados avaliados por regras antigas dos avaliados pelas novas. Sem
 * isto, as estatísticas passariam a misturar as duas populações em silêncio,
 * e uma subida ou descida da média poderia ser apenas uma mudança de régua.
 *
 * Regra de atualização: incrementar **sempre** que se altere
 * `algoritmo/` ou `dados/tratamentos.ts` de forma que mude a pontuação de
 * uma resposta. Formato `AAAA.MM-n`.
 */
export const VERSAO_REGRAS = "2026.09-1";
