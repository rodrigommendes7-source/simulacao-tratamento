"use client";

import { useEffect, useRef, useState } from "react";
import type { Passo } from "../../lib/sequenciaConsulta";

/**
 * Bolha central + opções da variável dispostas à volta.
 *
 * Fluxo: clicar no centro abre as opções; escolhe-se (uma ou várias); clicar
 * outra vez no centro submete a resposta daquela variável e avança. O centro
 * é sempre o mesmo botão — abre e confirma — para o gesto ser igual em todos
 * os passos, incluindo os de escolha múltipla, onde não havia forma de dizer
 * "já acabei" sem um botão à parte.
 *
 * Geometria: as opções ficam numa elipse (não num círculo) porque as
 * etiquetas são largas e baixas — num círculo, as de leste/oeste chocavam com
 * o centro e as vizinhas sobrepunham-se. Os raios são calculados a partir do
 * tamanho real das etiquetas e do número de opções, e acima de 8 opções
 * usam-se dois anéis: num anel só, 13 etiquetas não cabem sem se pisarem.
 */

/** Largura fixa das etiquetas — uniformes, para o anel ler como um conjunto e não como peças soltas. */
const LARGURA_OPCAO = 158;
/** Altura típica de uma etiqueta (2 linhas), usada só para calcular espaçamentos. */
const ALTURA_OPCAO = 52;
const DIAMETRO_CENTRO = 132;
/** Folga entre o centro e o primeiro anel. */
const FOLGA = 30;
/** A partir daqui o anel cresce com o número de opções; abaixo disto o raio base já chega. */
const OPCOES_SEM_CRESCIMENTO = 5;
/** Acima deste número de opções passa-se a dois anéis. */
const MAX_UM_ANEL = 8;

interface Anel {
  rx: number;
  ry: number;
  /** Índices das opções neste anel. */
  indices: number[];
  /** Deslocamento angular, para os anéis não alinharem os itens uns atrás dos outros. */
  offset: number;
}

function calcularAneis(n: number): Anel[] {
  const rxBase = LARGURA_OPCAO / 2 + DIAMETRO_CENTRO / 2 + FOLGA;
  const ryBase = ALTURA_OPCAO / 2 + DIAMETRO_CENTRO / 2 + FOLGA;
  const todos = Array.from({ length: n }, (_, i) => i);

  if (n <= MAX_UM_ANEL) {
    // Com 7 ou 8 opções o anel base já não chega — as etiquetas encostavam
    // umas às outras e as de leste/oeste entravam pelo centro adentro. O raio
    // cresce com o número de opções em vez de as amontoar.
    const fator = Math.max(1, n / OPCOES_SEM_CRESCIMENTO);
    return [{ rx: rxBase * fator, ry: ryBase * fator, indices: todos, offset: 0 }];
  }

  // Dois anéis: os primeiros ficam dentro, os restantes fora, com meio passo
  // de desfasamento para as etiquetas não ficarem radialmente alinhadas.
  const nInterno = Math.floor(n / 2);
  return [
    { rx: rxBase, ry: ryBase, indices: todos.slice(0, nInterno), offset: 0 },
    {
      rx: rxBase + LARGURA_OPCAO,
      ry: ryBase + ALTURA_OPCAO + 34,
      indices: todos.slice(nInterno),
      offset: Math.PI / (n - nInterno),
    },
  ];
}

export default function SeletorCircular({
  passo,
  selecionadas,
  onAlternar,
  onConfirmar,
}: {
  passo: Passo;
  selecionadas: string[];
  onAlternar: (valor: string) => void;
  onConfirmar: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [largura, setLargura] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cada passo começa fechado: a bolha central é o convite a abrir.
  useEffect(() => {
    setAberto(false);
  }, [passo.id]);

  // O anel só cabe a partir de certa largura; abaixo disso a disposição muda.
  useEffect(() => {
    const alvo = containerRef.current;
    if (!alvo) return;
    const observador = new ResizeObserver(([entrada]) => setLargura(entrada.contentRect.width));
    observador.observe(alvo);
    setLargura(alvo.getBoundingClientRect().width);
    return () => observador.disconnect();
  }, []);

  const aneis = calcularAneis(passo.opcoes.length);
  const anelExterno = aneis[aneis.length - 1];
  const alturaCaixa = 2 * (anelExterno.ry + ALTURA_OPCAO / 2) + 24;
  const larguraCaixa = 2 * (anelExterno.rx + LARGURA_OPCAO / 2) + 24;

  // O anel só se usa se couber mesmo: o tamanho necessário depende do número
  // de opções, por isso o limiar é o da própria caixa e não um valor fixo.
  const compacto = largura > 0 && largura < larguraCaixa;
  const podeConfirmar = passo.opcional || selecionadas.length > 0;

  function aoClicarCentro() {
    if (!aberto) {
      setAberto(true);
      return;
    }
    if (!podeConfirmar) return;
    onConfirmar();
  }

  /** O centro muda de papel: abre, depois confirma. */
  const rotuloCentro = !aberto
    ? "Escolher"
    : !podeConfirmar
      ? "Escolha uma opção"
      : selecionadas.length === 0
        ? "Não avaliei"
        : "Confirmar";

  const subtituloCentro = aberto && selecionadas.length > 0 ? `${selecionadas.length} selecionada(s)` : null;

  function Opcao({
    indice,
    estilo,
    variante = "anel",
  }: {
    indice: number;
    estilo: React.CSSProperties;
    variante?: "anel" | "grelha";
  }) {
    const opcao = passo.opcoes[indice];
    const activa = selecionadas.includes(opcao.valor);
    return (
      <button
        onClick={() => onAlternar(opcao.valor)}
        aria-pressed={activa}
        className={variante === "anel" ? "bolha-opcao" : "bolha-opcao bolha-opcao-simples"}
        style={{
          width: LARGURA_OPCAO,
          minHeight: 46,
          padding: "9px 13px",
          borderRadius: 16,
          border: `1px solid ${activa ? "var(--accent)" : "var(--line-strong)"}`,
          background: activa ? "var(--accent)" : "var(--surface)",
          color: activa ? "var(--accent-ink)" : "var(--text-soft)",
          font: `${activa ? 700 : 600} 12.5px/1.35 inherit`,
          cursor: "pointer",
          textAlign: "center",
          // Etiquetas como "Induração/lipodermatosclerose" são uma palavra só:
          // sem isto transbordavam da caixa.
          overflowWrap: "anywhere",
          hyphens: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...estilo,
        }}
      >
        {opcao.label}
      </button>
    );
  }

  const centro = (
    <button
      onClick={aoClicarCentro}
      aria-expanded={aberto}
      aria-label={aberto ? `${rotuloCentro}: ${passo.titulo}` : `Escolher ${passo.titulo}`}
      className="bolha-central"
      style={{
        width: DIAMETRO_CENTRO,
        height: DIAMETRO_CENTRO,
        borderRadius: "50%",
        border: `2px solid ${aberto && podeConfirmar ? "var(--accent)" : "var(--line-strong)"}`,
        background: aberto && podeConfirmar ? "var(--accent)" : "var(--surface)",
        color: aberto && podeConfirmar ? "var(--accent-ink)" : "var(--ink)",
        font: "700 14.5px/1.3 inherit",
        cursor: aberto && !podeConfirmar ? "default" : "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        padding: 12,
        textAlign: "center",
      }}
    >
      <span>{rotuloCentro}</span>
      {subtituloCentro ? (
        <span style={{ font: "600 11px/1 inherit", opacity: 0.9 }}>{subtituloCentro}</span>
      ) : null}
      {aberto && podeConfirmar ? <span aria-hidden="true" style={{ fontSize: 13 }}>→</span> : null}
    </button>
  );

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <div className="lbl">{passo.titulo}</div>
        {passo.ajuda ? (
          <p className="mu" style={{ fontSize: 12.5, margin: "8px auto 0", maxWidth: 460, lineHeight: 1.5 }}>
            {passo.ajuda}
          </p>
        ) : null}
        {aberto && passo.multiplo ? (
          <p className="lbl" style={{ marginTop: 8 }}>Pode escolher mais do que uma</p>
        ) : null}
      </div>

      <div ref={containerRef} style={{ width: "100%" }}>
        {compacto ? (
          // Ecrã estreito: o anel não cabe, mas o gesto mantém-se — o centro
          // continua a abrir e a confirmar.
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "10px 0" }}>
            {centro}
            {aberto ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                {passo.opcoes.map((_, i) => (
                  <Opcao
                    key={passo.opcoes[i].valor}
                    indice={i}
                    variante="grelha"
                    estilo={{ animationDelay: `${i * 30}ms` }}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div
            style={{
              position: "relative",
              width: larguraCaixa,
              height: alturaCaixa,
              margin: "0 auto",
            }}
          >
            {/* Guia visual dos anéis — dá a ler a disposição radial sem competir com as etiquetas. */}
            {aberto ? (
              <svg
                aria-hidden="true"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
              >
                {aneis.map((anel, i) => (
                  <ellipse
                    key={i}
                    cx="50%"
                    cy="50%"
                    rx={anel.rx}
                    ry={anel.ry}
                    fill="none"
                    stroke="var(--line)"
                    strokeDasharray="3 7"
                  />
                ))}
              </svg>
            ) : null}

            <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", zIndex: 2 }}>
              {centro}
            </div>

            {aberto
              ? aneis.flatMap((anel) =>
                  anel.indices.map((indice, posicao) => {
                    const angulo =
                      (posicao / anel.indices.length) * 2 * Math.PI - Math.PI / 2 + anel.offset;
                    return (
                      <Opcao
                        key={passo.opcoes[indice].valor}
                        indice={indice}
                        estilo={{
                          position: "absolute",
                          left: `calc(50% + ${Math.cos(angulo) * anel.rx}px)`,
                          top: `calc(50% + ${Math.sin(angulo) * anel.ry}px)`,
                          transform: "translate(-50%,-50%)",
                          animationDelay: `${indice * 30}ms`,
                        }}
                      />
                    );
                  }),
                )
              : null}
          </div>
        )}
      </div>
    </div>
  );
}
