/**
 * Regras de relevância do resultado da Consulta pontual.
 *
 * O motor de decisão (algoritmo/motorDecisao.ts) responde "que categorias se
 * aplicam a este caso". Para o ecrã de resultado isso não chega: há uma
 * diferença entre uma categoria que *podia* aplicar-se a esta ferida mas não
 * se aplica agora (compressão numa úlcera venosa com ABPI fora do intervalo —
 * informação útil, é um aviso) e uma categoria que nunca teria nada a dizer
 * sobre esta ferida (compressão numa lesão por pressão — ruído puro).
 *
 * Só a primeira deve aparecer. Daí a distinção entre **relevante** (faz
 * sentido sequer falar disto nesta ferida) e **aplicável** (o motor diz que
 * se aplica agora). Nada aqui recalcula clínica: a aplicabilidade continua a
 * vir de algoritmo/aplicabilidadeCategorias.ts, e os tratamentos válidos de
 * algoritmo/motorDecisao.ts.
 */
import { TODOS_TRATAMENTOS } from "../dados/tratamentos";
import { avaliarCondicao, type ContextoAvaliacao } from "../algoritmo/avaliarCondicao";
import { TODAS_CATEGORIAS } from "../algoritmo/aplicabilidadeCategorias";
import type { CasoClinico } from "../tipos/casoClinico";
import type { DecisaoCaso } from "../tipos/resultado";
import type { CategoriaTratamento, EntradaTratamento } from "../tipos/tratamento";
import type { SinaisInfecaoInput } from "../tipos/variaveis";

/** Etiologias em que a compressão é sequer um tema. Fora destas, nem indicada nem contraindicada — simplesmente não se menciona. */
const ETIOLOGIAS_VASCULARES = ["venosa", "arterial", "mista_arteriovenosa"] as const;

/**
 * Houve alguma informação de sinais de infeção preenchida?
 *
 * Enquanto o utilizador não tocar em nenhum sinal, o formulário está no
 * estado neutro — e "nenhum sinal marcado" não é o mesmo que "observei e não
 * há sinais". Sem esta distinção o resultado afirmaria "sem sinais de
 * infeção" sobre uma variável que ninguém avaliou, por isso o bloco de nível
 * de infeção e a categoria de antimicrobianos ficam ambos calados.
 */
export function sinaisInfecaoPreenchidos(sinais: SinaisInfecaoInput): boolean {
  return (
    sinais.dor_aumentada ||
    sinais.tecido_friavel ||
    sinais.odor !== "ausente" ||
    sinais.atraso_cicatrizacao ||
    sinais.quebra_ferida_nova ||
    sinais.eritema !== "ausente" ||
    sinais.calor_local ||
    sinais.edema_local ||
    sinais.celulite ||
    sinais.linfangite ||
    sinais.abcesso ||
    sinais.febre ||
    sinais.leucocitose
  );
}

/**
 * A categoria tem alguma coisa a dizer sobre esta ferida?
 *
 * - `terapia_compressiva`: só em etiologia vascular. Numa lesão por pressão
 *   não se menciona de todo, nem para dizer que está contraindicada.
 * - `paliativos_oncologicos`: só em ferida oncológica maligna.
 * - `antimicrobianos`: só quando há sinais de infeção preenchidos (regra
 *   explícita — sem dados de infeção, não se fala de antimicrobianos).
 * - Restantes: são relevantes para qualquer ferida; se não se aplicam ao caso
 *   concreto é por causa das variáveis, e isso o motor já diz.
 */
export function categoriaRelevante(categoria: CategoriaTratamento, caso: CasoClinico): boolean {
  switch (categoria) {
    case "terapia_compressiva":
      return (ETIOLOGIAS_VASCULARES as readonly string[]).includes(caso.etiologia);
    case "paliativos_oncologicos":
      return caso.etiologia === "oncologica_maligna";
    case "antimicrobianos":
      return sinaisInfecaoPreenchidos(caso.sinais_infecao);
    default:
      return true;
  }
}

export interface CategoriaResultado {
  categoria: CategoriaTratamento;
  /** O motor considera a categoria aplicável ao caso. */
  aplicavel: boolean;
  /** Tratamentos válidos — o "Tratamento indicado: A, B ou C". */
  indicados: EntradaTratamento[];
  /**
   * Tratamentos desta categoria com uma contraindicação ativa neste caso — o
   * "Contraindicado: X, Y e Z". Só entram os que estão mesmo contraindicados;
   * um tratamento que apenas não tem indicação não é uma contraindicação e
   * ficaria a encher o ecrã.
   */
  contraindicados: EntradaTratamento[];
}

/**
 * Categorias a mostrar no resultado, já filtradas por relevância.
 *
 * Uma categoria relevante mas não aplicável continua a aparecer quando tem
 * contraindicações ativas a comunicar (o caso da compressão com ABPI fora do
 * intervalo); se não tiver nada para dizer — nem indicados nem
 * contraindicados — é omitida.
 */
export function categoriasParaMostrar(caso: CasoClinico, decisao: DecisaoCaso): CategoriaResultado[] {
  const contexto: ContextoAvaliacao = { caso, nivelInfecao: decisao.nivelInfecao };

  return TODAS_CATEGORIAS.filter((categoria) => categoriaRelevante(categoria, caso))
    .map((categoria) => {
      const aplicavel = decisao.categoriasAplicaveis.includes(categoria);
      const indicados = aplicavel ? (decisao.tratamentosValidos[categoria] ?? []) : [];
      const idsIndicados = new Set(indicados.map((t) => t.id));

      const contraindicados = TODOS_TRATAMENTOS.filter(
        (t) =>
          t.categoria === categoria &&
          !idsIndicados.has(t.id) &&
          t.contraindicadoQuando.some((c) => avaliarCondicao(c, contexto)),
      );

      return { categoria, aplicavel, indicados, contraindicados };
    })
    .filter((r) => r.indicados.length > 0 || r.contraindicados.length > 0);
}

/**
 * O bloco de nível de infeção só se mostra quando alguém avaliou os sinais.
 * Sem isso, "sem sinais de infeção" seria uma afirmação inventada sobre uma
 * variável em branco.
 */
export function mostrarNivelInfecao(caso: CasoClinico): boolean {
  return sinaisInfecaoPreenchidos(caso.sinais_infecao);
}
