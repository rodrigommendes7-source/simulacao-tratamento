/**
 * Modelo de conteúdo da secção "Aprender" — manual de estudo com 3 eixos de
 * navegação cruzada (tema clínico / tratamento / etiologia), reconstruído a
 * partir do conteúdo já validado nas Fases 1-3 do projeto. Nenhum campo
 * aqui introduz conteúdo clínico novo — cada página é extraída e
 * reestruturada de um documento existente (ver `referencias` e o
 * comentário de proveniência em cada entrada de `dados/aprender.ts`).
 */
import type { NivelEvidencia } from "./tratamento";

export type EixoAprender = "tema_clinico" | "tratamento" | "etiologia";

/** Um "erro frequente" documentado — sempre rastreável a um distrator do banco de justificações (dados/bancoJustificacoes.ts) ou a uma nota do documento de origem. */
export interface ErroFrequente {
  texto: string;
}

export interface PaginaAprender {
  id: string;
  eixo: EixoAprender;
  titulo: string;
  /** 1-2 frases, sempre visível. */
  resumo: string;
  /** Detalhe clínico completo — condensado do documento de origem, não reescrito com conteúdo novo. */
  detalheClinico: string;
  quandoIndicado?: string;
  quandoEvitar?: string;
  nivelEvidencia?: NivelEvidencia;
  /** Nota livre sobre o nível de evidência quando varia por subtipo/entrada (ex.: desbridamento tem vários métodos com evidências diferentes). */
  notaEvidencia?: string;
  errosFrequentes: ErroFrequente[];
  /** Só preenchido nas páginas do eixo "tratamento" (categorias) — nomes genéricos de substância, secção 10 da Fase 3. */
  apositosExemplo?: string[];
  /** IDs de outras páginas de aprender (qualquer eixo). */
  relacionados: string[];
  /** IDs de dados/casosTeste.ts onde este tema é central. */
  casosRelacionados?: string[];
  /** IDs de referencias.md. */
  referencias: string[];
}
