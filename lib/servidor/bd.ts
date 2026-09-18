import "server-only";

/**
 * Acesso à base de dados (PostgreSQL, Neon).
 *
 * Só é importado a partir de rotas de API e de scripts — o `server-only`
 * transforma em erro de compilação qualquer tentativa de o puxar para um
 * componente de cliente, que é exatamente o engano que faria a cadeia de
 * ligação acabar no browser.
 *
 * O esquema vive em `esquema.sql`, ao lado deste ficheiro, e é aplicado por
 * `npm run bd:migrar`. É deliberadamente idempotente (`IF NOT EXISTS`), para
 * que correr o script duas vezes não seja um problema.
 */
import { neon } from "@neondatabase/serverless";

let ligacaoCache: ReturnType<typeof neon> | null = null;

/**
 * Cliente SQL. A ligação é criada à primeira utilização e não no arranque do
 * módulo: assim, um ambiente sem `DATABASE_URL` (por exemplo, correr os
 * testes) só falha se alguém tentar mesmo falar com a base de dados.
 */
export function sql() {
  if (ligacaoCache) return ligacaoCache;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL não definida. Copie .env.example para .env.local e preencha a cadeia de ligação do Neon.",
    );
  }
  ligacaoCache = neon(url);
  return ligacaoCache;
}
