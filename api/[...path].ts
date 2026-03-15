import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";

const COOKIE_NAME = "md_auth";
const LOGIN_EMAIL = "admin@matchdata.com";
const LOGIN_PASSWORD = "fec2026";
const DEFAULT_USER_EMAIL = "leandro@matchdata.com";
const DEFAULT_USER_PASSWORD = "fec2026";
const SESSION_SECRET = process.env.SESSION_SECRET || "matchdata-dev-secret-change-me";

export const config = { runtime: "nodejs" };

type AuthUser = {
  id: number;
  email: string;
  password: string;
};

async function getMatchesStore() {
  return import("../server/matchesStore");
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  try {
    const [algorithm, salt, hash] = stored.split(":");

    // Compatibilidade com usuários legados salvos em texto puro.
    if (!algorithm || !salt || !hash) {
      return stored === password;
    }

    if (algorithm !== "scrypt") return false;
    if (!/^[a-f0-9]{128}$/i.test(hash)) return false;

    const calculatedHash = scryptSync(password, salt, 64).toString("hex");
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(calculatedHash, "hex"));
  } catch {
    return false;
  }
}

function getJwtSecret() {
  return new TextEncoder().encode(SESSION_SECRET);
}

async function createSessionToken(userId: number, email: string) {
  return new SignJWT({ user_id: userId, email })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

function getFallbackUser(email: string, password: string): { id: number; email: string } | null {
  if (email === LOGIN_EMAIL && password === LOGIN_PASSWORD) {
    return { id: 1, email: LOGIN_EMAIL };
  }

  if (email === DEFAULT_USER_EMAIL && password === DEFAULT_USER_PASSWORD) {
    return { id: 2, email: DEFAULT_USER_EMAIL };
  }

  return null;
}

async function getAuthUser(req: any): Promise<{ userId: number; email: string } | null> {
  const token = getCookieValue(req.headers.cookie, COOKIE_NAME);
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), { algorithms: ["HS256"] });
    const userId = Number(payload.user_id);
    const email = String(payload.email ?? "");

    if (!userId || !email) return null;
    return { userId, email };
  } catch {
    return null;
  }
}

function getCookieValue(rawCookie: string | undefined, name: string) {
  if (!rawCookie) return null;
  const entries = rawCookie.split(";").map((v) => v.trim());
  for (const entry of entries) {
    const [key, ...rest] = entry.split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function buildSessionCookie(token: string) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${60 * 60 * 24 * 7}`,
  ];

  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  return parts.join("; ");
}

function parseBody(req: any) {
  const body = req.body;
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
}

async function requireAuth(req: any, res: any) {
  const auth = await getAuthUser(req);
  if (!auth) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
  return auth;
}

async function ensureDefaultUsers() {
  const store = await getMatchesStore();
  const admin = await store.getUserByEmail(LOGIN_EMAIL);
  if (!admin) {
    await store.createUser(LOGIN_EMAIL, hashPassword(LOGIN_PASSWORD));
  }

  const leandro = await store.getUserByEmail(DEFAULT_USER_EMAIL);
  if (!leandro) {
    await store.createUser(DEFAULT_USER_EMAIL, hashPassword(DEFAULT_USER_PASSWORD));
  }
}

export default async function handler(req: any, res: any) {
  try {
    await ensureDefaultUsers();
  } catch (error) {
    console.error("[Auth] Failed to ensure default users:", error);
  }

  const queryPath = req.query?.path;
  const pathSegments = Array.isArray(queryPath)
    ? queryPath
    : typeof queryPath === "string"
      ? [queryPath]
      : [];

  const fallbackFromUrl =
    typeof req.url === "string"
      ? req.url.split("?")[0].replace(/^\/api\/?/, "")
      : "";

  const rawPath =
    pathSegments.length > 0 ? pathSegments.join("/") : fallbackFromUrl;

  const path = `/${rawPath.replace(/^\/+/, "")}`;

  if (req.method === "POST" && path === "/register") {
    try {
      const body = parseBody(req);
      const normalizedEmail = String(body?.email ?? "").trim().toLowerCase();
      const normalizedPassword = String(body?.password ?? "").trim();

      if (!normalizedEmail || !normalizedPassword) {
        res.status(400).json({ success: false, message: "Email e senha são obrigatórios" });
        return;
      }

      const store = await getMatchesStore();
      const existing = await store.getUserByEmail(normalizedEmail);
      if (existing) {
        res.status(409).json({ success: false, message: "Email já cadastrado" });
        return;
      }

      const user = await store.createUser(normalizedEmail, hashPassword(normalizedPassword));
      const token = await createSessionToken(user.id, user.email);
      res.setHeader("Set-Cookie", buildSessionCookie(token));
      res.status(201).json({ success: true, user: { id: user.id, email: user.email } });
      return;
    } catch {
      res.status(500).json({ success: false, message: "Falha ao criar usuário" });
      return;
    }
  }

  if (req.method === "POST" && path === "/login") {
    const body = parseBody(req);
    const normalizedEmail = String(body?.email ?? "").trim().toLowerCase();
    const normalizedPassword = String(body?.password ?? "").trim();

    try {
      const store = await getMatchesStore();
      const user: AuthUser | null = await store.getUserByEmail(normalizedEmail);

      if (!user || !verifyPassword(normalizedPassword, user.password)) {
        res.status(401).json({ success: false, message: "Credenciais inválidas" });
        return;
      }

      // Se usuário legado estiver com senha em texto puro, migra para hash seguro no login válido.
      if (!user.password.startsWith("scrypt:")) {
        await store.updateUserPassword(user.id, hashPassword(normalizedPassword));
      }

      const token = await createSessionToken(user.id, user.email);
      res.setHeader("Set-Cookie", buildSessionCookie(token));
      res.status(200).json({ success: true, user: { id: user.id, email: user.email } });
      return;
    } catch (error) {
      console.error("[Auth] Login error:", error);

      // Fallback seguro para contas padrão em ambientes sem Neon configurado.
      const fallbackUser = getFallbackUser(normalizedEmail, normalizedPassword);
      if (fallbackUser) {
        const token = await createSessionToken(fallbackUser.id, fallbackUser.email);
        res.setHeader("Set-Cookie", buildSessionCookie(token));
        res.status(200).json({ success: true, user: fallbackUser, warning: "login realizado em modo fallback" });
        return;
      }

      res.status(500).json({ success: false, message: "Falha no login (erro interno)" });
      return;
    }
  }

  if (req.method === "POST" && path === "/logout") {
    res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax; Secure`);
    res.status(200).json({ success: true });
    return;
  }

  if (req.method === "GET" && path === "/session") {
    const auth = await getAuthUser(req);
    res.status(200).json({ authenticated: Boolean(auth), user: auth });
    return;
  }

  if (req.method === "POST" && path === "/matches") {
    const auth = await requireAuth(req, res);
    if (!auth) return;

    try {
      const body = parseBody(req);
      const candidateMatch = body?.match ?? body;
      if (!candidateMatch || typeof candidateMatch !== "object") {
        res.status(400).json({ message: "Invalid match payload" });
        return;
      }

      const { listPersistedMatchesByUser, savePersistedMatchesByUser } = await getMatchesStore();
      const currentMatches = await listPersistedMatchesByUser(auth.userId);

      const normalizedMatch = {
        ...candidateMatch,
        id: Number(candidateMatch.id),
        goalsFor: Number(candidateMatch.goalsFor) || 0,
        goalsAgainst: Number(candidateMatch.goalsAgainst) || 0,
      };

      if (!normalizedMatch.id || !normalizedMatch.date || !normalizedMatch.opponent) {
        res.status(400).json({ message: "Match is missing required fields" });
        return;
      }

      const withoutCurrent = currentMatches.filter((match) => match.id !== normalizedMatch.id);
      const mergedMatches = [normalizedMatch, ...withoutCurrent].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      await savePersistedMatchesByUser(auth.userId, mergedMatches);
      res.status(201).json({ success: true, match: normalizedMatch, matches: mergedMatches });
    } catch {
      res.status(500).json({ message: "Failed to save match" });
    }
    return;
  }

  if (req.method === "GET" && path === "/matches") {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    try {
      const { listPersistedMatchesByUser } = await getMatchesStore();
      const matches = await listPersistedMatchesByUser(auth.userId);
      res.status(200).json({ matches });
    } catch {
      res.status(500).json({ message: "Failed to load matches" });
    }
    return;
  }

  if (req.method === "PUT" && path === "/matches/sync") {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    try {
      const body = parseBody(req);
      const matches = Array.isArray(body?.matches) ? body.matches : [];
      const { savePersistedMatchesByUser } = await getMatchesStore();
      await savePersistedMatchesByUser(auth.userId, matches);
      res.status(200).json({ success: true });
    } catch {
      res.status(500).json({ message: "Failed to save matches" });
    }
    return;
  }

  res.status(404).json({ message: "Not found" });
}
