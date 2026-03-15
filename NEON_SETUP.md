# Configuração do Neon (persistência multiusuário por `user_id`)

Este projeto persiste usuários e partidas no Neon através das rotas:

- `POST /api/register`
- `POST /api/login`
- `POST /api/logout`
- `GET /api/session`
- `GET /api/matches`
- `PUT /api/matches/sync`

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

## Segurança e arquitetura
- As senhas são salvas com hash seguro (`scrypt`, equivalente ao requisito de bcrypt).
- O login gera JWT assinado contendo `user_id`.
- O JWT é salvo em cookie `HttpOnly`.
- Toda leitura/escrita de partidas é filtrada por `user_id`.

## Estrutura SQL criada automaticamente
Ao primeiro acesso, o backend garante as tabelas:

- `users (id, email, password, created_at)`
- `user_profiles (id, user_id, display_name, created_at)`
- `user_data (id, user_id, title, value, payload, created_at)`

## Contas iniciais
- Admin: `admin@matchdata.com` / `fec2026`
- Nova conta solicitada: `leandro@matchdata.com` / `fec2026`

> Se não existirem no banco, o sistema cria automaticamente no primeiro request da API.

## Fallback local (desenvolvimento)
Se nenhuma variável de banco estiver definida, usa `.data/matches.json` local **apenas para partidas**.

Para autenticação/cadastro multiusuário, Neon é obrigatório.
