/**
 * Converte as respostas da sequência guiada (lib/sequenciaConsulta.ts) num
 * `CasoClinico` — a mesma estrutura que os casos de teste usam, para que a
 * Consulta pontual passe pelo motor de decisão sem qualquer caminho paralelo.
 *
 * Os campos que a sequência não pergunta (localização, dimensões, tempo de
 * evolução) ficam com valores neutros: não entram em nenhuma condição de
 * indicação/contraindicação da Fase 3, servem só para o caso ser estruturalmente
 * completo.
 */
import { calcularAreaCm2, calcularClassificacaoTempoEvolucao } from "../tipos/variaveis";
import { mostraTipoExsudado, precisaAbpi } from "./formularioConsulta";
import type { RespostasConsulta } from "./sequenciaConsulta";
import type { CasoClinico } from "../tipos/casoClinico";
import type {
  Etiologia,
  ProfundidadeEstadiamentoGenerica,
  ProfundidadeEstadiamentoPressao,
  SinaisInfecaoInput,
  TipoExsudado,
  TipoTecido,
  ValorBordo,
  ValorPelePerilesional,
  VolumeExsudado,
} from "../tipos/variaveis";

/** Estado "nada observado" — distinto de "observado e negativo" (ver lib/relevanciaResultado.ts). */
export const SINAIS_NEUTROS: SinaisInfecaoInput = {
  dor_aumentada: false,
  tecido_friavel: false,
  odor: "ausente",
  atraso_cicatrizacao: false,
  quebra_ferida_nova: false,
  eritema: "ausente",
  calor_local: false,
  edema_local: false,
  celulite: false,
  linfangite: false,
  abcesso: false,
  febre: false,
  leucocitose: false,
};

/** Polígono que cobre a imagem toda: a Consulta pontual não tem fotografia nem pins, e o motor só lê `.tipo`. */
const POLIGONO_COMPLETO = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

function construirSinais(marcados: string[]): SinaisInfecaoInput {
  const sinais: SinaisInfecaoInput = { ...SINAIS_NEUTROS };
  for (const marca of marcados) {
    // Odor e eritema são graduados; marcar equivale a "moderado".
    if (marca === "odor" || marca === "eritema") sinais[marca] = "moderado";
    else if (marca in sinais) (sinais as unknown as Record<string, boolean>)[marca] = true;
  }
  return sinais;
}

export function casoDaConsulta(respostas: RespostasConsulta): CasoClinico {
  const etiologia = (respostas.etiologia?.[0] ?? "venosa") as Etiologia;
  const volume = (respostas.exsudado_volume?.[0] ?? "ausente") as VolumeExsudado;
  const tipos = (respostas.exsudado_tipo ?? []) as TipoExsudado[];
  const abpiBruto = respostas.abpi?.[0];

  return {
    etiologia,
    tipo_tecido_leito: ((respostas.tecidos ?? []) as TipoTecido[]).map((tipo) => ({
      tipo,
      poligono: POLIGONO_COMPLETO,
    })),
    exsudado: { volume, tipo: mostraTipoExsudado(volume) ? tipos : [] },
    sinais_infecao: construirSinais(respostas.sinais_infecao ?? []),
    bordos: (respostas.bordos ?? []) as ValorBordo[],
    pele_perilesional: (respostas.pele ?? []) as ValorPelePerilesional[],
    localizacao_anatomica: "outra",
    profundidade_estadiamento: (respostas.profundidade?.[0] ?? "superficial") as
      | ProfundidadeEstadiamentoPressao
      | ProfundidadeEstadiamentoGenerica,
    dimensoes: { comprimento_cm: 3, largura_cm: 2, area_cm2: calcularAreaCm2(3, 2) },
    dor: Number(respostas.dor?.[0] ?? 0),
    tempo_evolucao: { duracao_semanas: 2, classificacao: calcularClassificacaoTempoEvolucao(2) },
    abpi: precisaAbpi(etiologia) && abpiBruto !== undefined ? Number(abpiBruto) : undefined,
  };
}
