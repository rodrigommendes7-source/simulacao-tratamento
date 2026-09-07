import Link from "next/link";

export default function SimuladorPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between border-b hairline px-6 py-4">
        <Link href="/" className="text-sm font-medium hover:text-teal-clinico">
          ← Simulador de Feridas
        </Link>
        <span className="text-xs text-grafite">Área do simulador</span>
      </header>
      <main className="mx-auto flex max-w-5xl flex-col items-start px-6 py-16">
        <h1 className="text-xl font-medium">Motor clínico em construção</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink/80">
          Esta área vai receber os casos clínicos e o motor de avaliação. Por
          agora não há funcionalidade disponível.
        </p>
      </main>
    </div>
  );
}
