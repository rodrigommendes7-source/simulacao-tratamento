"use client";

import Link from "next/link";
import type { ImagemAprender } from "../../lib/aprenderImagens";

/**
 * Fotografias ilustrativas de uma página de detalhe.
 *
 * As coordenadas do destaque são normalizadas 0-1 sobre a caixa da imagem
 * (a mesma convenção do ecrã de resolução de casos), por isso o SVG usa
 * viewBox 0 0 1 1 com preserveAspectRatio="none" sobreposto exatamente à
 * mesma caixa — o polígono fica alinhado com a fotografia.
 */
function Destaque({ pontos }: { pontos: { x: number; y: number }[] }) {
  const d = pontos.map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <svg
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
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
              <div className="ph" style={{ height: 300, position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt={img.legenda} />
                {img.destaque?.length ? <Destaque pontos={img.destaque} /> : null}
              </div>
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
