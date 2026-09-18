"use client";

/**
 * Cliente das rotas de API — o único sítio do browser que fala com o servidor.
 *
 * Todos os pedidos vão com `credentials: "same-origin"` para o cookie de
 * sessão seguir. O cookie é `httpOnly`, por isso o JavaScript da página nunca
 * lhe toca: é o browser que o envia. Não há token nenhum guardado em
 * `localStorage` — foi precisamente isso que esta migração veio eliminar.
 */

export interface RespostaErro {
  erro: string;
}

export class ErroApi extends Error {
  constructor(
    mensagem: string,
    readonly estado: number,
  ) {
    super(mensagem);
    this.name = "ErroApi";
  }
}

/**
 * Pedido à API. Devolve o corpo já em JSON, ou atira `ErroApi` com a mensagem
 * que o servidor deu — que é a que deve chegar ao ecrã, porque é a única que
 * sabe se o problema foi o nome repetido, a palavra-passe ou o limite de
 * tentativas.
 */
export async function pedir<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(caminho, {
      ...opcoes,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...(opcoes.headers ?? {}) },
    });
  } catch {
    // Rede em baixo, servidor inacessível, pedido cancelado. Não há corpo
    // nenhum para ler — a mensagem tem de ser nossa.
    throw new ErroApi("Não foi possível contactar o servidor. Verifique a ligação.", 0);
  }

  const corpo = (await resposta.json().catch(() => null)) as (T & Partial<RespostaErro>) | null;

  if (!resposta.ok) {
    throw new ErroApi(corpo?.erro ?? "Ocorreu um erro inesperado.", resposta.status);
  }
  return corpo as T;
}

export function json(corpo: unknown): RequestInit {
  return { body: JSON.stringify(corpo) };
}
