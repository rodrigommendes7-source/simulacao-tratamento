const steps = [
  {
    number: "01",
    title: "Apresentação do caso",
    description:
      "Recebes o historial clínico, a localização anatómica e o contexto do doente, tal como aconteceria numa consulta ou numa visita domiciliária.",
  },
  {
    number: "02",
    title: "Avaliação do estado da ferida",
    description:
      "Descreves o leito da ferida, as margens, o exsudado e os sinais de infeção — a observação clínica que precede qualquer decisão de tratamento.",
  },
  {
    number: "03",
    title: "Seleção do plano de tratamento",
    description:
      "Escolhes o penso, a frequência de troca e as medidas complementares, ponderando o que a avaliação te mostrou.",
  },
  {
    number: "04",
    title: "Feedback fundamentado",
    description:
      "Recebes uma análise da tua decisão com referência direta às guidelines clínicas que a sustentam, incluindo o que ficou por considerar.",
  },
];

export default function HowItWorks() {
  return (
    <section id="sobre" className="border-t hairline">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <h2 className="font-display text-2xl italic text-ink">
          Como funciona
        </h2>
        <ol className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2">
          {steps.map((step) => (
            <li key={step.number} className="flex gap-4">
              <span className="text-sm text-teal-clinico">
                {step.number}
              </span>
              <div>
                <h3 className="font-medium text-ink">{step.title}</h3>
                <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink/80">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
