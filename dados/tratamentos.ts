/**
 * Base de dados de tratamentos — tradução da Fase 3 v2
 * (fase3-base-dados-tratamentos.md) para estrutura de dados avaliável pelo
 * motor de decisão.
 *
 * `indicadoQuandoTexto`/`contraindicadoQuandoTexto`: texto tal como está no
 * documento de origem (secção "Indicado quando"/"Contraindicado quando" de
 * cada entrada) — usado pela explicação da recomendação em
 * app/consulta/page.tsx. Não é gerado a partir da DSL (`indicadoQuando`/
 * `contraindicadoQuando`) para não reescrever conteúdo clínico já validado.
 *
 * ASSUNÇÕES DE CODIFICAÇÃO (a confirmar com Rodrigo — sinalizadas aqui em
 * vez de dispersas por cada entrada):
 *
 * 1. Muitos critérios "indicado quando"/"contraindicado quando" da Fase 3
 *    são prosa clínica não redutível a `variavel.campo` da taxonomia fixa
 *    (ex.: "falta de treino/certificação", "alergia a ovo/soja/larvas",
 *    "feridas grandes >2cm", "proximidade de vasos major", "localização
 *    facial", "uso prolongado sem reavaliação", "disfunção tiroideia").
 *    Estes ficam registados em `notasNaoCodificadas` mas NÃO bloqueiam a
 *    indicação no algoritmo — o mesmo tratamento que o próprio projeto já
 *    dá à "escara seca estável em isquemia" (nota informativa, não regra
 *    automática — Fase 3, P3-F01).
 * 2. Categoria 1 (desbridamento): todas as entradas pressupõem
 *    implicitamente `tipo_tecido_leito` conter tecido não viável
 *    (esfacelo/necrose_seca/necrose_humida) — é o propósito da própria
 *    categoria, ainda que nem todas as entradas o repitam explicitamente
 *    no texto da Fase 3. Adicionado como condição base a cada entrada.
 * 3. Onde a Fase 3 lista várias condições "indicado quando" separadas por
 *    ";", tratamos cada uma como uma indicação alternativa (OU), não como
 *    exigência simultânea (E) — consistente com o estilo do documento
 *    (ex.: desbridamento cirúrgico lista duas indicações distintas, não
 *    uma conjunção).
 * 4. Categoria 4 (terapia compressiva): modelada com base em `abpi` (ver
 *    tipos/variaveis.ts). Fora do intervalo 0,5–1,3 assume-se que a decisão
 *    correta é avaliação vascular/especializada, não um produto desta
 *    categoria — por isso a categoria é tratada como não aplicável fora
 *    deste intervalo (ver algoritmo/motorDecisao.ts).
 */

import { contem, diferente, e, igual, numerica, ou, sempre } from "../tipos/condicao";
import type { Condicao } from "../tipos/condicao";
import type { EntradaTratamento } from "../tipos/tratamento";

const TECIDO_NAO_VIAVEL: Condicao = ou(
  contem("tipo_tecido_leito", "esfacelo"),
  contem("tipo_tecido_leito", "necrose_seca"),
  contem("tipo_tecido_leito", "necrose_humida"),
);

// ---------------------------------------------------------------------------
// 1. Desbridamento
// ---------------------------------------------------------------------------

const desbridamento: EntradaTratamento[] = [
  {
    id: "desbridamento_cirurgico",
    categoria: "desbridamento",
    nome: "Cirúrgico/cortante",
    mecanismo: "Remoção de tecido não viável com instrumento cortante.",
    indicadoQuando: TECIDO_NAO_VIAVEL,
    contraindicadoQuando: [],
    indicadoQuandoTexto:
      "tipo_tecido_leito contém necrose_seca/necrose_humida/esfacelo em quantidade significativa; necessidade de remoção imediata (ex.: sinais_infecao.nivel_infecao a progredir).",
    contraindicadoQuandoTexto:
      "Ausência de demarcação clara entre tecido necrótico e viável; doente sob anticoagulação sem preparação adequada; falta de treino/certificação para desbridamento mais extenso.",
    nivelEvidencia: "forte",
    notasAplicacao:
      "Método mais rápido; combinar com desbridamento de manutenção entre sessões.",
    notasNaoCodificadas: [
      "Ausência de demarcação clara necrótico/viável",
      "Anticoagulação sem preparação adequada",
      "Falta de treino/certificação para desbridamento mais extenso",
      "Nota informativa (não bloqueia): escara seca estável em isquemia/calcanhar pode não dever ser desbridada até avaliação vascular prévia",
    ],
    referencias: ["R61"],
  },
  {
    id: "desbridamento_autolitico",
    categoria: "desbridamento",
    nome: "Autolítico",
    mecanismo: "Fagocitose e enzimas proteolíticas endógenas em ambiente húmido.",
    indicadoQuando: e(TECIDO_NAO_VIAVEL, igual("nivel_infecao", "sem_sinais")),
    contraindicadoQuando: [],
    indicadoQuandoTexto: "sinais_infecao.nivel_infecao = sem_sinais; método sem dor preferido.",
    contraindicadoQuandoTexto:
      "Grande quantidade de tecido necrótico; imunidade comprometida; sem redução da necrose em 1-2 dias (mudar de método).",
    nivelEvidencia: "moderada",
    notasAplicacao: "O mais lento; requer pensos que mantenham humidade (categoria 2).",
    notasNaoCodificadas: [
      "Grande quantidade de tecido necrótico",
      "Imunidade comprometida",
      "Sem redução da necrose em 1-2 dias, mudar de método",
    ],
    referencias: ["R62", "R63"],
  },
  {
    id: "desbridamento_enzimatico",
    categoria: "desbridamento",
    nome: "Enzimático",
    mecanismo: "Enzimas proteolíticas (ex.: colagenase) degradam o colagénio necrótico.",
    indicadoQuando: TECIDO_NAO_VIAVEL,
    contraindicadoQuando: [
      igual("nivel_infecao", "infecao_local_overt"),
      igual("nivel_infecao", "infecao_propagacao_sistemica"),
    ],
    indicadoQuandoTexto:
      "Necessidade de método mais rápido que o autolítico sem indicação para cirúrgico; manutenção entre sessões de desbridamento cortante.",
    contraindicadoQuandoTexto:
      "sinais_infecao.nivel_infecao em infecao_local_overt/infecao_propagacao_sistemica (contraindicação relativa); não combinar com prata ou solução de Dakin.",
    nivelEvidencia: "moderada",
    notasAplicacao: "Aplicação diária; não combinar com prata ou solução de Dakin.",
    notasNaoCodificadas: ["Contraindicação relativa em infeção overt/sistémica"],
    referencias: ["R63", "R62"],
  },
  {
    id: "desbridamento_mecanico",
    categoria: "desbridamento",
    nome: "Mecânico",
    mecanismo: "Remoção por força externa (wet-to-dry).",
    indicadoQuando: TECIDO_NAO_VIAVEL,
    contraindicadoQuando: [contem("tipo_tecido_leito", "granulacao")],
    indicadoQuandoTexto: "Quantidade moderada de tecido necrótico; quando outros métodos não estão disponíveis.",
    contraindicadoQuandoTexto:
      "tipo_tecido_leito contém granulação saudável (método não seletivo); dor elevada sem analgesia adequada.",
    nivelEvidencia: "limitada",
    notasAplicacao: "Demorado, frequentemente doloroso; uso reduzido atualmente.",
    notasNaoCodificadas: ["Dor elevada sem analgesia adequada"],
    referencias: ["R63"],
  },
  {
    id: "desbridamento_biologico_larval",
    categoria: "desbridamento",
    nome: "Biológico (larval)",
    mecanismo: "Larvas estéreis de Lucilia sericata dissolvem tecido necrótico.",
    indicadoQuando: TECIDO_NAO_VIAVEL,
    contraindicadoQuando: [contem("bordos", "socavados_underminados")],
    indicadoQuandoTexto:
      "Feridas grandes onde se pretende remoção indolor e seletiva; alternativa quando cirúrgico não é opção ou sinais_infecao.nivel_infecao ≠ sem_sinais.",
    contraindicadoQuandoTexto:
      "Alergia a ovo/soja/larvas de mosca; localização anatómica facial; proximidade de vasos major; bordos com cavidades/trajetos fistulosos; terapia anticoagulante.",
    nivelEvidencia: "moderada",
    notasAplicacao: "Pode permanecer 4-5 dias; requer prescrição.",
    notasNaoCodificadas: [
      "Alergia a ovo/soja/larvas de mosca",
      "Localização facial",
      "Proximidade de vasos major",
      "Terapia anticoagulante",
    ],
    referencias: ["R64", "R62"],
  },
];

// ---------------------------------------------------------------------------
// 2. Pensos de gestão de humidade
// ---------------------------------------------------------------------------

const pensosHumidade: EntradaTratamento[] = [
  {
    id: "penso_hidrocoloide",
    categoria: "pensos_humidade",
    nome: "Hidrocoloide",
    mecanismo: "Polímeros hidrofílicos que absorvem exsudado progressivamente e formam gel.",
    indicadoQuando: ou(
      igual("exsudado.volume", "escasso"),
      igual("exsudado.volume", "moderado"),
    ),
    contraindicadoQuando: [
      igual("exsudado.volume", "abundante"),
      contem("pele_perilesional", "macerada"),
      diferente("nivel_infecao", "sem_sinais"),
      igual("profundidade_estadiamento", "estadio_4"),
      igual("profundidade_estadiamento", "espessura_total"),
      contem("bordos", "socavados_underminados"),
    ],
    indicadoQuandoTexto: "exsudado.volume = escasso/moderado; etiologia = pressao.",
    contraindicadoQuandoTexto:
      "exsudado.volume = abundante; pele_perilesional contém macerada; sinais_infecao.nivel_infecao ≠ sem_sinais; profundidade_estadiamento = estadio_4 ou espessura_total com exposição; queimaduras de espessura total; bordos = socavados_underminados com underminação extensa.",
    nivelEvidencia: "forte",
    notasAplicacao: "Mudança a cada 2-4 dias; impossibilita visualização direta entre mudanças.",
    referencias: ["R65", "R66"],
  },
  {
    id: "penso_espuma",
    categoria: "pensos_humidade",
    nome: "Espuma (foam)",
    mecanismo: "Folhas semipermeáveis de poliuretano, células abertas que retêm fluido.",
    indicadoQuando: ou(
      igual("exsudado.volume", "moderado"),
      igual("exsudado.volume", "abundante"),
      igual("profundidade_estadiamento", "espessura_total"),
    ),
    contraindicadoQuando: [igual("exsudado.volume", "escasso")],
    indicadoQuandoTexto: "exsudado.volume = moderado/abundante; profundidade_estadiamento = espessura_total.",
    contraindicadoQuandoTexto: "exsudado.volume = escasso.",
    nivelEvidencia: "forte",
    notasAplicacao: "Não aderentes, repelem contaminantes.",
    referencias: ["R67"],
  },
  {
    id: "penso_alginato",
    categoria: "pensos_humidade",
    nome: "Alginato",
    mecanismo: "Polissacárido de algas castanhas; troca iónica com exsudado forma gel hidrofílico.",
    indicadoQuando: ou(
      igual("exsudado.volume", "abundante"),
      contem("bordos", "nao_aderentes_solto"),
      contem("bordos", "socavados_underminados"),
    ),
    contraindicadoQuando: [igual("exsudado.volume", "escasso")],
    indicadoQuandoTexto:
      "exsudado.volume = abundante; bordos = nao_aderentes_solto ou socavados_underminados com necessidade de preencher espaço morto.",
    contraindicadoQuandoTexto: "exsudado.volume = escasso.",
    nivelEvidencia: "forte",
    notasAplicacao: "Requer penso secundário de fixação.",
    referencias: ["R67", "R66"],
  },
  {
    id: "penso_hidrofibra",
    categoria: "pensos_humidade",
    nome: "Hidrofibra",
    mecanismo: "Fibras de carboximetilcelulose sódica, elevada absorção e gelificação atraumática.",
    indicadoQuando: ou(
      igual("exsudado.volume", "moderado"),
      igual("exsudado.volume", "abundante"),
    ),
    contraindicadoQuando: [igual("exsudado.volume", "escasso")],
    indicadoQuandoTexto: "exsudado.volume = moderado/abundante; combinar absorção com desbridamento autolítico atraumático.",
    contraindicadoQuandoTexto: "exsudado.volume = escasso.",
    nivelEvidencia: "moderada",
    notasAplicacao: "Boa opção quando dor elevada é preocupação relevante.",
    referencias: ["R61", "R67"],
  },
  {
    id: "penso_hidrogel",
    categoria: "pensos_humidade",
    nome: "Hidrogel",
    mecanismo: "Polímeros reticulados com até 95% de água; hidratam o leito.",
    indicadoQuando: ou(
      igual("exsudado.volume", "escasso"),
      igual("exsudado.volume", "ausente"),
      contem("tipo_tecido_leito", "necrose_seca"),
      contem("tipo_tecido_leito", "esfacelo"),
    ),
    contraindicadoQuando: [igual("exsudado.volume", "abundante")],
    indicadoQuandoTexto: "exsudado.volume = escasso/ausente; tipo_tecido_leito contém necrose_seca/esfacelo.",
    contraindicadoQuandoTexto: "exsudado.volume = abundante.",
    nivelEvidencia: "forte",
    notasAplicacao: "Preferencial para reidratar tecido necrótico seco.",
    referencias: ["R66"],
  },
  {
    id: "penso_filme_transparente",
    categoria: "pensos_humidade",
    nome: "Filme transparente",
    mecanismo: "Poliuretano com adesivo, permeável a gases, impermeável a fluido.",
    indicadoQuando: ou(
      igual("exsudado.volume", "ausente"),
      igual("exsudado.volume", "escasso"),
    ),
    contraindicadoQuando: [
      igual("exsudado.volume", "moderado"),
      igual("exsudado.volume", "abundante"),
      diferente("nivel_infecao", "sem_sinais"),
    ],
    indicadoQuandoTexto: "exsudado.volume = ausente/escasso; feridas superficiais, etiologia = cirurgica fechada (proteção).",
    contraindicadoQuandoTexto: "exsudado.volume = moderado/abundante; sinais_infecao.nivel_infecao ≠ sem_sinais.",
    nivelEvidencia: "forte",
    notasAplicacao: "Permite visualização direta.",
    referencias: ["R67", "R65"],
  },
];

// ---------------------------------------------------------------------------
// 3. Pensos antimicrobianos
// ---------------------------------------------------------------------------
// Regra de exclusão comum a toda a categoria: nenhum destes deve ser
// sugerido quando sinais_infecao.nivel_infecao = sem_sinais (uso
// profilático não recomendado).

const antimicrobianos: EntradaTratamento[] = [
  {
    id: "antimicrobiano_prata",
    categoria: "antimicrobianos",
    nome: "Prata",
    mecanismo: "Ação citotóxica de largo espectro; combate biofilme.",
    indicadoQuando: diferente("nivel_infecao", "sem_sinais"),
    contraindicadoQuando: [],
    indicadoQuandoTexto: "sinais_infecao.nivel_infecao em infecao_local_covert/infecao_local_overt/infecao_propagacao_sistemica.",
    contraindicadoQuandoTexto: "sinais_infecao.nivel_infecao = sem_sinais; uso prolongado sem reavaliação.",
    nivelEvidencia: "mista",
    notasAplicacao: "Reavaliar a cada mudança de penso.",
    notasNaoCodificadas: ["Uso prolongado sem reavaliação"],
    referencias: ["R68"],
  },
  {
    id: "antimicrobiano_iodo",
    categoria: "antimicrobianos",
    nome: "Iodo (cadexómero/povidona-iodada)",
    mecanismo: "Antissético de largo espectro; cadexómero absorve exsudado e liberta iodo.",
    indicadoQuando: e(
      diferente("nivel_infecao", "sem_sinais"),
      igual("exsudado.volume", "moderado"),
    ),
    contraindicadoQuando: [],
    indicadoQuandoTexto: "sinais_infecao.nivel_infecao ≠ sem_sinais; exsudado.volume = moderado.",
    contraindicadoQuandoTexto: "Alergia ao iodo; disfunção tiroideia; gravidez/amamentação.",
    nivelEvidencia: "moderada",
    notasAplicacao: "Mudança de cor do penso indica substituição.",
    notasNaoCodificadas: ["Alergia ao iodo", "Disfunção tiroideia", "Gravidez/amamentação"],
    referencias: ["R70", "R71"],
  },
  {
    id: "antimicrobiano_mel",
    categoria: "antimicrobianos",
    nome: "Mel (grau médico, Manuka)",
    mecanismo: "pH baixo e metilglioxal (MGO); facilita desbridamento autolítico.",
    indicadoQuando: e(
      TECIDO_NAO_VIAVEL,
      diferente("nivel_infecao", "sem_sinais"),
      ou(
        igual("etiologia", "venosa"),
        igual("etiologia", "pressao"),
        igual("etiologia", "pe_diabetico_neuropatico"),
        igual("etiologia", "pe_diabetico_neuroisquemico"),
        igual("etiologia", "cirurgica"),
        igual("etiologia", "traumatica"),
      ),
    ),
    contraindicadoQuando: [],
    indicadoQuandoTexto:
      "tipo_tecido_leito contém necrose_seca/esfacelo; sinais_infecao.nivel_infecao ≠ sem_sinais; etiologias venosa, pressao, pe_diabetico_neuropatico, pe_diabetico_neuroisquemico, cirurgica ou traumatica.",
    contraindicadoQuandoTexto: "Alergia a produtos de abelha; uso prolongado (MGO pode ser citotóxico em concentração elevada).",
    nivelEvidencia: "moderada",
    notasAplicacao: "Pode causar dor transitória por ação osmótica.",
    notasNaoCodificadas: ["Alergia a produtos de abelha", "Uso prolongado (MGO citotóxico em concentração elevada)"],
    referencias: ["R72", "R73"],
  },
  {
    id: "antimicrobiano_phmb",
    categoria: "antimicrobianos",
    nome: "PHMB",
    mecanismo: "Antimicrobiano sintético de largo espectro, inibe metabolismo celular bacteriano.",
    indicadoQuando: diferente("nivel_infecao", "sem_sinais"),
    contraindicadoQuando: [],
    indicadoQuandoTexto: "sinais_infecao.nivel_infecao ≠ sem_sinais, sobretudo para evitar resistência associada à prata.",
    contraindicadoQuandoTexto: "Sensibilidade conhecida ao produto.",
    nivelEvidencia: "moderada",
    notasAplicacao: "Alternativa não-prata, evita resistência associada à prata.",
    notasNaoCodificadas: ["Sensibilidade conhecida ao produto"],
    referencias: ["R71"],
  },
  {
    id: "antimicrobiano_dacc",
    categoria: "antimicrobianos",
    nome: "DACC",
    mecanismo: "Mecanismo físico hidrofóbico — microrganismos aderem irreversivelmente ao penso.",
    indicadoQuando: diferente("nivel_infecao", "sem_sinais"),
    contraindicadoQuando: [],
    indicadoQuandoTexto: "sinais_infecao.nivel_infecao ≠ sem_sinais; feridas crónicas onde inflamação prolongada é preocupação (etiologia = venosa).",
    contraindicadoQuandoTexto: "Sem contraindicações major além de sensibilidade ao produto.",
    nivelEvidencia: "moderada",
    notasAplicacao: "Requer ambiente húmido para ligação hidrofóbica eficaz.",
    notasNaoCodificadas: ["Sensibilidade ao produto"],
    referencias: ["R69", "R68"],
  },
];

// ---------------------------------------------------------------------------
// 4. Terapia compressiva
// ---------------------------------------------------------------------------
// Aplicabilidade da categoria (etiologia venosa/mista + 0,5<=abpi<=1,3) é
// tratada no motor de decisão, não aqui — ver assunção 4 no topo do ficheiro.

const terapiaCompressiva: EntradaTratamento[] = [
  {
    id: "compressao_alta_pressao",
    categoria: "terapia_compressiva",
    nome: "Compressão de alta pressão (35-40mmHg)",
    mecanismo: "Pressão externa graduada contraria hipertensão venosa.",
    indicadoQuando: numerica("abpi", ">", 0.8),
    contraindicadoQuando: [
      numerica("abpi", "<", 0.5),
      numerica("abpi", ">", 1.3),
    ],
    indicadoQuandoTexto: "ABPI > 0,8 → compressão de alta pressão (35-40mmHg).",
    contraindicadoQuandoTexto:
      "ABPI < 0,5 (contraindicação absoluta); doença arterial oclusiva significativa; insuficiência cardíaca não compensada; ABPI > 1,3 (vasos incompressíveis/calcificados — avaliação vascular especializada obrigatória).",
    nivelEvidencia: "forte",
    notasAplicacao: "Avaliação arterial (ABPI) é pré-requisito indispensável.",
    referencias: ["R10", "R11", "R12", "R13"],
  },
  {
    id: "compressao_reduzida",
    categoria: "terapia_compressiva",
    nome: "Compressão reduzida/modificada (15-25mmHg)",
    mecanismo: "Pressão externa graduada, reduzida por compromisso arterial parcial.",
    indicadoQuando: e(numerica("abpi", ">=", 0.5), numerica("abpi", "<=", 0.8)),
    contraindicadoQuando: [numerica("abpi", "<", 0.5)],
    indicadoQuandoTexto: "0,5 ≤ ABPI ≤ 0,8 → compressão reduzida/modificada (15-25mmHg).",
    contraindicadoQuandoTexto: "ABPI < 0,5 (contraindicação absoluta).",
    nivelEvidencia: "forte",
    notasAplicacao: "Avaliação arterial (ABPI) é pré-requisito indispensável.",
    referencias: ["R10", "R11", "R12", "R13"],
  },
  {
    id: "meias_compressao_pos_cicatrizacao",
    categoria: "terapia_compressiva",
    nome: "Meias de compressão graduada (pós-cicatrização)",
    mecanismo: "Prevenção de recorrência após cicatrização.",
    indicadoQuando: e(numerica("abpi", ">=", 0.5), numerica("abpi", "<=", 1.3)),
    contraindicadoQuando: [numerica("abpi", "<", 0.5)],
    indicadoQuandoTexto: "Pós-cicatrização → meias de compressão graduada.",
    contraindicadoQuandoTexto: "ABPI < 0,5 (contraindicação absoluta).",
    nivelEvidencia: "mista",
    notasAplicacao: "Prevenção de recorrência — ver nota de arquitetura sobre ligação ao teto de pontuação.",
    referencias: ["R10", "R11", "R12", "R13"],
  },
];

// ---------------------------------------------------------------------------
// 5. Terapia de pressão negativa (NPWT)
// ---------------------------------------------------------------------------

const pressaoNegativa: EntradaTratamento[] = [
  {
    id: "npwt",
    categoria: "pressao_negativa",
    nome: "Terapia de pressão negativa (NPWT/TPN)",
    mecanismo: "Pressão subatmosférica remove exsudado, aproxima bordos, promove granulação.",
    indicadoQuando: ou(
      contem("tipo_tecido_leito", "granulacao"),
      igual("exsudado.volume", "abundante"),
      igual("profundidade_estadiamento", "estadio_3"),
      igual("profundidade_estadiamento", "estadio_4"),
    ),
    contraindicadoQuando: [
      igual("etiologia", "oncologica_maligna"),
      contem("tipo_tecido_leito", "necrose_seca"),
      contem("tipo_tecido_leito", "necrose_humida"),
    ],
    indicadoQuandoTexto:
      "tipo_tecido_leito predominantemente granulação a promover (não para remoção de necrose extensa); exsudado.volume = abundante; profundidade_estadiamento em estadio_3/estadio_4 (adjunto precoce); fixação de enxertos; profilático sobre incisões cirúrgicas fechadas em alto risco.",
    contraindicadoQuandoTexto:
      "Osteomielite/infeção não tratada; etiologia = oncologica_maligna não tratada (risco teórico de estimulação tumoral); profundidade_estadiamento = estadio_4/espessura_total com estruturas vitais expostas sem proteção; tipo_tecido_leito com necrose não desbridada; fístulas não entéricas não exploradas; vascularização comprometida.",
    nivelEvidencia: "mista",
    notasAplicacao: "Requer profissional certificado; mudanças de penso 2-3x/semana.",
    notasNaoCodificadas: [
      "Osteomielite/infeção não tratada",
      "Estruturas vitais expostas sem proteção",
      "Fístulas não entéricas não exploradas",
      "Vascularização comprometida",
    ],
    referencias: ["R74", "R75", "R76", "R77"],
  },
];

// ---------------------------------------------------------------------------
// 6. Gestão de bordos problemáticos
// ---------------------------------------------------------------------------

const bordosProblematicos: EntradaTratamento[] = [
  {
    id: "nitrato_prata",
    categoria: "bordos_problematicos",
    nome: "Nitrato de prata",
    mecanismo: "Material cáustico — cauterização química, coagula tecido.",
    indicadoQuando: ou(
      contem("tipo_tecido_leito", "granulacao_hipergranulada"),
      contem("bordos", "enrolados_epibole"),
    ),
    contraindicadoQuando: [contem("pele_perilesional", "macerada")],
    indicadoQuandoTexto: "tipo_tecido_leito contém granulacao_hipergranulada; bordos contém enrolados_epibole; hemorragia ligeira a controlar.",
    contraindicadoQuandoTexto: "Feridas grandes (>2cm); pele_perilesional frágil ou macerada.",
    nivelEvidencia: "mista",
    notasAplicacao: "Doloroso; efeito hemostático simultâneo é vantagem.",
    notasNaoCodificadas: ["Feridas grandes (>2cm)", "Pele perilesional frágil"],
    referencias: ["R79", "R80", "R78"],
  },
  {
    id: "corticoide_topico",
    categoria: "bordos_problematicos",
    nome: "Corticoide tópico",
    mecanismo: "Reduz resposta inflamatória local, diminuindo tecido hipergranulado.",
    indicadoQuando: contem("tipo_tecido_leito", "granulacao_hipergranulada"),
    contraindicadoQuando: [
      igual("nivel_infecao", "infecao_local_overt"),
      igual("nivel_infecao", "infecao_propagacao_sistemica"),
    ],
    indicadoQuandoTexto: "tipo_tecido_leito contém granulacao_hipergranulada; preferência por método indolor.",
    contraindicadoQuandoTexto: "sinais_infecao.nivel_infecao em infecao_local_overt/infecao_propagacao_sistemica não tratada.",
    nivelEvidencia: "moderada",
    notasAplicacao: "Indolor, boa adesão.",
    referencias: ["R81", "R82", "R83"],
  },
  {
    id: "desbridamento_bordo",
    categoria: "bordos_problematicos",
    nome: "Desbridamento de bordo (epibole/fibrótico)",
    mecanismo: "Remoção física do bordo estagnado, reinicia migração epitelial.",
    indicadoQuando: ou(
      contem("bordos", "enrolados_epibole"),
      contem("bordos", "fibroticos"),
    ),
    contraindicadoQuando: [],
    indicadoQuandoTexto: "bordos contém enrolados_epibole ou fibroticos sem resposta a medidas menos invasivas.",
    contraindicadoQuandoTexto: "Mesmas contraindicações gerais do desbridamento cirúrgico.",
    nivelEvidencia: "moderada",
    notasAplicacao: "Frequentemente combinado com nitrato de prata/corticoide como adjuvante.",
    referencias: ["R61"],
  },
];

// ---------------------------------------------------------------------------
// 7. Cuidados paliativos específicos (oncologica_maligna)
// ---------------------------------------------------------------------------
// Estes tratamentos alimentam a pontuação proporcional por dimensão
// (secção 3.3), avaliada separadamente em algoritmo/oncologico.ts — mas
// mantêm-se aqui também como entradas de catálogo consultáveis.

const paliativosOncologicos: EntradaTratamento[] = [
  {
    id: "paliativo_odor",
    categoria: "paliativos_oncologicos",
    nome: "Gestão de odor (metronidazol tópico / carvão ativado)",
    mecanismo: "Metronidazol atua sobre componente anaeróbia; carvão ativado por adsorção física.",
    indicadoQuando: sempre(),
    contraindicadoQuando: [],
    indicadoQuandoTexto: "sinais_infecao.odor = moderado/forte.",
    contraindicadoQuandoTexto: "Hipersensibilidade ao metronidazol.",
    nivelEvidencia: "limitada",
    notasAplicacao: "Melhoria em 2-3 dias, uso até 2 semanas.",
    notasNaoCodificadas: [
      "Aplicabilidade real usa sinais_infecao.odor >= ligeiro — avaliada em algoritmo/oncologico.ts, não pela DSL de indicadoQuando (a DSL não modela thresholds de odor diretamente; ver assunção).",
      "Hipersensibilidade ao metronidazol",
    ],
    referencias: ["R33", "R34", "R35"],
  },
  {
    id: "paliativo_hemorragia",
    categoria: "paliativos_oncologicos",
    nome: "Gestão de hemorragia (agente hemostático / nitrato de prata)",
    mecanismo: "Agentes hemostáticos tópicos promovem coagulação local.",
    indicadoQuando: contem("exsudado.tipo", "sanguinolento"),
    contraindicadoQuando: [],
    indicadoQuandoTexto: "exsudado.tipo contém sanguinolento persistente.",
    contraindicadoQuandoTexto: "Hemorragia significativa/ativa — exige articulação com especialidade de feridas/oncologia.",
    nivelEvidencia: "limitada",
    notasAplicacao: "Nitrato de prata (categoria 6) é opção para hemorragias ligeiras pontuais.",
    notasNaoCodificadas: ["Hemorragia significativa/ativa exige articulação com especialidade"],
    referencias: ["R37", "R36"],
  },
];

// ---------------------------------------------------------------------------
// 8. Limpeza e irrigação
// ---------------------------------------------------------------------------

const limpezaIrrigacao: EntradaTratamento[] = [
  {
    id: "soro_fisiologico",
    categoria: "limpeza_irrigacao",
    nome: "Soro fisiológico (irrigação padrão)",
    mecanismo: "Remoção física de detritos e contaminantes de superfície.",
    // Passo sempre presente, independente das restantes variáveis — ver Fase 3, categoria 8.
    indicadoQuando: sempre(),
    contraindicadoQuando: [],
    indicadoQuandoTexto:
      "Aplicável a qualquer ferida antes de qualquer outro tratamento — passo de preparação do leito, não uma escolha condicional às restantes variáveis.",
    contraindicadoQuandoTexto: "Sem contraindicações relevantes.",
    nivelEvidencia: "forte",
    notasAplicacao: "Passo obrigatório antes de aplicar qualquer penso — sempre presente, não é alternativa às restantes categorias.",
    referencias: [],
  },
  {
    id: "antisseptico_limpeza",
    categoria: "limpeza_irrigacao",
    nome: "Antisséticos de limpeza (PHMB em solução, hipoclorito de nova geração)",
    mecanismo: "Redução de carga microbiana de superfície antes do penso definitivo.",
    indicadoQuando: diferente("nivel_infecao", "sem_sinais"),
    contraindicadoQuando: [],
    indicadoQuandoTexto: "sinais_infecao.nivel_infecao ≠ sem_sinais, como preparação antes do penso antimicrobiano.",
    contraindicadoQuandoTexto:
      "Feridas limpas sem sinais de infeção (uso rotineiro não recomendado); agentes antigos como água oxigenada/hipoclorito clássico (EUSOL) desaconselhados pelo risco de dano tecidual.",
    nivelEvidencia: "moderada",
    notasAplicacao: "Preparação, não permanece na ferida.",
    referencias: ["R57", "R58"],
  },
];

// ---------------------------------------------------------------------------
// 9. Interfaces não aderentes (silicone)
// ---------------------------------------------------------------------------

const interfacesSilicone: EntradaTratamento[] = [
  {
    id: "interface_silicone",
    categoria: "interfaces_silicone",
    nome: "Interface/malha de silicone",
    mecanismo: "Camada de contacto não aderente, reduz trauma e dor na remoção.",
    indicadoQuando: ou(
      contem("pele_perilesional", "seca_descamativa"),
      numerica("dor", ">=", 7),
      contem("tipo_tecido_leito", "epitelizacao"),
    ),
    contraindicadoQuando: [],
    indicadoQuandoTexto:
      "pele_perilesional frágil/seca_descamativa; dor elevada associada à mudança de penso; feridas com tipo_tecido_leito em fase de epitelização (proteção do tecido novo).",
    contraindicadoQuandoTexto: "exsudado.volume = abundante sem penso secundário absorvente associado.",
    nivelEvidencia: "moderada",
    notasAplicacao: "Usada em conjunto com — não em substituição de — um penso absorvente das categorias 2/3.",
    notasNaoCodificadas: [
      "Contraindicado se exsudado abundante sem penso secundário absorvente associado — não codificável a partir do caso isolado, depende da combinação de resposta escolhida",
      "Threshold de 'dor elevada' fixado em dor >= 7 (escala 0-10) — validado por Rodrigo em 2026-09-12",
    ],
    referencias: ["R67"],
  },
];

export const TODOS_TRATAMENTOS: EntradaTratamento[] = [
  ...desbridamento,
  ...pensosHumidade,
  ...antimicrobianos,
  ...terapiaCompressiva,
  ...pressaoNegativa,
  ...bordosProblematicos,
  ...paliativosOncologicos,
  ...limpezaIrrigacao,
  ...interfacesSilicone,
];
