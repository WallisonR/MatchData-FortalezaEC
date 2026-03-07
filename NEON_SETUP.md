# Configuração do Neon (persistência de partidas)

Este projeto persiste partidas no Neon através das rotas `/api/matches` e `/api/matches/sync`.

## Variáveis de ambiente na Vercel
Com a integração Neon -> Vercel, normalmente já são criadas automaticamente.

O backend aceita (em ordem):

1. `NEON_DATABASE_URL`
2. `DATABASE_URL`
3. `DATABASE_URL_UNPOOLED`
4. `POSTGRES_URL`
5. `POSTGRES_PRISMA_URL`
6. `POSTGRES_URL_NON_POOLING`
7. `POSTGRES_URL_NO_SSL`
8. montagem via parâmetros (`PGHOST`/`PGDATABASE`/`PGUSER`/`PGPASSWORD`) ou (`POSTGRES_HOST`/`POSTGRES_DATABASE`/`POSTGRES_USER`/`POSTGRES_PASSWORD`)

> Se você já conectou a integração Neon na Vercel, `POSTGRES_URL` e similares geralmente já vêm preenchidas.

## Login fixo
- e-mail: `admin@matchdata.com`
- senha: `fec2026`

(Se quiser trocar, use `APP_LOGIN_EMAIL` e `APP_LOGIN_PASSWORD`.)

## Funcionamento
- `POST /api/login` autentica e grava cookie de sessão.
- `GET /api/session` valida sessão.
- `GET /api/matches` lê as partidas no Neon.
- `PUT /api/matches/sync` salva as partidas no Neon.

## Fallback local (desenvolvimento)
Se nenhuma variável de banco estiver definida, usa `.data/matches.json` local.
