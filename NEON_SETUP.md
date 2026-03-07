# Configuração do Neon (persistência de partidas)

Este projeto suporta persistência de partidas via Neon.

## Opção recomendada (connection string)
Defina na Vercel (Project Settings -> Environment Variables):

- `NEON_DATABASE_URL` (ou `DATABASE_URL`)

Exemplo de formato:

`postgresql://USER:PASSWORD@HOST/DB?sslmode=require&channel_binding=require`

## Opção alternativa (legado)
Também funciona com:

- `NEON_SQL_ENDPOINT`
- `NEON_SQL_API_KEY`

## Funcionamento
- `GET /api/matches` lê as partidas persistidas.
- `PUT /api/matches/sync` salva a lista de partidas.
- Tabela usada: `app_matches` (criada automaticamente pelo servidor).

## Fallback local (desenvolvimento)
Se o Neon não estiver configurado, o servidor usa arquivo local `.data/matches.json`.
