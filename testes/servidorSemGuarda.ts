/**
 * Substituto do pacote `server-only` nos testes.
 *
 * O `server-only` existe para rebentar quando um módulo de servidor é
 * importado a partir de código de cliente, e a forma como o faz é atirar
 * assim que é carregado fora do Next. Num teste em Node isso apanharia
 * qualquer ficheiro de `lib/servidor/` — incluindo funções puras que não
 * tocam em base de dados nenhuma e que se querem mesmo testar.
 *
 * Este módulo vazio toma o lugar dele (ver vitest.config.ts). A proteção
 * continua inteira onde interessa: quem importar `lib/servidor/` de um
 * componente de cliente continua a falhar na compilação do Next, que é onde
 * esse engano tem de ser apanhado.
 */
export {};
