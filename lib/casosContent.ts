import type { CasoClinico } from "../tipos/casoClinico";

/**
 * Conteúdo narrativo por caso de teste — não faz parte de `CasoClinico`
 * (que só guarda variáveis clínicas estruturadas).
 *
 * Fase 1 do ecrã de resolução: o aluno observa e só na Fase 2 é que
 * classifica. Por isso a observação é dada **em linguagem corrente**, nunca
 * com os termos do nosso modelo de dados — escreve-se "líquido claro, tipo
 * água" e não "exsudado seroso", "pouca quantidade" e não "exsudado
 * escasso". Dar o termo técnico aqui entregaria a resposta da Fase 2, que é
 * precisamente onde se avalia se o aluno sabe traduzir o que vê para a
 * classificação certa. Os valores estruturados em dados/casosTeste.ts não
 * mudam — só muda a forma como são descritos.
 *
 * A observação vem repartida por categoria (`observacoes`), cada uma com o
 * seu título, em vez de um parágrafo único onde a informação se perde.
 *
 * REGRA: a Fase 1 só descreve o que a Fase 2 **não** avalia. Cobre o líquido
 * da ferida, o cheiro e o tamanho (mais o enquadramento de localização e
 * tempo, que não são avaliados). Fica de fora tudo o que o aluno tem de
 * identificar sozinho a partir da fotografia ou do exame — tecido do leito,
 * bordos, pele perilesional e sinais de infeção. Descrevê-los aqui, mesmo em
 * linguagem corrente, entrega a resposta da fase seguinte.
 */
export interface BlocoObservacao {
  /** Título da categoria, em linguagem corrente (ex.: "Líquido da ferida"). */
  titulo: string;
  texto: string;
}

export interface ConteudoCaso {
  fotografia: string;
  contexto: string;
  /** Localização e há quanto tempo existe — enquadramento, não classificação. */
  observacoes: BlocoObservacao[];
}

export const CONTEUDO_POR_CASO: Record<string, ConteudoCaso> = {
  caso_1_lesao_pressao: {
    fotografia: "/caso1.jpg",
    contexto: "Homem, 83 anos. Acamado, mobilidade muito reduzida. Sem diabetes.",
    observacoes: [
      { titulo: "Onde fica e há quanto tempo", texto: "Na zona do fundo das costas, mesmo por cima das nádegas. Apareceu há cerca de 2 semanas." },
      { titulo: "Líquido da ferida", texto: "Sai algum líquido, numa quantidade média — o penso fica húmido mas não encharcado. É um líquido claro e aguado, cor de palha, sem sangue nem espessura." },
      { titulo: "Cheiro", texto: "Não se nota qualquer cheiro ao retirar o penso." },
      { titulo: "Tamanho", texto: "Mede cerca de 4 cm de comprimento por 3 cm de largura, e tem cerca de meio centímetro de fundo." },
    ],
  },
  caso_2_deiscencia_cirurgica: {
    fotografia: "/caso2.jpg",
    contexto: "Mulher, 58 anos. Cirurgia abdominal recente, sutura reaberta parcialmente.",
    observacoes: [
      { titulo: "Onde fica e há quanto tempo", texto: "Na barriga, ao longo da cicatriz de uma cirurgia recente, que se voltou a abrir em parte. Tem 1 semana." },
      { titulo: "Líquido da ferida", texto: "Sai bastante líquido — o penso fica bem húmido e às vezes é preciso mudá-lo mais cedo. É um líquido claro e aguado, misturado com algum sangue vivo." },
      { titulo: "Cheiro", texto: "Não se nota qualquer cheiro ao retirar o penso." },
      { titulo: "Tamanho", texto: "É comprida e estreita: cerca de 12 cm de comprimento por 3 cm de largura." },
    ],
  },
  caso_3_ulcera_diabetica: {
    fotografia: "/caso3.jpg",
    contexto: "Homem, 61 anos. Diabetes tipo 2 de longa duração, neuropatia periférica confirmada.",
    observacoes: [
      { titulo: "Onde fica e há quanto tempo", texto: "Na planta do pé, num ponto onde o pé faz força ao andar. Tem cerca de 3 semanas." },
      { titulo: "Líquido da ferida", texto: "Sai muito pouco líquido — o penso sai quase seco. O pouco que sai é claro e aguado." },
      { titulo: "Cheiro", texto: "Não se nota qualquer cheiro ao retirar o penso." },
      { titulo: "Tamanho", texto: "É pequena: cerca de 1,5 cm por 1 cm." },
    ],
  },
  caso_4_ulcera_venosa_maleolo: {
    fotografia: "/caso4.jpg",
    contexto: "Mulher, 68 anos. Insuficiência venosa crónica, edema dos membros inferiores.",
    observacoes: [
      { titulo: "Onde fica e há quanto tempo", texto: "Na parte de dentro do tornozelo, sobre o osso saliente. Já apareceu e sarou outras vezes no mesmo sítio; desta vez dura há 8 meses." },
      { titulo: "Líquido da ferida", texto: "Sai algum líquido, numa quantidade média — o penso fica húmido mas não encharcado. É claro e aguado, sem sangue." },
      { titulo: "Cheiro", texto: "Não se nota qualquer cheiro ao retirar o penso." },
      { titulo: "Tamanho", texto: "Mede cerca de 6 cm por 4 cm." },
    ],
  },
  caso_5_ulcera_venosa_perna: {
    fotografia: "/caso5.jpg",
    contexto: "Mulher, 74 anos. Insuficiência venosa crónica, lesões satélite na perna.",
    observacoes: [
      { titulo: "Onde fica e há quanto tempo", texto: "Na parte de baixo da perna, acima do tornozelo. Tem cerca de 6 semanas." },
      { titulo: "Líquido da ferida", texto: "Sai muito líquido — o penso fica encharcado e precisa de ser mudado com frequência. É claro e aguado." },
      { titulo: "Cheiro", texto: "Sente-se um cheiro ligeiro ao retirar o penso, pouco intenso." },
      { titulo: "Tamanho", texto: "Mede cerca de 7 cm por 5 cm." },
    ],
  },
};

export interface PerguntaDialogo {
  tag: string;
  pergunta: string;
  resposta: (caso: CasoClinico) => string;
}

export const PERGUNTAS_DIALOGO: PerguntaDialogo[] = [
  {
    tag: "Dor",
    pergunta: "Como classifica a dor de 0 a 10?",
    resposta: (c) =>
      c.dor <= 2
        ? `Cerca de ${c.dor}. Quase não incomoda.`
        : c.dor <= 5
          ? `Uns ${c.dor}. Incomoda mas dá para viver com isso.`
          : `Uns ${c.dor}. É bastante incomodativo, sobretudo quando mexo na zona.`,
  },
  {
    tag: "Historial",
    pergunta: "Há quanto tempo tem a ferida e como evoluiu?",
    resposta: (c) =>
      c.tempo_evolucao.classificacao === "aguda"
        ? `Começou há ${c.tempo_evolucao.duracao_semanas} semana(s). É recente.`
        : `Já tenho isto há ${c.tempo_evolucao.duracao_semanas} semanas. Não tem fechado.`,
  },
  {
    tag: "Posicionamento",
    pergunta: "Passa muito tempo na mesma posição ou apoiado na zona da ferida?",
    resposta: (c) =>
      c.localizacao_anatomica === "sacro" || c.localizacao_anatomica === "isquion" || c.localizacao_anatomica === "trocanter" || c.localizacao_anatomica === "calcanhar"
        ? "Passo a maior parte do dia deitado ou sentado, na mesma posição."
        : c.localizacao_anatomica === "planta_pe"
          ? "Ando bastante e não costumo aliviar o apoio nessa zona do pé."
          : "Não sinto que a posição faça muita diferença nesta ferida.",
  },
  {
    tag: "Febre",
    pergunta: "Tem tido febre ou arrepios?",
    resposta: (c) =>
      c.sinais_infecao.febre
        ? "Sim, tive episódios de febre nos últimos dias."
        : "Não, nunca tive febre por causa disto.",
  },
  {
    tag: "Mobilidade",
    pergunta: "Consegue andar e tratar da ferida sozinho(a)?",
    resposta: (c) =>
      c.localizacao_anatomica === "sacro" || c.localizacao_anatomica === "isquion" || c.localizacao_anatomica === "trocanter"
        ? "Não, preciso de ajuda para me virar e para o penso."
        : "Sim, ando sem ajuda e trato do penso sozinho(a).",
  },
];

/** Heurística de dificuldade — não é dado da especificação, apenas uma
 * aproximação a partir do número de categorias de tratamento aplicáveis. */
export function dificuldadeHeuristica(nCategoriasAplicaveis: number): "Iniciante" | "Intermédio" | "Avançado" {
  if (nCategoriasAplicaveis <= 3) return "Iniciante";
  if (nCategoriasAplicaveis <= 5) return "Intermédio";
  return "Avançado";
}
