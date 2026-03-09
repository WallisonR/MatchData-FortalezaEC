const CANDIDATE_URLS = [
  process.env.NEON_DATABASE_URL,
  process.env.DATABASE_URL,
  process.env.DATABASE_URL_UNPOOLED,
  process.env.POSTGRES_URL,
  process.env.POSTGRES_PRISMA_URL,
  process.env.POSTGRES_URL_NON_POOLING,
  process.env.POSTGRES_URL_NO_SSL,
].filter((v): v is string => Boolean(v && v.trim()));

function endpointFromConnectionString(connectionString: string) {
  const url = new URL(connectionString);
  return `https://${url.host}/sql`;
}

async function main() {
  const connectionString = CANDIDATE_URLS[0];

  if (!connectionString) {
    console.error("❌ Nenhuma variável de conexão Neon/Postgres foi encontrada no ambiente.");
    process.exit(1);
  }

  const endpoint = endpointFromConnectionString(connectionString);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": connectionString,
    },
    body: JSON.stringify({
      query:
        "select current_database() as database, current_user as db_user, now() as server_time, version() as version",
      params: [],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`❌ Falha na conexão Neon: ${response.status} ${text}`);
    process.exit(1);
  }

  const payload = (await response.json()) as any;
  const row = payload?.rows?.[0] ?? payload?.result?.rows?.[0] ?? payload?.data?.rows?.[0];

  if (!row) {
    console.error("❌ Resposta do Neon sem linhas retornadas.");
    process.exit(1);
  }

  console.log("✅ Conexão com Neon OK");
  console.log(JSON.stringify(row, null, 2));
}

main().catch((err) => {
  console.error("❌ Erro inesperado ao testar Neon:", err instanceof Error ? err.message : err);
  process.exit(1);
});
