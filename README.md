# Simulador de Feridas

> Simulador clínico para avaliação e tratamento de feridas, baseado em guidelines internacionais.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Deployed on Vercel](https://img.shields.io/badge/deploy-Vercel-black?style=flat&logo=vercel)

🔗 **Demo ao vivo:** https://simulacao-tratamento.vercel.app/

<!-- 📸 Adicionar aqui uma captura de ecrã ou GIF da aplicação -->

## Sobre

Plataforma web educativa de simulação clínica de tratamento de feridas, desenvolvida para estudantes de enfermagem (com ligação à Universidade dos Açores). Combina rigor científico com pedagogia baseada em casos clínicos reais, e serve também como ferramenta de apoio à decisão clínica no ponto de cuidado.

## Funcionalidades

- **Base de dados científica** sobre feridas (tecido, exsudado, odor, infeção, bordos, pele perilesional)
- **Base de dados de tratamentos**
- **Algoritmo de decisão clínica**
- **Casos clínicos reais**, construídos a partir de fotografias de feridas
- **Avaliação de alunos**, por comparação com o algoritmo de referência
- **Secção "Aprender"** de consulta livre
- **Estatísticas e progresso** do aluno, com conta própria (nome de utilizador e palavra-passe, sem email)
- **Ferramenta de consulta clínica pontual**

## Stack técnica

- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [PostgreSQL](https://www.postgresql.org/) ([Neon](https://neon.tech/), via integração da Vercel)
- Deploy em [Vercel](https://vercel.com/)

## Como correr localmente

```bash
git clone <URL-DO-REPOSITORIO>
cd simulador-de-feridas
npm install

# Configurar a base de dados
cp .env.example .env.local
# preencher DATABASE_URL com a cadeia de ligação do Neon

# Aplicar o esquema (idempotente — pode correr as vezes que forem precisas)
npm run bd:migrar

npm run dev
```

A aplicação fica disponível em `http://localhost:3000`.

## Verificações

```bash
npm test                  # testes unitários
npm run validate:clinico  # completude clínica (corre também no prebuild)
npm run lint
```

## Privacidade

O simulador guarda contas e histórico numa base de dados na União Europeia. **Não recolhe email** — a
recuperação da palavra-passe depende de um código gerado no registo e mostrado uma única vez. Cada aluno vê
apenas o seu histórico, e pode apagar a conta e todos os dados a qualquer momento. A política completa está
em `/privacidade`.

## Estado do projeto

🚧 Protótipo funcional em produção, em desenvolvimento ativo.

## Base científica

Desenvolvido com base em guidelines internacionais de referência: IWGDF, EPUAP, IWII, WHS, EWMA, WUWHS, APTFeridas, WundDACH 2025.

## Licença

<!-- Definir licença (ex.: MIT) -->
