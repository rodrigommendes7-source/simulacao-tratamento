import type { Config } from "tailwindcss";

/**
 * O Tailwind é usado aqui de forma muito limitada: as cores, espaçamentos e
 * tipografia da app vivem em variáveis CSS (app/globals.css), e o único sítio
 * que usa utilitários é o `<body>` em app/layout.tsx (`font-sans antialiased`).
 *
 * Havia aqui uma paleta `colors` (accent lime `#bfe86f`, e outras) de uma
 * versão anterior do tema, que nenhuma classe chegava a usar e que não
 * correspondia a nada do tema atual — quem a lesse ficaria com a ideia errada
 * de quais são as cores do produto. Removida; as cores reais estão nos tokens
 * `--accent`, `--ink`, etc.
 *
 * `fontFamily` fica, porque é o que liga `font-sans`/`font-mono` às variáveis
 * que o next/font gera (app/fonts.ts).
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
