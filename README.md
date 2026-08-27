# Estude!

Gerenciador de cronograma de estudos para estudantes. Reescrita em React/Next.js do projeto Django original (`../estude-old`). Interface em português do Brasil.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS v4
- Prisma 7 + SQLite (via driver adapter `@prisma/adapter-libsql`)
- Autenticação própria: senha com bcrypt e sessão opaca em cookie httpOnly
- `@dnd-kit` para reordenação por arrastar

## Modelo de dados

`User → Subject (matéria) → Topic (tópico) → Agendamento`. Cada agendamento tem nome próprio, além de data e link opcionais, um estado de conclusão e uma ordem.

## Rodando localmente

Pré-requisito: pnpm.

```bash
pnpm install
pnpm db:migrate      # cria prisma/dev.db e aplica as migrations
pnpm db:seed         # opcional: usuário demo/demo123 com dados de exemplo
pnpm dev             # http://localhost:3000
```

Variáveis de ambiente em `.env`: `DATABASE_URL` (caminho do SQLite) e `SESSION_SECRET`.

## Scripts

- `pnpm dev` / `pnpm build` / `pnpm start`
- `pnpm lint`, `pnpm typecheck`
- `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:studio`

## Telas

Login, Registro, Início (matérias + cronograma do dia), Matéria (tópicos e agendamentos), Ajustar Cronograma (calendário) e Sessão de Estudos (timer Pomodoro). Concluir, reordenar, seguir link e excluir segurando estão disponíveis nas listas de agendamentos.
