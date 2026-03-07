import { listPersistedMatches, savePersistedMatches } from "../server/matchesStore";

const COOKIE_NAME = "md_auth";
const LOGIN_EMAIL = "admin@matchdata.com";
const LOGIN_PASSWORD = "fec2026";

function getCookieValue(rawCookie: string | undefined, name: string) {
  if (!rawCookie) return null;
  const entries = rawCookie.split(";").map((v) => v.trim());
  for (const entry of entries) {
    const [key, ...rest] = entry.split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function isAuthenticated(req: any) {
  return getCookieValue(req.headers.cookie, COOKIE_NAME) === "1";
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

function requireAuth(req: any, res: any) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }
  return true;
}

export default async function handler(req: any, res: any) {
  const path = `/${(req.query.path ?? []).toString().replace(/,/g, "/")}`;

  if (req.method === "POST" && path === "/login") {
    const body = parseBody(req);
    const normalizedEmail = String(body?.email ?? "").trim().toLowerCase();
    const normalizedPassword = String(body?.password ?? "").trim();

    if (normalizedEmail !== LOGIN_EMAIL || normalizedPassword !== LOGIN_PASSWORD) {
      res.status(401).json({ success: false, message: "Credenciais inválidas" });
      return;
    }

    res.setHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}; Secure`
    );
    res.status(200).json({ success: true });
    return;
  }

  if (req.method === "POST" && path === "/logout") {
    res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax; Secure`);
    res.status(200).json({ success: true });
    return;
  }

  if (req.method === "GET" && path === "/session") {
    res.status(200).json({ authenticated: isAuthenticated(req) });
    return;
  }

  if (req.method === "GET" && path === "/matches") {
    if (!requireAuth(req, res)) return;
    try {
      const matches = await listPersistedMatches();
      res.status(200).json({ matches });
    } catch {
      res.status(500).json({ message: "Failed to load matches" });
    }
    return;
  }

  if (req.method === "PUT" && path === "/matches/sync") {
    if (!requireAuth(req, res)) return;
    try {
      const body = parseBody(req);
      const matches = Array.isArray(body?.matches) ? body.matches : [];
      await savePersistedMatches(matches);
      res.status(200).json({ success: true });
    } catch {
      res.status(500).json({ message: "Failed to save matches" });
    }
    return;
  }

  res.status(404).json({ message: "Not found" });
}
