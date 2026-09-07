import Link from "next/link";

export default function Masthead() {
  return (
    <header className="border-b hairline">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="font-display text-xl tracking-tight text-ink">
          Simulador de Feridas
        </span>
        <nav className="flex items-center gap-6 text-sm text-ink/80">
          <Link href="#sobre" className="hover:text-teal-clinico">
            Sobre
          </Link>
          <Link href="/simulador" className="hover:text-teal-clinico">
            Simulador
          </Link>
        </nav>
      </div>
    </header>
  );
}
