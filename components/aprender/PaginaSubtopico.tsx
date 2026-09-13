"use client";

import Link from "next/link";
import { entradasDaPagina, obterEntrada } from "../../lib/aprenderSubtopicos";
import { imagensDoSubtopico } from "../../lib/aprenderImagens";
import type { EixoAprender } from "../../tipos/aprender";
import BlocoReferencias from "./BlocoReferencias";
import Fotografias from "./Fotografias";
import Trilho from "./Trilho";

const LABEL_EIXO: Record<EixoAprender, string> = {
  tema_clinico: "Tema clínico",
  tratamento: "Tratamento",
  etiologia: "Etiologia",
};

/**
 * 3.ª e última camada do drill-down: a informação de um subtópico concreto
 * (ex.: "Esfacelo"), com as fotografias onde ele é visível e o bloco de
 * referências completo no fim.
 */
export default function PaginaSubtopico({ id, sub }: { id: string; sub: string }) {
  const resultado = obterEntrada(id, sub);

  if (!resultado) {
    return (
      <div className="card animate-up" style={{ padding: 24 }}>
        <h2 className="h2">Tópico não encontrado</h2>
        <Link href={`/aprender/${id}`} className="btn" style={{ marginTop: 14 }}>← Voltar à categoria</Link>
      </div>
    );
  }

  const { estrutura, entrada } = resultado;
  const { pagina } = estrutura;
  const entradas = entradasDaPagina(estrutura);
  const indice = entradas.findIndex((e) => e.id === entrada.id);
  const anterior = indice > 0 ? entradas[indice - 1] : null;
  const seguinte = indice < entradas.length - 1 ? entradas[indice + 1] : null;

  const imagens =
    entrada.tipo === "subtopico"
      ? imagensDoSubtopico(pagina.id, entrada.id, pagina.casosRelacionados ?? [])
      : [];

  return (
    <div className="animate-up">
      <Trilho
        itens={[
          { label: "Aprender", href: "/aprender" },
          { label: pagina.titulo, href: `/aprender/${pagina.id}` },
          { label: entrada.titulo },
        ]}
      />

      <h1 className="h1" style={{ marginTop: 10 }}>{entrada.titulo}</h1>
      <p className="mu" style={{ fontSize: 12.5, marginTop: 8 }}>
        {LABEL_EIXO[pagina.eixo]} · {pagina.titulo}
      </p>

      <div className="card" style={{ padding: 22, marginTop: 16 }}>
        {entrada.itens ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {entrada.itens.map((texto, i) => (
              <div key={i} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.65, color: "var(--text-soft)" }}>
                <span style={{ color: "var(--danger)", flex: "none" }} aria-hidden="true">✗</span>
                <span>{texto}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 14.5, lineHeight: 1.75, margin: 0, color: "var(--text-soft)", whiteSpace: "pre-line" }}>
            {entrada.corpo}
          </p>
        )}
      </div>

      <Fotografias imagens={imagens} />

      <BlocoReferencias ids={pagina.referencias} />

      <div style={{ display: "flex", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
        {anterior ? (
          <Link href={`/aprender/${pagina.id}/${anterior.id}`} className="btn">← {anterior.titulo}</Link>
        ) : null}
        {seguinte ? (
          <Link href={`/aprender/${pagina.id}/${seguinte.id}`} className="btn" style={{ marginLeft: "auto" }}>
            {seguinte.titulo} →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
