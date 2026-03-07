# Configuração do Neon (persistência de partidas)

Este projeto suporta persistência de partidas via Neon SQL HTTP.

## Variáveis de ambiente
Defina na Vercel (Project Settings -> Environment Variables):

- `NEON_SQL_ENDPOINT`: endpoint HTTP do Neon SQL API
- `NEON_SQL_API_KEY`: API key do Neon com permissão de leitura/escrita

## Funcionamento
- `GET /api/matches` lê as partidas persistidas.
- `PUT /api/matches/sync` salva a lista de partidas.
- Tabela usada: `app_matches` (criada automaticamente pelo servidor).

## Fallback local (desenvolvimento)
Se as variáveis do Neon não estiverem definidas, o servidor usa arquivo local `.data/matches.json`.
