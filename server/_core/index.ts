import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import crypto from "node:crypto";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { listPersistedMatches, savePersistedMatches } from "../matchesStore";

const SIMPLE_AUTH_COOKIE = "md_auth";
const LOGIN_EMAIL = (process.env.APP_LOGIN_EMAIL || "admin@matchdata.com").trim().toLowerCase();
const LOGIN_PASSWORD = (process.env.APP_LOGIN_PASSWORD || "fec2026").trim();
const sessions = new Set<string>();

function getCookieValue(rawCookie: string | undefined, name: string) {
  if (!rawCookie) return null;
  const entries = rawCookie.split(";").map((v) => v.trim());
  for (const entry of entries) {
    const [key, ...rest] = entry.split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function isAuthenticated(req: express.Request) {
  const token = getCookieValue(req.headers.cookie, SIMPLE_AUTH_COOKIE);
  return token ? sessions.has(token) : false;
}

function requireSimpleAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  next();
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body ?? {};
    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    const normalizedPassword = String(password ?? "").trim();

    if (normalizedEmail !== LOGIN_EMAIL || normalizedPassword !== LOGIN_PASSWORD) {
      res.status(401).json({ success: false, message: "Credenciais inválidas" });
      return;
    }

    const token = crypto.randomUUID();
    sessions.add(token);

    res.cookie(SIMPLE_AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    res.json({ success: true });
  });

  app.post("/api/logout", (req, res) => {
    const token = getCookieValue(req.headers.cookie, SIMPLE_AUTH_COOKIE);
    if (token) sessions.delete(token);
    res.clearCookie(SIMPLE_AUTH_COOKIE, { path: "/" });
    res.json({ success: true });
  });

  app.get("/api/session", (req, res) => {
    res.json({ authenticated: isAuthenticated(req) });
  });

  app.get("/api/matches", requireSimpleAuth, async (_req, res) => {
    try {
      const matches = await listPersistedMatches();
      res.json({ matches });
    } catch (error) {
      res.status(500).json({ message: "Failed to load matches" });
    }
  });

  app.put("/api/matches/sync", requireSimpleAuth, async (req, res) => {
    try {
      const matches = Array.isArray(req.body?.matches) ? req.body.matches : [];
      await savePersistedMatches(matches);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to save matches" });
    }
  });
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
