/**
 * Sequência guiada da Consulta pontual — uma variável de cada vez.
 *
 * O formulário anterior mostrava todas as variáveis ao mesmo tempo, em grupos
 * de "bolhas" soltas. Aqui a interação é sequencial: cada passo é uma
 * variável, o utilizador escolhe, a escolha sobe para o topo e avança-se para
 * a seguinte. Este módulo define *o que* é perguntado e por que ordem — é
 * lógica pura, sem React, para que a sequência (incluindo os passos que se
 * saltam) possa ser testada sem renderizar nada.
 *
 * Ordem pedida: Etiologia → Tecidos → Exsudado (volume e tipo) → Bordos →
 * Pele perilesional → Profundidade → Dor → Sinais de infeção.
 *
 * O ABPI não constava dessa lista mas é perguntado logo a seguir à etiologia
 * nas etiologias vasculares: a aplicabilidade da terapia compressiva depende
 * inteiramente dele (algoritmo/aplicabilidadeCategorias.ts) e, sem valor, a
 * compressão nunca apareceria como indicada — o resultado sairia
 * silenciosamente errado para as úlceras venosas.
 */
import {
  LABEL_BORDO,
  LABEL_ESTADIO_PRESSAO,
  LABEL_ETIOLOGIA,
  LABEL_NIVEL_ODOR_ERITEMA,
  LABEL_PELE,
  LABEL_PROFUNDIDADE_GENERICA,
  LABEL_TECIDO,
  LABEL_TIPO_EXSUDADO,
  LABEL_VOLUME,
} from "./etiquetas";
import { escalaProfundidade, mostraTipoExsudado, precisaAbpi } from "./formularioConsulta";
import {
  TODAS_ETIOLOGIAS,
  TODAS_PROFUNDIDADES_GENERICAS,
  TODOS_BORDOS,
  TODOS_ESTADIOS_PRESSAO,
  TODOS_PELE_PERILESIONAL,
  TODOS_TIPOS_EXSUDADO,
  TODOS_TIPOS_TECIDO,
  TODOS_VOLUMES_EXSUDADO,
} from "./../tipos/variaveis";
import type { Etiologia, VolumeExsudado } from "../tipos/variaveis";

/** Identificador de cada passo — usado como chave de estado e nos testes. */
export type IdPasso =
  | "etiologia"
  | "abpi"
  | "tecidos"
  | "exsudado_volume"
  | "exsudado_tipo"
  | "bordos"
  | "pele"
  | "profundidade"
  | "dor"
  | "sinais_infecao";

export interface OpcaoPasso {
  valor: string;
  label: string;
}

export interface Passo {
  id: IdPasso;
  /** Nome da variável, mostrado na bolha central e na lista de escolhas. */
  titulo: string;
  /** Frase curta de ajuda. */
  ajuda?: string;
  /** Permite escolher mais do que uma opção; nestes casos avança-se com um botão explícito. */
  multiplo: boolean;
  /** Um passo opcional pode ser confirmado sem nenhuma escolha (ex.: sinais de infeção não avaliados). */
  opcional: boolean;
  opcoes: OpcaoPasso[];
}

/** Estado acumulado das respostas, indexado por passo. Multi-escolha guarda várias entradas. */
export type RespostasConsulta = Partial<Record<IdPasso, string[]>>;

function opcoes<T extends string>(valores: readonly T[], labels: Record<T, string>): OpcaoPasso[] {
  return valores.map((valor) => ({ valor, label: labels[valor] }));
}

/** Escala de dor 0-10 agrupada — 11 bolhas num círculo seriam ilegíveis, e a clínica usa estes patamares. */
export const OPCOES_DOR: OpcaoPasso[] = [
  { valor: "0", label: "Sem dor (0)" },
  { valor: "2", label: "Ligeira (2)" },
  { valor: "4", label: "Moderada (4)" },
  { valor: "6", label: "Intensa (6)" },
  { valor: "8", label: "Muito intensa (8)" },
  { valor: "10", label: "Máxima (10)" },
];

/** ABPI em patamares com significado clínico próprio, em vez de um campo numérico livre. */
export const OPCOES_ABPI: OpcaoPasso[] = [
  { valor: "0.4", label: "< 0,5 — isquemia grave" },
  { valor: "0.7", label: "0,5 a 0,8 — doença arterial" },
  { valor: "0.95", label: "0,8 a 1,3 — normal" },
  { valor: "1.4", label: "> 1,3 — incompressível" },
];

/**
 * Sinais de infeção como uma lista única de opções marcáveis. Odor e eritema
 * são graduados na taxonomia; aqui entram como presença ("moderado"), que é o
 * que o utilizador consegue dizer numa escolha rápida e o suficiente para a
 * derivação do nível (algoritmo/nivelInfecao.ts) mudar de patamar.
 */
export const OPCOES_SINAIS: OpcaoPasso[] = [
  { valor: "dor_aumentada", label: "Dor aumentada" },
  { valor: "tecido_friavel", label: "Tecido friável" },
  { valor: "odor", label: `Odor (${LABEL_NIVEL_ODOR_ERITEMA.moderado.toLowerCase()})` },
  { valor: "atraso_cicatrizacao", label: "Atraso de cicatrização" },
  { valor: "quebra_ferida_nova", label: "Quebra de ferida nova" },
  { valor: "eritema", label: `Eritema (${LABEL_NIVEL_ODOR_ERITEMA.moderado.toLowerCase()})` },
  { valor: "calor_local", label: "Calor local" },
  { valor: "edema_local", label: "Edema local" },
  { valor: "celulite", label: "Celulite" },
  { valor: "linfangite", label: "Linfangite" },
  { valor: "abcesso", label: "Abcesso" },
  { valor: "febre", label: "Febre" },
  { valor: "leucocitose", label: "Leucocitose" },
];

/**
 * Constrói a sequência de passos para o estado atual das respostas. É
 * recalculada a cada escolha porque alguns passos dependem de respostas
 * anteriores: a escala de profundidade muda com a etiologia, o ABPI só existe
 * nas vasculares, e o tipo de exsudado desaparece quando não há exsudado.
 */
export function construirPassos(respostas: RespostasConsulta): Passo[] {
  const etiologia = respostas.etiologia?.[0] as Etiologia | undefined;
  const volume = respostas.exsudado_volume?.[0] as VolumeExsudado | undefined;

  const passos: Passo[] = [
    {
      id: "etiologia",
      titulo: "Etiologia",
      ajuda: "A causa de base da ferida.",
      multiplo: false,
      opcional: false,
      opcoes: opcoes(
        TODAS_ETIOLOGIAS.filter((e) => e !== "outra"),
        LABEL_ETIOLOGIA,
      ),
    },
  ];

  if (etiologia && precisaAbpi(etiologia)) {
    passos.push({
      id: "abpi",
      titulo: "ABPI",
      ajuda: "Índice tornozelo-braço. Decide se a compressão é sequer possível.",
      multiplo: false,
      opcional: false,
      opcoes: OPCOES_ABPI,
    });
  }

  passos.push({
    id: "tecidos",
    titulo: "Tecido do leito",
    ajuda: "Pode haver mais do que um tipo de tecido.",
    multiplo: true,
    opcional: false,
    opcoes: opcoes(TODOS_TIPOS_TECIDO, LABEL_TECIDO),
  });

  passos.push({
    id: "exsudado_volume",
    titulo: "Exsudado — volume",
    multiplo: false,
    opcional: false,
    opcoes: opcoes(TODOS_VOLUMES_EXSUDADO, LABEL_VOLUME),
  });

  // Sem exsudado não há tipo de exsudado a classificar.
  if (volume && mostraTipoExsudado(volume)) {
    passos.push({
      id: "exsudado_tipo",
      titulo: "Exsudado — tipo",
      ajuda: "Pode ser uma combinação.",
      multiplo: true,
      opcional: false,
      opcoes: opcoes(TODOS_TIPOS_EXSUDADO, LABEL_TIPO_EXSUDADO),
    });
  }

  passos.push({
    id: "bordos",
    titulo: "Bordos",
    multiplo: true,
    opcional: false,
    opcoes: opcoes(TODOS_BORDOS, LABEL_BORDO),
  });

  passos.push({
    id: "pele",
    titulo: "Pele perilesional",
    multiplo: true,
    opcional: false,
    opcoes: opcoes(TODOS_PELE_PERILESIONAL, LABEL_PELE),
  });

  passos.push(
    etiologia && escalaProfundidade(etiologia) === "pressao"
      ? {
          id: "profundidade",
          titulo: "Estadiamento",
          ajuda: "Escala NPIAP, usada na lesão por pressão.",
          multiplo: false,
          opcional: false,
          opcoes: opcoes(TODOS_ESTADIOS_PRESSAO, LABEL_ESTADIO_PRESSAO),
        }
      : {
          id: "profundidade",
          titulo: "Profundidade",
          multiplo: false,
          opcional: false,
          opcoes: opcoes(TODAS_PROFUNDIDADES_GENERICAS, LABEL_PROFUNDIDADE_GENERICA),
        },
  );

  passos.push({
    id: "dor",
    titulo: "Dor",
    ajuda: "Escala 0-10.",
    multiplo: false,
    opcional: false,
    opcoes: OPCOES_DOR,
  });

  passos.push({
    id: "sinais_infecao",
    titulo: "Sinais de infeção",
    ajuda: "Marque os que observou. Se não avaliou, avance sem marcar — o resultado não fala de infeção.",
    multiplo: true,
    opcional: true,
    opcoes: OPCOES_SINAIS,
  });

  return passos;
}

/**
 * Conjunto dos passos múltiplos que o utilizador já deu por terminados.
 *
 * Só faz sentido para `multiplo: true`: num passo de escolha única a
 * primeira escolha *é* a resposta, não há nada a confirmar.
 */
export type PassosConfirmados = ReadonlySet<IdPasso>;

const SEM_CONFIRMACOES: PassosConfirmados = new Set<IdPasso>();

/**
 * Um passo está respondido — e portanto a sequência pode avançar para o
 * seguinte?
 *
 * Num passo de escolha única basta haver escolha. Num passo múltiplo isso
 * não chega: enquanto o critério foi "tem alguma resposta", a primeira
 * opção clicada dava o passo por terminado e a sequência saltava logo para
 * a variável seguinte — era impossível marcar uma segunda opção sem voltar
 * atrás pelas "Escolhas feitas". Por isso um passo múltiplo só conta como
 * respondido depois de confirmado explicitamente (a bolha central do
 * SeletorCircular), o que também é o que torna alcançável o
 * `infecao_local_covert`, que exige 2 sinais covert.
 */
export function passoRespondido(
  passo: Passo,
  respostas: RespostasConsulta,
  confirmados: PassosConfirmados = SEM_CONFIRMACOES,
): boolean {
  if (respostas[passo.id] === undefined) return false;
  return passo.multiplo ? confirmados.has(passo.id) : true;
}

/** Índice do primeiro passo ainda por responder; igual ao número de passos quando a sequência está completa. */
export function indiceProximoPasso(
  passos: Passo[],
  respostas: RespostasConsulta,
  confirmados: PassosConfirmados = SEM_CONFIRMACOES,
): number {
  const i = passos.findIndex((p) => !passoRespondido(p, respostas, confirmados));
  return i === -1 ? passos.length : i;
}

export function sequenciaCompleta(
  passos: Passo[],
  respostas: RespostasConsulta,
  confirmados: PassosConfirmados = SEM_CONFIRMACOES,
): boolean {
  return indiceProximoPasso(passos, respostas, confirmados) === passos.length;
}

/**
 * Remove respostas de passos que deixaram de existir — mudar a etiologia de
 * venosa para pressão tem de deitar fora o ABPI já escolhido, senão ficava
 * uma resposta órfã a influenciar o caso construído.
 */
export function limparRespostasObsoletas(passos: Passo[], respostas: RespostasConsulta): RespostasConsulta {
  const validos = new Set(passos.map((p) => p.id));
  const limpas: RespostasConsulta = {};
  for (const [id, valor] of Object.entries(respostas)) {
    if (validos.has(id as IdPasso)) limpas[id as IdPasso] = valor;
  }
  return limpas;
}

/**
 * Descarta confirmações de passos que já não têm resposta — ou porque o
 * passo desapareceu, ou porque a resposta foi limpa por
 * `limparRespostasObsoletas`. Sem isto, baixar o volume de exsudado para
 * "ausente" (que elimina `exsudado_tipo` e a sua resposta) e voltar a
 * subi-lo deixava a confirmação antiga de pé, e o passo voltava a saltar ao
 * primeiro clique. Recebe as respostas **já limpas**.
 */
export function limparConfirmacoesObsoletas(
  respostas: RespostasConsulta,
  confirmados: PassosConfirmados,
): Set<IdPasso> {
  return new Set([...confirmados].filter((id) => respostas[id] !== undefined));
}
