# Configuração do Neon (persistência de partidas)

Este projeto persiste partidas no Neon através das rotas `/api/matches` e `/api/matches/sync`.

## Variáveis de ambiente na Vercel
Com a integração Neon -> Vercel, normalmente já são criadas automaticamente.

O backend aceita, nesta ordem:

1. `NEON_DATABASE_URL`
2. `POSTGRES_URL`
3. `POSTGRES_PRISMA_URL`
4. `POSTGRES_URL_NON_POOLING`
5. `DATABASE_URL`

> Se você já conectou a integração Neon na Vercel, geralmente `POSTGRES_URL` já vem preenchida.

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
