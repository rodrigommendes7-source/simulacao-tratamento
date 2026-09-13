/**
 * Derivação da 2.ª camada de navegação do Aprender (categoria → subtópico).
 *
 * O conteúdo clínico de `dados/aprender.ts` já está escrito como uma lista de
 * blocos nomeados dentro de `detalheClinico` — "Granulação — …", "Esfacelo — …",
 * um bloco por parágrafo. Em vez de duplicar esse texto numa estrutura nova
 * (o que abriria a porta a as duas versões divergirem), o drill-down parte
 * daqui: cada parágrafo com a forma `Nome — corpo` passa a ser um subtópico
 * navegável. Nenhuma afirmação clínica é reescrita, só reagrupada.
 *
 * Parágrafos que não sigam essa forma (texto introdutório ou corrido) ficam
 * como `preambulo` e são mostrados na página da categoria, acima da lista.
 * Páginas sem blocos nomeados suficientes não ganham camada intermédia — a
 * categoria mostra o texto completo, como antes.
 */
import { PAGINAS_APRENDER, obterPagina } from "../dados/aprender";
import type { PaginaAprender } from "../tipos/aprender";

export interface SubtopicoAprender {
  /** Slug estável derivado do nome — usado na rota /aprender/[id]/[sub]. */
  id: string;
  titulo: string;
  /** Corpo do bloco, tal como está no documento de origem. */
  detalhe: string;
  /** Primeira frase do corpo, para o cartão da lista. */
  resumo: string;
}

/** Mínimo de blocos nomeados para valer a pena criar uma camada intermédia. */
const MINIMO_SUBTOPICOS = 2;

/** Travessão (—) usado como separador nome/corpo; hífen simples não conta, para não partir palavras compostas. */
const BLOCO_NOMEADO = /^(.{2,70}?)\s+—\s+([\s\S]+)$/;

export function criarSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function primeiraFrase(texto: string): string {
  const corte = texto.search(/[.;](\s|$)/);
  const frase = corte === -1 ? texto : texto.slice(0, corte + 1);
  return frase.length > 180 ? `${frase.slice(0, 177).trimEnd()}…` : frase;
}

export interface EstruturaPagina {
  pagina: PaginaAprender;
  /** Texto corrido antes do primeiro bloco nomeado. */
  preambulo: string;
  /** Texto corrido depois do último bloco nomeado (nota de prática). Mostrado a seguir à lista, para não trocar a ordem do documento de origem. */
  nota: string;
  /** Vazio quando a página não tem camada intermédia. */
  subtopicos: SubtopicoAprender[];
}

export function estruturarPagina(pagina: PaginaAprender): EstruturaPagina {
  const paragrafos = pagina.detalheClinico.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  const preambulo: string[] = [];
  const nota: string[] = [];
  const subtopicos: SubtopicoAprender[] = [];
  const slugsUsados = new Map<string, number>();

  for (const paragrafo of paragrafos) {
    const m = BLOCO_NOMEADO.exec(paragrafo);
    // Um bloco nomeado válido tem um nome curto, sem pontuação de frase
    // ("Granulação", "Necrose seca"), e não uma frase inteira que por acaso
    // usa travessão a meio. Os parênteses são retirados antes de verificar a
    // pontuação porque nomes legítimos trazem-nos com vírgulas lá dentro
    // ("Mel (grau médico, Manuka)").
    const semParenteses = m ? m[1].replace(/\([^)]*\)/g, "") : "";
    if (!m || /[.:;,]/.test(semParenteses) || m[1].split(/\s+/).length > 8) {
      // Antes do primeiro bloco é introdução; depois do último é nota de fecho.
      (subtopicos.length === 0 ? preambulo : nota).push(paragrafo);
      continue;
    }
    const titulo = m[1].trim();
    const base = criarSlug(titulo);
    const repetido = slugsUsados.get(base) ?? 0;
    slugsUsados.set(base, repetido + 1);
    const detalhe = m[2].trim();
    subtopicos.push({
      id: repetido === 0 ? base : `${base}-${repetido + 1}`,
      titulo,
      detalhe,
      resumo: primeiraFrase(detalhe),
    });
  }

  if (subtopicos.length < MINIMO_SUBTOPICOS) {
    return { pagina, preambulo: paragrafos.join("\n\n"), nota: "", subtopicos: [] };
  }
  return { pagina, preambulo: preambulo.join("\n\n"), nota: nota.join("\n\n"), subtopicos };
}

export function obterEstrutura(id: string): EstruturaPagina | null {
  const pagina = obterPagina(id);
  return pagina ? estruturarPagina(pagina) : null;
}

export function obterSubtopico(idPagina: string, idSub: string): { estrutura: EstruturaPagina; subtopico: SubtopicoAprender } | null {
  const estrutura = obterEstrutura(idPagina);
  const subtopico = estrutura?.subtopicos.find((s) => s.id === idSub);
  return estrutura && subtopico ? { estrutura, subtopico } : null;
}

/** Todos os pares (página, subtópico) — usado para pesquisa global e para validação. */
export function todosOsSubtopicos(): { pagina: PaginaAprender; subtopico: SubtopicoAprender }[] {
  return PAGINAS_APRENDER.flatMap((pagina) =>
    estruturarPagina(pagina).subtopicos.map((subtopico) => ({ pagina, subtopico })),
  );
}

// ───────────────────── Camada de navegação (lista → detalhe) ─────────────────────

/**
 * Uma entrada navegável da página de categoria. Unifica dois casos para que o
 * drill-down seja igual em todos os eixos: nas páginas cujo detalhe está
 * escrito em blocos nomeados (tecidos, bordos, métodos de desbridamento…)
 * cada bloco é uma entrada; nas páginas de texto corrido (a maioria das
 * etiologias e técnicas) as entradas são as próprias secções da página, que
 * antes eram colapsáveis na mesma vista.
 */
export interface EntradaAprender {
  id: string;
  titulo: string;
  tipo: "subtopico" | "seccao";
  /** Texto corrido da entrada. Vazio quando a entrada é uma lista (`itens`). */
  corpo: string;
  /** Usado pela entrada de erros frequentes. */
  itens?: string[];
  resumo: string;
}

function resumoDe(texto: string): string {
  return primeiraFrase(texto);
}

export function entradasDaPagina(estrutura: EstruturaPagina): EntradaAprender[] {
  const { pagina, preambulo, subtopicos } = estrutura;
  const entradas: EntradaAprender[] = [];

  if (subtopicos.length) {
    for (const s of subtopicos) {
      entradas.push({ id: s.id, titulo: s.titulo, tipo: "subtopico", corpo: s.detalhe, resumo: s.resumo });
    }
  } else if (preambulo) {
    entradas.push({
      id: "detalhe-clinico",
      titulo: "Detalhe clínico completo",
      tipo: "seccao",
      corpo: preambulo,
      resumo: resumoDe(preambulo),
    });
  }

  if (pagina.quandoIndicado) {
    entradas.push({
      id: "quando-indicado",
      titulo: pagina.eixo === "etiologia" ? "Princípios de tratamento da causa" : "Quando indicado",
      tipo: "seccao",
      corpo: pagina.quandoIndicado,
      resumo: resumoDe(pagina.quandoIndicado),
    });
  }
  if (pagina.quandoEvitar) {
    entradas.push({
      id: "quando-evitar",
      titulo: "Quando evitar",
      tipo: "seccao",
      corpo: pagina.quandoEvitar,
      resumo: resumoDe(pagina.quandoEvitar),
    });
  }
  if (pagina.notaEvidencia) {
    entradas.push({
      id: "nota-evidencia",
      titulo: "Nota sobre o nível de evidência",
      tipo: "seccao",
      corpo: pagina.notaEvidencia,
      resumo: resumoDe(pagina.notaEvidencia),
    });
  }
  if (pagina.errosFrequentes.length) {
    entradas.push({
      id: "erros-frequentes",
      titulo: "Erros frequentes",
      tipo: "seccao",
      corpo: "",
      itens: pagina.errosFrequentes.map((e) => e.texto),
      resumo: `${pagina.errosFrequentes.length} erro(s) documentado(s) a partir do banco de justificações.`,
    });
  }

  return entradas;
}

export function obterEntrada(idPagina: string, idEntrada: string): { estrutura: EstruturaPagina; entrada: EntradaAprender } | null {
  const estrutura = obterEstrutura(idPagina);
  if (!estrutura) return null;
  const entrada = entradasDaPagina(estrutura).find((e) => e.id === idEntrada);
  return entrada ? { estrutura, entrada } : null;
}
