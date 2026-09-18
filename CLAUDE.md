# CLAUDE.md

Este ficheiro dá contexto ao Claude Code sobre o projeto **Simulador de Feridas**. Lê isto antes de propor qualquer alteração.

## Sobre o projeto

Plataforma web educativa de simulação clínica de tratamento de feridas para estudantes de enfermagem, com ligação à Universidade dos Açores. Combina rigor científico com pedagogia baseada em casos clínicos reais. Objetivo paralelo: servir de ferramenta de apoio à decisão clínica no ponto de cuidado.

- **Site (produção):** https://simulacao-tratamento.vercel.app/
- **Estado atual:** protótipo funcional em produção, em desenvolvimento ativo.

## Stack técnica

- Next.js
- TypeScript
- Tailwind CSS
- **PostgreSQL (Neon, via integração da Vercel)** — `@neondatabase/serverless`
- **Argon2id** (`@node-rs/argon2`) para palavras-passe e códigos de recuperação
- Deploy: Vercel

Variável de ambiente obrigatória (ver `.env.example`): `DATABASE_URL`.
Esquema aplicado com `npm run bd:migrar` (idempotente, ver `lib/servidor/esquema.sql`).

## Idioma

- Comunicação, comentários e documentação: **português europeu (PT-PT)**.
- **Identificadores no código: PT-PT**, incluindo rotas de API, nomes de tabelas e de colunas. Decidido em 2026-09-15 — o repositório já estava todo assim; ficou fechado para não haver duas convenções.

## Arquitetura do produto — 8 componentes

1. Base de dados científica sobre feridas (tecido, exsudado, odor, infeção, bordos, pele perilesional, etc.)
2. Base de dados sobre tratamentos
3. Algoritmo de decisão clínica
4. Casos clínicos derivados de fotos reais de feridas (não gerados às cegas pelo algoritmo)
5. Sistema de avaliação de alunos, por comparação com o algoritmo
6. Secção "Aprender" de consulta livre
7. Secção de estatísticas/progresso do aluno (identificação por código/token, sem login formal)
8. Ferramenta de consulta clínica pontual

## Decisões de produto já fechadas

- Teto explícito de pontuação quando falta tratar a causa da ferida (não é perda proporcional). Etiologias exatas a definir com a base de dados científica.
- Identificação do aluno na secção de estatísticas via código/token guardado pelo aluno — sem conta formal (sem email/password).
- A aplicação tem servidor (não é totalmente anónima/local). Qualquer texto a prometer "sem servidor" ou "histórico só neste dispositivo" está desatualizado e deve ser corrigido.
- Casos clínicos (Fase 4) são construídos a partir de fotos reais de feridas fornecidas por Rodrigo, não gerados automaticamente pelo algoritmo. Início com 5 casos de teste.

### Migração para servidor — decisões de 2026-09-15

- **Contas no servidor, sem email.** Nome de utilizador único + palavra-passe. A unicidade é garantida pela restrição `UNIQUE` em `utilizadores.nome_canonico`; a forma canónica é minúsculas, espaços colapsados e **acentos removidos** (`normalizarUtilizador` em `lib/contas.ts`) — "Ana Antão" e "ana antao" são a mesma conta. A remoção de acentos é feita na aplicação, não com a extensão `unaccent`, para ser determinística e testável sem base de dados.
- **Recuperação por código, não por email.** Gerado no servidor no registo, mostrado **uma única vez**, guardado em hash Argon2id, utilização única com rotação automática. Não há forma de o voltar a mostrar — é deliberado.
- **O hashing é no servidor.** O PBKDF2 que corria no browser foi removido. O cliente envia a palavra-passe por HTTPS e nunca vê um hash: se enviasse o hash, o hash passava a ser a palavra-passe efetiva e uma fuga da base de dados abria todas as contas.
- **PIN numérico de 4 a 6 dígitos mantido** (decisão do Rodrigo, 2026-09-15, depois de a fraqueza ter sido assinalada). Consequência assumida: com apenas 10 000 a 1 000 000 de combinações, o atraso progressivo em `lib/servidor/atrasoTentativas.ts` passa a ser a **única** defesa real contra força bruta. Não o enfraquecer sem rever esta decisão.
- **Sessão em cookie `httpOnly`, `secure`, `sameSite: lax`, 30 dias.** Na base de dados guarda-se só o SHA-256 do token. Nunca guardar token de sessão em `localStorage`. O atributo `Secure` é decidido pelo **protocolo do pedido** (`x-forwarded-proto`, com recurso ao `NODE_ENV` quando não há proxy à frente) e nunca por uma bandeira manual: esquecida em produção deixa o cookie viajar em claro, ligada por engano em desenvolvimento faz a sessão deixar de funcionar sem erro visível.

- **Dados existentes no browser: recomeço limpo** (opção escolhida pelo Rodrigo entre importação assistida, recomeço limpo e coexistência). `lib/dadosAntigos.ts` apaga as chaves `sf_*` — incluindo `sf_contas`, que continha derivações de PINs — e o `AppShell` explica uma vez ao aluno por que razão o histórico anterior não transitou.
- **`versao_regras` em cada resultado e consulta** (`lib/versaoRegras.ts`, atualmente `2026.09-1`). Incrementar **sempre** que uma alteração a `algoritmo/` ou a `dados/tratamentos.ts` mude a pontuação de uma resposta — sem isso, as estatísticas passam a comparar resultados medidos por réguas diferentes sem ninguém dar conta.
- **Apagar conta é efetivo.** Tudo em `ON DELETE CASCADE`; validado contra um PostgreSQL real que as quatro tabelas ficam vazias. Não introduzir apagamento lógico ("soft delete") sem rever a página de privacidade, que promete o contrário.
- **Sem `CREATE EXTENSION pgcrypto`**: `gen_random_uuid()` é do núcleo do PostgreSQL desde a versão 13.
- **Página `/privacidade` é pública** (ver `PUBLICAS` em `components/AppShell.tsx`) — tem de poder ser lida antes de alguém criar conta.

### Atraso progressivo em vez de bloqueio — decisão de 2026-09-18

Substitui integralmente a decisão anterior sobre limitação de tentativas (bloqueio de conta à N.ª falha + contador por IP), que foi removida.

- **Nenhum utilizador pode ficar impedido de entrar.** É uma plataforma educativa: um bloqueio transforma um esquecimento numa porta fechada. Não existe estado de "bloqueado" e nenhuma tentativa é recusada — nunca devolver 429 neste caminho.
- **Atraso progressivo por nome de utilizador**, só do lado do servidor (um atraso no cliente não trava nada — quem ataca não usa o nosso cliente). Sem custo nas duas primeiras falhas; a partir da 3.ª, 0,5 s → 1 s → 2 s → **teto de 5 s**. O teto é o que impede o atraso de se tornar, na prática, um bloqueio.
- **O contador zera em qualquer autenticação bem sucedida** e expira sozinho ao fim de 15 minutos sem tentativas. As linhas expiradas são varridas na autenticação bem sucedida seguinte — **não fica estado à espera de intervenção administrativa**. Verificado contra a base de dados real.
- **Sem qualquer limitação por IP.** Numa escola, uma turma inteira sai pelo mesmo endereço: um contador por IP penalizaria exatamente quem o simulador existe para servir. Não reintroduzir.
- **A resposta não revela o atraso.** Mensagem genérica e igual para nome inexistente e palavra-passe errada, sem campos extra a indicar espera.
- **`SEGREDO_SESSAO` deixou de existir.** Só servia para o HMAC dos IPs; sem contador por IP, ficou sem utilizador. A única variável de ambiente obrigatória é `DATABASE_URL`.
- A escala do atraso é uma função pura (`atrasoParaFalhas`) e está fixada em `testes/atrasoTentativas.test.ts`.

### Ecrã principal — decisões de 2026-09-18

- **A pontuação por categoria já estava gravada.** O `EntradaHistorico.correspondenciaTratamento` é uma cópia de `ResultadoAvaliacao.correspondenciaPorCategoria` e cada entrada traz o seu `pontuacaoPercentual`. Não foi preciso alterar o esquema nem o tipo: duplicar o campo criaria duas fontes de verdade que divergiriam na primeira alteração ao motor.
- **O ecrã principal agrega com `calcularDesempenhoTratamentos`**, a mesma função do ecrã de Estatísticas. Antes atribuía a `pontuacaoFinal` do caso a todas as categorias aplicáveis, pelo que um aluno com 75 % aparecia com 100 % até na categoria que errara por completo. Usar a mesma função elimina também a divergência entre o número dos dois ecrãs.
- **Nada no ecrã principal chama `decidirCaso`.** Recalcular aplicava as regras clínicas de hoje a respostas avaliadas com as de então — é para isso que existe a coluna `versao_regras`. **Não voltar a recalcular** em agregações de histórico.
- **Ausência nunca é zero.** `taxaAcerto: null` (categoria sem detalhe, ou nunca encontrada) fica de fora do painel e não entra em média nenhuma.
- **`LIMIAR_BOM_DESEMPENHO = 70`** em `lib/pontuacao.ts`. Estava repetido em código sem nome nem justificação. **Valor inalterado** — é decisão clínica/pedagógica e só muda com validação do Rodrigo.
- **Caso aleatório filtrado por etiologia** (`lib/proximoCaso.ts`), com recuo para casos por resolver e depois para o conjunto completo. O cartão promete "uma etiologia que ainda não resolveu" e filtrar por `id` dava uma segunda ferida da mesma etiologia. Com 5 casos em 4 etiologias, o primeiro degrau esgota-se ao quarto caso — **reforça a prioridade da cobertura etiológica (5.3) no roteiro**; não é problema de código.
- **Estados de boas-vindas** em `lib/boasVindas.ts`: sem histórico convida a começar e esconde a média (um "0%" lê-se como zero de aproveitamento, não como ausência de dados); com um caso não diz ainda "de volta" — esse estado vai ser comum com o test drive previsto.
- A escolha do caso e a tabela de boas-vindas vivem fora do componente por serem lógica com ramos; estão fixadas em `testes/proximoCaso.test.ts` e `testes/boasVindas.test.ts`.
- **`sessoes.ultimo_acesso_em` removida.** Nenhum código a escrevia: ficava no valor por omissão e mentia a quem a lesse. Mantê-la a sério custaria um UPDATE por pedido autenticado.

### Test drive sem registo — decisões de 2026-09-18

- **Mostrar valor antes de pedir compromisso.** Quem abre o link decide em menos de um minuto se volta, e é também a peça que faz funcionar o contacto com peritos e docentes, que recebem um link e não criam conta para o abrir. O convite em `/login` é um cartão próprio, não um link discreto — é o caminho que queremos que a maioria siga à primeira visita.
- **Caso fixo: `caso_2_deiscencia_cirurgica`** (`CASO_TEST_DRIVE` em `lib/testDrive.ts`). Nunca aleatório — quem partilha o link tem de saber o que a outra pessoa vai ver. A etiologia é a mais reconhecível para um aluno de qualquer ano e não exige o raciocínio vascular das venosas.
- **A experiência é a real, não uma demonstração.** `CaseSolver` ganhou a prop `modo` (`"conta"` por omissão, `"testDrive"`); as cinco fases, a avaliação e o ecrã de resultado são o mesmo código. **Não criar uma versão reduzida** — o valor demonstrado tem de ser o valor real.
- **A tentativa vive em `sessionStorage`, não em `localStorage`.** Morre com o separador, que é exatamente a semântica prometida: guarda-se se a pessoa se registar a seguir, caso contrário perde-se. Uma tentativa, um caso, teto de 64 KB, `casoId` validado à entrada e à saída. **Não persistir para além disto** — sem recuperação tardia.
- **Sem rascunho no test drive.** A rota exige sessão, e o estado da tentativa só dura o que durar.
- **A migração usa `/api/resultados` tal como está**, já autenticada, logo após o registo. É por ser o mesmo caminho que o resultado fica indistinguível de um resolvido com conta — mesma validação, e a `versao_regras` carimbada pelo servidor. **Não criar atalho nem variante da rota.**
- **O marcador `?origem=test-drive` é obrigatório** para a migração acontecer; o ecrã de entrada aberto sem ele **apaga** a tentativa. É isto que torna "diretamente a seguir" estrutural em vez de uma promessa: uma tentativa esquecida no separador nunca se cola a um registo posterior sem relação.
- **Nenhuma rota de escrita sem sessão**, e verificado: `resultados`, `consultas` e `rascunhos` devolvem 401 sem cookie, em todos os métodos. A única forma de a tentativa chegar à base de dados é através do registo.
- **Não há canal novo para inferir se um nome existe.** O test drive não toca em nomes. O 409 do registo ("já existe uma conta com esse nome") é pré-existente e inevitável — quem escolhe um nome tem de saber que está ocupado. A entrada mantém a mensagem genérica.
- **Sem caminho para entrar com conta existente a partir do resultado do test drive** (decisão do Rodrigo, 2026-09-18). Migrar para uma conta já existente é gravar num histórico alheio a partir de estado não autenticado, e é outra decisão.
- Quem se regista aterra no estado de boas-vindas de **um caso**, preparado no lote anterior. Confirmado no percurso completo.

### Por decidir — segundo limiar clínico

`corPontuacao` em `app/estatisticas/page.tsx` usa o 70 e ainda um **50** para o estado intermédio. Esse 50 nunca foi declarado como decisão e provavelmente nunca foi decidido. Fica para lote próprio, e a conversa aí é sobre **o que os dois limiares significam**, não sobre onde vivem as constantes.

### Fora de âmbito, a seguir em lotes próprios

Vista de docente, dados agregados de turma, comparação entre utilizadores, modo de demonstração sem registo.

## Regras de trabalho obrigatórias

- **Nunca assumir lógica clínica.** Decisões clínicas (etiologias, thresholds, regras de pontuação) requerem validação explícita de Rodrigo antes de implementação. Propor e justificar, não decidir unilateralmente.
- **Verificação antes de qualquer alteração ao algoritmo de decisão:** confirmar programaticamente que todos os casos continuam a atingir 100/100 antes de considerar a alteração concluída.
- **Diagnóstico antes da correção.** Para bugs, fazer diagnóstico programático (sandbox/scripts) e confirmar a causa raiz antes de propor a correção.
- Ambiguidade clínica deve ser clarificada explicitamente com Rodrigo, nunca assumida.

### Questão clínica assinalada em 2026-09-15 — corrigida em 2026-09-18

O painel "Desempenho por categoria de tratamento" de `app/page.tsx` creditava acerto em **todas** as categorias aplicáveis sempre que `pontuacaoFinal >= 70`, distribuindo a nota global por todas. **Corrigido** no lote do ecrã principal (ver acima): passou a agregar a pontuação real por categoria, já gravada no histórico. Não houve alteração de lógica clínica — só se passou a ler o dado certo.

## Ferramentas e referências

- Execução direta de TypeScript sem compilação: `node --experimental-strip-types`
- Pesquisa clínica: Scholar Gateway — queries em inglês com terminologia clínica específica, `start_year` 2015–2018, `topN` 10–15.
- Imagens clínicas: Medetec Medical Images (medetec.co.uk) — uso educacional gratuito, com atribuição.
- Guidelines de referência: IWGDF, EPUAP, IWII, WHS, EWMA, WUWHS, APTFeridas, WundDACH 2025.

## Fora de âmbito / não fazer

- Não reutilizar código, estruturas de dados ou lógica clínica de versões anteriores do projeto — foram deliberadamente descartadas por a lógica clínica estar desatualizada.
- Não gerar casos clínicos automaticamente sem fotos reais associadas.
