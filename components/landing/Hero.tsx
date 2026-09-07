import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="mx-auto grid max-w-5xl grid-cols-1 gap-12 px-6 py-16 md:grid-cols-5 md:py-24">
      <div className="animate-hero-in md:col-span-3">
        <h1 className="font-display text-4xl italic leading-tight text-ink md:text-5xl">
          Aprender a tratar feridas exige ver feridas.
        </h1>
        <p className="mt-6 max-w-prose text-base leading-relaxed text-ink/85">
          O Simulador de Feridas apresenta casos clínicos reais, passo a
          passo: descreve o estado da ferida, avalia o que vês e escolhe um
          plano de tratamento. Cada decisão recebe feedback fundamentado em
          guidelines internacionais, não em respostas certas ou erradas
          decoradas.
        </p>
        <Link
          href="/simulador"
          className="mt-8 inline-block border border-ink px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          Aceder ao simulador
        </Link>
      </div>
      <figure className="animate-hero-in md:col-span-2" style={{ animationDelay: "80ms" }}>
        <div className="relative aspect-[4/3] w-full overflow-hidden border hairline">
          <Image
            src="/caso1.jpg"
            alt="Ferida crónica em fase de desbridamento, com régua de medição clínica."
            fill
            className="object-cover"
            priority
          />
        </div>
        <figcaption className="mt-2 text-xs leading-snug text-grafite">
          Fig. 1 — Ferida crónica em fase de desbridamento, com tecido
          necrótico e exsudado visíveis.
        </figcaption>
      </figure>
    </section>
  );
}
