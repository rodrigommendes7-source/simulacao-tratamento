import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Configuração dos testes.
 *
 * O único ajuste é o `server-only`: esse pacote existe para rebentar quando um
 * módulo de servidor é importado a partir de código de cliente, e a forma como
 * o faz é atirar assim que é carregado fora do Next. Num teste em Node isso
 * apanharia qualquer ficheiro de `lib/servidor/` — incluindo funções puras que
 * não tocam em base de dados nenhuma e que se querem mesmo testar.
 *
 * Aponta-se para um módulo vazio nosso (testes/servidorSemGuarda.ts), e não
 * para um ficheiro interno do pacote, que não está exportado e podia mudar
 * de sítio. A proteção continua inteira onde interessa: quem importar
 * `lib/servidor/` de um componente de cliente continua a falhar na compilação
 * do Next, que é onde esse engano tem de ser apanhado.
 */
export default defineConfig({
  resolve: {
    alias: {
      "server-only": fileURLToPath(new URL("./testes/servidorSemGuarda.ts", import.meta.url)),
    },
  },
});
