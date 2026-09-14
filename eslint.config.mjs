import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

/**
 * Configuração do ESLint em formato "flat" (ESLint 9+).
 *
 * O `.eslintrc.json` que aqui estava deixou de ser lido a partir do ESLint 9
 * — `npm run lint` falhava com "couldn't find an eslint.config.(js|mjs|cjs)"
 * e ninguém dava por isso porque o `next build` corre o seu próprio lint
 * interno. As regras são as mesmas de antes (`next/core-web-vitals`),
 * convertidas com o `FlatCompat` porque o `eslint-config-next` ainda é
 * publicado no formato antigo.
 *
 * Ficheiro `.mjs` e não `.js` porque o `package.json` não declara
 * `"type": "module"`.
 */
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  {
    ignores: [".next/**", "node_modules/**", "out/**", "build/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals"),
];

export default config;
