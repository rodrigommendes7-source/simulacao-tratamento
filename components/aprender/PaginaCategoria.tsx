"use client";

import Link from "next/link";
import { TODOS_CASOS_TESTE } from "../../dados/casosTeste";
import { obterPagina } from "../../dados/aprender";
import { entradasDaPagina, obterEstrutura } from "../../lib/aprenderSubtopicos";
import { imagensDoSubtopico } from "../../lib/aprenderImagens";
import type { EixoAprender } from "../../tipos/aprender";
import BlocoReferencias from "./BlocoReferencias";
import Fotografias from "./Fotografias";
import Trilho from "./Trilho";

const LABEL_EIXO: Record<EixoAprender, string> = {
  tema_clinico: "Tema clínico",
  tratamento: "Tratamento",
  etiologia: "Etiologia",
};

const LABEL_NIVEL: Record<string, string> = {
  forte: "Forte",
  moderada: "Moderada",
  limitada: "Limitada",
  mista: "Mista",
};

/**
 * 2.ª camada do drill-down: a categoria (ex.: "Tecido do leito da ferida")
 * não mostra o conteúdo todo — mostra a lista dos seus subtópicos, cada um
 * com o seu próprio ecrã. Nada aqui expande no lugar.
 */
export default function PaginaCategoria({ id }: { id: string }) {
  const estrutura = obterEstrutura(id);

  if (!estrutura) {
    return (
      <div className="card animate-up" style={{ padding: 24 }}>
        <h2 className="h2">Página não encontrada</h2>
        <Link href="/aprender" className="btn" style={{ marginTop: 14 }}>← Voltar a Aprender</Link>
      </div>
    );
  }

  const { pagina, preambulo, nota, subtopicos } = estrutura;
  const entradas = entradasDaPagina(estrutura);

  const relacionadas = pagina.relacionados
    .map((rid) => obterPagina(rid))
    .filter((p): p is NonNullable<typeof p> => !!p);
  const casos = (pagina.casosRelacionados ?? [])
    .map((cid) => TODOS_CASOS_TESTE.find((c) => c.id === cid))
    .filter((c): c is NonNullable<typeof c> => !!c);

  // Na categoria só se ilustra quando a página tem foto própria de contexto
  // (etiologias); as fotos por tecido vivem no subtópico respetivo.
  const imagens = subtopicos.length ? [] : imagensDoSubtopico(pagina.id, null, pagina.casosRelacionados ?? []);

  return (
    <div className="animate-up">
      <Trilho itens={[{ label: "Aprender", href: "/aprender" }, { label: LABEL_EIXO[pagina.eixo] }]} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
        <h1 className="h1">{pagina.titulo}</h1>
        {pagina.nivelEvidencia ? (
          <span className="chip" style={{ cursor: "default", marginTop: 6 }}>
            Evidência: {LABEL_NIVEL[pagina.nivelEvidencia]}
          </span>
        ) : null}
      </div>

      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0, color: "var(--ink)" }}>{pagina.resumo}</p>
        {subtopicos.length && preambulo ? (
          <p style={{ fontSize: 13.5, lineHeight: 1.7, margin: "12px 0 0", color: "var(--text-soft)", whiteSpace: "pre-line" }}>
            {preambulo}
          </p>
        ) : null}
      </div>

      {pagina.apositosExemplo?.length ? (
        <div className="soft" style={{ marginTop: 14, padding: "14px 16px" }}>
          <div className="lbl">Apósitos exemplo</div>
          <div className="wrapchips" style={{ marginTop: 9 }}>
            {pagina.apositosExemplo.map((a) => (
              <span key={a} className="chip" style={{ cursor: "default" }}>{a}</span>
            ))}
          </div>
        </div>
      ) : null}

      <Fotografias imagens={imagens} />

      <div style={{ marginTop: 22 }}>
        <div className="lbl">
          {subtopicos.length ? `Escolha um tópico · ${subtopicos.length}` : "Secções"}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
            gap: 14,
            marginTop: 10,
          }}
        >
          {entradas.map((e) => (
            <Link key={e.id} href={`/aprender/${pagina.id}/${e.id}`} className="card tile" style={{ padding: 18, display: "block" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 className="h3" style={{ flex: 1 }}>{e.titulo}</h3>
                <span className="lbl" aria-hidden="true">→</span>
              </div>
              <p className="mu" style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.5 }}>{e.resumo}</p>
            </Link>
          ))}
        </div>
      </div>

      {nota ? (
        <div className="soft" style={{ marginTop: 14, padding: "14px 16px" }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.7, margin: 0, color: "var(--text-soft)", whiteSpace: "pre-line" }}>
            {nota}
          </p>
        </div>
      ) : null}

      {relacionadas.length ? (
        <div style={{ marginTop: 22 }}>
          <div className="lbl">Relacionados</div>
          <div className="wrapchips" style={{ marginTop: 10 }}>
            {relacionadas.map((r) => (
              <Link key={r.id} href={`/aprender/${r.id}`} className="chip">
                {r.titulo} <span className="lbl">· {LABEL_EIXO[r.eixo]}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {casos.length ? (
        <div style={{ marginTop: 16 }}>
          <div className="lbl">Casos de teste onde este tema é central</div>
          <div className="wrapchips" style={{ marginTop: 10 }}>
            {casos.map((c) => (
              <Link key={c.id} href={`/casos/${c.id}`} className="chip">{c.titulo}</Link>
            ))}
          </div>
        </div>
      ) : null}

      <BlocoReferencias ids={pagina.referencias} />
    </div>
  );
}
