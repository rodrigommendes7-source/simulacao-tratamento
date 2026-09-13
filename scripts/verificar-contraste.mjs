/**
 * Verificação automática de contraste (WCAG 2.1) sobre os tokens reais de
 * app/globals.css — lê o ficheiro, extrai as duas paletas (escura e clara) e
 * testa cada par texto/fundo possível. Corre com `npm run verificar:contraste`.
 *
 * Critérios: 4.5:1 para texto normal (AA), 3:1 para limites de componentes
 * de interface (AA não-textual, 1.4.11).
 */
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

function extrairBloco(seletor) {
  const i = css.indexOf(seletor);
  if (i === -1) throw new Error(`Bloco não encontrado: ${seletor}`);
  const bloco = css.slice(i, css.indexOf("}", i));
  const tokens = {};
  for (const [, nome, valor] of bloco.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6});/g)) {
    tokens[nome] = valor.toLowerCase();
  }
  return tokens;
}

const PALETAS = {
  escuro: extrairBloco(':root[data-theme="dark"]'),
  claro: extrairBloco(':root[data-theme="light"]'),
};

function luminancia(hex) {
  const canais = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2];
}

function contraste(a, b) {
  const [l1, l2] = [luminancia(a), luminancia(b)];
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** Tokens usados como cor de texto na aplicação. */
const TEXTO = ["ink", "text-soft", "muted", "label", "accent", "accent-hover", "tile-alt-ink", "success", "danger", "warning"];
/** Tokens usados como fundo de superfícies onde esse texto aparece. */
const FUNDO = ["bg", "surface", "surface-alt", "soft", "soft-alt", "track", "selected", "tile-alt", "nav-bg"];
/**
 * Pares fixos: texto sobre preenchimento de marca, e limites de componentes
 * (3:1). Cada tinta ("-ink") só é legível sobre o fundo com que faz par —
 * usar `--accent-ink` (quase preto) sobre `--tile-alt` (verde escuro) deixou
 * o tile "Escolher caso" da página inicial a 1.24:1, praticamente invisível.
 */
const PARES_FIXOS = [
  ["accent-ink", "accent", 4.5],
  ["accent-ink", "accent-hover", 4.5],
  ["tile-alt-ink", "tile-alt", 4.5],
  ["line-strong", "surface", 3],
  ["line-strong", "soft", 3],
  ["line-strong", "soft-alt", 3],
];

let falhas = 0;

for (const [nome, t] of Object.entries(PALETAS)) {
  console.log(`\n── modo ${nome} ──`);
  for (const f of TEXTO) {
    let pior = Infinity;
    let onde = "";
    for (const b of FUNDO) {
      const r = contraste(t[f], t[b]);
      if (r < pior) [pior, onde] = [r, b];
    }
    const mau = pior < 4.5;
    if (mau) falhas++;
    console.log(`${mau ? "FALHA" : "  ok "}  ${f.padEnd(13)} pior ${pior.toFixed(2)}:1 sobre --${onde}`);
  }
  for (const [f, b, minimo] of PARES_FIXOS) {
    const r = contraste(t[f], t[b]);
    const mau = r < minimo;
    if (mau) falhas++;
    console.log(`${mau ? "FALHA" : "  ok "}  ${f} sobre ${b}: ${r.toFixed(2)}:1 (mín. ${minimo})`);
  }
}

console.log(`\n${falhas === 0 ? "Todos os pares cumprem WCAG AA." : `${falhas} par(es) abaixo do mínimo.`}`);
process.exit(falhas === 0 ? 0 : 1);
