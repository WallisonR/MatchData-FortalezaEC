import fs from "node:fs";
import path from "node:path";

export type PersistedMatch = {
  id: number;
  date: string;
  opponent: string;
  competition: string;
  result: "W" | "D" | "L";
  goalsFor: number;
  goalsAgainst: number;
  possession?: number;
  xg?: number;
  pct_jogos_marcou?: number;
  finalizacoes?: number;
  pct_final_certa?: number;
  final_dentro?: number;
  pct_cruzamentos_acerto?: number;
  entradas_area_90?: number;
  toques_area_90?: number;
  xg_contra?: number;
  pct_nao_sofreu?: number;
  final_sofrida?: number;
  pct_final_certa_sofrida?: number;
  final_dentro_sofrida?: number;
  pct_cruzamentos_acerto_sofridos?: number;
  entradas_area_sofrida_90?: number;
  toques_area_sofridos_90?: number;
  shots?: number;
  shotsOnTarget?: number;
  passes?: number;
  passAccuracy?: number;
  tackles?: number;
  corners?: number;
};

const LOCAL_FILE = path.resolve(process.cwd(), ".data", "matches.json");

function ensureLocalDir() {
  const dir = path.dirname(LOCAL_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function normalizeMatch(input: PersistedMatch): PersistedMatch {
  return {
    ...input,
    id: Number(input.id),
    goalsFor: Number(input.goalsFor) || 0,
    goalsAgainst: Number(input.goalsAgainst) || 0,
  };
}

const NEON_DATABASE_URL =
  process.env.NEON_DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  "";
const NEON_SQL_ENDPOINT = process.env.NEON_SQL_ENDPOINT || "";
const NEON_SQL_API_KEY = process.env.NEON_SQL_API_KEY || "";

function getNeonFetchEndpointFromUrl(connectionString: string) {
  try {
    const url = new URL(connectionString);
    return `https://${url.host}/sql`;
  } catch {
    return null;
  }
}

async function neonQuery<T = any>(query: string, params: unknown[] = []): Promise<T[]> {
  // Preferred mode: direct Neon connection string (what you provided)
  if (NEON_DATABASE_URL) {
    const endpoint = getNeonFetchEndpointFromUrl(NEON_DATABASE_URL);
    if (!endpoint) {
      throw new Error("Invalid NEON_DATABASE_URL/DATABASE_URL");
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Neon-Connection-String": NEON_DATABASE_URL,
      },
      body: JSON.stringify({ query, params }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Neon SQL request failed: ${response.status} ${text}`);
    }

    const payload = (await response.json()) as any;
    return payload.rows ?? payload.result?.rows ?? payload.data?.rows ?? [];
  }

  // Backward compatibility mode: SQL endpoint + API key
  if (NEON_SQL_ENDPOINT && NEON_SQL_API_KEY) {
    const response = await fetch(NEON_SQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NEON_SQL_API_KEY}`,
      },
      body: JSON.stringify({ query, params }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Neon SQL request failed: ${response.status} ${text}`);
    }

    const payload = (await response.json()) as any;
    return payload.rows ?? payload.result?.rows ?? payload.data?.rows ?? [];
  }

  throw new Error("Neon not configured");
}

let neonReady = false;

async function ensureNeonTable() {
  if (neonReady) return;
  await neonQuery(`
    CREATE TABLE IF NOT EXISTS app_matches (
      id INTEGER PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  neonReady = true;
}

function neonEnabled() {
  return Boolean(NEON_DATABASE_URL || (NEON_SQL_ENDPOINT && NEON_SQL_API_KEY));
}

export async function listPersistedMatches(): Promise<PersistedMatch[]> {
  if (neonEnabled()) {
    await ensureNeonTable();
    const rows = await neonQuery<{ payload: PersistedMatch }>(
      "SELECT payload FROM app_matches ORDER BY id DESC"
    );
    return rows.map((r) => normalizeMatch(r.payload));
  }

  try {
    if (!fs.existsSync(LOCAL_FILE)) return [];
    const raw = fs.readFileSync(LOCAL_FILE, "utf-8");
    const parsed = JSON.parse(raw) as PersistedMatch[];
    return Array.isArray(parsed) ? parsed.map(normalizeMatch) : [];
  } catch {
    return [];
  }
}

export async function savePersistedMatches(matches: PersistedMatch[]): Promise<void> {
  const normalized = matches.map(normalizeMatch);

  if (neonEnabled()) {
    await ensureNeonTable();
    await neonQuery("BEGIN");
    try {
      await neonQuery("DELETE FROM app_matches");
      for (const item of normalized) {
        await neonQuery(
          "INSERT INTO app_matches (id, payload, updated_at) VALUES ($1, $2::jsonb, NOW())",
          [item.id, JSON.stringify(item)]
        );
      }
      await neonQuery("COMMIT");
    } catch (error) {
      await neonQuery("ROLLBACK");
      throw error;
    }
    return;
  }

  ensureLocalDir();
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(normalized, null, 2), "utf-8");
}
