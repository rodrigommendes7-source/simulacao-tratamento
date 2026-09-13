/**
 * Verificação de completude — secção 5 do pedido da Fase 4. Extraído de
 * testes/completude.test.ts para ser reutilizado tal e qual pelo script de
 * build `scripts/validar-clinico.ts` (ponto 3 da correção pós-implementação)
 * — a mesma lógica corre como teste automatizado E como passo de build, sem
 * duplicação.
 *
 * Ver testes/completude.test.ts para a justificação da decisão de escopo
 * (exaustivo por categoria, não pela combinatória total das variáveis).
 */
import { categoriaAplicavel } from "./aplicabilidadeCategorias";
import type { ContextoAvaliacao } from "./avaliarCondicao";
import { tratamentoValido } from "./motorDecisao";
import { TODOS_TRATAMENTOS } from "../dados/tratamentos";
import type { CasoClinico } from "../tipos/casoClinico";
import type { CategoriaTratamento } from "../tipos/tratamento";
import type { NivelInfecao, ValorBordo } from "../tipos/variaveis";
import { TODOS_NIVEIS_INFECAO } from "../tipos/variaveis";
import { fabricarCasoBase, produtoCartesiano, tecidoDe } from "../testes/utilidadesTeste";

export interface Combo {
  descricao: string;
  caso: CasoClinico;
  nivelInfecao: NivelInfecao;
}

export interface ResultadoVerificacaoCategoria {
  categoria: CategoriaTratamento;
  aplicaveis: number;
  falhas: string[];
}

export function verificarCompletude(categoria: CategoriaTratamento, combos: Combo[]): ResultadoVerificacaoCategoria {
  const falhas: string[] = [];
  let aplicaveis = 0;
  for (const { descricao, caso, nivelInfecao } of combos) {
    const contexto: ContextoAvaliacao = { caso, nivelInfecao };
    if (!categoriaAplicavel(categoria, contexto)) continue;
    aplicaveis++;
    const algumValido = TODOS_TRATAMENTOS.some(
      (t) => t.categoria === categoria && tratamentoValido(t, contexto),
    );
    if (!algumValido) {
      falhas.push(descricao);
    }
  }
  return { categoria, falhas, aplicaveis };
}

export function gerarCombosDesbridamento(): Combo[] {
  const tiposBase = ["granulacao", "esfacelo", "necrose_seca", "necrose_humida"] as const;
  const combos: Combo[] = [];
  for (const flags of produtoCartesiano<[boolean, boolean, boolean, boolean]>(
    [true, false],
    [true, false],
    [true, false],
    [true, false],
  )) {
    const tipos = tiposBase.filter((_, i) => flags[i]);
    if (!tipos.some((t) => t !== "granulacao")) continue; // precisa de necrótico para a categoria fazer sentido
    for (const nivelInfecao of TODOS_NIVEIS_INFECAO) {
      for (const socavado of [true, false]) {
        const bordos: ValorBordo[] = socavado ? ["socavados_underminados"] : [];
        combos.push({
          descricao: `tecido=${tipos.join("+")} nivelInfecao=${nivelInfecao} socavado=${socavado}`,
          caso: fabricarCasoBase({ tipo_tecido_leito: tecidoDe([...tipos]), bordos }),
          nivelInfecao,
        });
      }
    }
  }
  return combos;
}

export function gerarCombosPensosHumidade(): Combo[] {
  const volumes = ["ausente", "escasso", "moderado", "abundante"] as const;
  const profundidades = ["estadio_4", "espessura_total", "superficial"] as const;
  const combos: Combo[] = [];
  for (const volume of volumes) {
    for (const macerada of [true, false]) {
      for (const nivelInfecao of TODOS_NIVEIS_INFECAO) {
        for (const profundidade of profundidades) {
          for (const socavado of [true, false]) {
            for (const necroseOuEsfacelo of [true, false]) {
              for (const naoAderente of [true, false]) {
                const bordos: ValorBordo[] = [
                  ...(socavado ? (["socavados_underminados"] as const) : []),
                  ...(naoAderente ? (["nao_aderentes_solto"] as const) : []),
                ];
                combos.push({
                  descricao: `volume=${volume} macerada=${macerada} nivelInfecao=${nivelInfecao} profundidade=${profundidade} bordos=${bordos.join("+")} necroseOuEsfacelo=${necroseOuEsfacelo}`,
                  caso: fabricarCasoBase({
                    exsudado: { volume, tipo: volume === "ausente" ? [] : ["seroso"] },
                    pele_perilesional: macerada ? ["macerada"] : ["integra"],
                    profundidade_estadiamento: profundidade,
                    bordos,
                    tipo_tecido_leito: necroseOuEsfacelo ? tecidoDe(["necrose_seca"]) : tecidoDe(["granulacao"]),
                  }),
                  nivelInfecao,
                });
              }
            }
          }
        }
      }
    }
  }
  return combos;
}

export function gerarCombosAntimicrobianos(): Combo[] {
  const combos: Combo[] = [];
  for (const nivelInfecao of TODOS_NIVEIS_INFECAO) {
    for (const volume of ["ausente", "escasso", "moderado", "abundante"] as const) {
      for (const necroseOuEsfacelo of [true, false]) {
        for (const etiologia of ["venosa", "arterial"] as const) {
          combos.push({
            descricao: `nivelInfecao=${nivelInfecao} volume=${volume} necroseOuEsfacelo=${necroseOuEsfacelo} etiologia=${etiologia}`,
            caso: fabricarCasoBase({
              etiologia,
              exsudado: { volume, tipo: [] },
              tipo_tecido_leito: necroseOuEsfacelo ? tecidoDe(["esfacelo"]) : tecidoDe(["granulacao"]),
            }),
            nivelInfecao,
          });
        }
      }
    }
  }
  return combos;
}

export function gerarCombosCompressao(): Combo[] {
  const combos: Combo[] = [];
  for (const etiologia of ["venosa", "mista_arteriovenosa"] as const) {
    for (const abpi of [0.5, 0.65, 0.8, 0.95, 1.3]) {
      combos.push({
        descricao: `etiologia=${etiologia} abpi=${abpi}`,
        caso: fabricarCasoBase({ etiologia, abpi }),
        nivelInfecao: "sem_sinais",
      });
    }
  }
  return combos;
}

export function gerarCombosLimpezaIrrigacao(): Combo[] {
  return TODOS_NIVEIS_INFECAO.map((nivelInfecao) => ({
    descricao: `nivelInfecao=${nivelInfecao}`,
    caso: fabricarCasoBase(),
    nivelInfecao,
  }));
}

export function gerarCombosInterfacesSilicone(): Combo[] {
  const combos: Combo[] = [];
  for (const peleSeca of [true, false]) {
    for (const dor of [0, 6, 7, 10]) {
      for (const epitelizacao of [true, false]) {
        combos.push({
          descricao: `peleSeca=${peleSeca} dor=${dor} epitelizacao=${epitelizacao}`,
          caso: fabricarCasoBase({
            pele_perilesional: peleSeca ? ["seca_descamativa"] : ["integra"],
            dor,
            tipo_tecido_leito: epitelizacao ? tecidoDe(["epitelizacao"]) : tecidoDe(["granulacao"]),
          }),
          nivelInfecao: "sem_sinais",
        });
      }
    }
  }
  return combos;
}

export function gerarCombosPressaoNegativa(): Combo[] {
  const profundidades = ["estadio_3", "estadio_4", "superficial"] as const;
  const combos: Combo[] = [];
  for (const granulacaoPresente of [true, false]) {
    for (const volumeAbundante of [true, false]) {
      for (const profundidade of profundidades) {
        for (const necrosePresente of [true, false]) {
          for (const oncologica of [true, false]) {
            combos.push({
              descricao: `granulacao=${granulacaoPresente} volumeAbundante=${volumeAbundante} profundidade=${profundidade} necrose=${necrosePresente} oncologica=${oncologica}`,
              caso: fabricarCasoBase({
                etiologia: oncologica ? "oncologica_maligna" : "outra",
                exsudado: { volume: volumeAbundante ? "abundante" : "moderado", tipo: [] },
                profundidade_estadiamento: profundidade,
                tipo_tecido_leito: tecidoDe([
                  ...(granulacaoPresente ? (["granulacao"] as const) : []),
                  ...(necrosePresente ? (["necrose_seca"] as const) : []),
                  ...(!granulacaoPresente && !necrosePresente ? (["epitelizacao"] as const) : []),
                ]),
              }),
              nivelInfecao: "sem_sinais",
            });
          }
        }
      }
    }
  }
  return combos;
}

export function gerarCombosBordosProblematicos(): Combo[] {
  const combos: Combo[] = [];
  for (const hipergranulada of [true, false]) {
    for (const enrolados of [true, false]) {
      for (const fibroticos of [true, false]) {
        for (const macerada of [true, false]) {
          for (const nivelInfecao of TODOS_NIVEIS_INFECAO) {
            const bordos: ValorBordo[] = [
              ...(enrolados ? (["enrolados_epibole"] as const) : []),
              ...(fibroticos ? (["fibroticos"] as const) : []),
            ];
            combos.push({
              descricao: `hipergranulada=${hipergranulada} enrolados=${enrolados} fibroticos=${fibroticos} macerada=${macerada} nivelInfecao=${nivelInfecao}`,
              caso: fabricarCasoBase({
                tipo_tecido_leito: hipergranulada ? tecidoDe(["granulacao_hipergranulada"]) : tecidoDe(["granulacao"]),
                bordos,
                pele_perilesional: macerada ? ["macerada"] : ["integra"],
              }),
              nivelInfecao,
            });
          }
        }
      }
    }
  }
  return combos;
}

/** As 8 categorias cobertas pela verificação de completude exaustiva (ver testes/completude.test.ts para a justificação de escopo). */
export const VERIFICACOES_COMPLETUDE: { categoria: CategoriaTratamento; gerarCombos: () => Combo[] }[] = [
  { categoria: "desbridamento", gerarCombos: gerarCombosDesbridamento },
  { categoria: "pensos_humidade", gerarCombos: gerarCombosPensosHumidade },
  { categoria: "antimicrobianos", gerarCombos: gerarCombosAntimicrobianos },
  { categoria: "terapia_compressiva", gerarCombos: gerarCombosCompressao },
  { categoria: "limpeza_irrigacao", gerarCombos: gerarCombosLimpezaIrrigacao },
  { categoria: "interfaces_silicone", gerarCombos: gerarCombosInterfacesSilicone },
  { categoria: "pressao_negativa", gerarCombos: gerarCombosPressaoNegativa },
  { categoria: "bordos_problematicos", gerarCombos: gerarCombosBordosProblematicos },
];

export function verificarCompletudeTotal(): ResultadoVerificacaoCategoria[] {
  return VERIFICACOES_COMPLETUDE.map(({ categoria, gerarCombos }) =>
    verificarCompletude(categoria, gerarCombos()),
  );
}
