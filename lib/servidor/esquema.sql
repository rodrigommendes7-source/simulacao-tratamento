-- Esquema da base de dados do Simulador de Feridas.
-- Aplicado por `npm run bd:migrar`. Idempotente: pode correr as vezes que forem precisas.

-- Sem CREATE EXTENSION: `gen_random_uuid()` faz parte do núcleo do PostgreSQL
-- desde a versão 13, por isso não é preciso o pgcrypto. Uma extensão a menos é
-- uma permissão a menos a exigir de quem alojar a base de dados.

-- ─────────────────────────────── Contas ───────────────────────────────
-- `nome_canonico` é o nome em minúsculas e sem acentos, calculado na
-- aplicação (lib/contas.ts, normalizarUtilizador). A restrição UNIQUE nesta
-- coluna é o que garante, de facto, que não há dois "Ana Antão" — duas
-- inserções em simultâneo não podem escapar-lhe, ao contrário de uma
-- verificação prévia em SELECT.
-- Não há coluna de email, e é deliberado: o projeto não recolhe endereços.
CREATE TABLE IF NOT EXISTS utilizadores (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_apresentacao     text        NOT NULL,
  nome_canonico         text        NOT NULL UNIQUE,
  palavra_passe_hash    text        NOT NULL,
  recuperacao_hash      text        NOT NULL,
  recuperacao_usada_em  timestamptz,
  criado_em             timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────── Sessões ───────────────────────────────
-- Guarda-se o SHA-256 do token, nunca o token: quem leia a base de dados não
-- fica com sessões utilizáveis. O token em claro existe só no cookie.
CREATE TABLE IF NOT EXISTS sessoes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  utilizador_id  uuid        NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
  token_hash     text        NOT NULL UNIQUE,
  criada_em      timestamptz NOT NULL DEFAULT now(),
  expira_em      timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sessoes_utilizador_idx ON sessoes (utilizador_id);
CREATE INDEX IF NOT EXISTS sessoes_expira_idx     ON sessoes (expira_em);

-- Havia aqui um `ultimo_acesso_em` que nenhum código alguma vez escreveu:
-- ficava para sempre no valor por omissão e, portanto, mentia a quem o lesse.
-- Mantê-lo a sério custaria um UPDATE por cada pedido autenticado. Sai.
ALTER TABLE sessoes DROP COLUMN IF EXISTS ultimo_acesso_em;

-- ────────────────────────── Histórico de casos ──────────────────────────
-- `payload` guarda a EntradaHistorico completa (tipos/historico.ts). As
-- colunas soltas ao lado existem para filtrar e ordenar sem abrir o JSON;
-- normalizar a estrutura toda em tabelas obrigaria a uma migração de cada vez
-- que o motor de decisão ganhasse um campo.
--
-- Nota sobre jsonb: guarda chaves e valores fielmente, mas NÃO preserva a
-- ordem das chaves (reordena-as ao guardar). Nada no código depende dessa
-- ordem — lib/estatisticas.ts lê tudo por nome — mas quem comparar dois
-- payloads tem de o fazer com as chaves ordenadas, ou vê diferenças que não
-- existem.
CREATE TABLE IF NOT EXISTS resultados (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  utilizador_id   uuid        NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
  caso_id         text        NOT NULL,
  titulo          text        NOT NULL,
  etiologia       text        NOT NULL,
  data            timestamptz NOT NULL,
  pontuacao_final integer     NOT NULL,
  -- Versão das regras clínicas com que este resultado foi avaliado
  -- (lib/versaoRegras.ts). Sem ela, uma alteração ao algoritmo passaria a
  -- misturar resultados medidos por réguas diferentes sem ninguém dar conta.
  versao_regras   text        NOT NULL,
  payload         jsonb       NOT NULL
);
CREATE INDEX IF NOT EXISTS resultados_utilizador_data_idx ON resultados (utilizador_id, data);

-- ──────────────────────── Histórico de consultas ────────────────────────
CREATE TABLE IF NOT EXISTS consultas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  utilizador_id  uuid        NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
  data           timestamptz NOT NULL,
  versao_regras  text        NOT NULL,
  payload        jsonb       NOT NULL
);
CREATE INDEX IF NOT EXISTS consultas_utilizador_data_idx ON consultas (utilizador_id, data);

-- ─────────────────────────────── Rascunhos ───────────────────────────────
-- Um rascunho por caso e por aluno — daí a chave primária composta, que faz
-- do "guardar" um UPSERT natural.
CREATE TABLE IF NOT EXISTS rascunhos (
  utilizador_id  uuid        NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
  caso_id        text        NOT NULL,
  guardado_em    timestamptz NOT NULL DEFAULT now(),
  payload        jsonb       NOT NULL,
  PRIMARY KEY (utilizador_id, caso_id)
);

-- ────────────────────── Atraso progressivo nas tentativas ──────────────────────
-- `chave` é "u:<nome_canonico>". Não há contador por IP: numa escola, uma turma
-- inteira sai pelo mesmo endereço, e um limite por IP penalizaria exatamente
-- quem o simulador existe para servir.
--
-- Não há coluna de bloqueio, e é deliberado: nenhum utilizador pode ficar
-- impedido de entrar. As falhas só determinam quanto tempo o servidor espera
-- antes de responder (lib/servidor/atrasoTentativas.ts). O contador expira
-- sozinho ao fim de 15 minutos sem tentativas e é varrido na autenticação
-- seguinte — não fica estado à espera de alguém que o limpe.
CREATE TABLE IF NOT EXISTS tentativas_login (
  chave      text PRIMARY KEY,
  falhas     integer     NOT NULL DEFAULT 0,
  ultima_em  timestamptz NOT NULL DEFAULT now()
);

-- Migração da versão anterior, que tinha bloqueio. Idempotente: numa base de
-- dados criada de raiz, as três instruções não têm nada que fazer.
ALTER TABLE tentativas_login DROP COLUMN IF EXISTS bloqueado_ate;
ALTER TABLE tentativas_login DROP COLUMN IF EXISTS primeira_em;
ALTER TABLE tentativas_login ADD COLUMN IF NOT EXISTS ultima_em timestamptz NOT NULL DEFAULT now();
