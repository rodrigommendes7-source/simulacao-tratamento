"use client";

import { useEffect, useState } from "react";

/**
 * Animação curta entre a última escolha e o resultado.
 *
 * A decisão é instantânea (o motor é síncrono e puro), mas passar do último
 * clique direto para uma página cheia de recomendações não dá a ler que houve
 * um processo. Estas etapas espelham o que o motor faz de facto — derivar o
 * nível de infeção, ver que categorias se aplicam, filtrar tratamentos — em
 * vez de serem um carregamento decorativo.
 */
const ETAPAS = [
  "A ler as variáveis clínicas…",
  "A cruzar com as regras de indicação…",
  "A verificar contraindicações…",
  "A preparar a recomendação…",
];

/** Duração total, repartida pelas etapas. */
const DURACAO_MS = 2600;

export default function AnimacaoGeracao({ onTerminar }: { onTerminar: () => void }) {
  const [etapa, setEtapa] = useState(0);

  useEffect(() => {
    const passo = DURACAO_MS / ETAPAS.length;
    const temporizadores = ETAPAS.map((_, i) =>
      window.setTimeout(() => setEtapa(i), i * passo),
    );
    const fim = window.setTimeout(onTerminar, DURACAO_MS);
    return () => {
      temporizadores.forEach(window.clearTimeout);
      window.clearTimeout(fim);
    };
  }, [onTerminar]);

  return (
    <div
      className="card animate-up"
      style={{ padding: "56px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}
      role="status"
      aria-live="polite"
    >
      <div style={{ position: "relative", width: 120, height: 120 }}>
        <div className="anel-procura" />
        <div className="anel-procura anel-procura-2" />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 30,
          }}
          aria-hidden="true"
        >
          🔎
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <h2 className="h2">A analisar o caso</h2>
        <p className="mu" style={{ fontSize: 13.5, marginTop: 8, minHeight: 20 }}>{ETAPAS[etapa]}</p>
      </div>

      <div className="bar" style={{ width: "min(320px, 80%)" }}>
        <div
          style={{
            height: "100%",
            background: "var(--accent)",
            width: `${((etapa + 1) / ETAPAS.length) * 100}%`,
            transition: "width .5s ease",
          }}
        />
      </div>
    </div>
  );
}
