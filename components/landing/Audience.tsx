export default function Audience() {
  return (
    <section className="border-t hairline">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <h2 className="font-display text-2xl italic text-ink">
          Para quem é
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-12 md:grid-cols-2">
          <div>
            <h3 className="font-medium text-ink">Estudantes de enfermagem</h3>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink/80">
              Antes de tratar uma ferida real, é preciso errar sem
              consequências. O simulador expõe-te a casos que variam em
              gravidade e etiologia, obriga-te a justificar cada escolha e
              devolve-te o raciocínio clínico por trás da resposta certa —
              não apenas se acertaste ou erraste.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-ink">Docentes</h3>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink/80">
              Os casos podem ser usados como complemento às aulas práticas,
              permitindo discutir decisões de tratamento com referência
              direta às guidelines internacionais em vez de depender apenas
              de casos hipotéticos descritos em texto.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
