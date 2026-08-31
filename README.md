# Estude!

Gerenciador de cronograma de estudos para estudantes. Reescrita em React/Next.js do projeto Django original (`estude-old`). Interface em português do Brasil.

## Funcionalidades

- **Matérias e tópicos** — organize o conteúdo em matérias (com cor própria) divididas em tópicos, cada um com seus agendamentos de estudo.
- **Agendamentos** — cada item de estudo tem nome, link opcional, data opcional, ordem e estado de conclusão; podem ser reordenados por arrastar (`@dnd-kit`) e excluídos segurando o botão.
- **Cronograma (calendário)** — visualização mensal para organizar os agendamentos por dia, com ajuste de meta diária de estudo.
- **Início** — mostra as matérias e a agenda dos próximos dias.
- **Sessão de estudos (Timer)** — modo Pomodoro para estudar os itens do dia e acompanhar o tempo estudado.
- **Modelos de estudo (templates)** — planos prontos (ex.: um modelo completo para o ENEM) que podem ser importados de uma vez, gerando matérias, tópicos e agendamentos automaticamente.
- **Autenticação própria** — cadastro/login com usuário e senha (hash com bcrypt) e sessão em cookie httpOnly.

## Stack

- [Next.js](https://nextjs.org/) (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Prisma 7 + SQLite (via driver adapter `@prisma/adapter-libsql`)
- Autenticação própria: senha com bcrypt e sessão opaca em cookie httpOnly
- `@dnd-kit` para reordenação por arrastar
- Zod para validação de esquemas (ex.: dos modelos de estudo)
- Vitest para testes

## Modelo de dados

```
User → Subject (matéria) → Topic (tópico) → Agendamento
         └── StudyDay (tempo estudado por dia)
```

- **User**: usuário com meta diária de estudo (`dailyStudyGoalMinutes`).
- **Subject**: matéria, com cor e ordem, pertence a um usuário.
- **Topic**: tópico dentro de uma matéria.
- **Agendamento**: item de estudo dentro de um tópico — nome, link e data opcionais, ordem, ordem do dia (`dayOrder`) e estado de conclusão.
- **StudyDay**: total de segundos estudados por usuário em um determinado dia.
- **Session**: sessão de autenticação (token + expiração).

Veja o esquema completo em `prisma/schema.prisma`.

## Rodando localmente

Pré-requisito: [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm db:migrate      # cria prisma/dev.db e aplica as migrations
pnpm db:seed         # opcional: usuário demo/demo123 com dados de exemplo
pnpm dev             # http://localhost:3000
```

Variáveis de ambiente em `.env`:

| Variável         | Descrição                                              |
| ---------------- | ------------------------------------------------------- |
| `DATABASE_URL`   | Caminho do arquivo SQLite (ex.: `file:./prisma/dev.db`) |
| `SESSION_SECRET` | Segredo usado na sessão de autenticação                 |

## Rodando com Docker

O projeto inclui um `Dockerfile` (multi-stage, com Prisma e migrations aplicadas automaticamente no start) e um `docker-compose.yml`:

```bash
docker compose -f docker/docker-compose.yml up --build
```

O serviço sobe em `http://localhost:3000`, com o banco SQLite persistido em um volume Docker (`estude-data`).

## Scripts

| Script              | Descrição                                    |
| ------------------- | --------------------------------------------- |
| `pnpm dev`          | Ambiente de desenvolvimento                   |
| `pnpm build`        | Gera o client do Prisma e builda o Next.js    |
| `pnpm start`        | Inicia em modo produção                       |
| `pnpm preview`      | Build + start                                 |
| `pnpm lint`         | ESLint                                        |
| `pnpm typecheck`    | Checagem de tipos (`tsc --noEmit`)            |
| `pnpm format`       | Verifica formatação (Prettier)                |
| `pnpm format:write` | Aplica formatação                             |
| `pnpm test`         | Executa os testes (Vitest)                    |
| `pnpm db:generate`  | Gera o client do Prisma                       |
| `pnpm db:migrate`   | Aplica migrations em desenvolvimento          |
| `pnpm db:seed`      | Popula o banco com um usuário e dados demo    |
| `pnpm db:studio`    | Abre o Prisma Studio                          |

## Estrutura do projeto

```
src/
├── app/                     # Rotas (App Router)
│   ├── (auth)/              # Login e registro
│   └── (app)/               # Início, matéria, cronograma, timer, modelos
├── components/              # Componentes de UI, organizados por domínio
│   ├── agendamento/
│   ├── schedule/
│   ├── subject/
│   ├── templates/
│   ├── timer/
│   └── topic/
└── lib/
    ├── actions/             # Server actions (auth, matérias, tópicos, agendamentos, estudo, modelos)
    ├── templates/           # Catálogo de modelos de estudo (ex.: enem.json) e geração automática de cronograma
    ├── auth.ts              # Sessão e hashing de senha
    ├── data.ts              # Consultas de dados
    ├── dates.ts             # Utilitários de data
    └── db.ts                # Cliente Prisma

prisma/                      # Schema e migrations
scripts/seed.mjs             # Script de seed
docker/                      # Dockerfile e docker-compose
designs/                     # Mockups das telas (Login, Registro, Início, Matéria, Cronograma, Timer, etc.)
```

## Telas

Login, Registro, Início (matérias + cronograma do dia), Matéria (tópicos e agendamentos), Cronograma (calendário), Sessão de Estudos (timer Pomodoro) e Modelos de estudo. Concluir, reordenar, seguir link e excluir segurando estão disponíveis nas listas de agendamentos. Mockups de referência em `designs/`.
