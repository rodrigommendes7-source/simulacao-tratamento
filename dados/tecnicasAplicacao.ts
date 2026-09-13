/**
 * Técnicas de aplicação — tradução de `tecnicas-aplicacao.md` para estrutura
 * avaliável pelo mesmo motor de condições usado em dados/tratamentos.ts
 * (tipos/condicao.ts + algoritmo/avaliarCondicao.ts).
 *
 * Eixo separado dos tratamentos (categoria/mecanismo) — ver
 * especificacao-ecra-resolucao-caso.md, P-Design-02. Não existe ainda no
 * motor de decisão original (algoritmo/motorDecisao.ts só cobre as 9
 * categorias de tratamento); esta base alimenta a UI e é avaliada
 * separadamente (ver algoritmo/avaliarTecnicas.ts).
 *
 * `indicadoQuandoTexto`/`contraindicadoQuandoTexto`: texto tal como está em
 * tecnicas-aplicacao.md — usado pela explicação da recomendação em
 * app/consulta/page.tsx, não gerado a partir da DSL.
 */
import { contem, diferente, e, igual, numerica, ou, sempre } from "../tipos/condicao";
import type { Condicao } from "../tipos/condicao";

export interface EntradaTecnica {
  id: string;
  nome: string;
  mecanismo: string;
  indicadoQuando: Condicao;
  contraindicadoQuando: Condicao[];
  indicadoQuandoTexto: string;
  contraindicadoQuandoTexto: string;
  nivelEvidencia: "forte" | "moderada" | "limitada" | "mista";
  notasAplicacao: string;
}

export const TODAS_TECNICAS: EntradaTecnica[] = [
  {
    id: "penso_rapido",
    nome: "Penso rápido",
    mecanismo: "Fixação adesiva simples de cobertura para feridas muito pequenas e superficiais.",
    indicadoQuando: e(
      ou(igual("exsudado.volume", "ausente"), igual("exsudado.volume", "escasso")),
      igual("nivel_infecao", "sem_sinais"),
    ),
    contraindicadoQuando: [
      igual("nivel_infecao", "infecao_local_overt"),
      igual("nivel_infecao", "infecao_propagacao_sistemica"),
    ],
    indicadoQuandoTexto: "dimensões pequenas (feridas mínimas); exsudado.volume = ausente/escasso; sinais_infecao.nivel_infecao = sem_sinais.",
    contraindicadoQuandoTexto: "sinais_infecao.nivel_infecao em infecao_local_overt/infecao_propagacao_sistemica.",
    nivelEvidencia: "moderada",
    notasAplicacao: "Não adequado para feridas de maior dimensão ou exsudativas.",
  },
  {
    id: "penso_simples_protetor",
    nome: "Penso simples protetor",
    mecanismo: "Cobertura de proteção geral, sem função terapêutica própria.",
    indicadoQuando: sempre(),
    contraindicadoQuando: [],
    indicadoQuandoTexto:
      "Aplicável na generalidade dos casos como técnica de fecho — funciona como opção-base quando nenhuma das outras técnicas é especificamente necessária.",
    contraindicadoQuandoTexto: "Sem contraindicações específicas.",
    nivelEvidencia: "forte",
    notasAplicacao:
      "Opção-base quando nenhuma das outras técnicas é especificamente necessária.",
  },
  {
    id: "ligadura",
    nome: "Ligadura",
    mecanismo: "Fixação por enfaixamento, sem intenção compressiva.",
    indicadoQuando: sempre(),
    contraindicadoQuando: [],
    indicadoQuandoTexto:
      "Feridas de maior dimensão ou em localizações onde o penso adesivo não fixa bem; necessidade de fixação segura sem efeito de compressão.",
    contraindicadoQuandoTexto:
      "Sem contraindicações específicas, desde que não seja usada com intenção compressiva indevida (nesse caso, ver Terapia compressiva).",
    nivelEvidencia: "moderada",
    notasAplicacao:
      "Feridas de maior dimensão ou em locais onde o penso adesivo não fixa bem. Distinta da terapia compressiva.",
  },
  {
    id: "penso_impermeavel",
    nome: "Penso impermeável",
    mecanismo: "Camada externa que protege contra contaminação e humidade externa.",
    indicadoQuando: e(
      igual("nivel_infecao", "sem_sinais"),
      ou(igual("exsudado.volume", "ausente"), igual("exsudado.volume", "escasso")),
    ),
    contraindicadoQuando: [
      igual("nivel_infecao", "infecao_local_overt"),
      igual("nivel_infecao", "infecao_propagacao_sistemica"),
    ],
    indicadoQuandoTexto: "sinais_infecao.nivel_infecao = sem_sinais; exsudado.volume = ausente/escasso.",
    contraindicadoQuandoTexto:
      "sinais_infecao.nivel_infecao em infecao_local_overt/infecao_propagacao_sistemica (ambiente oclusivo pode favorecer proliferação bacteriana).",
    nivelEvidencia: "moderada",
    notasAplicacao: "Útil quando há exposição a água/humidade externa.",
  },
  {
    id: "terapia_compressiva_tecnica",
    nome: "Terapia compressiva",
    mecanismo: "Pressão externa graduada contraria a hipertensão venosa.",
    indicadoQuando: e(numerica("abpi", ">=", 0.5), numerica("abpi", "<=", 1.3)),
    contraindicadoQuando: [numerica("abpi", "<", 0.5)],
    indicadoQuandoTexto:
      "ABPI > 0,8 → compressão de alta pressão (35-40mmHg); 0,5 ≤ ABPI ≤ 0,8 → compressão reduzida/modificada (15-25mmHg); pós-cicatrização → meias de compressão graduada.",
    contraindicadoQuandoTexto:
      "ABPI < 0,5 (contraindicação absoluta); doença arterial oclusiva significativa; insuficiência cardíaca não compensada; ABPI > 1,3 (avaliação vascular especializada obrigatória).",
    nivelEvidencia: "forte",
    notasAplicacao:
      "Avaliação arterial (ABPI) é pré-requisito indispensável. Mesmo dado que a categoria de tratamento \"Terapia compressiva\" — não conta em duplicado na pontuação.",
  },
  {
    id: "sem_protecao",
    nome: "Sem proteção / exposição ao ar",
    mecanismo: "Ausência deliberada de cobertura.",
    indicadoQuando: contem("tipo_tecido_leito", "necrose_seca"),
    contraindicadoQuando: [
      diferente("nivel_infecao", "sem_sinais"),
      igual("exsudado.volume", "moderado"),
      igual("exsudado.volume", "abundante"),
    ],
    indicadoQuandoTexto:
      "tipo_tecido_leito contém necrose_seca estável em contexto de isquemia arterial (a escara seca estável não deve ser amolecida).",
    contraindicadoQuandoTexto: "sinais_infecao.nivel_infecao ≠ sem_sinais; exsudado.volume = moderado/abundante.",
    nivelEvidencia: "limitada",
    notasAplicacao: "Técnica de exceção — necrose seca estável, não é opção por defeito.",
  },
];
