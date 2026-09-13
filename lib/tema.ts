"use client";

export type Tema = "dark" | "light";

const CHAVE_TEMA = "sf_tema";

export function obterTema(): Tema {
  if (typeof window === "undefined") return "dark";
  const guardado = window.localStorage.getItem(CHAVE_TEMA);
  if (guardado === "dark" || guardado === "light") return guardado;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function aplicarTema(tema: Tema): void {
  document.documentElement.setAttribute("data-theme", tema);
  window.localStorage.setItem(CHAVE_TEMA, tema);
}

/** Script inline (sem "use client") a injetar no <head> para aplicar o tema antes da hidratação — evita flash de tema errado. */
export const SCRIPT_TEMA_INICIAL = `
(function () {
  try {
    var t = localStorage.getItem("${CHAVE_TEMA}");
    if (t !== "dark" && t !== "light") {
      t = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    document.documentElement.setAttribute("data-theme", t);
  } catch (e) {}
})();
`;
