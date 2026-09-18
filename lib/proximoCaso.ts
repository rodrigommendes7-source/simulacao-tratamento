import type { CasoTeste } from "../dados/casosTeste";
import type { EntradaHistorico } from "../tipos/historico";

/**
 * Escolha do "caso aleatório" recomendado no ecrã principal.
 *
 * O cartão promete "uma etiologia que ainda não resolveu", e é por etiologia
 * que se filtra. Filtrar por `id` de caso — como se fazia antes — dava uma
 * segunda ferida da mesma etiologia apresentada como etiologia nova, porque há
 * mais do que um caso por etiologia. A cobertura etiológica é objetivo
 * pedagógico e já é a métrica do cartão ao lado.
 *
 * A ordem de preferência:
 *
 *   1. etiologia ainda não coberta;
 *   2. se todas cobertas, caso ainda não resolvido;
 *   3. se todos resolvidos, qualquer caso — repetir é melhor do que não ter
 *      para onde ir.
 *
 * Os dois degraus de recuo não são hipóteses distantes: com 5 casos em 4
 * etiologias, ao quarto caso resolvido a cobertura fecha-se e é o segundo
 * degrau que passa a escolher.
 *
 * Vive fora do componente por ser lógica com ramos que vale a pena fixar em
 * testes; o sorteio entra por parâmetro para os testes poderem ser
 * determinísticos.
 */
export function escolherProximoCaso(
  casos: readonly CasoTeste[],
  historico: readonly EntradaHistorico[],
  sortear: (limite: number) => number = (limite) => Math.floor(Math.random() * limite),
): CasoTeste | null {
  if (casos.length === 0) return null;

  const etiologiasCobertas = new Set(historico.map((h) => h.etiologia));
  const resolvidos = new Set(historico.map((h) => h.casoId));

  const porEtiologiaNova = casos.filter((c) => !etiologiasCobertas.has(c.caso.etiologia));
  const porResolver = casos.filter((c) => !resolvidos.has(c.id));

  const candidatos = porEtiologiaNova.length
    ? porEtiologiaNova
    : porResolver.length
      ? porResolver
      : casos;

  return candidatos[sortear(candidatos.length)] ?? null;
}
