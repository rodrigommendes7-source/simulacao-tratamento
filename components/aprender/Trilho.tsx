"use client";

import Link from "next/link";

/** Trilho de navegação (breadcrumb) — em drill-down o aluno precisa de saber em que camada está e de voltar uma camada atrás, não só à raiz. */
export default function Trilho({ itens }: { itens: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Trilho de navegação" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {itens.map((item, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          {i > 0 ? <span className="lbl" aria-hidden="true">/</span> : null}
          {item.href ? (
            <Link href={item.href} className="lbl" style={{ color: "var(--accent)" }}>
              {i === 0 ? "← " : ""}
              {item.label}
            </Link>
          ) : (
            <span className="lbl">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
