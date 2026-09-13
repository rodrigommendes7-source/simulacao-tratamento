import { THRESHOLD_DOR_ONCOLOGICA } from "../algoritmo/oncologico";
import { pontoDentroPoligono } from "../algoritmo/pontoNoPoligono";
import type { CasoClinico } from "../tipos/casoClinico";
import { calcularAreaCm2, calcularClassificacaoTempoEvolucao } from "../tipos/variaveis";
import type { DecisaoCaso, MedidasCausaisResposta, RespostaAluno } from "../tipos/resultado";
import type { Ponto2D, TipoTecido, TipoTecidoLeito } from "../tipos/variaveis";

/**
 * Encontra um ponto interior de um polígono arbitrário (convexo, côncavo ou
 * com reentrâncias) por pesquisa em grelha sobre a bounding box — o
 * centróide simples (média dos vértices, ou até o centróide ponderado por
 * área) pode cair fora de um polígono suficientemente côncavo, como
 * confirmado pelos polígonos desenhados à mão em dados/casosTeste.ts. Só
 * para uso em testes (construir "a resposta perfeita"); a resolução de 60
 * é mais do que suficiente para os polígonos reais do projeto e o custo é
 * irrelevante fora do algoritmo de produção.
 */
export function pontoInteriorPoligono(poligono: Ponto2D[]): Ponto2D {
  const xs = poligono.map((p) => p.x);
  const ys = poligono.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const N = 60;
  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= N; j++) {
      const ponto = { x: minX + ((maxX - minX) * i) / N, y: minY + ((maxY - minY) * j) / N };
      if (pontoDentroPoligono(ponto, poligono)) return ponto;
    }
  }
  throw new Error("Não foi possível encontrar um ponto interior ao polígono — verificar geometria.");
}

/** Polígono cobrindo toda a imagem (coordenadas normalizadas 0-1) — usado nos fixtures de teste, onde a geometria exata da zona é irrelevante e só a lógica de categoria/etiologia está a ser testada (ver testes/avaliarIdentificacao.test.ts para testes que exercitam geometria real). */
export const POLIGONO_IMAGEM_COMPLETA: Ponto2D[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

/** Constrói `tipo_tecido_leito` a partir de uma lista de tipos, cada um ocupando uma zona igual (faixa horizontal) da imagem — evita zonas sobrepostas mantendo os fixtures simples. */
export function tecidoDe(tipos: TipoTecido[]): TipoTecidoLeito {
  if (tipos.length === 0) return [{ tipo: "epitelizacao", poligono: POLIGONO_IMAGEM_COMPLETA }];
  const altura = 1 / tipos.length;
  return tipos.map((tipo, i) => ({
    tipo,
    poligono: [
      { x: 0, y: i * altura },
      { x: 1, y: i * altura },
      { x: 1, y: (i + 1) * altura },
      { x: 0, y: (i + 1) * altura },
    ],
  }));
}

/** Caso clínico neutro — ponto de partida para os testes; sobrepor só os campos relevantes ao cenário testado. */
export function fabricarCasoBase(overrides: Partial<CasoClinico> = {}): CasoClinico {
  const base: CasoClinico = {
    etiologia: "outra",
    tipo_tecido_leito: tecidoDe(["granulacao"]),
    exsudado: { volume: "moderado", tipo: [] },
    sinais_infecao: {
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
    },
    bordos: [],
    pele_perilesional: ["integra"],
    localizacao_anatomica: "outra",
    profundidade_estadiamento: "espessura_parcial",
    dimensoes: { comprimento_cm: 2, largura_cm: 2, area_cm2: calcularAreaCm2(2, 2) },
    dor: 0,
    tempo_evolucao: {
      duracao_semanas: 2,
      classificacao: calcularClassificacaoTempoEvolucao(2),
    },
  };
  return { ...base, ...overrides };
}

export function fabricarRespostaVazia(overrides: Partial<RespostaAluno> = {}): RespostaAluno {
  return {
    tratamentosSelecionados: [],
    medidasCausais: {},
    ...overrides,
  };
}

/**
 * Constrói a resposta "perfeita" para um caso a partir da sua própria
 * chave de referência (DecisaoCaso): seleciona todos os tratamentos válidos
 * de todas as categorias aplicáveis (exceto paliativos_oncologicos, que tem
 * modelo de pontuação próprio) e preenche as medidas causais necessárias
 * para satisfazer o checklist "causa tratada"/portão sistémico/dimensão
 * "dor" oncológica. Usada para confirmar que 100% é sempre atingível para
 * um caso concreto (não substitui a verificação de completude exaustiva).
 */
export function construirRespostaPerfeita(
  caso: CasoClinico,
  decisao: DecisaoCaso,
): RespostaAluno {
  const tratamentosSelecionados = decisao.categoriasAplicaveis
    .filter((categoria) => categoria !== "paliativos_oncologicos")
    .flatMap((categoria) => (decisao.tratamentosValidos[categoria] ?? []).map((t) => t.id));

  const medidasCausais: MedidasCausaisResposta = {};
  switch (caso.etiologia) {
    case "venosa":
      if (!decisao.categoriasAplicaveis.includes("terapia_compressiva")) {
        medidasCausais.referenciacaoVascular = true;
      }
      break;
    case "arterial":
    case "mista_arteriovenosa":
      medidasCausais.referenciacaoVascular = true;
      break;
    case "pressao":
      medidasCausais.alivioPressao = true;
      break;
    case "pe_diabetico_neuropatico":
    case "pe_diabetico_neuroisquemico":
      medidasCausais.descargaOffloading = true;
      medidasCausais.controloGlicemicoReferenciado = true;
      break;
  }
  if (decisao.nivelInfecao === "infecao_propagacao_sistemica") {
    medidasCausais.referenciacaoMedicaSistemica = true;
  }
  if (caso.etiologia === "oncologica_maligna" && caso.dor >= THRESHOLD_DOR_ONCOLOGICA) {
    medidasCausais.gestaoDorConsiderada = true;
  }

  return { tratamentosSelecionados, medidasCausais };
}

/** Produto cartesiano de N listas de opções — usado para enumeração exaustiva por categoria (secção 5). */
export function produtoCartesiano<T extends unknown[]>(
  ...listas: { [K in keyof T]: T[K][] }
): T[] {
  return listas.reduce<unknown[][]>(
    (acc, lista) => acc.flatMap((combo) => lista.map((valor) => [...combo, valor])),
    [[]],
  ) as T[];
}
