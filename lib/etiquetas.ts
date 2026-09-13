import type {
  Etiologia,
  TipoTecido,
  ValorBordo,
  ValorPelePerilesional,
  VolumeExsudado,
  TipoExsudado,
  NivelInfecao,
  NivelOdorEritema,
  ProfundidadeEstadiamentoPressao,
  ProfundidadeEstadiamentoGenerica,
} from "../tipos/variaveis";
import type { CategoriaTratamento } from "../tipos/tratamento";

export const LABEL_NIVEL_ODOR_ERITEMA: Record<NivelOdorEritema, string> = {
  ausente: "Ausente",
  ligeiro: "Ligeiro",
  moderado: "Moderado",
  forte: "Forte",
};

export const LABEL_ESTADIO_PRESSAO: Record<ProfundidadeEstadiamentoPressao, string> = {
  estadio_1: "Estádio 1",
  estadio_2: "Estádio 2",
  estadio_3: "Estádio 3",
  estadio_4: "Estádio 4",
  nao_classificavel: "Não classificável",
  lesao_tecidos_profundos_suspeita: "Lesão de tecidos profundos suspeita",
};

export const LABEL_PROFUNDIDADE_GENERICA: Record<ProfundidadeEstadiamentoGenerica, string> = {
  superficial: "Superficial",
  espessura_parcial: "Espessura parcial",
  espessura_total: "Espessura total",
};

export const LABEL_ETIOLOGIA: Record<Etiologia, string> = {
  venosa: "Venosa",
  arterial: "Arterial",
  mista_arteriovenosa: "Mista arteriovenosa",
  pressao: "Pressão",
  pe_diabetico_neuropatico: "Pé diabético neuropático",
  pe_diabetico_neuroisquemico: "Pé diabético neuroisquémico",
  cirurgica: "Cirúrgica",
  traumatica: "Traumática",
  oncologica_maligna: "Oncológica maligna",
  outra: "Outra",
};

export const LABEL_TECIDO: Record<TipoTecido, string> = {
  granulacao: "Granulação",
  granulacao_hipergranulada: "Granulação hipergranulada",
  epitelizacao: "Epitelização",
  esfacelo: "Esfacelo",
  necrose_seca: "Necrose seca",
  necrose_humida: "Necrose húmida",
};

export const LABEL_BORDO: Record<ValorBordo, string> = {
  aderentes_planos: "Aderentes/planos",
  nao_aderentes_solto: "Não aderentes/solto",
  enrolados_epibole: "Enrolados (epíbole)",
  socavados_underminados: "Socavados/underminados",
  hiperqueratosicos: "Hiperqueratósicos",
  fibroticos: "Fibróticos",
};

export const LABEL_PELE: Record<ValorPelePerilesional, string> = {
  integra: "Íntegra",
  macerada: "Macerada",
  seca_descamativa: "Seca/descamativa",
  eczematizada: "Eczematizada",
  hiperpigmentada: "Hiperpigmentada",
  induracao_lipodermatosclerose: "Induração/lipodermatosclerose",
  calo_hiperqueratose: "Calo/hiperqueratose",
};

export const LABEL_VOLUME: Record<VolumeExsudado, string> = {
  ausente: "Ausente",
  escasso: "Escasso",
  moderado: "Moderado",
  abundante: "Abundante",
};

export const LABEL_TIPO_EXSUDADO: Record<TipoExsudado, string> = {
  seroso: "Seroso",
  sanguinolento: "Sanguinolento",
  purulento: "Purulento",
};

export const LABEL_NIVEL_INFECAO: Record<NivelInfecao, string> = {
  sem_sinais: "Sem sinais de infeção",
  infecao_local_covert: "Infeção local (covert)",
  infecao_local_overt: "Infeção local (overt)",
  infecao_propagacao_sistemica: "Propagação sistémica",
};

export const LABEL_CATEGORIA: Record<CategoriaTratamento, string> = {
  desbridamento: "Desbridamento",
  pensos_humidade: "Pensos de gestão de humidade",
  antimicrobianos: "Pensos antimicrobianos",
  terapia_compressiva: "Terapia compressiva",
  pressao_negativa: "Terapia de pressão negativa",
  bordos_problematicos: "Gestão de bordos problemáticos",
  paliativos_oncologicos: "Cuidados paliativos específicos",
  limpeza_irrigacao: "Limpeza e irrigação",
  interfaces_silicone: "Interfaces não aderentes (silicone)",
};
