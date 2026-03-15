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

export type AuthUser = {
  id: number;
  email: string;
  password: string;
  created_at?: string;
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

function buildUrlFromPgParams() {
  const host = process.env.PGHOST || process.env.POSTGRES_HOST;
  const database = process.env.PGDATABASE || process.env.POSTGRES_DATABASE;
  const user = process.env.PGUSER || process.env.POSTGRES_USER;
  const password = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;

  if (!host || !database || !user || !password) return "";

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  return `postgresql://${encodedUser}:${encodedPassword}@${host}/${database}?sslmode=require`;
}

const NEON_DATABASE_URL =
  process.env.NEON_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL_NO_SSL ||
  buildUrlFromPgParams() ||
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

async function neonQuery<T = any>(
  query: string,
  params: unknown[] = []
): Promise<T[]> {
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
  await neonQuery(`
    CREATE TABLE IF NOT EXISTS app_user_matches (
      owner_key TEXT NOT NULL,
      match_id INTEGER NOT NULL,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (owner_key, match_id)
    )
  `);
  await neonQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await neonQuery(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      display_name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await neonQuery(`
    CREATE TABLE IF NOT EXISTS user_data (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title TEXT,
      value INTEGER,
      payload JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  neonReady = true;
}

function neonEnabled() {
  return Boolean(NEON_DATABASE_URL || (NEON_SQL_ENDPOINT && NEON_SQL_API_KEY));
}

function shouldAllowLocalFallback() {
  if (process.env.FORCE_LOCAL_MATCH_STORE === "1") return true;
  return process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1";
}

export async function listPersistedMatches(): Promise<PersistedMatch[]> {
  if (neonEnabled()) {
    await ensureNeonTable();
    const rows = await neonQuery<{ payload?: PersistedMatch }>(
      "SELECT payload FROM app_matches ORDER BY id DESC"
    );
    return rows
      .filter((r): r is { payload: PersistedMatch } => Boolean(r && r.payload))
      .map(r => normalizeMatch(r.payload));
  }

  if (!shouldAllowLocalFallback()) {
    throw new Error("Neon database is not configured in this environment");
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

export async function listPersistedMatchesByOwner(
  ownerKey: string
): Promise<PersistedMatch[]> {
  const normalizedOwner = String(ownerKey || "")
    .trim()
    .toLowerCase();
  if (!normalizedOwner) return [];

  if (neonEnabled()) {
    await ensureNeonTable();
    const rows = await neonQuery<{ payload?: PersistedMatch }>(
      "SELECT payload FROM app_user_matches WHERE owner_key = $1 ORDER BY match_id DESC",
      [normalizedOwner]
    );

    return rows
      .filter((r): r is { payload: PersistedMatch } => Boolean(r && r.payload))
      .map(r => normalizeMatch(r.payload));
  }

  if (!shouldAllowLocalFallback()) {
    throw new Error("Neon database is not configured in this environment");
  }

  try {
    if (!fs.existsSync(LOCAL_FILE)) return [];
    const raw = fs.readFileSync(LOCAL_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Record<string, PersistedMatch[]>;

    if (Array.isArray(parsed)) {
      return parsed.map(normalizeMatch);
    }

    const ownerMatches = parsed?.[normalizedOwner];
    return Array.isArray(ownerMatches) ? ownerMatches.map(normalizeMatch) : [];
  } catch {
    return [];
  }
}

export async function savePersistedMatchesByOwner(
  ownerKey: string,
  matches: PersistedMatch[]
): Promise<void> {
  const normalizedOwner = String(ownerKey || "")
    .trim()
    .toLowerCase();
  if (!normalizedOwner) return;
  const normalizedMatches = matches.map(normalizeMatch);

  if (neonEnabled()) {
    await ensureNeonTable();
    await neonQuery("BEGIN");
    try {
      await neonQuery("DELETE FROM app_user_matches WHERE owner_key = $1", [
        normalizedOwner,
      ]);
      for (const item of normalizedMatches) {
        await neonQuery(
          "INSERT INTO app_user_matches (owner_key, match_id, payload, updated_at) VALUES ($1, $2, $3::jsonb, NOW())",
          [normalizedOwner, item.id, JSON.stringify(item)]
        );
      }
      await neonQuery("COMMIT");
    } catch (error) {
      await neonQuery("ROLLBACK");
      throw error;
    }
    return;
  }

  if (!shouldAllowLocalFallback()) {
    throw new Error("Neon database is not configured in this environment");
  }

  ensureLocalDir();
  let payload: Record<string, PersistedMatch[]> = {};
  if (fs.existsSync(LOCAL_FILE)) {
    try {
      const current = JSON.parse(fs.readFileSync(LOCAL_FILE, "utf-8"));
      if (Array.isArray(current)) {
        payload = { legacy: current.map(normalizeMatch) };
      } else if (current && typeof current === "object") {
        payload = current;
      }
    } catch {
      payload = {};
    }
  }
  payload[normalizedOwner] = normalizedMatches;
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(payload, null, 2), "utf-8");
}

export async function createUser(
  email: string,
  passwordHash: string
): Promise<AuthUser> {
  if (!neonEnabled()) {
    throw new Error("Neon database is required for user management");
  }

  await ensureNeonTable();
  const rows = await neonQuery<AuthUser>(
    "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, password, created_at",
    [email, passwordHash]
  );

  if (!rows[0]) {
    throw new Error("Failed to create user");
  }

  await neonQuery(
    "INSERT INTO user_profiles (user_id, display_name) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING",
    [rows[0].id, email]
  );

  return rows[0];
}

export async function getUserByEmail(email: string): Promise<AuthUser | null> {
  if (!neonEnabled()) {
    throw new Error("Neon database is required for user management");
  }

  await ensureNeonTable();
  const rows = await neonQuery<AuthUser>(
    "SELECT id, email, password, created_at FROM users WHERE email = $1 LIMIT 1",
    [email]
  );
  return rows[0] ?? null;
}

export async function updateUserPassword(
  userId: number,
  passwordHash: string
): Promise<void> {
  if (!neonEnabled()) {
    throw new Error("Neon database is required for user management");
  }

  await ensureNeonTable();
  await neonQuery("UPDATE users SET password = $1 WHERE id = $2", [
    passwordHash,
    userId,
  ]);
}

export async function ensureUser(
  email: string,
  passwordHash: string
): Promise<AuthUser> {
  const existing = await getUserByEmail(email);
  if (existing) return existing;
  return createUser(email, passwordHash);
}

export async function listPersistedMatchesByUser(
  userId: number
): Promise<PersistedMatch[]> {
  if (neonEnabled()) {
    await ensureNeonTable();
    const rows = await neonQuery<{ payload?: PersistedMatch }>(
      "SELECT payload FROM user_data WHERE user_id = $1 ORDER BY id DESC",
      [userId]
    );
    return rows
      .filter((r): r is { payload: PersistedMatch } => Boolean(r && r.payload))
      .map(r => normalizeMatch(r.payload));
  }

  return listPersistedMatches();
}

export async function savePersistedMatchesByUser(
  userId: number,
  matches: PersistedMatch[]
): Promise<void> {
  const normalized = matches.map(normalizeMatch);

  if (neonEnabled()) {
    await ensureNeonTable();
    await neonQuery("BEGIN");
    try {
      await neonQuery("DELETE FROM user_data WHERE user_id = $1", [userId]);
      for (const item of normalized) {
        await neonQuery(
          "INSERT INTO user_data (user_id, title, value, payload, created_at) VALUES ($1, $2, $3, $4::jsonb, NOW())",
          [userId, item.opponent, item.goalsFor, JSON.stringify(item)]
        );
      }
      await neonQuery("COMMIT");
    } catch (error) {
      await neonQuery("ROLLBACK");
      throw error;
    }
    return;
  }

  await savePersistedMatches(matches);
}

export async function savePersistedMatches(
  matches: PersistedMatch[]
): Promise<void> {
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

  if (!shouldAllowLocalFallback()) {
    throw new Error("Neon database is not configured in this environment");
  }

  ensureLocalDir();
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(normalized, null, 2), "utf-8");
}
