"use client";

import Image from "next/image";
import Link from "next/link";
import type { ImagemAprender } from "../../lib/aprenderImagens";
import {
  caixaPintadaCover,
  dimensoesValidas,
  type Dimensoes,
} from "../../lib/enquadramentoImagem";
import { useDimensoesContentor } from "../useDimensoesContentor";
import { useState } from "react";

/**
 * Fotografias ilustrativas de uma página de detalhe.
 *
 * As coordenadas do destaque são normalizadas 0-1 sobre a **imagem inteira**,
 * mas a imagem é pintada com `object-fit: cover` — escalada até cobrir a caixa
 * e cortada no que sobra. Sobrepor o SVG à caixa (viewBox 0 0 1 1 esticado por
 * `preserveAspectRatio="none"` sobre `inset: 0`), como se fazia, desenhava o
 * polígono fora do tecido que ele devia assinalar, com um desvio que mudava
 * com a largura da janela.
 *
 * O SVG é agora posicionado sobre a caixa efetivamente pintada pela imagem —
 * que é maior do que o contentor e transborda para fora dele, exatamente como
 * a própria fotografia; o `overflow: hidden` de `.ph` corta as duas da mesma
 * maneira, por isso ficam alinhadas.
 */
function Destaque({
  pontos,
  contentor,
  natural,
}: {
  pontos: { x: number; y: number }[];
  contentor: Dimensoes | null;
  natural: Dimensoes | null;
}) {
  const d = pontos.map((p) => `${p.x},${p.y}`).join(" ");
  // Sem as medidas (imagem por carregar) sobrepõe-se ao contentor, como antes
  // — é o melhor palpite disponível e corrige-se assim que a imagem carrega.
  const caixa =
    dimensoesValidas(contentor) && dimensoesValidas(natural)
      ? caixaPintadaCover(contentor, natural)
      : null;

  return (
    <svg
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{
        position: "absolute",
        left: caixa ? `${caixa.esquerda}px` : 0,
        top: caixa ? `${caixa.topo}px` : 0,
        width: caixa ? `${caixa.largura}px` : "100%",
        height: caixa ? `${caixa.altura}px` : "100%",
        pointerEvents: "none",
      }}
    >
      <polygon
        points={d}
        fill="var(--accent)"
        fillOpacity="0.22"
        stroke="var(--accent)"
        strokeWidth="0.006"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Uma fotografia com o seu destaque, a medir-se a si própria. */
function FotografiaComDestaque({ img }: { img: ImagemAprender }) {
  const { ref, dimensoes } = useDimensoesContentor<HTMLDivElement>();
  const [natural, setNatural] = useState<Dimensoes | null>(null);

  return (
    <div className="ph" style={{ height: 300, position: "relative" }}>
      <div ref={ref} style={{ position: "absolute", inset: 0 }}>
        <Image
          src={img.src!}
          alt={img.legenda}
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
          style={{ objectFit: "cover" }}
          onLoad={(e) =>
            setNatural({
              largura: e.currentTarget.naturalWidth,
              altura: e.currentTarget.naturalHeight,
            })
          }
        />
        {img.destaque?.length ? (
          <Destaque pontos={img.destaque} contentor={dimensoes} natural={natural} />
        ) : null}
      </div>
    </div>
  );
}

export default function Fotografias({ imagens }: { imagens: ImagemAprender[] }) {
  if (imagens.length === 0) return null;

  return (
    <section style={{ marginTop: 20 }}>
      <div className="lbl">Fotografias</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: imagens.length > 1 ? "repeat(auto-fit,minmax(260px,1fr))" : "1fr",
          gap: 14,
          marginTop: 10,
        }}
      >
        {imagens.map((img, i) =>
          img.pendente ? (
            <div key={i} className="soft" style={{ padding: 16 }}>
              <div className="lbl" style={{ color: "var(--warning)" }}>Fotografia pendente</div>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--text-soft)", margin: "8px 0 0" }}>
                {img.legenda}.
              </p>
              {img.notaPendente ? (
                <p className="mu" style={{ fontSize: 12, lineHeight: 1.55, margin: "6px 0 0" }}>{img.notaPendente}</p>
              ) : null}
            </div>
          ) : (
            <figure key={i} style={{ margin: 0 }}>
              <FotografiaComDestaque img={img} />
              <figcaption className="mu" style={{ fontSize: 12, lineHeight: 1.5, marginTop: 8 }}>
                {img.destaque?.length ? "Região assinalada a verde. " : null}
                Fotografia reaproveitada de{" "}
                {img.casoId ? (
                  <Link href={`/casos/${img.casoId}`}>{img.legenda.replace(" — região assinalada", "")}</Link>
                ) : (
                  img.legenda
                )}
                .
              </figcaption>
            </figure>
          ),
        )}
      </div>
    </section>
  );
}
