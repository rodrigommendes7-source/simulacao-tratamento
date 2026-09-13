/**
 * Conteúdo da secção "Aprender" — manual de estudo com 3 eixos de navegação
 * cruzada (tema clínico / tratamento / etiologia). Todo o conteúdo é
 * extraído e reestruturado dos documentos de projeto já validados — nenhuma
 * afirmação clínica nova é introduzida aqui:
 *
 * - Eixo "tema_clinico": fase2-conteudo-clinico-evidencia.md, secções 2-7.
 * - Eixo "etiologia": fase2-conteudo-clinico-evidencia.md, secção 1.
 * - Eixo "tratamento" (categorias): fase3-base-dados-tratamentos.md
 *   (mecanismo/indicado/contraindicado/evidência das secções 1-9; apósitos
 *   exemplo da secção 10).
 * - Eixo "tratamento" (técnicas): tecnicas-aplicacao.md.
 *
 * "Erros frequentes" são derivados do banco de justificações
 * (dados/bancoJustificacoes.ts / banco-justificacoes.md): cada distrator do
 * banco anota explicitamente a que categoria/técnica a razão errada
 * pertence de facto — essa anotação é a fonte de cada entrada abaixo,
 * colocada na página da categoria/técnica a que a razão realmente pertence
 * (não na página onde aparece como opção errada). Distratores sem
 * atribuição explícita a outra categoria ficam como nota de mal-entendido
 * na própria página onde aparecem.
 */
import type { PaginaAprender } from "../tipos/aprender";

export const PAGINAS_APRENDER: PaginaAprender[] = [
  // ───────────────────────── Eixo: Tema clínico ─────────────────────────
  {
    id: "tema-tecido-leito",
    eixo: "tema_clinico",
    titulo: "Tecido do leito da ferida",
    resumo:
      "O tipo de tecido no leito indica se a cicatrização está a progredir (granulação, epitelização) ou bloqueada por tecido desvitalizado (esfacelo, necrose) — a variável mais diretamente ligada à escolha de desbridamento.",
    detalheClinico:
      "Granulação — tecido saudável, vermelho/rosa, aspeto empedrado; sinal positivo de cicatrização em curso, mas granulação vermelha escura que sangra facilmente pode indicar infeção. Tratamento: proteção e humidade adequada, sem intervenção agressiva.\n\n" +
      "Granulação hipergranulada — sobreprodução de tecido de granulação acima do nível da pele, friável, sangra com facilidade; é também um sinal covert do continuum IWII de infeção. Causas: excesso de humidade, fricção, oclusão, irritação crónica/agente cáustico, ou patogénio aeróbio. Impede migração epitelial e deposição de colagénio. Tratamento: identificar e tratar a causa subjacente — corticoides tópicos, nitrato de prata, ou excisão em casos persistentes.\n\n" +
      "Epitelização — cobertura da superfície por novo tecido epitelial sobre base de granulação saudável; fase final da cicatrização. Tratamento: proteção e hidratação; intervenção agressiva é contraproducente.\n\n" +
      "Esfacelo — tecido desvitalizado, amarelo/esbranquiçado, solto ou fibroso/aderente; indicador de inflamação em curso, a cicatrização não progride sem remoção/controlo. Geralmente requer desbridamento (nota diferencial: tecido adiposo pode ser confundido com esfacelo).\n\n" +
      "Necrose seca — tecido morto, preto/castanho, seco e endurecido (escara); \"escara estável\" é seca, firme, sem drenagem/edema/eritema/flutuação. Geralmente requer remoção — mas escara seca estável em isquemia arterial ou no calcanhar pode, em certos contextos, não dever ser desbridada até resolução vascular prévia (nota informativa, não bloqueia o desbridamento automaticamente no algoritmo).\n\n" +
      "Necrose húmida — tecido necrótico não seco, maior carga bacteriana que a necrose seca; sinal de alerta mais urgente. Geralmente requer desbridamento, com maior urgência.",
    errosFrequentes: [
      { texto: "Erro comum: tratar 'osso/tendão exposto' como um valor de tipo_tecido_leito — corresponde a profundidade_estadiamento (estadio_4 em pressão, ou espessura_total com exposição óssea/tendinosa explícita nas outras etiologias), nunca a um valor de tecido." },
      { texto: "Nota informativa (não é regra automática no algoritmo): escara seca estável em isquemia arterial/calcanhar pode, em certos contextos, não dever ser desbridada até avaliação vascular prévia." },
    ],
    relacionados: ["tr-desbridamento", "tr-bordos-problematicos", "tr-pensos-humidade", "etio-pressao", "etio-venosa", "tema-localizacao-profundidade-dimensoes"],
    casosRelacionados: ["caso_1_lesao_pressao", "caso_4_ulcera_venosa_maleolo"],
    referencias: ["R38", "R39", "R40", "R41", "R42", "R43"],
  },
  {
    id: "tema-exsudado",
    eixo: "tema_clinico",
    titulo: "Exsudado",
    resumo:
      "O volume e o tipo de exsudado orientam a escolha do penso e funcionam também como sinal de alerta: um aumento súbito do volume pode indicar infeção ou fístula.",
    detalheClinico:
      "Volume — escasso é normal na fase inflamatória/proliferativa inicial, não é por si só sinal de alarme; moderado está dentro do espectro esperado em cicatrização ativa e exige monitorização; abundante, sobretudo se for um aumento súbito, é sinal de alarme e pode indicar infeção ou fístula/sinus.\n\n" +
      "Tipo — seroso é fluido claro e aquoso, normal durante a cicatrização; sanguinolento é sangue fresco, normal na fase inflamatória mas fora dessa fase pode indicar traumatismo do leito (relevância particular em etiologia oncológica maligna); purulento é fluido espesso e opaco, sinal clássico de infeção bacteriana (sinal overt do continuum IWII).\n\n" +
      "Combinações — seroso + sanguinolento é a combinação mais comum e não é, por si só, sinal de infeção; a presença de purulento combinado com qualquer outro componente mantém o significado de alerta infecioso. Todas as 7 combinações não-vazias de seroso/sanguinolento/purulento são representáveis, sem nomes compostos próprios como \"serossanguinolento\".",
    errosFrequentes: [
      { texto: "Erro comum: assumir que exsudado abundante + purulento determina, por si só, o nível de infeção — a derivação de nivel_infecao usa especificamente os sinais definidos em sinais_infecao, com exsudado.tipo=purulento apenas como referência cruzada ao sinal overt." },
      { texto: "Erro comum: procurar um valor único como \"serossanguinolento\" — o sistema representa combinações de seroso/sanguinolento/purulento como conjunto, sem nomes compostos." },
    ],
    relacionados: ["tr-pensos-humidade", "tema-sinais-infecao", "tr-antimicrobianos", "tr-paliativos-oncologicos"],
    casosRelacionados: ["caso_2_deiscencia_cirurgica", "caso_5_ulcera_venosa_perna"],
    referencias: ["R44", "R45", "R46", "R47"],
  },
  {
    id: "tema-sinais-infecao",
    eixo: "tema_clinico",
    titulo: "Sinais de infeção (continuum IWII)",
    resumo:
      "O simulador usa o continuum de infeção do IWII (2022) — sinais covert (subtis) e overt (clássicos) dentro de \"infeção local\", seguidos de propagação sistémica — em vez do modelo antigo de \"colonização crítica\".",
    detalheClinico:
      "Sinais covert (subtis): dor aumentada, tecido friável, odor, atraso de cicatrização, hipergranulação (referência cruzada a tipo_tecido_leito), quebra de ferida nova.\n\n" +
      "Sinais overt (clássicos): eritema, calor local, edema local, exsudado purulento (referência cruzada a exsudado.tipo).\n\n" +
      "Sinais de propagação/infeção sistémica: celulite, linfangite, abcesso, febre, leucocitose.\n\n" +
      "nivel_infecao é derivado automaticamente em 4 valores (sem_sinais, infecao_local_covert, infecao_local_overt, infecao_propagacao_sistemica). Toxinas bacterianas comprometem a deposição de colagénio e as proteases degradam a matriz extracelular mais rapidamente do que é sintetizada, impedindo a progressão para a fase proliferativa.\n\n" +
      "Limitação a registar: sinais clínicos visuais podem refletir infeção já bem estabelecida, podem estar ausentes/atípicos em doentes com diabetes ou doenças autoimunes, e o eritema pode estar mascarado em pele mais escura.",
    errosFrequentes: [
      { texto: "Erro comum: aplicar a regra antiga do NERDS/STONEES (\"≥3 sinais = colonização crítica\") — esse modelo foi substituído pelo continuum IWII, que não usa esse limiar de contagem discreto." },
      { texto: "Erro comum: avaliar sinais de infeção sem considerar que o eritema pode estar mascarado em pele mais escura, ou que os sinais podem estar atípicos/ausentes em doentes com diabetes ou doenças autoimunes." },
    ],
    relacionados: ["tr-antimicrobianos", "tr-limpeza-irrigacao", "tema-tecido-leito", "tema-exsudado"],
    casosRelacionados: ["caso_5_ulcera_venosa_perna"],
    referencias: ["R57", "R58", "R59", "R60"],
  },
  {
    id: "tema-bordos",
    eixo: "tema_clinico",
    titulo: "Bordos da ferida",
    resumo:
      "O tipo de bordo é um dos preditores mais fortes da trajetória de cicatrização — bordos aderentes e planos são o sinal mais favorável, bordos enrolados (epíbole) o sinal de alarme mais marcante.",
    detalheClinico:
      "Aderentes/planos — bordo fixo ao leito, sem paredes nem degrau; um dos preditores mais fortes de boa trajetória de cicatrização.\n\n" +
      "Não aderentes/solto — existem paredes/degraus, base mais profunda que o bordo; sinal a monitorizar, pode preceder underminação.\n\n" +
      "Enrolados (epíbole) — bordos enrolados/curvados para dentro; células epidérmicas migram para baixo sobre as inferiores em vez de atravessar a ferida (inibição de contacto); sinal de alarme major, cicatrização estagnada, frequentemente exige desbridamento do bordo.\n\n" +
      "Socavados/underminados — espaço/túnel sob o bordo intacto, detetável por palpação; informa decisões de preenchimento de espaço morto (usa-se dimensoes.profundidade_cm quando relevante).\n\n" +
      "Hiperqueratósicos — tecido tipo calo à volta do bordo, impede avanço epitelial, associado a pressão mecânica repetida (pé diabético neuropático).\n\n" +
      "Fibróticos — bordo duro, rígido, cicatricial; sinal de estagnação em feridas crónicas de longa duração.",
    errosFrequentes: [
      { texto: "Erro comum: tratar \"socavados/underminados\" como se tivesse um valor de profundidade próprio — a profundidade do socavamento usa-se via dimensoes.profundidade_cm, nunca como campo próprio de bordos." },
      { texto: "Decisão de modelo: não se modela tunelização/fistulização nem medidas de localização horária como estrutura própria — socavados_underminados fica como valor categórico simples." },
    ],
    relacionados: ["tr-bordos-problematicos", "tr-desbridamento", "tema-tecido-leito", "etio-pe-diabetico-neuropatico"],
    referencias: ["R48", "R49", "R50"],
  },
  {
    id: "tema-pele-perilesional",
    eixo: "tema_clinico",
    titulo: "Pele perilesional",
    resumo:
      "A pele à volta da ferida tem tanto valor de diagnóstico como o leito — maceração, hiperpigmentação ou calo apontam para causas e cuidados específicos.",
    detalheClinico:
      "Íntegra — sem sinais de dano; favorável (é um valor normal da lista, não \"ausência de achados\").\n\n" +
      "Macerada — enrugamento/degradação por exposição prolongada a humidade (excesso de exsudado, penso inadequado, imobilidade/incontinência); afeta negativamente a cicatrização, a dor e a qualidade de vida — o tratamento passa por reduzir a humidade excessiva.\n\n" +
      "Seca/descamativa — pele frágil, mais suscetível a lesões secundárias (MARSI).\n\n" +
      "Eczematizada — dermatite associada à humidade perilesional continuada não controlada.\n\n" +
      "Hiperpigmentada — alteração de pigmentação pós-inflamatória, fortemente associada à etiologia venosa; nota crítica: lesões que aparecem vermelhas/castanhas em pele clara podem aparecer pretas/púrpuras em pele escura, com implicação direta na fiabilidade desta variável e de sinais_infecao.eritema.\n\n" +
      "Induração/lipodermatosclerose — endurecimento do tecido subcutâneo, característico de insuficiência venosa crónica.\n\n" +
      "Calo/hiperqueratose — espessamento da epiderme associado a pressão mecânica repetida (pé diabético neuropático).",
    errosFrequentes: [
      { texto: "Erro comum (pendência ainda sem validação de formulário): selecionar \"íntegra\" em simultâneo com outros valores — são contraditórios." },
    ],
    relacionados: ["tr-interfaces-silicone", "etio-venosa", "etio-pe-diabetico-neuropatico", "tema-sinais-infecao"],
    referencias: ["R51", "R52", "R53", "R54"],
  },
  {
    id: "tema-localizacao-profundidade-dimensoes",
    eixo: "tema_clinico",
    titulo: "Localização, profundidade/estadiamento e dimensões",
    resumo:
      "Sobretudo variáveis de contexto e prognóstico — não são, por si só, critério de indicação de tratamento, mas moldam fortemente a etiologia mais provável.",
    detalheClinico:
      "Localização anatómica não tem fisiopatologia própria — o seu significado está nas associações etiologia-localização (ex.: maléolo medial/terço distal da perna → venosa; planta do pé/dedos → pé diabético neuropático; sacro/ísquio/trocânter/calcâneo → pressão).\n\n" +
      "Profundidade/estadiamento: em etiologia pressão usa-se obrigatoriamente a escala NPIAP — estádio 1 (eritema não branqueável em pele intacta, pode não branquear visivelmente em pele escura), estádio 2 (perda de espessura parcial com derme exposta), estádio 3 (perda de espessura total, tecido adiposo pode estar visível), estádio 4 (perda de espessura total com fáscia/músculo/tendão/osso expostos ou palpáveis), não classificável (perda de espessura total obscurecida por esfacelo/escara — exceção clínica: escara estável no calcanhar ou membro isquémico não deve ser amolecida ou removida sem avaliação vascular prévia), lesão de tecidos profundos suspeita (descoloração não branqueável persistente, deteção mais difícil em pele escura). Nas restantes etiologias usa-se a escala genérica superficial/espessura parcial/espessura total; quando a fonte de um caso não menciona profundidade explicitamente, assume-se superficial.\n\n" +
      "Dimensões (comprimento, largura, profundidade opcional, área calculada automaticamente) têm valor prognóstico direto — feridas maiores associam-se a tempos de cicatrização mais longos — e a medição repetida ao longo do tempo tem mais valor do que um valor único.\n\n" +
      "Dor usa escala 0-10, padrão transversal a todas as guidelines revistas, e é distinta de sinais_infecao.dor_aumentada (sinal covert de infeção).\n\n" +
      "Tempo de evolução classifica-se como aguda (<6 semanas) ou crónica (≥6 semanas) e alimenta diretamente sinais_infecao.atraso_cicatrizacao.",
    errosFrequentes: [
      { texto: "Erro comum: tratar \"osso/tendão exposto\" como um valor de tipo_tecido_leito — corresponde a profundidade_estadiamento, nunca a um valor de tecido." },
      { texto: "Erro comum: confundir a dor basal da ferida (0-10) com sinais_infecao.dor_aumentada — são variáveis distintas." },
    ],
    relacionados: ["etio-pressao", "tema-tecido-leito", "etio-venosa"],
    casosRelacionados: ["caso_1_lesao_pressao"],
    referencias: ["R14", "R55", "R56"],
  },

  // ───────────────────────────── Eixo: Etiologia ─────────────────────────────
  {
    id: "etio-venosa",
    eixo: "etiologia",
    titulo: "Úlcera venosa",
    resumo:
      "Hipertensão venosa crónica leva a feridas na região do maléolo medial, com hiperpigmentação e exsudado moderado a abundante — a compressão é o tratamento de maior impacto.",
    detalheClinico:
      "Fisiopatologia: hipertensão venosa crónica por disfunção valvular, obstrução ao retorno venoso ou falência da bomba muscular da perna; a pressão mantida gera inflamação e extravasamento de mediadores inflamatórios para o interstício.\n\n" +
      "Apresentação típica: feridas superficiais e irregulares na região do \"gaiter\" medial (terço distal da perna, acima do maléolo), com edema, hiperpigmentação, dermatite de estase e lipodermatosclerose; dor ligeira-moderada que alivia com elevação do membro (diferencial-chave vs. arterial).\n\n" +
      "Achados esperados: localização maléolo medial ou terço distal da perna; pele perilesional com hiperpigmentação, induração/lipodermatosclerose, frequentemente macerada; exsudado moderado/abundante, seroso; tecido do leito variável, de granulação a esfacelo; dor baixa-moderada que alivia à elevação.",
    quandoIndicado:
      "Princípios de tratamento da causa: terapia de compressão como primeira linha, precedida de exclusão de doença arterial significativa (ABPI). Teto de pontuação: aplica-se sem compressão documentada + avaliação arterial prévia.",
    errosFrequentes: [
      { texto: "Erro comum: aplicar compressão sem excluir doença arterial (ABPI) — a avaliação arterial prévia é pré-requisito indispensável, não opcional." },
    ],
    relacionados: ["tc-terapia-compressiva", "tema-pele-perilesional", "tr-pensos-humidade", "tema-tecido-leito"],
    casosRelacionados: ["caso_4_ulcera_venosa_maleolo", "caso_5_ulcera_venosa_perna"],
    referencias: ["R01", "R02", "R03"],
  },
  {
    id: "etio-arterial",
    eixo: "etiologia",
    titulo: "Úlcera arterial",
    resumo:
      "Doença arterial periférica reduz a perfusão e causa isquemia — dor intensa que agrava com a elevação é o sinal diferencial-chave face à etiologia venosa.",
    detalheClinico:
      "Fisiopatologia: doença arterial periférica — estreitamento do lúmen vascular, mais frequentemente aterosclerótico — reduz o fluxo e causa isquemia tecidual; fatores de risco: tabagismo, diabetes, idade, hipertensão.\n\n" +
      "Apresentação típica: feridas \"em saca-bocado\" (punched-out), bordos bem definidos, pulsos diminuídos/ausentes, pele fria, descolorida, sem pelos, unhas espessadas; dor intensa que agrava com elevação e alivia com o membro pendente (inverso da venosa); claudicação intermitente e dor em repouso associadas.\n\n" +
      "Achados esperados: localização dedos do pé ou maléolo lateral; pele perilesional seca/descamativa, sem hiperpigmentação (diferencial vs. venosa); exsudado escasso; tecido do leito com tendência a necrose seca/húmida, leitos pouco granulados; dor elevada que agrava à elevação.",
    quandoIndicado:
      "Princípios de tratamento da causa: avaliação/referenciação vascular antes de qualquer intervenção local agressiva; compressão pode estar contraindicada se isquemia significativa. Teto: aplica-se sem referenciação vascular/avaliação de perfusão.",
    errosFrequentes: [
      { texto: "Erro comum: assumir hiperpigmentação como sinal desta etiologia — a ausência de hiperpigmentação é precisamente o diferencial que a distingue da etiologia venosa." },
    ],
    relacionados: ["etio-mista-arteriovenosa", "tc-terapia-compressiva", "tema-bordos"],
    referencias: ["R04", "R08", "R09"],
  },
  {
    id: "etio-mista-arteriovenosa",
    eixo: "etiologia",
    titulo: "Úlcera mista arteriovenosa",
    resumo:
      "Coexistência de doença arterial periférica e insuficiência venosa crónica no mesmo membro — pode afetar até cerca de um quarto dos doentes com úlceras dos membros inferiores.",
    detalheClinico:
      "Fisiopatologia: coexistência de doença arterial periférica e insuficiência venosa crónica no mesmo membro.\n\n" +
      "Apresentação típica: combina sinais de ambas — hiperpigmentação/edema venoso com extremidades frias, pele lisa/rígida, enchimento capilar diminuído, pulsos fracos/ausentes; doentes mais idosos, mais comorbilidades, história de tabagismo; dor muito prevalente.\n\n" +
      "Achados esperados: mistura de padrões venoso e arterial — não se resume a um padrão \"puro\" de nenhuma das duas etiologias isoladas.",
    quandoIndicado:
      "Princípios de tratamento da causa: confirmação objetiva da componente arterial (ABPI, geralmente <0,9) antes de decidir sobre compressão. Compressão contraindicada se ABPI <0,5 (valor único fixado no projeto) ou pressão absoluta do tornozelo <60mmHg — compressão pneumática intermitente como alternativa. Teto: mesmo critério da arterial (referenciação vascular/avaliação de perfusão).",
    errosFrequentes: [],
    relacionados: ["etio-venosa", "etio-arterial", "tc-terapia-compressiva"],
    referencias: ["R05", "R06", "R03", "R07"],
  },
  {
    id: "etio-pressao",
    eixo: "etiologia",
    titulo: "Lesão por pressão",
    resumo:
      "Lesão localizada sobre proeminências ósseas por pressão isolada ou combinada com fricção/cisalhamento — o alívio de pressão é a intervenção fundamental.",
    detalheClinico:
      "Fisiopatologia: lesão localizada da pele/tecidos subjacentes sobre proeminências ósseas, por pressão isolada ou combinada com fricção/cisalhamento; combina forças mecânicas, isquemia e hipoxia; tecido muscular mais vulnerável que a pele; relação inversa entre pressão e tempo até ulceração.\n\n" +
      "Apresentação típica: localiza-se sobre proeminências ósseas — sacro, ísquio, trocânter, calcâneo; fatores de risco: imobilidade, défice nutricional/hipoalbuminemia, incontinência, défice cognitivo, diabetes, insuficiência vascular, humidade prolongada; prevalente em idosos, doentes críticos, lesados vertebro-medulares.\n\n" +
      "Achados esperados: localização sacro/ísquio/trocânter/calcâneo; profundidade_estadiamento usa obrigatoriamente a escala NPIAP; bordos socavados/underminados em estádios avançados; quando o leito está obscurecido por esfacelo/necrose ao ponto de não se conseguir avaliar a profundidade real, profundidade_estadiamento = não classificável.",
    quandoIndicado:
      "Princípios de tratamento da causa: alívio de pressão (reposicionamento, superfícies de redistribuição) é a intervenção fundamental. Teto: aplica-se sem alívio de pressão documentado.",
    errosFrequentes: [],
    relacionados: ["tema-localizacao-profundidade-dimensoes", "tr-desbridamento", "tema-tecido-leito"],
    casosRelacionados: ["caso_1_lesao_pressao"],
    referencias: ["R14", "R15", "R16"],
  },
  {
    id: "etio-pe-diabetico-neuropatico",
    eixo: "etiologia",
    titulo: "Pé diabético neuropático",
    resumo:
      "Trauma mecânico repetido em zonas de pressão plantar elevada, num pé sem sensibilidade protetora por neuropatia — a ferida é classicamente indolor.",
    detalheClinico:
      "Fisiopatologia: trauma mecânico repetido em zonas de pressão plantar elevada, num pé com perda de sensibilidade protetora por neuropatia periférica diabética; sem perceção de dor/pressão, o trauma persiste e perpetua-se.\n\n" +
      "Apresentação típica: sinais de neuropatia — perda de sensibilidade vibratória/postural, perda de reflexos tendinosos (aquiliano), calo excessivo sobre pontos de pressão, pé em garra, atrofia muscular; teste do monofilamento 10g para rastreio; ferida classicamente indolor — dor desproporcional sugere infeção profunda ou isquemia sobreposta.\n\n" +
      "Achados esperados: localização planta do pé ou dedos (zonas de maior pressão plantar); pele perilesional com calo/hiperqueratose; dor baixa/ausente mesmo em feridas profundas; risco de infeção subclínica — sinais covert mais difíceis de detetar pela perda de sensibilidade.",
    quandoIndicado:
      "Princípios de tratamento da causa: offloading (descarga de pressão plantar) é a intervenção mais importante — dispositivo não-removível knee-high (TCC ou walker tornado irremovível) é primeira linha; controlo glicémico referenciado como segundo pilar. Teto: aplica-se sem descarga + controlo glicémico referenciado.",
    errosFrequentes: [
      { texto: "Erro comum: interpretar dor baixa/ausente como sinal de que a ferida está bem — nesta etiologia é esperado pela neuropatia; dor desproporcional é que deve alertar para infeção profunda ou isquemia sobreposta." },
    ],
    relacionados: ["etio-pe-diabetico-neuroisquemico", "tema-pele-perilesional", "tema-bordos"],
    casosRelacionados: ["caso_3_ulcera_diabetica"],
    referencias: ["R17", "R18", "R19"],
  },
  {
    id: "etio-pe-diabetico-neuroisquemico",
    eixo: "etiologia",
    titulo: "Pé diabético neuroisquémico",
    resumo:
      "Combina neuropatia periférica e doença arterial periférica — atualmente o subtipo mais comum de úlcera do pé diabético, ultrapassando a forma puramente neuropática.",
    detalheClinico:
      "Fisiopatologia: combina neuropatia periférica e doença arterial periférica concomitante; subtipo mais comum de úlcera do pé diabético atualmente (~metade dos casos).\n\n" +
      "Apresentação típica: lesões irregulares, leito pálido/necrótico, podendo evoluir para gangrena; pode ocorrer em superfícies dorsais dos dedos. Ponto crítico de diagnóstico diferencial: neuropatia autonómica associada causa frequentemente calcificação da média arterial (esclerose de Mönckeberg), elevando artificialmente o ABI — teste pouco fiável aqui; onda trifásica ao Doppler portátil é evidência mais forte de ausência de doença arterial.\n\n" +
      "Achados esperados: dor pode estar mascarada pela componente neuropática mesmo com isquemia significativa; tecido do leito com maior tendência para necrose vs. neuropática pura; risco combinado de infeção elevado.",
    quandoIndicado:
      "Princípios de tratamento da causa: avaliação de perfusão arterial (não confiar só no ABI) + descarga de pressão, com maior cautela — tratar infeção/isquemia moderada-grave antes ou junto com offloading. Teto: mesmo critério da neuropática (descarga + controlo glicémico referenciado), com avaliação vascular obrigatória adicional.",
    errosFrequentes: [
      { texto: "Erro comum: confiar no ABI isolado nesta etiologia — a calcificação da média arterial (esclerose de Mönckeberg) eleva artificialmente o valor; a onda trifásica ao Doppler portátil é evidência mais forte de ausência de doença arterial." },
    ],
    relacionados: ["etio-pe-diabetico-neuropatico", "etio-arterial"],
    referencias: ["R20", "R21", "R22"],
  },
  {
    id: "etio-cirurgica",
    eixo: "etiologia",
    titulo: "Ferida cirúrgica",
    resumo:
      "Ferida planeada por incisão cirúrgica; a complicação principal é a deiscência, mais comum nos primeiros 10 dias pós-operatórios.",
    detalheClinico:
      "Fisiopatologia: ferida planeada por incisão cirúrgica, margens lineares/regulares; maioria cicatriza por primeira intenção.\n\n" +
      "Apresentação típica: ferida linear, bordos aproximados se não complicada; complicação principal é a deiscência (reabertura), mais comum nos primeiros 10 dias pós-operatórios, parcial ou completa; infeção do local cirúrgico é a causa mais frequente de deiscência.\n\n" +
      "Achados esperados: bordos não aderentes/solto se deiscência parcial; sinais_infecao é variável crítica de vigilância — quebra_ferida_nova (covert) é sinal precoce de deiscência iminente; tempo_evolucao classifica-se como aguda na apresentação inicial.",
    quandoIndicado:
      "Princípios de tratamento da causa: sem teto de pontuação — a causa (ato cirúrgico) já está resolvida; foco na gestão da complicação, não na remoção de causa subjacente contínua.",
    errosFrequentes: [],
    relacionados: ["tema-sinais-infecao", "tr-limpeza-irrigacao"],
    casosRelacionados: ["caso_2_deiscencia_cirurgica"],
    referencias: ["R23", "R24", "R25"],
  },
  {
    id: "etio-traumatica",
    eixo: "etiologia",
    titulo: "Ferida traumática",
    resumo:
      "Lesão mecânica externa aguda e não planeada, com padrão de leito/bordos que varia conforme o mecanismo — abrasão, laceração, avulsão, punctura, mordedura ou queimadura.",
    detalheClinico:
      "Fisiopatologia: lesão mecânica externa aguda, não planeada; segue padrão de cicatrização de ferida aguda (hemostase, inflamação, granulação, remodelação).\n\n" +
      "Apresentação típica: espectro de mecanismos — abrasão, laceração, avulsão, punctura, mordedura, queimadura — cada um com padrão de leito/bordos distinto; suscetibilidade elevada a infeção por contaminação inicial.\n\n" +
      "Achados esperados: bordos variam com o mecanismo (irregulares em lacerações); risco de infeção de base mais elevado que cirúrgica limpa; tempo_evolucao classifica-se como aguda na apresentação, cicatrização normal em 6-8 semanas sem complicação.",
    quandoIndicado: "Princípios de tratamento da causa: sem teto de pontuação — evento já ocorreu, não é causa ativa contínua.",
    errosFrequentes: [],
    relacionados: ["tema-sinais-infecao", "tr-limpeza-irrigacao"],
    referencias: ["R26", "R27", "R28"],
  },
  {
    id: "etio-oncologica-maligna",
    eixo: "etiologia",
    titulo: "Ferida oncológica maligna",
    resumo:
      "Proliferação/infiltração de células tumorais na pele — o objetivo deixa de ser a cicatrização e passa a ser controlo sintomático (odor, exsudado, dor, hemorragia) e dignidade.",
    detalheClinico:
      "Fisiopatologia: proliferação/infiltração de células tumorais na pele e tecidos subjacentes; ferida crónica secundária, baixa/nula probabilidade de cicatrização completa no contexto de doença avançada.\n\n" +
      "Apresentação típica: odor (colonização/necrose), exsudado abundante, hemorragia fácil, dor multifatorial, prurido, maceração perilesional; impacto psicossocial significativo.\n\n" +
      "Achados esperados: exsudado abundante, tipo frequentemente sanguinolento; sinais_infecao.odor moderado/forte é sintoma central de gestão paliativa; tecido do leito irregular, misto, friável; dor multifatorial, frequentemente elevada; a distinção colonização esperada vs. infeção significativa é difícil, o continuum IWII pode não se aplicar da mesma forma.",
    quandoIndicado:
      "Princípios de tratamento — nota especial: o objetivo passa a ser controlo sintomático, conforto e dignidade, não cicatrização. O teto de pontuação convencional não se aplica — critério próprio focado em qualidade do controlo sintomático (odor, exsudado, dor, hemorragia). NPWT é contraindicação relativa nesta etiologia não tratada (risco teórico de estimulação tumoral).",
    errosFrequentes: [
      { texto: "Erro comum: aplicar o teto de pontuação convencional (causa não tratada) a esta etiologia — tem um critério de pontuação próprio, focado em controlo sintomático, não em \"tratar a causa\"." },
      { texto: "Erro comum: considerar terapia de pressão negativa nesta etiologia sem a tratar previamente — é contraindicação relativa pelo risco teórico de estimulação tumoral." },
    ],
    relacionados: ["tr-paliativos-oncologicos", "tema-exsudado", "tema-sinais-infecao"],
    referencias: ["R29", "R30", "R31", "R32"],
  },

  // ─────────────────────── Eixo: Tratamento (categorias) ───────────────────────
  {
    id: "tr-desbridamento",
    eixo: "tratamento",
    titulo: "Desbridamento",
    resumo:
      "Remove tecido não viável (esfacelo, necrose) que impede a cicatrização — 5 métodos com velocidade, seletividade e nível de evidência muito diferentes entre si.",
    detalheClinico:
      "Cirúrgico/cortante — remoção de tecido não viável com instrumento cortante; é o método mais rápido, mas não é opção de longo prazo isolada — combinar com desbridamento de manutenção entre sessões.\n\n" +
      "Autolítico — fagocitose e enzimas proteolíticas endógenas do próprio doente em ambiente húmido; o mais lento de todos, requer pensos que mantenham humidade (Pensos de gestão de humidade).\n\n" +
      "Enzimático — enzimas proteolíticas (ex.: colagenase) degradam o colagénio que fixa o tecido necrótico; aplicação diária; não combinar com prata ou solução de Dakin.\n\n" +
      "Mecânico — remoção por força externa (\"wet-to-dry\"); demorado, frequentemente doloroso; uso reduzido atualmente a favor de métodos mais seletivos.\n\n" +
      "Biológico (larval) — larvas estéreis de Lucilia sericata libertam enzimas proteolíticas que dissolvem o tecido necrótico, com ação bactericida adicional; pode permanecer 4-5 dias, requer prescrição.\n\n" +
      "Combinar métodos (ex.: enzimático/autolítico como manutenção entre sessões de cortante) é frequente na prática.",
    quandoIndicado:
      "Existe tecido necrótico ou desvitalizado (esfacelo, necrose seca ou húmida) em quantidade significativa. Cirúrgico: também quando há necessidade de remoção imediata (ex.: infeção a progredir). Autolítico: preferencialmente sem sinais de infeção e quando se quer método sem dor. Enzimático: quando se precisa de um método mais rápido que o autolítico sem indicação para cirúrgico, ou como manutenção entre sessões de cortante. Mecânico: quantidade moderada de necrose, quando outros métodos não estão disponíveis. Biológico: feridas grandes onde se pretende remoção indolor e seletiva, alternativa quando cirúrgico não é opção ou há sinais de infeção.",
    quandoEvitar:
      "Cirúrgico: sem demarcação clara necrótico/viável, em anticoagulação sem preparação adequada, ou sem treino/certificação para desbridamento mais extenso. Autolítico: grande quantidade de tecido necrótico, imunidade comprometida, ou sem redução da necrose em 1-2 dias (mudar de método). Enzimático: infeção local overt/sistémica (contraindicação relativa). Mecânico: quando há granulação saudável presente (método não seletivo) ou dor elevada sem analgesia adequada. Biológico: alergia a ovo/soja/larvas de mosca, localização facial, proximidade de vasos major, bordos com cavidades/trajetos fistulosos, ou terapia anticoagulante.",
    notaEvidencia: "Forte para o método cirúrgico/cortante; Moderada para autolítico, enzimático e biológico (larval); Limitada para o mecânico.",
    errosFrequentes: [
      { texto: "Erro comum: justificar desbridamento com \"reduzir o volume de exsudado\" — essa razão pertence a Pensos de gestão de humidade." },
      { texto: "Erro comum: justificar desbridamento com \"controlar a carga bacteriana\" — essa razão pertence a Pensos antimicrobianos." },
      { texto: "Erro comum: justificar a técnica de terapia compressiva com \"há tecido necrótico a hidratar\" — essa razão pertence ao Desbridamento (hidratação de necrose seca, tipicamente com hidrogel)." },
      { texto: "Erro comum: justificar terapia de pressão negativa com \"há necrose extensa no leito por remover\" — essa razão pertence ao Desbridamento; a NPWT fica não aplicável até a necrose ser desbridada." },
      { texto: "Erro comum: justificar gestão de bordos problemáticos com \"há tecido necrótico no leito\" — essa razão pertence ao Desbridamento." },
      { texto: "Nota informativa (não é regra automática do algoritmo): escara seca estável em isquemia arterial ou no calcanhar pode, em certos contextos clínicos, não dever ser desbridada até resolução vascular prévia." },
    ],
    apositosExemplo: ["bisturi/tesoura cirúrgica (cortante)", "hidrocoloide ou hidrogel (facilitam autolítico)", "colagenase (enzimático)", "compressa seca em técnica wet-to-dry (mecânico)", "larvas estéreis de Lucilia sericata (biológico)"],
    relacionados: ["tema-tecido-leito", "tr-pensos-humidade", "tr-antimicrobianos", "tr-bordos-problematicos"],
    casosRelacionados: ["caso_1_lesao_pressao", "caso_3_ulcera_diabetica"],
    referencias: ["R61", "R62", "R63", "R64"],
  },
  {
    id: "tr-pensos-humidade",
    eixo: "tratamento",
    titulo: "Pensos de gestão de humidade",
    resumo:
      "Seleção por volume de exsudado: hidrogel/hidrocoloide/filme para escasso, espuma/alginato/hidrofibra para abundante — o eixo central da categoria.",
    detalheClinico:
      "Hidrocoloides — polímeros hidrofílicos reticulados, absorvem água progressivamente formando gel, baixam o pH da ferida; mudança a cada 2-4 dias, impossibilita visualização direta entre mudanças.\n\n" +
      "Espumas (foam) — folhas semipermeáveis de poliuretano, células abertas que retêm fluido; não aderentes, repelem contaminantes.\n\n" +
      "Alginatos — polissacárido de algas castanhas, troca iónica com exsudado rico em sódio produz gel hidrofílico; requerem penso secundário de fixação.\n\n" +
      "Hidrofibra — fibras de carboximetilcelulose sódica, elevada absorção e gelificação atraumática; boa opção quando a dor é preocupação relevante.\n\n" +
      "Hidrogel — polímeros reticulados com até 95% de água, hidratam o leito; preferencial para reidratar tecido necrótico seco.\n\n" +
      "Filme transparente — poliuretano com adesivo, permeável a gases, impermeável a fluido; permite visualização direta.\n\n" +
      "Regra geral: exsudado abundante → espuma, alginato ou hidrofibra; exsudado escasso/ausente → hidrogel, hidrocoloide ou filme; necrose seca presente → hidrogel + considerar desbridamento enzimático/autolítico em conjunto.",
    quandoIndicado:
      "Hidrocoloides: exsudado escasso/moderado, etiologia pressão. Espumas: exsudado moderado/abundante ou profundidade em espessura total. Alginatos: exsudado abundante, ou preencher espaço morto em bordos não aderentes/socavados. Hidrofibra: exsudado moderado/abundante. Hidrogel: exsudado escasso/ausente, ou necrose seca/esfacelo. Filme: exsudado ausente/escasso, feridas superficiais, etiologia cirúrgica fechada.",
    quandoEvitar:
      "Hidrocoloides: exsudado abundante, pele perilesional macerada, sinais de infeção, estádio 4/espessura total com exposição, queimaduras de espessura total, ou underminação extensa. Espumas e alginatos e hidrofibra: exsudado escasso. Hidrogel: exsudado abundante. Filme: exsudado moderado/abundante ou sinais de infeção.",
    notaEvidencia: "Forte para hidrocoloides, espumas, alginatos e filme transparente; Moderada para hidrofibra.",
    errosFrequentes: [
      { texto: "Erro comum: justificar pensos antimicrobianos com \"sinais de infeção local a controlar\" quando o exsudado é o problema principal — sem sinais de infeção, essa razão pertence a Pensos de gestão de humidade." },
      { texto: "Erro comum: justificar pensos antimicrobianos com \"exsudado desproporcional ao penso atual\" — essa razão pertence a Pensos de gestão de humidade (ajustar a capacidade de absorção, não introduzir antimicrobiano)." },
      { texto: "Erro comum: justificar pensos antimicrobianos com \"a ferida está seca e precisa de hidratação\" — essa razão pertence a Pensos de gestão de humidade (hidrogel)." },
      { texto: "Erro comum: justificar gestão de bordos problemáticos com \"o exsudado é abundante\" — essa razão pertence a Pensos de gestão de humidade." },
      { texto: "Erro comum: justificar interfaces não aderentes (silicone) com \"exsudado abundante e precisa de alta absorção\" — essa razão pertence a Pensos de gestão de humidade; a interface de silicone não tem função absorvente própria." },
      { texto: "Erro comum: justificar a técnica de terapia compressiva com \"a ferida tem exsudado abundante\" — essa é razão de escolha de penso (esta categoria), não da técnica de compressão em si." },
    ],
    apositosExemplo: ["hidrocoloide", "espuma de poliuretano", "alginato de cálcio", "hidrofibra de carboximetilcelulose sódica", "hidrogel (amorfo ou em folha)", "filme de poliuretano transparente"],
    relacionados: ["tema-exsudado", "tr-desbridamento", "tr-antimicrobianos", "tema-tecido-leito"],
    casosRelacionados: ["caso_2_deiscencia_cirurgica", "caso_5_ulcera_venosa_perna"],
    referencias: ["R65", "R66", "R67"],
  },
  {
    id: "tr-antimicrobianos",
    eixo: "tratamento",
    titulo: "Pensos antimicrobianos",
    resumo:
      "Nunca indicados sem sinais de infeção (uso profilático não recomendado) — prata, iodo, mel de grau médico, PHMB ou DACC, consoante o contexto.",
    detalheClinico:
      "Regra de exclusão comum a toda a categoria: nenhum destes deve ser sugerido quando não há sinais de infeção.\n\n" +
      "Prata — ação citotóxica de largo espectro, combate biofilme; reavaliar a cada mudança de penso.\n\n" +
      "Iodo (cadexómero de iodo/povidona-iodada) — antissético de largo espectro; o cadexómero absorve exsudado e liberta iodo lentamente; mudança de cor do penso (castanho→branco) indica substituição.\n\n" +
      "Mel (grau médico, Manuka) — pH baixo aumenta libertação de oxigénio da hemoglobina, ação antibacteriana pelo metilglioxal (MGO); facilita desbridamento autolítico; pode causar dor transitória por ação osmótica.\n\n" +
      "PHMB (polihexametileno biguanida) — antimicrobiano sintético de largo espectro, inibe metabolismo celular bacteriano; alternativa não-prata.\n\n" +
      "DACC (cloreto de dialquilcarbamoílo) — mecanismo físico hidrofóbico, microrganismos aderem irreversivelmente ao penso e são removidos fisicamente, sem lise bacteriana; sem risco de indução de resistência por ser mecanismo físico; requer ambiente húmido para ligação hidrofóbica eficaz.",
    quandoIndicado:
      "Sinais de infeção local (covert/overt) ou propagação sistémica. Iodo: também exsudado moderado. Mel: necrose seca/esfacelo e sinais de infeção, nas etiologias venosa, pressão, pé diabético (ambos subtipos), cirúrgica ou traumática. DACC: feridas crónicas onde a inflamação prolongada é preocupação (etiologia venosa).",
    quandoEvitar:
      "Sem sinais de infeção (uso profilático não recomendado), ou uso prolongado sem reavaliação. Iodo: alergia ao iodo, disfunção tiroideia, gravidez/amamentação. Mel: alergia a produtos de abelha, uso prolongado (MGO pode ser citotóxico em concentração elevada). PHMB e DACC: sensibilidade conhecida ao produto.",
    notaEvidencia: "Mista para a prata (escolha primária há décadas, mas sem superioridade consistente comprovada e com resistência bacteriana documentada); Moderada para iodo, mel, PHMB e DACC.",
    errosFrequentes: [
      { texto: "Erro comum: justificar desbridamento com \"controlar a carga bacteriana da ferida\" — essa é a razão real para escolher pensos antimicrobianos." },
      { texto: "Erro comum: justificar pensos de gestão de humidade com \"sinais de infeção local a controlar\" — essa razão pertence a pensos antimicrobianos." },
      { texto: "Erro comum: justificar gestão de bordos problemáticos com \"sinais sistémicos de infeção\" — essa razão pertence a pensos antimicrobianos (ou referenciação médica), não à gestão de bordos." },
      { texto: "Erro comum: justificar interfaces não aderentes (silicone) com \"sinais de infeção a controlar\" — essa razão pertence a pensos antimicrobianos." },
    ],
    apositosExemplo: ["prata (nanocristalina, sulfadiazina ou nitrato)", "iodo (cadexómero de iodo ou povidona iodada)", "mel de grau médico (Manuka)", "PHMB (polihexametileno biguanida)", "DACC (cloreto de dialquilcarbamoílo)"],
    relacionados: ["tema-sinais-infecao", "tr-pensos-humidade", "tr-limpeza-irrigacao"],
    casosRelacionados: ["caso_5_ulcera_venosa_perna"],
    referencias: ["R68", "R69", "R70", "R71", "R72", "R73"],
  },
  {
    id: "tr-pressao-negativa",
    eixo: "tratamento",
    titulo: "Terapia de pressão negativa (NPWT)",
    resumo:
      "Pressão subatmosférica que remove exsudado e promove granulação — não deve ser usada sobre necrose por desbridar nem em oncológica maligna não tratada.",
    detalheClinico:
      "Mecanismo: pressão subatmosférica via espuma de poro aberto, cobertura adesiva e bomba de vácuo; remove exsudado e microrganismos, aproxima bordos, promove angiogénese/granulação. Evidência recente questiona o mecanismo clássico de \"aumento de perfusão\" — pode haver diminuição imediata de perfusão, sobretudo com pensos circunferenciais. Requer profissional certificado; mudanças de penso menos frequentes (2-3x/semana).",
    quandoIndicado:
      "Tipo de tecido do leito predominantemente granulação a promover (não para remoção de necrose extensa); exsudado abundante; estádio 3/4 (adjunto precoce); fixação de enxertos; profilático sobre incisões cirúrgicas fechadas em alto risco.",
    quandoEvitar:
      "Osteomielite/infeção não tratada; etiologia oncológica maligna não tratada (risco teórico de estimulação tumoral); estádio 4/espessura total com estruturas vitais expostas sem proteção; tecido necrótico não desbridado; fístulas não entéricas não exploradas; vascularização comprometida.",
    notaEvidencia:
      "Mista — meta-análises mostram benefício estatisticamente significativo em cicatrização e tempo de internamento em feridas de segunda intenção, mas avaliações tecnológicas mais antigas consideraram evidência insuficiente para benefício clínico robusto; evidência mais forte para redução de deiscência em contexto profilático pós-cirúrgico.",
    errosFrequentes: [
      { texto: "Erro comum: escolher NPWT quando há hipergranulação a controlar — essa razão pertence a Gestão de bordos problemáticos." },
      { texto: "Erro comum: escolher NPWT sobre necrose ainda não desbridada — a resposta certa está primeiro no Desbridamento; NPWT fica não aplicável nesse caso." },
    ],
    apositosExemplo: ["sistema de pressão negativa com espuma de poliuretano", "sistema de pressão negativa com gaze"],
    relacionados: ["tr-desbridamento", "tema-tecido-leito", "tema-exsudado"],
    referencias: ["R74", "R75", "R76", "R77"],
  },
  {
    id: "tr-bordos-problematicos",
    eixo: "tratamento",
    titulo: "Gestão de bordos problemáticos",
    resumo:
      "Bordos enrolados/fibróticos ou hipergranulação controlam-se com nitrato de prata, corticoide tópico ou desbridamento do próprio bordo.",
    detalheClinico:
      "Nitrato de prata — material cáustico, cauterização química, coagula tecido e destrói bactérias; doloroso, mas o efeito hemostático simultâneo é vantagem.\n\n" +
      "Corticoide tópico — reduz a resposta inflamatória local, diminuindo a proliferação de tecido hipergranulado; indolor, boa adesão.\n\n" +
      "Desbridamento de bordo (epíbole/fibrótico) — remoção física do bordo estagnado, reinicia migração epitelial; frequentemente combinado com nitrato de prata/corticoide como adjuvante.",
    quandoIndicado:
      "Granulação hipergranulada, bordos enrolados (epíbole) ou fibróticos. Nitrato de prata: também hemorragia ligeira a controlar. Desbridamento de bordo: bordos enrolados/fibróticos sem resposta a medidas menos invasivas.",
    quandoEvitar:
      "Nitrato de prata: feridas grandes (>2cm), pele perilesional frágil ou macerada. Corticoide tópico: infeção local overt/sistémica não tratada. Desbridamento de bordo: mesmas contraindicações gerais do desbridamento cirúrgico.",
    notaEvidencia: "Mista para o nitrato de prata (sem \"gold standard\" definido face ao corticoide tópico); Moderada para o corticoide tópico e para o desbridamento de bordo.",
    errosFrequentes: [
      { texto: "Erro comum: justificar pensos de gestão de humidade com \"o bordo da ferida está estagnado\" — essa razão pertence a Gestão de bordos problemáticos." },
      { texto: "Erro comum: justificar pensos antimicrobianos com \"o tecido de granulação está hipergranulado\" — essa razão pertence a Gestão de bordos problemáticos." },
      { texto: "Erro comum: justificar terapia de pressão negativa com \"há hipergranulação a controlar\" — essa razão pertence a Gestão de bordos problemáticos." },
      { texto: "Erro comum: justificar cuidados paliativos específicos com \"o tecido está hipergranulado\" — essa razão pertence a Gestão de bordos problemáticos." },
      { texto: "Erro comum: justificar interfaces não aderentes (silicone) com \"o bordo da ferida está enrolado\" — essa razão pertence a Gestão de bordos problemáticos." },
    ],
    apositosExemplo: ["nitrato de prata em aplicador", "corticoide tópico"],
    relacionados: ["tema-bordos", "tema-tecido-leito", "tr-desbridamento"],
    referencias: ["R78", "R79", "R80", "R81", "R82", "R83", "R84", "R61"],
  },
  {
    id: "tr-paliativos-oncologicos",
    eixo: "tratamento",
    titulo: "Cuidados paliativos específicos",
    resumo:
      "Controlo sintomático — odor, exsudado, hemorragia e dor — numa ferida oncológica maligna, com objetivo de conforto e qualidade de vida, não cicatrização.",
    detalheClinico:
      "Gestão de odor — metabolitos de bactérias anaeróbias/gram-negativas colonizando tecido necrótico/tumoral causam o odor; metronidazol tópico atua sobre a componente anaeróbia; melhoria em 2-3 dias, uso até 2 semanas; carvão ativado por adsorção física é combinável.\n\n" +
      "Gestão de exsudado — segue a lógica de seleção por volume da categoria de Pensos de gestão de humidade, com ênfase em conforto; frequência de mudança ajustada ao conforto do doente, não só à saturação do penso.\n\n" +
      "Gestão de hemorragia — fragilidade vascular tumoral causa sangramento fácil; agentes hemostáticos tópicos promovem coagulação local; hemorragia significativa/ativa exige articulação com especialidade de feridas/oncologia, fora do âmbito de decisão isolada de enfermagem; nitrato de prata é opção para hemorragias ligeiras pontuais.\n\n" +
      "Critério de sucesso: controlo sintomático e qualidade de vida, não progressão para cicatrização.",
    quandoIndicado:
      "Odor: moderado/forte. Exsudado: abundante (típico) → espuma/alginato/hidrofibra; escasso → hidrocoloide/filme. Hemorragia: exsudado com sanguinolento persistente.",
    quandoEvitar: "Metronidazol: hipersensibilidade ao metronidazol. Hemorragia significativa/ativa: exige articulação com especialidade, fora do âmbito desta categoria isolada.",
    nivelEvidencia: "limitada",
    errosFrequentes: [],
    apositosExemplo: ["metronidazol tópico (gel ou pó)", "penso de carvão ativado", "agente hemostático tópico"],
    relacionados: ["etio-oncologica-maligna", "tema-exsudado", "tr-bordos-problematicos"],
    referencias: ["R33", "R34", "R35", "R36", "R37"],
  },
  {
    id: "tr-limpeza-irrigacao",
    eixo: "tratamento",
    titulo: "Limpeza e irrigação",
    resumo:
      "Passo de preparação do leito que antecede qualquer outro tratamento, sempre presente e independente das restantes variáveis — não é uma categoria condicional.",
    detalheClinico:
      "Soro fisiológico (irrigação padrão) — remoção física de detritos, exsudado seco e contaminantes de superfície, sem atividade antimicrobiana intrínseca relevante; passo obrigatório antes de aplicar qualquer penso.\n\n" +
      "Antisséticos de limpeza (ex.: PHMB em solução, hipoclorito de nova geração) — redução de carga microbiana de superfície antes da aplicação do penso definitivo; agentes antigos como água oxigenada/hipoclorito clássico (EUSOL) são desaconselhados pelo risco de dano tecidual, exceto em contextos de recursos limitados; distinto do penso antimicrobiano em si — é preparação, não permanece na ferida.",
    quandoIndicado: "Soro fisiológico: aplicável a qualquer ferida, antes de qualquer outro tratamento. Antisséticos de limpeza: sinais de infeção, como preparação antes do penso antimicrobiano.",
    quandoEvitar: "Antisséticos de limpeza: feridas limpas sem sinais de infeção (uso rotineiro não recomendado).",
    notaEvidencia: "Forte para o soro fisiológico (recomendação transversal a praticamente todas as guidelines); Moderada para os antisséticos de limpeza.",
    errosFrequentes: [
      { texto: "Erro comum: pensar que a limpeza substitui a necessidade de um penso antimicrobiano quando há infeção — a limpeza não substitui o tratamento da infeção." },
      { texto: "Erro comum: pensar que a limpeza só é necessária quando há sinais de infeção — é sempre um passo prévio, não condicional à infeção." },
      { texto: "Erro comum: pensar que a limpeza é desnecessária se a ferida parecer limpa visualmente — a preparação do leito não depende da perceção visual." },
    ],
    apositosExemplo: ["soro fisiológico (cloreto de sódio 0,9%)", "solução de PHMB para limpeza"],
    relacionados: ["tema-sinais-infecao", "tr-antimicrobianos"],
    referencias: [],
  },
  {
    id: "tr-interfaces-silicone",
    eixo: "tratamento",
    titulo: "Interfaces não aderentes (silicone)",
    resumo:
      "Camada de contacto não aderente que reduz trauma e dor na remoção — usada em conjunto com, não em substituição de, um penso absorvente.",
    detalheClinico:
      "Interface/malha de silicone — camada de contacto não aderente entre a ferida e o penso secundário; reduz trauma e dor na remoção sem interferir com a capacidade de absorção do penso sobreposto. Usada em conjunto com — não em substituição de — um penso absorvente das categorias de humidade/antimicrobianos, consoante o exsudado/sinais de infeção.",
    quandoIndicado: "Pele perilesional frágil/seca-descamativa; dor elevada associada à mudança de penso; feridas em fase de epitelização (proteção do tecido novo).",
    quandoEvitar: "Exsudado abundante sem penso secundário absorvente associado — a interface por si só não absorve.",
    nivelEvidencia: "moderada",
    errosFrequentes: [
      { texto: "Erro comum: justificar desbridamento com \"proteger tecido de granulação frágil na remoção do penso\" — essa razão pertence a Interfaces não aderentes (silicone)." },
    ],
    apositosExemplo: ["malha/interface de silicone"],
    relacionados: ["tema-pele-perilesional", "tema-tecido-leito", "tr-pensos-humidade"],
    referencias: ["R67"],
  },

  // ─────────────────────── Eixo: Tratamento (técnicas de aplicação) ───────────────────────
  {
    id: "tc-penso-rapido",
    eixo: "tratamento",
    titulo: "Penso rápido",
    resumo:
      "Fixação adesiva simples para feridas muito pequenas, superficiais e sem exsudado relevante — não serve para feridas maiores, exsudativas ou infetadas.",
    detalheClinico: "Fixação adesiva simples de cobertura para feridas muito pequenas e superficiais. Não é adequado como técnica principal para feridas de maior dimensão ou exsudativas.",
    quandoIndicado: "Dimensões pequenas (feridas mínimas); exsudado ausente/escasso; sem sinais de infeção.",
    quandoEvitar: "Infeção local overt ou propagação sistémica.",
    nivelEvidencia: "moderada",
    notaEvidencia: "Estimativa qualitativa — uso corrente, sem controvérsia clínica significativa para feridas mínimas, mas sem pesquisa dedicada própria (ao contrário das categorias de tratamento).",
    errosFrequentes: [
      { texto: "Erro comum: escolher penso rápido quando é preciso efeito de compressão terapêutica — essa razão pertence à técnica de Terapia compressiva." },
    ],
    relacionados: ["tc-penso-simples-protetor", "tema-exsudado"],
    referencias: [],
  },
  {
    id: "tc-penso-simples-protetor",
    eixo: "tratamento",
    titulo: "Penso simples protetor",
    resumo: "A técnica de fecho por defeito, quando nenhuma das outras técnicas é especificamente necessária.",
    detalheClinico: "Cobertura de proteção geral, sem função terapêutica própria — protege o tratamento colocado por baixo.",
    quandoIndicado: "Aplicável na generalidade dos casos como técnica de fecho — opção-base quando não há necessidade de compressão, impermeabilização especial, ou ausência de proteção.",
    quandoEvitar: "Sem contraindicações específicas.",
    nivelEvidencia: "forte",
    errosFrequentes: [
      { texto: "Erro comum: justificar cuidados paliativos específicos com \"a ferida está a cicatrizar bem e só precisa de proteção\" — essa razão pertence à técnica de Penso simples protetor." },
      { texto: "Erro comum: pensar que substitui a necessidade de compressão em úlceras venosas — a compressão é uma técnica à parte, com indicação própria." },
    ],
    relacionados: ["tc-penso-rapido", "tc-ligadura"],
    referencias: [],
  },
  {
    id: "tc-ligadura",
    eixo: "tratamento",
    titulo: "Ligadura",
    resumo: "Fixação por enfaixamento sem intenção compressiva — para feridas grandes ou locais onde o penso adesivo não fixa bem.",
    detalheClinico: "Fixação por enfaixamento, sem intenção compressiva — segura o tratamento primário em posição. Distinta da terapia compressiva — aqui a ligadura não exerce pressão terapêutica graduada.",
    quandoIndicado: "Feridas de maior dimensão ou em localizações onde o penso adesivo não fixa bem; necessidade de fixação segura sem efeito de compressão.",
    quandoEvitar: "Sem contraindicações específicas, desde que não seja usada com intenção compressiva indevida (nesse caso, ver Terapia compressiva).",
    nivelEvidencia: "moderada",
    errosFrequentes: [
      { texto: "Erro comum: justificar ligadura com \"é usada para exercer pressão terapêutica graduada\" — essa é a Terapia compressiva, não a ligadura simples." },
    ],
    relacionados: ["tc-terapia-compressiva", "tc-penso-simples-protetor"],
    referencias: [],
  },
  {
    id: "tc-penso-impermeavel",
    eixo: "tratamento",
    titulo: "Penso impermeável",
    resumo: "Camada externa que protege contra contaminação e humidade externa — contraindicada quando há sinais de infeção, pelo ambiente oclusivo.",
    detalheClinico: "Camada externa que protege contra contaminação e humidade externa (água, fricção de roupa). Útil quando o doente tem exposição a água/humidade externa (higiene, atividade).",
    quandoIndicado: "Sem sinais de infeção; exsudado ausente/escasso.",
    quandoEvitar: "Infeção local overt ou propagação sistémica (ambiente oclusivo pode favorecer proliferação bacteriana, mesma lógica já registada para o filme transparente).",
    nivelEvidencia: "moderada",
    errosFrequentes: [
      { texto: "Erro comum: escolher penso impermeável quando é preciso efeito de compressão — essa razão pertence à técnica de Terapia compressiva." },
    ],
    relacionados: ["tr-pensos-humidade", "tema-sinais-infecao"],
    referencias: [],
  },
  {
    id: "tc-terapia-compressiva",
    eixo: "tratamento",
    titulo: "Terapia compressiva",
    resumo: "Pressão externa graduada contra a hipertensão venosa — a avaliação arterial (ABPI) é pré-requisito indispensável, não opcional.",
    detalheClinico:
      "Pressão externa graduada contraria a hipertensão venosa, aumenta a fração de ejeção venosa e o retorno pela bomba muscular da perna. Tipos: bandagem multicamada elástica; bandagem inelástica (short-stretch); meias de compressão graduada (pós-cicatrização); compressão pneumática intermitente. Avaliação arterial (ABPI) é pré-requisito indispensável — até 30% dos doentes com úlceras de membro inferior têm doença arterial periférica concomitante. Liga-se simultaneamente (a) a esta técnica de aplicação e (b) ao critério do teto de pontuação de venosa/mista arteriovenosa — aplicar bem a compressão é uma ação de tratamento; ter tratado a causa é o que determina o teto, são avaliações distintas sobre o mesmo dado (não se somam).",
    quandoIndicado: "ABPI > 0,8 → compressão de alta pressão (35-40mmHg); 0,5 ≤ ABPI ≤ 0,8 → compressão reduzida/modificada (15-25mmHg); pós-cicatrização → meias de compressão graduada.",
    quandoEvitar: "ABPI < 0,5 (contraindicação absoluta); doença arterial oclusiva significativa; insuficiência cardíaca não compensada; ABPI > 1,3 (vasos incompressíveis/calcificados — avaliação vascular especializada obrigatória).",
    notaEvidencia: "Forte para úlceras venosas em geral (revisão Cochrane); Mista entre sistemas específicos (Canadian Bandaging Trial sem diferença robusta elástica vs. inelástica).",
    errosFrequentes: [
      { texto: "Erro comum: justificar penso rápido com \"é preciso efeito de compressão terapêutica\" — essa razão pertence à Terapia compressiva." },
      { texto: "Erro comum: justificar penso simples protetor com \"substitui a necessidade de compressão em úlceras venosas\" — a compressão é uma técnica à parte, com indicação própria." },
      { texto: "Erro comum: justificar ligadura com \"é usada para exercer pressão terapêutica graduada\" — isso é especificamente a Terapia compressiva." },
      { texto: "Erro comum: justificar penso impermeável com \"é preciso efeito de compressão\" — essa razão pertence à Terapia compressiva." },
    ],
    relacionados: ["etio-venosa", "etio-arterial", "etio-mista-arteriovenosa", "tc-ligadura"],
    casosRelacionados: ["caso_4_ulcera_venosa_maleolo", "caso_5_ulcera_venosa_perna"],
    referencias: ["R10", "R11", "R12", "R13"],
  },
  {
    id: "tc-sem-protecao",
    eixo: "tratamento",
    titulo: "Sem proteção / exposição ao ar",
    resumo: "Ausência deliberada de cobertura — técnica de exceção só para necrose seca estável em contexto de isquemia arterial, nunca uma opção por defeito.",
    detalheClinico: "Ausência deliberada de cobertura — a ferida fica exposta. Técnica de exceção, não uma opção por defeito.",
    quandoIndicado: "Tipo de tecido do leito contém necrose seca estável em contexto de isquemia arterial (a escara seca estável não deve ser amolecida, e por vezes a exposição controlada ao ar é preferida a qualquer oclusão).",
    quandoEvitar: "Sinais de infeção presentes; exsudado moderado/abundante.",
    nivelEvidencia: "limitada",
    notaEvidencia: "Uso muito específico, não é prática geral.",
    errosFrequentes: [],
    relacionados: ["tr-desbridamento", "tema-tecido-leito"],
    referencias: [],
  },
];

export function obterPagina(id: string): PaginaAprender | undefined {
  return PAGINAS_APRENDER.find((p) => p.id === id);
}
