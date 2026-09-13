import { describe, expect, it } from "vitest";
import { avaliarJustificacoes, pontuacaoJustificacoes, type ItemJustificacao } from "../algoritmo/avaliarJustificacoes";
import { JUSTIFICACOES_TRATAMENTO, JUSTIFICACOES_TECNICA } from "../dados/bancoJustificacoes";

describe("avaliarJustificacoes", () => {
  it("marca como correta quando a opção escolhida é a única marcada 'correta' no banco", () => {
    const indiceCorreto = JUSTIFICACOES_TRATAMENTO.desbridamento!.opcoes.findIndex((o) => o.correta);
    const itens: ItemJustificacao[] = [{ chave: "tr:desbridamento", tipo: "tratamento", id: "desbridamento" }];
    const resultado = avaliarJustificacoes(itens, { "tr:desbridamento": indiceCorreto });
    expect(resultado[0].correta).toBe(true);
    expect(resultado[0].respondida).toBe(true);
  });

  it("marca como incorreta quando a opção escolhida não é a correta", () => {
    const indiceCorreto = JUSTIFICACOES_TRATAMENTO.desbridamento!.opcoes.findIndex((o) => o.correta);
    const indiceErrado = JUSTIFICACOES_TRATAMENTO.desbridamento!.opcoes.findIndex((o, i) => !o.correta && i !== indiceCorreto);
    const itens: ItemJustificacao[] = [{ chave: "tr:desbridamento", tipo: "tratamento", id: "desbridamento" }];
    const resultado = avaliarJustificacoes(itens, { "tr:desbridamento": indiceErrado });
    expect(resultado[0].correta).toBe(false);
  });

  it("marca 'respondida: false' e 'correta: false' quando não há resposta para o item", () => {
    const itens: ItemJustificacao[] = [{ chave: "tr:desbridamento", tipo: "tratamento", id: "desbridamento" }];
    const resultado = avaliarJustificacoes(itens, {});
    expect(resultado[0]).toEqual({ chave: "tr:desbridamento", tipo: "tratamento", id: "desbridamento", respondida: false, correta: false });
  });

  it("funciona também para itens de técnica", () => {
    const indiceCorreto = JUSTIFICACOES_TECNICA.penso_rapido.opcoes.findIndex((o) => o.correta);
    const itens: ItemJustificacao[] = [{ chave: "tc:penso_rapido", tipo: "tecnica", id: "penso_rapido" }];
    const resultado = avaliarJustificacoes(itens, { "tc:penso_rapido": indiceCorreto });
    expect(resultado[0].correta).toBe(true);
  });
});

describe("pontuacaoJustificacoes", () => {
  it("null quando não há itens", () => {
    expect(pontuacaoJustificacoes([])).toBeNull();
  });

  it("percentagem de itens corretos", () => {
    const correspondencias = [
      { chave: "a", tipo: "tratamento" as const, id: "a", respondida: true, correta: true },
      { chave: "b", tipo: "tratamento" as const, id: "b", respondida: true, correta: false },
    ];
    expect(pontuacaoJustificacoes(correspondencias)).toBe(50);
  });
});
