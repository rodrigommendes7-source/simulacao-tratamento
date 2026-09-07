const references = [
  {
    name: "IWGDF 2023",
    description:
      "International Working Group on the Diabetic Foot — guidelines para prevenção e tratamento de úlceras do pé diabético.",
  },
  {
    name: "EPUAP",
    description:
      "European Pressure Ulcer Advisory Panel — prevenção e tratamento de úlceras de pressão.",
  },
  {
    name: "WundDACH 2025",
    description:
      "Consenso alemão, austríaco e suíço para o tratamento local de feridas crónicas.",
  },
  {
    name: "TIME/TIMERS",
    description:
      "Modelo de preparação do leito da ferida — tecido, infeção/inflamação, humidade, margens, reparação e fatores sociais.",
  },
  {
    name: "EWMA",
    description:
      "European Wound Management Association — documentos de posicionamento sobre práticas de tratamento de feridas.",
  },
  {
    name: "WUWHS",
    description:
      "World Union of Wound Healing Societies — consensos internacionais em cuidados de feridas.",
  },
  {
    name: "APTFeridas 2025",
    description:
      "Associação Portuguesa de Tratamento de Feridas — recomendações nacionais para a prática clínica.",
  },
];

export default function References() {
  return (
    <section className="border-t hairline">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <h2 className="font-display text-2xl italic text-ink">
          Fundamentação científica
        </h2>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-ink/80">
          Cada caso e cada peça de feedback remetem para guidelines
          reconhecidas internacionalmente. Nenhum conteúdo clínico é
          inventado — é derivado das seguintes referências.
        </p>
        <ul className="mt-10 divide-y hairline border-t hairline">
          {references.map((ref) => (
            <li key={ref.name} className="flex flex-col gap-1 py-4 md:flex-row md:gap-6">
              <span className="w-40 shrink-0 font-medium text-ink">
                {ref.name}
              </span>
              <span className="max-w-prose text-sm leading-relaxed text-ink/80">
                {ref.description}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
