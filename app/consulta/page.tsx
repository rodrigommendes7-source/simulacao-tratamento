"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { decidirCaso } from "../../algoritmo/motorDecisao";
import { avaliarCausaTratada } from "../../algoritmo/causaTratada";
import { avaliarPortaoSistemico } from "../../algoritmo/portaoSistemico";
import { avaliarOncologico } from "../../algoritmo/oncologico";
import { avaliarTecnicas } from "../../algoritmo/avaliarTecnicas";
import { casoDaConsulta } from "../../lib/casoDaConsulta";
import {
  construirPassos,
  indiceProximoPasso,
  limparRespostasObsoletas,
  sequenciaCompleta,
  type RespostasConsulta,
} from "../../lib/sequenciaConsulta";
import { obterConsultas, registarConsulta, type ConsultaHistorico } from "../../lib/consultas";
import SeletorCircular from "../../components/consulta/SeletorCircular";
import EscolhasFeitas from "../../components/consulta/EscolhasFeitas";
import AnimacaoGeracao from "../../components/consulta/AnimacaoGeracao";
import ResultadoConsulta from "../../components/consulta/ResultadoConsulta";

/** A Consulta pontual é informativa: nada aqui é uma resposta de aluno a avaliar. */
const RESPOSTA_INFORMATIVA = { tratamentosSelecionados: [], medidasCausais: {} };

type Ecra = "sequencia" | "gerar" | "resultado";

export default function ConsultaPage() {
  const [respostas, setRespostas] = useState<RespostasConsulta>({});
  const [indiceForcado, setIndiceForcado] = useState<number | null>(null);
  const [ecra, setEcra] = useState<Ecra>("sequencia");

  const [consultas, setConsultas] = useState<ConsultaHistorico[]>([]);
  const [consultaRevisao, setConsultaRevisao] = useState<ConsultaHistorico | null>(null);

  useEffect(() => {
    setConsultas(obterConsultas());
  }, []);

  const passos = useMemo(() => construirPassos(respostas), [respostas]);
  const indiceNatural = indiceProximoPasso(passos, respostas);
  // Voltar atrás a um passo que entretanto desapareceu (mudar de etiologia
  // vascular remove o ABPI) deixaria o índice a apontar para fora da lista.
  const indiceAtual = indiceForcado !== null ? Math.min(indiceForcado, passos.length - 1) : indiceNatural;
  const passoAtual = passos[indiceAtual];
  const completa = sequenciaCompleta(passos, respostas);

  // Avaliação do caso em construção — tudo funções puras já existentes.
  const caso = useMemo(() => casoDaConsulta(respostas), [respostas]);
  const decisao = useMemo(() => decidirCaso(caso), [caso]);
  const tecnicas = useMemo(
    () => avaliarTecnicas([], { caso, nivelInfecao: decisao.nivelInfecao }),
    [caso, decisao],
  );
  const causaTratada = useMemo(
    () => avaliarCausaTratada(caso, RESPOSTA_INFORMATIVA, decisao.categoriasAplicaveis),
    [caso, decisao],
  );
  const portaoSistemico = useMemo(
    () => avaliarPortaoSistemico(decisao.nivelInfecao, RESPOSTA_INFORMATIVA),
    [decisao],
  );
  const oncologico = useMemo(
    () => (caso.etiologia === "oncologica_maligna" ? avaliarOncologico(caso, RESPOSTA_INFORMATIVA, decisao) : undefined),
    [caso, decisao],
  );

  function alternar(valor: string) {
    if (!passoAtual) return;
    setRespostas((prev) => {
      const atuais = prev[passoAtual.id] ?? [];
      const novos = passoAtual.multiplo
        ? atuais.includes(valor)
          ? atuais.filter((v) => v !== valor)
          : [...atuais, valor]
        : [valor];
      const atualizadas = { ...prev, [passoAtual.id]: novos };
      // Mudar uma resposta anterior pode fazer desaparecer passos seguintes
      // (ex.: etiologia vascular → pressão elimina o ABPI).
      return limparRespostasObsoletas(construirPassos(atualizadas), atualizadas);
    });
  }

  function confirmar() {
    if (!passoAtual) return;
    // Um passo opcional sem escolhas fica registado como respondido em branco,
    // para a sequência avançar sem ficar presa neste passo.
    setRespostas((prev) => (prev[passoAtual.id] === undefined ? { ...prev, [passoAtual.id]: [] } : prev));
    setIndiceForcado(null);
  }

  const irParaResultado = useCallback(() => setEcra("resultado"), []);

  function recomecar() {
    setRespostas({});
    setIndiceForcado(null);
    setConsultaRevisao(null);
    setEcra("sequencia");
    window.scrollTo({ top: 0 });
  }

  function guardar() {
    const nova = registarConsulta({ caso, decisao, tecnicas, causaTratada, portaoSistemico, oncologico });
    setConsultas((prev) => [...prev, nova]);
  }

  // ── Consulta antiga em revisão: mostra-se o snapshot, sem recalcular ──
  if (consultaRevisao) {
    return (
      <div className="animate-up">
        <h1 className="h1">Consulta pontual</h1>
        <div className="soft" style={{ marginTop: 16, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span className="lbl" style={{ color: "var(--accent)" }}>
            A rever a consulta de {new Date(consultaRevisao.data).toLocaleString("pt-PT")}
          </span>
          <span className="mu" style={{ fontSize: 12 }}>
            Resultado tal como foi calculado nessa altura — não é recalculado com a versão atual do motor.
          </span>
          <button className="btn" style={{ marginLeft: "auto" }} onClick={recomecar}>Nova consulta</button>
        </div>
        <div style={{ marginTop: 16 }}>
          <ResultadoConsulta
            caso={consultaRevisao.caso}
            decisao={consultaRevisao.decisao}
            tecnicas={consultaRevisao.tecnicas}
            causaTratada={consultaRevisao.causaTratada}
            portaoSistemico={consultaRevisao.portaoSistemico}
            oncologico={consultaRevisao.oncologico}
          />
        </div>
      </div>
    );
  }

  if (ecra === "gerar") {
    return (
      <div>
        <h1 className="h1">Consulta pontual</h1>
        <div style={{ marginTop: 18 }}>
          <AnimacaoGeracao onTerminar={irParaResultado} />
        </div>
      </div>
    );
  }

  if (ecra === "resultado") {
    return (
      <div className="animate-up">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
          <div>
            <h1 className="h1">Recomendação</h1>
            <p className="mu" style={{ fontSize: 13.5, marginTop: 6 }}>
              Só aparecem as categorias que dizem respeito a esta ferida. Não conta para a pontuação.
            </p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" onClick={guardar}>Guardar consulta</button>
            <button className="btn btn-p" onClick={recomecar}>Nova consulta</button>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <EscolhasFeitas passos={passos} respostas={respostas} indiceAtual={passos.length} onVoltarA={() => {}} />
        </div>

        <div style={{ marginTop: 16 }}>
          <ResultadoConsulta
            caso={caso}
            decisao={decisao}
            tecnicas={tecnicas}
            causaTratada={causaTratada}
            portaoSistemico={portaoSistemico}
            oncologico={oncologico}
          />
        </div>
      </div>
    );
  }

  // ── Sequência guiada ──
  return (
    <div className="animate-up">
      <h1 className="h1">Consulta pontual</h1>
      <p className="mu" style={{ fontSize: 13.5, marginTop: 6 }}>
        Uma variável de cada vez. Escolha, e avança sozinho para a seguinte. Não conta para a pontuação.
      </p>

      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16 }}>
        <EscolhasFeitas
          passos={passos}
          respostas={respostas}
          indiceAtual={indiceAtual}
          onVoltarA={(i) => setIndiceForcado(i)}
        />

        <div className="card" style={{ padding: "22px 22px 26px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span className="lbl">Passo {Math.min(indiceAtual + 1, passos.length)} de {passos.length}</span>
            {indiceForcado !== null ? (
              <button className="chip" style={{ marginLeft: "auto" }} onClick={() => setIndiceForcado(null)}>
                Voltar ao passo atual
              </button>
            ) : null}
          </div>
          <div className="bar" style={{ marginBottom: 10 }}>
            <div
              style={{
                height: "100%",
                background: "var(--accent)",
                width: `${(indiceNatural / passos.length) * 100}%`,
                transition: "width .35s ease",
              }}
            />
          </div>

          {passoAtual ? (
            <SeletorCircular
              key={passoAtual.id}
              passo={passoAtual}
              selecionadas={respostas[passoAtual.id] ?? []}
              onAlternar={alternar}
              onConfirmar={confirmar}
            />
          ) : (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <h2 className="h2">Todas as variáveis preenchidas</h2>
              <p className="mu" style={{ fontSize: 13.5, margin: "10px 0 20px" }}>
                Reveja as escolhas acima, ou gere já a recomendação.
              </p>
              <button className="btn btn-p" onClick={() => setEcra("gerar")} disabled={!completa}>
                Gerar Tratamento
              </button>
            </div>
          )}
        </div>

        {completa && passoAtual ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button className="btn btn-p" onClick={() => setEcra("gerar")}>Gerar Tratamento</button>
          </div>
        ) : null}

        {consultas.length ? (
          <div className="soft" style={{ padding: "14px 16px" }}>
            <div className="lbl">Consultas guardadas · {consultas.length}</div>
            <div className="wrapchips" style={{ marginTop: 10 }}>
              {[...consultas].reverse().slice(0, 8).map((c) => (
                <button key={c.id} className="chip" onClick={() => setConsultaRevisao(c)}>
                  {new Date(c.data).toLocaleString("pt-PT")}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
