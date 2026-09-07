import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        paper: "var(--paper)",
        "teal-clinico": "var(--teal-clinico)",
        navy: "var(--navy)",
        "rust-alerta": "var(--rust-alerta)",
        grafite: "var(--grafite)",
      },
      fontFamily: {
        display: ["var(--font-newsreader)", "serif"],
        sans: ["var(--font-ibm-plex-sans)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
      },
      maxWidth: {
        prose: "38rem",
      },
    },
  },
  plugins: [],
};

export default config;
