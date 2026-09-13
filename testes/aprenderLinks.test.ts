import { describe, expect, it } from "vitest";
import { APRENDER_ID_POR_CATEGORIA, APRENDER_ID_POR_TECNICA, APRENDER_ID_POR_ETIOLOGIA } from "../lib/aprenderLinks";
import { PAGINAS_APRENDER } from "../dados/aprender";
import { LABEL_CATEGORIA } from "../lib/etiquetas";
import { TODAS_TECNICAS } from "../dados/tecnicasAplicacao";
import { TODAS_ETIOLOGIAS } from "../tipos/variaveis";

const idsValidos = new Set(PAGINAS_APRENDER.map((p) => p.id));

describe("mapeamento de ids do Aprender (usado pelas Estatísticas)", () => {
  it("toda categoria de tratamento tem um id de página válido", () => {
    for (const categoria of Object.keys(LABEL_CATEGORIA)) {
      const alvo = APRENDER_ID_POR_CATEGORIA[categoria as keyof typeof APRENDER_ID_POR_CATEGORIA];
      expect(idsValidos.has(alvo), `categoria "${categoria}" aponta para "${alvo}", que não existe em Aprender`).toBe(true);
    }
  });

  it("toda técnica de aplicação tem um id de página válido", () => {
    for (const tecnica of TODAS_TECNICAS) {
      const alvo = APRENDER_ID_POR_TECNICA[tecnica.id];
      expect(idsValidos.has(alvo), `técnica "${tecnica.id}" aponta para "${alvo}", que não existe em Aprender`).toBe(true);
    }
  });

  it("toda etiologia com conteúdo tem um id de página válido", () => {
    for (const etiologia of TODAS_ETIOLOGIAS.filter((e) => e !== "outra")) {
      const alvo = APRENDER_ID_POR_ETIOLOGIA[etiologia];
      expect(idsValidos.has(alvo), `etiologia "${etiologia}" aponta para "${alvo}", que não existe em Aprender`).toBe(true);
    }
  });
});
