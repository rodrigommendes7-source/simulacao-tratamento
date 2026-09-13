/**
 * Banco de justificações — Fase 5 (banco-justificacoes.md). Uma pergunta de
 * escolha múltipla por categoria de tratamento e por técnica de aplicação;
 * os distratores são razões corretas de OUTRA categoria/técnica (testa se o
 * aluno entende a diferença, não apenas se reconhece uma frase plausível).
 *
 * `terapia_compressiva` (categoria de tratamento, ver dados/tratamentos.ts)
 * não consta do documento original — o documento só cobre a técnica de
 * aplicação homónima. Mantém-se aqui com o mesmo raciocínio clínico
 * (etiologia venosa/mista + ABPI adequado) para que a categoria de
 * tratamento, que ainda existe no motor de decisão, tenha justificação
 * própria na UI.
 */
import type { CategoriaTratamento } from "../tipos/tratamento";

export interface OpcaoJustificacao {
  texto: string;
  correta: boolean;
}

export interface EntradaJustificacao {
  pergunta: string;
  opcoes: OpcaoJustificacao[];
}

export const JUSTIFICACOES_TRATAMENTO: Partial<Record<CategoriaTratamento, EntradaJustificacao>> = {
  desbridamento: {
    pergunta: "Porque escolheu desbridamento neste caso?",
    opcoes: [
      { texto: "Existe tecido necrótico ou desvitalizado no leito que impede a cicatrização e precisa de ser removido", correta: true },
      { texto: "Para reduzir o volume de exsudado da ferida", correta: false },
      { texto: "Para controlar a carga bacteriana da ferida", correta: false },
      { texto: "Para proteger tecido de granulação frágil na remoção do penso", correta: false },
    ],
  },
  pensos_humidade: {
    pergunta: "Porque escolheu pensos de gestão de humidade neste caso?",
    opcoes: [
      { texto: "O volume de exsudado da ferida exige um material com a capacidade de absorção ou hidratação adequada", correta: true },
      { texto: "Há sinais de infeção local a controlar", correta: false },
      { texto: "A causa da ferida ainda não foi tratada", correta: false },
      { texto: "O bordo da ferida está estagnado", correta: false },
    ],
  },
  antimicrobianos: {
    pergunta: "Porque escolheu um penso antimicrobiano neste caso?",
    opcoes: [
      { texto: "Existem sinais de infeção local ou sistémica que justificam o controlo da carga bacteriana", correta: true },
      { texto: "O exsudado está desproporcional ao penso atualmente usado", correta: false },
      { texto: "O tecido de granulação está hipergranulado", correta: false },
      { texto: "A ferida está seca e precisa de hidratação", correta: false },
    ],
  },
  terapia_compressiva: {
    pergunta: "Porque escolheu terapia compressiva neste caso?",
    opcoes: [
      { texto: "A etiologia é venosa ou mista arteriovenosa e o ABPI confirma que a compressão é segura no intervalo aplicável", correta: true },
      { texto: "A ferida tem exsudado abundante", correta: false },
      { texto: "Há tecido necrótico a hidratar", correta: false },
      { texto: "A ferida está infetada", correta: false },
    ],
  },
  pressao_negativa: {
    pergunta: "Porque escolheu terapia de pressão negativa neste caso?",
    opcoes: [
      { texto: "Há tecido de granulação a promover e exsudado abundante, sem necrose por desbridar nem outra contraindicação", correta: true },
      { texto: "Há necrose extensa no leito por remover", correta: false },
      { texto: "Há hipergranulação a controlar", correta: false },
      { texto: "A causa vascular ainda não foi avaliada", correta: false },
    ],
  },
  bordos_problematicos: {
    pergunta: "Porque escolheu gestão de bordos problemáticos neste caso?",
    opcoes: [
      { texto: "O bordo da ferida está enrolado/fibrótico, ou há hipergranulação a controlar", correta: true },
      { texto: "Há tecido necrótico no leito da ferida", correta: false },
      { texto: "O exsudado é abundante", correta: false },
      { texto: "Há sinais sistémicos de infeção", correta: false },
    ],
  },
  paliativos_oncologicos: {
    pergunta: "Porque escolheu cuidados paliativos específicos neste caso?",
    opcoes: [
      { texto: "O objetivo é controlo sintomático (odor, exsudado, hemorragia ou dor) numa ferida oncológica maligna, não a cicatrização", correta: true },
      { texto: "A ferida está a cicatrizar bem e só precisa de proteção", correta: false },
      { texto: "Há uma causa vascular ainda por tratar", correta: false },
      { texto: "O tecido está hipergranulado", correta: false },
    ],
  },
  limpeza_irrigacao: {
    pergunta: "Porque escolheu limpeza e irrigação neste caso?",
    opcoes: [
      { texto: "É o passo de preparação do leito que antecede qualquer outro tratamento, independentemente das restantes variáveis", correta: true },
      { texto: "Substitui a necessidade de um penso antimicrobiano quando há infeção", correta: false },
      { texto: "Só é necessária quando há sinais de infeção", correta: false },
      { texto: "É desnecessária se a ferida parecer limpa visualmente", correta: false },
    ],
  },
  interfaces_silicone: {
    pergunta: "Porque escolheu interfaces não aderentes (silicone) neste caso?",
    opcoes: [
      { texto: "A pele perilesional está frágil, ou há dor associada à remoção do penso, e é preciso proteger tecido novo/frágil sem aderir", correta: true },
      { texto: "O exsudado é abundante e precisa de alta absorção", correta: false },
      { texto: "Há sinais de infeção a controlar", correta: false },
      { texto: "O bordo da ferida está enrolado", correta: false },
    ],
  },
};

export const JUSTIFICACOES_TECNICA: Record<string, EntradaJustificacao> = {
  penso_rapido: {
    pergunta: "Porque escolheu penso rápido como técnica de aplicação?",
    opcoes: [
      { texto: "A ferida é muito pequena, superficial e sem exsudado relevante", correta: true },
      { texto: "A ferida tem exsudado abundante", correta: false },
      { texto: "Há sinais de infeção a monitorizar de perto", correta: false },
      { texto: "É preciso efeito de compressão terapêutica", correta: false },
    ],
  },
  penso_simples_protetor: {
    pergunta: "Porque escolheu penso simples protetor como técnica de aplicação?",
    opcoes: [
      { texto: "É a técnica de fecho por defeito quando nenhuma das outras técnicas é especificamente necessária", correta: true },
      { texto: "É sempre a melhor opção para feridas infetadas", correta: false },
      { texto: "Substitui a necessidade de compressão em úlceras venosas", correta: false },
      { texto: "Só é indicada quando há exsudado abundante", correta: false },
    ],
  },
  ligadura: {
    pergunta: "Porque escolheu ligadura como técnica de aplicação?",
    opcoes: [
      { texto: "A ferida é grande, ou está numa localização onde o penso adesivo não fixa bem, sem necessidade de efeito compressivo", correta: true },
      { texto: "É usada para exercer pressão terapêutica graduada", correta: false },
      { texto: "Substitui a necessidade de um penso/tratamento primário", correta: false },
      { texto: "É indicada só em feridas cirúrgicas", correta: false },
    ],
  },
  penso_impermeavel: {
    pergunta: "Porque escolheu penso impermeável como técnica de aplicação?",
    opcoes: [
      { texto: "É preciso proteger a ferida de humidade ou contaminação externa, sem sinais de infeção presentes", correta: true },
      { texto: "Há exsudado abundante a absorver", correta: false },
      { texto: "Há sinais de infeção ativa", correta: false },
      { texto: "É preciso efeito de compressão", correta: false },
    ],
  },
  terapia_compressiva_tecnica: {
    pergunta: "Porque escolheu terapia compressiva como técnica de aplicação?",
    opcoes: [
      { texto: "A etiologia é venosa ou mista arteriovenosa e o ABPI confirma que a compressão é segura no intervalo aplicável", correta: true },
      { texto: "A ferida tem exsudado abundante", correta: false },
      { texto: "Há tecido necrótico a hidratar", correta: false },
      { texto: "A ferida está infetada", correta: false },
    ],
  },
  sem_protecao: {
    pergunta: "Porque escolheu não proteger / expor ao ar como técnica de aplicação?",
    opcoes: [
      { texto: "Há necrose seca estável em contexto de isquemia arterial, onde a exposição controlada é preferível a qualquer oclusão", correta: true },
      { texto: "A ferida está a cicatrizar bem e não precisa de proteção", correta: false },
      { texto: "O exsudado é abundante", correta: false },
      { texto: "Há sinais de infeção presentes", correta: false },
    ],
  },
};
