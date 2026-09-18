"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { entrar, recuperar, registar, registarResultado } from "../../lib/estado";
import { ErroApi } from "../../lib/api";
import { ORIGEM_TEST_DRIVE, lerTentativa, limparTentativa } from "../../lib/testDrive";
import {
  MAX_PALAVRA_PASSE,
  MAX_UTILIZADOR,
  MIN_PALAVRA_PASSE,
  validarPalavraPasse,
  validarUtilizador,
} from "../../lib/contas";
import ThemeToggle from "../../components/ThemeToggle";
import CodigoRecuperacao from "../../components/CodigoRecuperacao";

type Modo = "entrar" | "criar" | "recuperar";

const TITULO: Record<Modo, React.ReactNode> = {
  entrar: (
    <>
      Entrar com o seu
      <br />
      nome de utilizador.
    </>
  ),
  criar: (
    <>
      Criar a sua
      <br />
      conta de treino.
    </>
  ),
  recuperar: (
    <>
      Repor a palavra-passe
      <br />
      com o código.
    </>
  ),
};

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("entrar");
  const [nome, setNome] = useState("");
  const [palavraPasse, setPalavraPasse] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  /**
   * Código de recuperação acabado de gerar. Enquanto estiver preenchido, o
   * ecrã não mostra mais nada: é a única vez que este código existe em claro,
   * e deixar a pessoa passar adiante por engano seria deixá-la sem forma de
   * repor a palavra-passe.
   */
  const [codigoNovo, setCodigoNovo] = useState<string | null>(null);
  /**
   * Veio do ecrã de resultado do test drive e tem uma resolução por guardar?
   *
   * Só nesse caso a tentativa é migrada. O marcador na ligação é o que torna
   * "diretamente a seguir" estrutural em vez de uma promessa: uma tentativa
   * esquecida no separador nunca se cola a um registo posterior sem relação
   * nenhuma com ela.
   */
  const [tentativaPorGuardar, setTentativaPorGuardar] = useState(false);
  /** A conta foi criada mas a resolução não chegou a ser gravada. */
  const [falhouMigracao, setFalhouMigracao] = useState(false);

  useEffect(() => {
    // Lê-se o parâmetro do `window` e não com `useSearchParams` para o ecrã de
    // entrada continuar pré-renderizado estaticamente — este valor só conta
    // depois de o cliente montar.
    const daTentativa = new URLSearchParams(window.location.search).get("origem") === ORIGEM_TEST_DRIVE;
    if (!daTentativa) {
      // Chegou aqui por outro caminho: a tentativa deixa de estar autorizada a
      // viajar e é esquecida já, em vez de ficar à espera de uma oportunidade.
      limparTentativa();
      return;
    }
    if (lerTentativa()) {
      setTentativaPorGuardar(true);
      setModo("criar");
    }
  }, []);

  /** O campo só aceita dígitos e trava no máximo — mais claro do que deixar escrever e recusar depois. */
  function escreverPin(valor: string, definir: (v: string) => void) {
    definir(valor.replace(/\D/g, "").slice(0, MAX_PALAVRA_PASSE));
  }

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    // Validar antes de ir à rede. O servidor valida na mesma — isto é só para
    // não gastar uma ida ao servidor num erro que se vê daqui.
    const erroNome = validarUtilizador(nome);
    if (erroNome) return setErro(erroNome);
    const erroPasse = validarPalavraPasse(palavraPasse);
    if (erroPasse) return setErro(erroPasse);
    if (modo !== "entrar" && palavraPasse !== confirmacao) {
      return setErro("As palavras-passe não coincidem.");
    }
    if (modo === "recuperar" && !codigo.trim()) {
      return setErro("Escreva o código de recuperação.");
    }

    setOcupado(true);
    try {
      const resultado =
        modo === "entrar"
          ? await entrar(nome, palavraPasse)
          : modo === "criar"
            ? await registar(nome, palavraPasse)
            : await recuperar(nome, codigo, palavraPasse);

      // A conta acabou de ser criada e a sessão já está iniciada: a resolução
      // do test drive vai para a base de dados **pela rota normal**, agora
      // autenticada. É por usar exatamente o mesmo caminho que o resultado
      // fica indistinguível de um resolvido com conta — mesma validação, e o
      // `versao_regras` carimbado no servidor como em qualquer outro.
      if (modo === "criar" && tentativaPorGuardar) {
        const tentativa = lerTentativa();
        if (tentativa) {
          try {
            await registarResultado(tentativa);
            limparTentativa();
          } catch {
            // A conta fica, a resolução perde-se. Dizê-lo é melhor do que
            // deixar a pessoa descobrir sozinha que o caso não está lá.
            limparTentativa();
            setFalhouMigracao(true);
          }
        }
      }

      // O registo e a recuperação devolvem um código novo, e é a única vez
      // que ele aparece. A sessão já está iniciada — só se entra na aplicação
      // depois de a pessoa confirmar que o guardou.
      if (resultado.codigoRecuperacao) {
        setCodigoNovo(resultado.codigoRecuperacao);
        return;
      }
      router.push("/");
    } catch (causa) {
      setErro(causa instanceof ErroApi ? causa.message : "Não foi possível continuar.");
    } finally {
      setOcupado(false);
    }
  }

  function trocarModo(novo: Modo) {
    setModo(novo);
    setErro(null);
    setPalavraPasse("");
    setConfirmacao("");
    setCodigo("");
  }

  const estiloCampo: React.CSSProperties = {
    background: "var(--soft-alt)",
    border: "1px solid var(--line-strong)",
    borderRadius: 10,
    padding: "11px 13px",
    color: "var(--ink)",
    fontSize: 15,
    width: "100%",
  };

  const estiloPin: React.CSSProperties = {
    ...estiloCampo,
    letterSpacing: ".3em",
    font: "500 17px/1 var(--font-jetbrains)",
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative", display: "flex", justifyContent: "center", alignItems: "center", padding: "40px 20px" }}>
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <ThemeToggle />
      </div>

      <div className="card animate-up" style={{ padding: 34, width: 460, maxWidth: "100%" }}>
        {codigoNovo ? (
          <>
            {falhouMigracao ? (
              <div
                role="alert"
                className="soft"
                style={{ padding: 14, marginBottom: 18, borderLeft: "3px solid var(--danger)" }}
              >
                <p className="mu" style={{ fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>
                  A conta foi criada, mas não conseguimos guardar a resolução que tinha feito — essa
                  perdeu-se. Pode resolver o caso outra vez a partir da lista de casos.
                </p>
              </div>
            ) : null}
            <CodigoRecuperacao codigo={codigoNovo} onContinuar={() => router.push("/")} />
          </>
        ) : (
          <>
            <div className="lbl">Identificação</div>
            <h1 className="h1" style={{ marginTop: 12 }}>
              {tentativaPorGuardar && modo === "criar" ? (
                <>
                  Crie a conta para
                  <br />
                  guardar a sua resolução.
                </>
              ) : (
                TITULO[modo]
              )}
            </h1>

            {tentativaPorGuardar && modo === "criar" ? (
              <div className="soft" style={{ marginTop: 16, padding: 14, borderLeft: "3px solid var(--accent)" }}>
                <p className="mu" style={{ fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>
                  A resolução que acabou de fazer fica guardada nesta conta assim que a criar, com a
                  pontuação categoria a categoria. Não pedimos email.
                </p>
              </div>
            ) : null}

            <div className="nav" style={{ marginTop: 20, display: "inline-flex" }} role="tablist">
              {(["entrar", "criar"] as Modo[]).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={modo === m}
                  className={modo === m ? "nav-on" : ""}
                  onClick={() => trocarModo(m)}
                  type="button"
                >
                  {m === "entrar" ? "Entrar" : "Criar conta"}
                </button>
              ))}
            </div>

            <form onSubmit={submeter}>
              <div className="soft" style={{ marginTop: 18, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span className="lbl">Nome de utilizador</span>
                  <input
                    value={nome}
                    onChange={(e) => setNome(e.target.value.slice(0, MAX_UTILIZADOR))}
                    placeholder="ex.: ana.silva"
                    autoComplete="username"
                    autoFocus
                    style={estiloCampo}
                  />
                </label>

                {modo === "recuperar" ? (
                  <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span className="lbl">Código de recuperação</span>
                    <input
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                      placeholder="ACDE-FGHJ-KMNP"
                      autoComplete="off"
                      style={{ ...estiloCampo, font: "500 15px/1.2 var(--font-jetbrains)" }}
                    />
                  </label>
                ) : null}

                <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span className="lbl">
                    {modo === "recuperar" ? "Nova palavra-passe" : "Palavra-passe"} ({MIN_PALAVRA_PASSE} a{" "}
                    {MAX_PALAVRA_PASSE} dígitos)
                  </span>
                  <input
                    value={palavraPasse}
                    onChange={(e) => escreverPin(e.target.value, setPalavraPasse)}
                    placeholder="••••••"
                    type="password"
                    inputMode="numeric"
                    autoComplete={modo === "entrar" ? "current-password" : "new-password"}
                    style={estiloPin}
                  />
                </label>

                {modo !== "entrar" ? (
                  <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span className="lbl">Confirmar palavra-passe</span>
                    <input
                      value={confirmacao}
                      onChange={(e) => escreverPin(e.target.value, setConfirmacao)}
                      placeholder="••••••"
                      type="password"
                      inputMode="numeric"
                      autoComplete="new-password"
                      style={estiloPin}
                    />
                  </label>
                ) : null}

                {erro ? (
                  <div role="alert" style={{ color: "var(--danger)", fontSize: 12.5, lineHeight: 1.5 }}>{erro}</div>
                ) : null}
              </div>

              <button className="btn btn-p" style={{ width: "100%", marginTop: 14 }} type="submit" disabled={ocupado}>
                {ocupado
                  ? "A verificar…"
                  : modo === "entrar"
                    ? "Entrar"
                    : modo === "criar"
                      ? "Criar conta e entrar"
                      : "Repor palavra-passe"}
              </button>
            </form>

            <button
              className="chip"
              type="button"
              style={{ marginTop: 14, fontSize: 12 }}
              onClick={() => trocarModo(modo === "recuperar" ? "entrar" : "recuperar")}
            >
              {modo === "recuperar" ? "← Voltar a entrar" : "Perdeu a palavra-passe?"}
            </button>

            {/*
              O test drive é o caminho que queremos que a maioria siga à
              primeira visita: pedir compromisso antes de mostrar valor inverte
              a ordem. Por isso é um cartão inteiro, com o que se vai ver — e
              não um link discreto no rodapé. Não aparece a quem veio de lá,
              que já resolveu o caso e só tem de criar a conta.
            */}
            {tentativaPorGuardar ? null : (
              <div className="card" style={{ marginTop: 18, padding: 18, borderColor: "var(--accent)" }}>
                <div className="lbl" style={{ color: "var(--accent)" }}>Ainda não tem conta?</div>
                <h2 className="h3" style={{ marginTop: 8 }}>Experimente primeiro, sem se registar.</h2>
                <p className="mu" style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.6 }}>
                  Resolva um caso real de deiscência cirúrgica — as cinco etapas e a avaliação completa,
                  tal como um aluno com conta. Demora poucos minutos e não pede nada.
                </p>
                <Link
                  href="/experimentar"
                  className="btn btn-p"
                  style={{ marginTop: 14, display: "inline-flex" }}
                >
                  Experimentar um caso →
                </Link>
              </div>
            )}

            <p className="mu" style={{ fontSize: 12, marginTop: 16, lineHeight: 1.6 }}>
              A conta fica guardada no servidor do simulador, por isso pode entrar a partir de qualquer
              computador. Não pedimos email: se perder a palavra-passe, o código de recuperação que lhe damos
              no registo é a única forma de a repor — guarde-o. Não use uma palavra-passe que use noutro sítio.{" "}
              <Link href="/privacidade" style={{ color: "var(--accent)" }}>
                Como tratamos os seus dados
              </Link>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}
