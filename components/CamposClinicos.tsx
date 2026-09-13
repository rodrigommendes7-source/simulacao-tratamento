"use client";

/**
 * Componentes de seleção reutilizados entre a Fase 2 (Identificação) do
 * fluxo "Resolver caso" (components/CaseSolver.tsx) e a Consulta pontual
 * (app/consulta/page.tsx) — mesma lógica de seleção, sem duplicar.
 */

export const ACC = "var(--accent)";
export const SEL: React.CSSProperties = { background: ACC, borderColor: ACC, color: "var(--accent-ink)" };

export function alternarConjunto<T>(setState: React.Dispatch<React.SetStateAction<Set<T>>>, valor: T) {
  setState((prev) => {
    const novo = new Set(prev);
    if (novo.has(valor)) novo.delete(valor);
    else novo.add(valor);
    return novo;
  });
}

export function Grupo({ titulo, children, nota }: { titulo: string; children: React.ReactNode; nota?: string }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div className="lbl">{titulo}</div>
      {nota ? <p className="mu" style={{ fontSize: 11.5, margin: "4px 0 0" }}>{nota}</p> : null}
      <div className="wrapchips" style={{ marginTop: 9 }}>{children}</div>
    </div>
  );
}

/** Seleção única (radio-like) entre um conjunto fixo de valores. */
export function ChipUnico<T extends string>({
  opcoes,
  labels,
  valor,
  onChange,
}: {
  opcoes: readonly T[];
  labels: Record<T, string>;
  valor: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <>
      {opcoes.map((v) => (
        <button key={v} type="button" className="chip" style={valor === v ? SEL : undefined} onClick={() => onChange(v)}>
          {labels[v]}
        </button>
      ))}
    </>
  );
}

/** Seleção múltipla (toggle) entre um conjunto fixo de valores. */
export function ChipMulti<T extends string>({
  opcoes,
  labels,
  valor,
  onChange,
}: {
  opcoes: readonly T[];
  labels: Record<T, string>;
  valor: ReadonlySet<T>;
  onChange: (v: T) => void;
}) {
  return (
    <>
      {opcoes.map((v) => (
        <button key={v} type="button" className="chip" style={valor.has(v) ? SEL : undefined} onClick={() => onChange(v)}>
          {labels[v]}
        </button>
      ))}
    </>
  );
}

/** Toggle booleano simples, com o rótulo do próprio sinal como texto do chip. */
export function ChipBooleano({ label, valor, onChange }: { label: string; valor: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" className="chip" style={valor ? SEL : undefined} onClick={() => onChange(!valor)}>
      {label}
    </button>
  );
}
