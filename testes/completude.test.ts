/**
 * Verificação de completude — secção 5 do pedido da Fase 4.
 *
 * DECISÃO DE ESCOPO (validada por Rodrigo em 2026-09-12, opção "Exaustivo
 * por categoria"): a combinatória total de TODAS as variáveis da Fase 1 em
 * simultâneo é intratável (só `sinais_infecao` tem ~32 mil combinações
 * independentes das suas booleans/níveis internos). Em vez disso, para cada
 * categoria de tratamento, geramos exaustivamente todas as combinações
 * apenas das variáveis que as condições dessa categoria realmente
 * referenciam (as restantes ficam fixadas a um valor neutro). Isto é
 * exaustivo relativamente ao que efetivamente pode fazer uma categoria
 * ficar vazia — variáveis que nenhuma condição da categoria consulta não
 * podem, por construção, causar um "buraco" nela.
 *
 * `nivel_infecao` é injetado diretamente no contexto de avaliação (em vez
 * de reconstruído a partir de `sinais_infecao` bruto) porque nenhuma
 * condição de tratamento consulta os sinais brutos — só o nível derivado.
 * A derivação em si já tem teste próprio (testes/nivelInfecao.test.ts).
 *
 * A lógica de geração de combinações e verificação vive em
 * algoritmo/verificacaoCompletude.ts, reutilizada tal e qual por
 * scripts/validar-clinico.ts (mesma verificação a correr no build) — este
 * ficheiro só faz as asserções.
 */
import { describe, expect, it } from "vitest";
import {
  gerarCombosAntimicrobianos,
  gerarCombosBordosProblematicos,
  gerarCombosCompressao,
  gerarCombosDesbridamento,
  gerarCombosInterfacesSilicone,
  gerarCombosLimpezaIrrigacao,
  gerarCombosPensosHumidade,
  gerarCombosPressaoNegativa,
  verificarCompletude,
} from "../algoritmo/verificacaoCompletude";

describe("completude por categoria (secção 5)", () => {
  it("desbridamento: sempre há tratamento válido quando há tecido não viável", () => {
    const { falhas, aplicaveis } = verificarCompletude("desbridamento", gerarCombosDesbridamento());
    expect(aplicaveis).toBeGreaterThan(0);
    expect(falhas).toEqual([]);
  });

  it("pensos_humidade: sempre há tratamento válido para qualquer volume de exsudado", () => {
    const combos = gerarCombosPensosHumidade();
    const { falhas, aplicaveis } = verificarCompletude("pensos_humidade", combos);
    expect(aplicaveis).toBe(combos.length); // categoria sempre aplicável
    expect(falhas).toEqual([]);
  });

  it("antimicrobianos: sempre há tratamento válido quando há sinais de infeção", () => {
    const { falhas, aplicaveis } = verificarCompletude("antimicrobianos", gerarCombosAntimicrobianos());
    expect(aplicaveis).toBeGreaterThan(0);
    expect(falhas).toEqual([]);
  });

  it("terapia_compressiva: sempre há tratamento válido para 0,5 <= abpi <= 1,3 em venosa/mista", () => {
    const combos = gerarCombosCompressao();
    const { falhas, aplicaveis } = verificarCompletude("terapia_compressiva", combos);
    expect(aplicaveis).toBe(combos.length);
    expect(falhas).toEqual([]);
  });

  it("limpeza_irrigacao: soro fisiológico cobre sempre a categoria (passo sempre presente)", () => {
    const combos = gerarCombosLimpezaIrrigacao();
    const { falhas, aplicaveis } = verificarCompletude("limpeza_irrigacao", combos);
    expect(aplicaveis).toBe(combos.length);
    expect(falhas).toEqual([]);
  });

  it("interfaces_silicone: sempre válida quando aplicável (sem contraindicação codificada)", () => {
    const { falhas, aplicaveis } = verificarCompletude("interfaces_silicone", gerarCombosInterfacesSilicone());
    expect(aplicaveis).toBeGreaterThan(0);
    expect(falhas).toEqual([]);
  });

  /**
   * pressao_negativa e bordos_problematicos: buracos encontrados na
   * primeira versão deste teste (NPWT contraindicado sempre que aplicável
   * com necrose presente ou etiologia oncológica; nitrato/corticoide ambos
   * contraindicados com hipergranulação+macerada+infeção overt/sistémica
   * sem bordos próprios) foram corrigidos por decisão de Rodrigo em
   * 2026-09-12: nesses casos a categoria passa a não aplicável (a resposta
   * certa está noutra categoria — Desbridamento ou Antimicrobianos,
   * respetivamente), em vez de "aplicável mas vazia". Ver
   * algoritmo/aplicabilidadeCategorias.ts. Por isso já são tratadas como
   * categorias core (falhas devem ser sempre vazias).
   */
  it("pressao_negativa: sempre há tratamento válido quando aplicável", () => {
    const { falhas, aplicaveis } = verificarCompletude("pressao_negativa", gerarCombosPressaoNegativa());
    expect(aplicaveis).toBeGreaterThan(0);
    expect(falhas).toEqual([]);
  });

  it("bordos_problematicos: sempre há tratamento válido quando aplicável", () => {
    const { falhas, aplicaveis } = verificarCompletude("bordos_problematicos", gerarCombosBordosProblematicos());
    expect(aplicaveis).toBeGreaterThan(0);
    expect(falhas).toEqual([]);
  });
});
