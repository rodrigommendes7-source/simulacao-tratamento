import type { ContextoAvaliacao } from "./avaliarCondicao";
import type { CategoriaTratamento } from "../tipos/tratamento";

/**
 * Predicados de aplicabilidade por categoria — determinam se uma categoria
 * da Fase 3 é sequer relevante para o caso (independentemente de haver ou
 * não um tratamento válido lá dentro). Necessário porque nem toda a
 * categoria se aplica a toda a ferida (ex.: antimicrobianos só quando há
 * sinais de infeção — regra de exclusão explícita da Fase 3, categoria 3).
 *
 * Decisões validadas por Rodrigo em 2026-09-12:
 *
 * - Categoria 4 (terapia_compressiva): aplicável apenas quando etiologia é
 *   venosa/mista_arteriovenosa E abpi está definido E 0,5 <= abpi <= 1,3.
 *   Fora deste intervalo a decisão correta é evitar compressão/referenciar
 *   para avaliação especializada — fora do catálogo desta categoria — pelo
 *   que fica não aplicável nesses casos, em vez de "aplicável mas vazia".
 * - Categoria 5 (pressao_negativa/NPWT): pelo mesmo princípio, quando o
 *   gatilho de indicação (granulação a promover/exsudado abundante/estádio
 *   3-4) coexiste com necrose não desbridada ou com etiologia =
 *   oncologica_maligna, a categoria fica não aplicável — a resposta certa
 *   está na categoria Desbridamento (ou, na oncológica, no modelo de
 *   pontuação próprio da secção 3.3), não em "NPWT aplicável mas vazia".
 * - Categoria 6 (bordos_problematicos): quando hipergranulação + pele
 *   macerada coexistem com infeção overt/sistémica, sem bordos
 *   enrolados/fibróticos presentes, a categoria fica não aplicável — a
 *   resposta esperada é tratar a infeção primeiro (categoria
 *   antimicrobianos); a gestão de bordos só volta a ficar aplicável depois
 *   de a infeção estar controlada (ou se enrolados/fibróticos estiverem
 *   presentes, que têm indicação própria independente da infeção).
 */
export function categoriaAplicavel(
  categoria: CategoriaTratamento,
  contexto: ContextoAvaliacao,
): boolean {
  const { caso, nivelInfecao } = contexto;
  const tipos = caso.tipo_tecido_leito.map((c) => c.tipo);
  const temTecidoNaoViavel =
    tipos.includes("esfacelo") ||
    tipos.includes("necrose_seca") ||
    tipos.includes("necrose_humida");

  switch (categoria) {
    case "desbridamento":
      return temTecidoNaoViavel;
    case "pensos_humidade":
      return true;
    case "antimicrobianos":
      return nivelInfecao !== "sem_sinais";
    case "terapia_compressiva":
      return (
        (caso.etiologia === "venosa" || caso.etiologia === "mista_arteriovenosa") &&
        caso.abpi !== undefined &&
        caso.abpi >= 0.5 &&
        caso.abpi <= 1.3
      );
    case "pressao_negativa": {
      const gatilho =
        tipos.includes("granulacao") ||
        caso.exsudado.volume === "abundante" ||
        caso.profundidade_estadiamento === "estadio_3" ||
        caso.profundidade_estadiamento === "estadio_4";
      if (!gatilho) return false;
      if (temTecidoNaoViavel) return false; // necrose não desbridada -> resposta certa é Desbridamento
      if (caso.etiologia === "oncologica_maligna") return false; // ver secção 3.3
      return true;
    }
    case "bordos_problematicos": {
      const bordosProprios =
        caso.bordos.includes("enrolados_epibole") || caso.bordos.includes("fibroticos");
      if (bordosProprios) return true;
      if (!tipos.includes("granulacao_hipergranulada")) return false;
      // hipergranulação + pele macerada + infeção overt/sistémica, sem bordos próprios:
      // resposta certa é tratar a infeção primeiro (categoria antimicrobianos).
      const infecaoAtiva =
        nivelInfecao === "infecao_local_overt" || nivelInfecao === "infecao_propagacao_sistemica";
      if (caso.pele_perilesional.includes("macerada") && infecaoAtiva) return false;
      return true;
    }
    case "paliativos_oncologicos":
      // Tratada por algoritmo/oncologico.ts (pontuação proporcional por dimensão), não pela verificação genérica de completude por categoria.
      return caso.etiologia === "oncologica_maligna";
    case "limpeza_irrigacao":
      return true;
    case "interfaces_silicone":
      return (
        caso.pele_perilesional.includes("seca_descamativa") ||
        caso.dor >= 7 ||
        tipos.includes("epitelizacao")
      );
  }
}

/** Categorias avaliadas pela verificação de completude genérica (secção 5). `paliativos_oncologicos` fica de fora por ter modelo de pontuação próprio (secção 3.3). */
export const CATEGORIAS_COMPLETUDE_GENERICA: CategoriaTratamento[] = [
  "desbridamento",
  "pensos_humidade",
  "antimicrobianos",
  "terapia_compressiva",
  "pressao_negativa",
  "bordos_problematicos",
  "limpeza_irrigacao",
  "interfaces_silicone",
];

export const TODAS_CATEGORIAS: CategoriaTratamento[] = [
  "desbridamento",
  "pensos_humidade",
  "antimicrobianos",
  "terapia_compressiva",
  "pressao_negativa",
  "bordos_problematicos",
  "paliativos_oncologicos",
  "limpeza_irrigacao",
  "interfaces_silicone",
];
