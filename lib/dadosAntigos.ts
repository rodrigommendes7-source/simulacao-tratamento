"use client";

/**
 * Limpeza do armazenamento local da versão anterior.
 *
 * Até esta versão, contas, histórico, consultas e rascunhos viviam todos no
 * `localStorage`, em chaves `sf_*`. Passaram para a base de dados, associados
 * a uma conta no servidor.
 *
 * Decisão tomada com o Rodrigo (ver CLAUDE.md): **recomeço limpo**. Os dados
 * antigos não são importados. As razões: eram locais a um browser, o universo
 * em circulação é de testes, e uma importação assistida seria código escrito
 * de propósito para ser apagado daqui a pouco tempo.
 *
 * O que este módulo faz, então, é só uma coisa: apagar as chaves antigas para
 * não ficarem lá esquecidas — incluindo `sf_contas`, que contém derivações de
 * PINs que as pessoas tendem a reutilizar noutros sítios. Devolve se
 * encontrou alguma coisa, para a interface poder explicar uma vez o que
 * aconteceu em vez de o histórico simplesmente desaparecer sem palavra.
 */

/** Prefixo de todas as chaves da versão local. */
const PREFIXO = "sf_";

/** Marca de que o aviso já foi mostrado — a única chave `sf_*` que fica. */
const CHAVE_AVISO = "sf_aviso_migracao_visto";

/**
 * Apaga tudo o que a versão local deixou e diz se havia dados do aluno.
 *
 * A marca do aviso é escrita sempre, mesmo quando não havia nada: sem isso, um
 * browser limpo faria a varredura a cada arranque para não encontrar nada.
 */
export function limparDadosAntigos(): { haviaDados: boolean } {
  if (typeof window === "undefined") return { haviaDados: false };

  try {
    if (window.localStorage.getItem(CHAVE_AVISO)) return { haviaDados: false };

    // Recolher primeiro e remover depois: remover durante a iteração faz os
    // índices deslizarem e salta chaves.
    const chaves: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const chave = window.localStorage.key(i);
      if (chave && chave.startsWith(PREFIXO) && chave !== CHAVE_AVISO) chaves.push(chave);
    }

    // `sf_utilizador` sozinho é só a sessão antiga, não é histórico — não
    // justifica avisar ninguém de que perdeu dados.
    const haviaDados = chaves.some((c) => c !== "sf_utilizador");

    for (const chave of chaves) window.localStorage.removeItem(chave);
    window.localStorage.setItem(CHAVE_AVISO, "1");

    return { haviaDados };
  } catch {
    // Armazenamento bloqueado (navegação privada, política do browser). Não
    // havia nada a limpar e não pode partir o arranque da aplicação.
    return { haviaDados: false };
  }
}
