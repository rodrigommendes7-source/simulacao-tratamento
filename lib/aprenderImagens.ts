/**
 * Imagens ilustrativas do Aprender.
 *
 * Não há um banco de fotografias próprio da secção Aprender. O que existe já
 * anotado no projeto são as fotografias dos casos de teste com os polígonos
 * de `tipo_tecido_leito` desenhados por cima (dados/casosTeste.ts) — ou seja,
 * já se sabe, por caso, onde é que cada tecido é visível. Este módulo
 * reaproveita essa anotação: a página de um tecido mostra a fotografia do
 * caso onde esse tecido está marcado, com a região destacada.
 *
 * Quando não existe nenhum caso com o tecido anotado, devolve-se uma entrada
 * `pendente` — a interface mostra um marcador explícito de "falta fotografia"
 * em vez de esconder o problema ou de usar uma imagem que não ilustra o tema.
 */
import { TODOS_CASOS_TESTE } from "../dados/casosTeste";
import { CONTEUDO_POR_CASO } from "./casosContent";
import { LABEL_ETIOLOGIA } from "./etiquetas";
import type { Ponto2D, TipoTecido } from "../tipos/variaveis";
import { TODOS_TIPOS_TECIDO } from "../tipos/variaveis";

export interface ImagemAprender {
  /** Caminho em /public. Ausente quando `pendente`. */
  src?: string;
  legenda: string;
  /** Caso de teste de onde vem a fotografia. */
  casoId?: string;
  /** Região a destacar sobre a fotografia (coordenadas normalizadas 0-1, como em ZonaTecido). */
  destaque?: Ponto2D[];
  /** Sem fotografia própria disponível — a preencher mais tarde. */
  pendente?: boolean;
  /** O que é preciso obter, quando `pendente`. */
  notaPendente?: string;
}

/** `necrose_seca` → `necrose-seca`, o mesmo slug que lib/aprenderSubtopicos.ts deriva do título "Necrose seca". */
function slugDoTecido(tipo: TipoTecido): string {
  return tipo.replace(/_/g, "-");
}

const TECIDO_POR_SLUG = new Map<string, TipoTecido>(TODOS_TIPOS_TECIDO.map((t) => [slugDoTecido(t), t]));

/** Máximo de exemplos por tecido — dois chegam para mostrar variação sem encher a página. */
const MAX_EXEMPLOS = 2;

function imagensDeTecido(tipo: TipoTecido): ImagemAprender[] {
  const exemplos: ImagemAprender[] = [];

  for (const caso of TODOS_CASOS_TESTE) {
    const zonas = caso.caso.tipo_tecido_leito.filter((z) => z.tipo === tipo);
    if (zonas.length === 0) continue;
    const fotografia = CONTEUDO_POR_CASO[caso.id]?.fotografia;
    if (!fotografia) continue;

    // A maior zona anotada é a mais legível como exemplo.
    const maior = zonas.reduce((a, b) => (areaPoligono(b.poligono) > areaPoligono(a.poligono) ? b : a));
    exemplos.push({
      src: fotografia,
      casoId: caso.id,
      legenda: `${caso.titulo} — região assinalada`,
      destaque: maior.poligono,
    });
    if (exemplos.length >= MAX_EXEMPLOS) break;
  }

  if (exemplos.length === 0) {
    return [
      {
        pendente: true,
        legenda: "Sem fotografia disponível para este tecido",
        notaPendente:
          "Nenhum caso de teste tem este tecido anotado, por isso não há de onde reaproveitar uma imagem. Falta fotografia própria.",
      },
    ];
  }
  return exemplos;
}

/** Área por fórmula do shoelace — só para comparar zonas entre si. */
function areaPoligono(pontos: Ponto2D[]): number {
  let soma = 0;
  for (let i = 0; i < pontos.length; i++) {
    const a = pontos[i];
    const b = pontos[(i + 1) % pontos.length];
    soma += a.x * b.y - b.x * a.y;
  }
  return Math.abs(soma) / 2;
}

/** Fotografias dos casos ligados a uma página (usado nas etiologias, onde a foto ilustra a apresentação típica). */
function imagensDeCasos(casosIds: string[]): ImagemAprender[] {
  return casosIds.slice(0, MAX_EXEMPLOS).flatMap((id) => {
    const caso = TODOS_CASOS_TESTE.find((c) => c.id === id);
    const fotografia = caso ? CONTEUDO_POR_CASO[caso.id]?.fotografia : undefined;
    if (!caso || !fotografia) return [];
    return [{ src: fotografia, casoId: caso.id, legenda: caso.titulo }];
  });
}

/**
 * Imagens de um subtópico. `subtopicoId` vem do slug derivado em
 * lib/aprenderSubtopicos.ts; `casosRelacionados` vem da própria página.
 */
export function imagensDoSubtopico(
  paginaId: string,
  subtopicoId: string | null,
  casosRelacionados: string[] = [],
): ImagemAprender[] {
  if (paginaId === "tema-tecido-leito" && subtopicoId) {
    const tipo = TECIDO_POR_SLUG.get(subtopicoId);
    if (tipo) return imagensDeTecido(tipo);
  }

  // Etiologias: a fotografia do caso é a ilustração natural da apresentação típica.
  if (paginaId.startsWith("etio-")) {
    const doCaso = imagensDeCasos(casosRelacionados);
    if (doCaso.length) return doCaso;
    const etiologia = paginaId.replace("etio-", "").replace(/-/g, "_");
    const label = (LABEL_ETIOLOGIA as Record<string, string>)[etiologia] ?? "esta etiologia";
    return [
      {
        pendente: true,
        legenda: `Sem fotografia disponível para ${label}`,
        notaPendente: "Não há caso de teste desta etiologia de onde reaproveitar a fotografia. Falta fotografia própria.",
      },
    ];
  }

  // Temas e tratamentos: só se a própria página apontar casos.
  return imagensDeCasos(casosRelacionados);
}

/** Inventário do que falta — usado pelo script de validação para listar as imagens em falta. */
export function imagensEmFalta(): { tecido: TipoTecido; slug: string }[] {
  return TODOS_TIPOS_TECIDO.filter((tipo) => imagensDeTecido(tipo).some((i) => i.pendente)).map((tipo) => ({
    tecido: tipo,
    slug: slugDoTecido(tipo),
  }));
}
