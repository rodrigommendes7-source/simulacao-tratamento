/**
 * Aplica o esquema da base de dados (`lib/servidor/esquema.sql`).
 *
 * Corre com `npm run bd:migrar`, contra a `DATABASE_URL` do ambiente. O
 * esquema é idempotente (`CREATE ... IF NOT EXISTS`), por isso corrê-lo duas
 * vezes não faz mal — e é assim que tem de ser, porque é o mesmo comando que
 * se usa para criar a base de dados de raiz e para acrescentar o que faltar.
 *
 * Deliberadamente não é um sistema de migrações com versões: enquanto o
 * esquema for este e o projeto estiver em protótipo, um ficheiro SQL
 * idempotente é mais fácil de ler do que uma cadeia de migrações. Quando
 * houver a primeira alteração destrutiva a uma tabela com dados reais, passa
 * a valer a pena o sistema a sério.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

/**
 * Carrega o `.env.local` quando a variável ainda não está no ambiente.
 *
 * O `next dev` faz isto sozinho, mas um script de linha de comandos não — e
 * obrigar a exportar a cadeia de ligação à mão antes de cada migração era um
 * passo a mais para esquecer. Um ambiente que já traga a variável (a Vercel, a
 * integração contínua) não é afetado: só se lê o ficheiro se faltar.
 */
function carregarAmbienteLocal(): void {
  if (process.env.DATABASE_URL) return;
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Sem `.env.local` — a mensagem de erro a seguir explica o que falta.
  }
}

async function main() {
  carregarAmbienteLocal();
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL não definida. Ver .env.example.");
    process.exit(1);
  }

  const sql = neon(url);
  const caminho = join(process.cwd(), "lib", "servidor", "esquema.sql");
  const esquema = readFileSync(caminho, "utf8");

  console.log(`A aplicar ${caminho}…\n`);

  // As instruções são enviadas uma a uma: o driver HTTP do Neon não aceita
  // múltiplas instruções num só pedido. Os comentários `--` são removidos
  // antes de dividir, para que um `;` dentro de um comentário não parta uma
  // instrução ao meio.
  const instrucoes = esquema
    .split("\n")
    .filter((linha) => !linha.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((i) => i.trim())
    .filter(Boolean);

  for (const instrucao of instrucoes) {
    const resumo = instrucao.replace(/\s+/g, " ").slice(0, 70);
    // `sql.query()` em vez da template: o texto vem do ficheiro de esquema,
    // que é código do projeto e não entrada de ninguém, e a forma de template
    // não aceita uma instrução montada em tempo de execução.
    await sql.query(instrucao);
    console.log(`  OK  ${resumo}…`);
  }

  console.log(`\nEsquema aplicado: ${instrucoes.length} instrução(ões).`);
}

main().catch((erro) => {
  console.error("\nFalhou a aplicação do esquema:", erro);
  process.exit(1);
});
