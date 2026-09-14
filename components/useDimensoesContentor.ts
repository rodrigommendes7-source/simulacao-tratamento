"use client";

import { useEffect, useRef, useState } from "react";
import type { Dimensoes } from "../lib/enquadramentoImagem";

/**
 * Mede a caixa de conteúdo de um elemento e mantém a medida atualizada.
 *
 * É preciso para desenhar por cima de uma fotografia com `object-fit: cover`:
 * a fatia da imagem que fica cortada depende das proporções do contentor, por
 * isso a conversão de coordenadas (lib/enquadramentoImagem.ts) muda sempre que
 * a janela muda de largura — não é um cálculo que se possa fazer uma vez.
 *
 * Usa-se `clientWidth`/`clientHeight` e não `getBoundingClientRect()` porque a
 * borda de `.ph` não faz parte da área onde a imagem é pintada.
 */
export function useDimensoesContentor<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [dimensoes, setDimensoes] = useState<Dimensoes | null>(null);

  useEffect(() => {
    const alvo = ref.current;
    if (!alvo) return;
    const medir = () => setDimensoes({ largura: alvo.clientWidth, altura: alvo.clientHeight });
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(alvo);
    return () => observador.disconnect();
  }, []);

  return { ref, dimensoes };
}
