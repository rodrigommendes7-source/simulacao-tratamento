import { describe, expect, it } from "vitest";
import { decidirCaso } from "../algoritmo/motorDecisao";
import { casoDaConsulta } from "../lib/casoDaConsulta";
import {
  construirPassos,
  indiceProximoPasso,
  limparConfirmacoesObsoletas,
  limparRespostasObsoletas,
  sequenciaCompleta,
  type IdPasso,
  type Passo,
  type RespostasConsulta,
} from "../lib/sequenciaConsulta";

/**
 * Simulação da interação real da Consulta pontual.
 *
 * `lib/sequenciaConsulta.ts` é lógica pura e já tem testes próprios; o bug do
 * avanço prematuro não vivia lá, vivia na forma como `app/consulta/page.tsx`
 * combinava `alternar` com `indiceProximoPasso`. Este ficheiro replica esses
 * dois handlers tal como estão na página — sem React — para que a regressão
 * fique coberta ao nível em que aconteceu: clicar numa opção de um passo
 * múltiplo não pode, por si só, mudar o passo atual.
 */
class Consulta {
  respostas: RespostasConsulta = {};
  confirmados: ReadonlySet<IdPasso> = new Set();
  indiceForcado: number | null = null;

  get passos(): Passo[] {
    return construirPassos(this.respostas);
  }

  get indiceAtual(): number {
    const passos = this.passos;
    return this.indiceForcado !== null
      ? Math.min(this.indiceForcado, passos.length - 1)
      : indiceProximoPasso(passos, this.respostas, this.confirmados);
  }

  get passoAtual(): Passo | undefined {
    return this.passos[this.indiceAtual];
  }

  get completa(): boolean {
    return sequenciaCompleta(this.passos, this.respostas, this.confirmados);
  }

  /** Espelha `alternar()` de app/consulta/page.tsx. */
  alternar(valor: string): this {
    const passoAtual = this.passoAtual;
    if (!passoAtual) return this;
    const atuais = this.respostas[passoAtual.id] ?? [];
    const novos = passoAtual.multiplo
      ? atuais.includes(valor)
        ? atuais.filter((v) => v !== valor)
        : [...atuais, valor]
      : [valor];
    const comEscolha = { ...this.respostas, [passoAtual.id]: novos };
    const atualizadas = limparRespostasObsoletas(construirPassos(comEscolha), comEscolha);

    this.respostas = atualizadas;
    const semEste = passoAtual.multiplo
      ? new Set([...this.confirmados].filter((id) => id !== passoAtual.id))
      : this.confirmados;
    this.confirmados = limparConfirmacoesObsoletas(atualizadas, semEste);
    return this;
  }

  /** Espelha `confirmar()` de app/consulta/page.tsx. */
  confirmar(): this {
    const passoAtual = this.passoAtual;
    if (!passoAtual) return this;
    if (this.respostas[passoAtual.id] === undefined) {
      this.respostas = { ...this.respostas, [passoAtual.id]: [] };
    }
    if (passoAtual.multiplo) {
      this.confirmados = new Set(this.confirmados).add(passoAtual.id);
    }
    this.indiceForcado = null;
    return this;
  }
}

describe("interação da sequência (app/consulta/page.tsx)", () => {
  it("um passo múltiplo aceita 2+ seleções antes de avançar", () => {
    const c = new Consulta();
    c.alternar("pressao"); // etiologia (única) → avança
    expect(c.passoAtual?.id).toBe("tecidos");

    c.alternar("esfacelo");
    expect(c.passoAtual?.id).toBe("tecidos");
    c.alternar("granulacao");
    expect(c.passoAtual?.id).toBe("tecidos");
    c.alternar("necrose_seca");
    expect(c.respostas.tecidos).toEqual(["esfacelo", "granulacao", "necrose_seca"]);

    c.confirmar();
    expect(c.passoAtual?.id).toBe("exsudado_volume");
  });

  it("todos os 5 passos múltiplos aceitam 2 seleções e só avançam ao confirmar", () => {
    const c = new Consulta();
    const multiplosVistos: IdPasso[] = [];
    // A primeira opção de `exsudado_volume` é "ausente", que elimina o passo
    // `exsudado_tipo` — escolhe-se um volume que o mantenha, para o percurso
    // passar mesmo pelos 10 passos.
    const escolhaUnica = (passo: Passo) =>
      passo.id === "exsudado_volume" ? "moderado" : passo.opcoes[0].valor;

    for (let guarda = 0; guarda < 40 && c.passoAtual; guarda++) {
      const passo = c.passoAtual;
      if (!passo.multiplo) {
        c.alternar(escolhaUnica(passo));
        expect(c.passoAtual?.id).not.toBe(passo.id); // única → avança já
        continue;
      }

      multiplosVistos.push(passo.id);
      c.alternar(passo.opcoes[0].valor);
      expect(c.passoAtual?.id).toBe(passo.id);
      c.alternar(passo.opcoes[1].valor);
      expect(c.passoAtual?.id).toBe(passo.id);
      expect(c.respostas[passo.id]).toHaveLength(2);

      c.confirmar();
      expect(c.passoAtual?.id).not.toBe(passo.id);
    }

    expect(multiplosVistos).toEqual(["tecidos", "exsudado_tipo", "bordos", "pele", "sinais_infecao"]);
    expect(c.completa).toBe(true);
    expect(c.passoAtual).toBeUndefined();
  });

  it("os passos de escolha única avançam num só clique", () => {
    const c = new Consulta();
    expect(c.passoAtual?.id).toBe("etiologia");
    c.alternar("venosa");
    expect(c.passoAtual?.id).toBe("abpi"); // único, vascular
    c.alternar("0.95");
    expect(c.passoAtual?.id).toBe("tecidos");
  });

  it("chega a infecao_local_covert com 2 sinais covert, sem usar 'Escolhas feitas'", () => {
    const c = new Consulta();
    c.alternar("pressao");
    c.alternar("granulacao").confirmar(); // tecidos
    c.alternar("escasso"); // exsudado_volume
    c.alternar("seroso").confirmar(); // exsudado_tipo
    c.alternar("aderentes_planos").confirmar(); // bordos
    c.alternar("integra").confirmar(); // pele
    c.alternar("estadio_3"); // profundidade
    c.alternar("2"); // dor

    expect(c.passoAtual?.id).toBe("sinais_infecao");
    c.alternar("dor_aumentada");
    expect(c.passoAtual?.id).toBe("sinais_infecao"); // não saltou
    c.alternar("tecido_friavel");
    expect(c.respostas.sinais_infecao).toEqual(["dor_aumentada", "tecido_friavel"]);
    c.confirmar();

    expect(c.completa).toBe(true);
    expect(decidirCaso(casoDaConsulta(c.respostas)).nivelInfecao).toBe("infecao_local_covert");
  });

  it("o passo opcional dos sinais pode ser confirmado em branco", () => {
    const c = new Consulta();
    c.alternar("cirurgica");
    c.alternar("granulacao").confirmar();
    c.alternar("moderado");
    c.alternar("seroso").confirmar();
    c.alternar("aderentes_planos").confirmar();
    c.alternar("integra").confirmar();
    c.alternar("espessura_parcial");
    c.alternar("2");

    expect(c.passoAtual?.id).toBe("sinais_infecao");
    c.confirmar(); // sem marcar nada
    expect(c.respostas.sinais_infecao).toEqual([]);
    expect(c.completa).toBe(true);
  });

  it("desmarcar a última opção de um passo múltiplo não o dá por respondido", () => {
    const c = new Consulta();
    c.alternar("pressao");
    c.alternar("esfacelo");
    c.alternar("esfacelo"); // desmarca
    expect(c.respostas.tecidos).toEqual([]);
    expect(c.passoAtual?.id).toBe("tecidos");
    expect(c.completa).toBe(false);
  });

  it("mexer num passo múltiplo já confirmado obriga a confirmar de novo", () => {
    const c = new Consulta();
    c.alternar("pressao");
    c.alternar("esfacelo").confirmar();
    expect(c.passoAtual?.id).toBe("exsudado_volume");

    // Voltar atrás pelas "Escolhas feitas" e mexer na seleção.
    c.indiceForcado = c.passos.findIndex((p) => p.id === "tecidos");
    c.alternar("granulacao");
    c.indiceForcado = null;
    expect(c.passoAtual?.id).toBe("tecidos");
    c.confirmar();
    expect(c.passoAtual?.id).toBe("exsudado_volume");
  });

  it("baixar o volume para 'ausente' e voltar a subir não herda a confirmação antiga", () => {
    const c = new Consulta();
    c.alternar("pressao");
    c.alternar("esfacelo").confirmar();
    c.alternar("moderado");
    c.alternar("seroso").confirmar(); // exsudado_tipo confirmado
    expect(c.passoAtual?.id).toBe("bordos");

    c.indiceForcado = c.passos.findIndex((p) => p.id === "exsudado_volume");
    c.alternar("ausente"); // elimina exsudado_tipo e a sua resposta
    c.indiceForcado = null;
    expect(c.respostas.exsudado_tipo).toBeUndefined();

    c.indiceForcado = c.passos.findIndex((p) => p.id === "exsudado_volume");
    c.alternar("abundante"); // exsudado_tipo volta, por responder
    c.indiceForcado = null;
    expect(c.passoAtual?.id).toBe("exsudado_tipo");
    c.alternar("seroso");
    expect(c.passoAtual?.id).toBe("exsudado_tipo"); // não saltou com a confirmação velha
  });
});
