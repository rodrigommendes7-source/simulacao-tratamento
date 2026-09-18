import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacidade · Simulador de Feridas",
  description: "Que dados guardamos, onde, durante quanto tempo e como se apagam.",
};

/**
 * Política de privacidade, em linguagem simples.
 *
 * É uma página pública (ver PUBLICAS em components/AppShell.tsx): tem de poder
 * ser lida **antes** de alguém criar conta, que é precisamente quando a
 * decisão de entregar dados é tomada.
 */
export default function PrivacidadePage() {
  return (
    <div className="animate-up" style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px" }}>
      <div className="lbl">Privacidade</div>
      <h1 className="h1" style={{ marginTop: 12 }}>Como tratamos os seus dados.</h1>
      <p className="mu" style={{ fontSize: 13.5, marginTop: 12, lineHeight: 1.7 }}>
        Sem juridiquês. Se ficar alguma dúvida depois de ler isto, a resposta certa é perguntar.
      </p>

      <Seccao titulo="O que guardamos">
        <ul style={LISTA}>
          <li>O <strong>nome de utilizador</strong> que escolheu.</li>
          <li>
            A <strong>palavra-passe</strong>, transformada num resumo criptográfico (Argon2id). Não fica
            guardada como a escreveu, e não há forma de a recuperar a partir do que guardamos — nem por nós.
          </li>
          <li>O <strong>código de recuperação</strong>, guardado da mesma maneira, também irreversível.</li>
          <li>
            Os <strong>casos que resolveu</strong>: as respostas que deu, a pontuação, a data e a versão das
            regras clínicas com que foi avaliado.
          </li>
          <li>As <strong>consultas pontuais</strong> que escolheu guardar.</li>
          <li>Os <strong>rascunhos</strong> de casos que começou e ainda não terminou.</li>
        </ul>
      </Seccao>

      <Seccao titulo="O que não guardamos">
        <ul style={LISTA}>
          <li>
            <strong>Email.</strong> Nunca o pedimos. É uma decisão deliberada: o que não se recolhe não pode
            fugir. Em troca, a recuperação da palavra-passe depende inteiramente do código que lhe damos no
            registo.
          </li>
          <li>
            <strong>Dados de doentes reais.</strong> O simulador trabalha sobre casos construídos a partir de
            fotografias clínicas de uso educativo. Nunca escreva aqui o nome nem dados de uma pessoa real.
          </li>
          <li>
            <strong>O seu endereço de rede (IP) em claro.</strong> Para travar tentativas repetidas de
            entrada contamos as falhas por um resumo irreversível do IP, não pelo IP.
          </li>
        </ul>
      </Seccao>

      <Seccao titulo="Onde ficam">
        <p style={PARAGRAFO}>
          Numa base de dados PostgreSQL alojada na União Europeia, ligada apenas a este simulador. A aplicação
          corre na Vercel. Os dados não são vendidos, partilhados nem usados para publicidade.
        </p>
      </Seccao>

      <Seccao titulo="Quem os vê">
        <p style={PARAGRAFO}>
          Só o próprio. O histórico de cada aluno é da sua conta: nenhum outro utilizador o vê, e não há
          comparações nem classificações entre alunos. Quem mantém o simulador tem acesso técnico à base de
          dados, como é inevitável em qualquer sistema com servidor.
        </p>
      </Seccao>

      <Seccao titulo="Durante quanto tempo">
        <p style={PARAGRAFO}>
          Enquanto a conta existir. Não há apagamento automático ao fim de um prazo: os dados servem para
          acompanhar o progresso ao longo do curso, e apagá-los sozinhos destruiria precisamente isso. Quando
          apagar a conta, desaparecem no momento.
        </p>
      </Seccao>

      <Seccao titulo="Como os apaga">
        <p style={PARAGRAFO}>
          Com sessão iniciada, em <strong>A sua conta → Apagar a conta</strong>. Pede-se a palavra-passe para
          confirmar e a eliminação é imediata: conta, casos resolvidos, consultas, rascunhos e sessões abertas.
          É definitivo — não guardamos cópia nem há forma de reverter.
        </p>
      </Seccao>

      <Seccao titulo="Estatísticas de visitas">
        <p style={PARAGRAFO}>
          Usamos as estatísticas de audiência da Vercel, que contam visitas de páginas sem cookies e sem
          identificar ninguém. Não sabem quem é, e não incluem nada do que resolve no simulador.
        </p>
      </Seccao>

      <p className="mu" style={{ fontSize: 13, marginTop: 34 }}>
        <Link href="/" style={{ color: "var(--accent)" }}>← Voltar ao simulador</Link>
      </p>
    </div>
  );
}

const PARAGRAFO: React.CSSProperties = { fontSize: 14, lineHeight: 1.75, marginTop: 10 };
const LISTA: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.75,
  marginTop: 10,
  paddingLeft: 20,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  listStyle: "disc",
};

function Seccao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="card" style={{ padding: 22, marginTop: 16 }}>
      <h2 className="h3">{titulo}</h2>
      {children}
    </section>
  );
}
