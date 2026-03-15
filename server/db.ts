import { eq, and, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, clubs, matches, teamStats, kpiTargets, kpiValues, performanceGoals, playerStats } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ CLUBS ============

export async function getOrCreateFortalezaClub() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(clubs).where(eq(clubs.name, "Fortaleza Esporte Clube")).limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }

  await db.insert(clubs).values({
    name: "Fortaleza Esporte Clube",
    primaryColor: "#0E4C92",
    secondaryColor: "#E31E24",
  });

  const result = await db.select().from(clubs).where(eq(clubs.name, "Fortaleza Esporte Clube")).limit(1);
  return result[0];
}

// Players APIs removed — player management not required for initial scope

// ============ MATCHES ============

export async function createMatch(data: {
  clubId: number;
  date: Date;
  opponent: string;
  competition: string;
  result?: "W" | "D" | "L";
  goalsFor?: number;
  goalsAgainst?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(matches).values(data);
  
  const result = await db.select().from(matches)
    .where(and(eq(matches.clubId, data.clubId), eq(matches.opponent, data.opponent)))
    .orderBy(desc(matches.createdAt))
    .limit(1);
  return result[0];
}

export async function getMatchesByClub(clubId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(matches)
    .where(eq(matches.clubId, clubId))
    .orderBy(desc(matches.date))
    .limit(limit);
}

export async function getMatchById(matchId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(matches).where(eq(matches.id, matchId)).limit(1).then(r => r[0]);
}

export async function updateMatch(matchId: number, data: Partial<typeof matches.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(matches).set(data).where(eq(matches.id, matchId));
  return getMatchById(matchId);
}

// Player stats APIs removed — not needed in current scope

// ============ TEAM STATS ============

export async function createTeamStat(data: typeof teamStats.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(teamStats).values(data);
  
  const result = await db.select().from(teamStats)
    .where(eq(teamStats.matchId, data.matchId))
    .orderBy(desc(teamStats.createdAt))
    .limit(1);
  return result[0];
}

export async function getTeamStatsByMatch(matchId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(teamStats).where(eq(teamStats.matchId, matchId)).limit(1).then(r => r[0]);
}

// ============ KPI TARGETS ============

export async function initializeKpiTargets(clubId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // KPIs Ofensivos
  const offensiveKpis: Array<{
    kpiName: string;
    metaG2: number | null;
    metaG6: number | null;
    unit: string;
    category: "OFFENSIVE" | "DEFENSIVE" | "GENERAL";
  }> = [
    { kpiName: "Pontos", metaG2: 65.4, metaG6: 60.8, unit: "pts", category: "OFFENSIVE" },
    { kpiName: "Média de Gols", metaG2: 1.23, metaG6: 1.244, unit: "gols", category: "OFFENSIVE" },
    { kpiName: "XG", metaG2: 1.302, metaG6: 1.33, unit: "xg", category: "OFFENSIVE" },
    { kpiName: "Posse %", metaG2: 0.51, metaG6: 0.50, unit: "%", category: "OFFENSIVE" },
    { kpiName: "% de jogos que marcou", metaG2: 0.76, metaG6: 0.722, unit: "%", category: "OFFENSIVE" },
    { kpiName: "Finalização/90min", metaG2: 12.4, metaG6: 12.2, unit: "shots", category: "OFFENSIVE" },
    { kpiName: "% Finalização Certa/90min", metaG2: 0.35, metaG6: 0.33, unit: "%", category: "OFFENSIVE" },
    { kpiName: "Finalização de Dentro da área/90min", metaG2: 7.6, metaG6: 6.2, unit: "shots", category: "OFFENSIVE" },
    { kpiName: "Cruzamentos % Acerto", metaG2: 0.342, metaG6: 0.348, unit: "%", category: "OFFENSIVE" },
    { kpiName: "Entradas da Área/por 90 min", metaG2: 22.4, metaG6: 21.4, unit: "entries", category: "OFFENSIVE" },
    { kpiName: "Toques na área/90min", metaG2: 14.6, metaG6: 14.8, unit: "touches", category: "OFFENSIVE" },
  ];

  // KPIs Defensivos
  const defensiveKpis: Array<{
    kpiName: string;
    metaG2: number | null;
    metaG6: number | null;
    unit: string;
    category: "OFFENSIVE" | "DEFENSIVE" | "GENERAL";
  }> = [
    { kpiName: "Média de Gols Sofridos", metaG2: 0.882, metaG6: 0.92, unit: "gols", category: "DEFENSIVE" },
    { kpiName: "XG Contra", metaG2: 0.968, metaG6: 1.098, unit: "xg", category: "DEFENSIVE" },
    { kpiName: "Posse Contra", metaG2: 0.49, metaG6: 0.5025, unit: "%", category: "DEFENSIVE" },
    { kpiName: "% de jogos que não sofreu gols", metaG2: 0.454, metaG6: 0.384, unit: "%", category: "DEFENSIVE" },
    { kpiName: "Finalização Sofrida/90min", metaG2: 10.8, metaG6: 11.6, unit: "shots", category: "DEFENSIVE" },
    { kpiName: "% Finalização CertaSofrida/90min", metaG2: 0.322, metaG6: 0.306, unit: "%", category: "DEFENSIVE" },
    { kpiName: "Finalização de Dentro da área Sofrida/90min", metaG2: 5.8, metaG6: 5.6, unit: "shots", category: "DEFENSIVE" },
    { kpiName: "Cruzamentos % Acerto Sofridos", metaG2: 0.312, metaG6: 0.336, unit: "%", category: "DEFENSIVE" },
    { kpiName: "Entradas da Área Sofrida/por 90 min", metaG2: 19, metaG6: 18.4, unit: "entries", category: "DEFENSIVE" },
    { kpiName: "Toques na área Sofridos/90min", metaG2: 11.8, metaG6: 12.6, unit: "touches", category: "DEFENSIVE" },
  ];

  // KPIs Gerais
  const generalKpis: Array<{
    kpiName: string;
    metaG2: number | null;
    metaG6: number | null;
    unit: string;
    category: "OFFENSIVE" | "DEFENSIVE" | "GENERAL";
  }> = [
    { kpiName: "Intensidade de Jogo", metaG2: 16, metaG6: 15, unit: "passes/min", category: "GENERAL" },
    { kpiName: "% Duelos Ofensivos", metaG2: 0.41, metaG6: 0.42, unit: "%", category: "GENERAL" },
    { kpiName: "% Duelos Defensivos", metaG2: 0.61, metaG6: 0.59, unit: "%", category: "GENERAL" },
    { kpiName: "% Duelos Aéreos", metaG2: 0.47, metaG6: 0.46, unit: "%", category: "GENERAL" },
    { kpiName: "Recuperações Altas/Médias", metaG2: 44, metaG6: 42, unit: "recoveries", category: "GENERAL" },
    { kpiName: "PPDA", metaG2: 9.88, metaG6: 10, unit: "ppda", category: "GENERAL" },
    { kpiName: "Média de Passes/por jogo", metaG2: 395, metaG6: 374, unit: "passes", category: "GENERAL" },
    { kpiName: "% Acerto de Passes", metaG2: 0.83, metaG6: 0.82, unit: "%", category: "GENERAL" },
  ];

  const allKpis = [...offensiveKpis, ...defensiveKpis, ...generalKpis];

  for (const kpi of allKpis) {
    const kpiData = {
      clubId: clubId,
      kpiName: kpi.kpiName,
      metaG2: kpi.metaG2?.toString() ?? null,
      metaG6: kpi.metaG6?.toString() ?? null,
      unit: kpi.unit,
      category: kpi.category,
    };
    await db.insert(kpiTargets).values([kpiData]).onDuplicateKeyUpdate({
      set: {
        metaG2: kpi.metaG2?.toString() ?? null,
        metaG6: kpi.metaG6?.toString() ?? null,
      },
    });
  }

  return db.select().from(kpiTargets).where(eq(kpiTargets.clubId, clubId));
}

export async function getKpiTargetsByClub(clubId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(kpiTargets).where(eq(kpiTargets.clubId, clubId));
}

export async function getKpiTargetsByCategory(clubId: number, category: "OFFENSIVE" | "DEFENSIVE" | "GENERAL") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(kpiTargets)
    .where(and(eq(kpiTargets.clubId, clubId), eq(kpiTargets.category, category)));
}

// ============ KPI VALUES ============

export async function createKpiValue(data: typeof kpiValues.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(kpiValues).values(data);
  
  const result = await db.select().from(kpiValues)
    .where(and(eq(kpiValues.matchId, data.matchId), eq(kpiValues.kpiId, data.kpiId)))
    .orderBy(desc(kpiValues.createdAt))
    .limit(1);
  return result[0];
}

export async function getKpiValuesByMatch(matchId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(kpiValues).where(eq(kpiValues.matchId, matchId));
}

export async function getKpiValuesByKpi(kpiId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(kpiValues)
    .where(eq(kpiValues.kpiId, kpiId))
    .orderBy(desc(kpiValues.createdAt))
    .limit(limit);
}

// ============ PERFORMANCE GOALS ============

export async function createPerformanceGoal(data: typeof performanceGoals.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(performanceGoals).values(data);
  
  const result = await db.select().from(performanceGoals)
    .where(and(
      eq(performanceGoals.clubId, data.clubId),
      eq(performanceGoals.kpiId, data.kpiId),
      eq(performanceGoals.period, data.period)
    ))
    .orderBy(desc(performanceGoals.createdAt))
    .limit(1);
  return result[0];
}

export async function getPerformanceGoalsByClub(clubId: number, period?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(performanceGoals.clubId, clubId)];
  if (period) {
    conditions.push(eq(performanceGoals.period, period));
  }

  return db.select().from(performanceGoals).where(and(...conditions));
}

export async function getPerformanceGoalsByPlayer(playerId: number, period?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(performanceGoals.playerId, playerId)];
  if (period) {
    conditions.push(eq(performanceGoals.period, period));
  }

  return db.select().from(performanceGoals).where(and(...conditions));
}

// ============ ANALYTICS ============

export async function getClubStatsByPeriod(clubId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startTimestamp = startDate.getTime();
  const endTimestamp = endDate.getTime();

  const clubMatches = await db.select().from(matches)
    .where(and(
      eq(matches.clubId, clubId),
      sql`UNIX_TIMESTAMP(${matches.date}) * 1000 >= ${startTimestamp}`,
      sql`UNIX_TIMESTAMP(${matches.date}) * 1000 <= ${endTimestamp}`
    ))
    .orderBy(desc(matches.date));

  return clubMatches;
}

export async function getPlayerAverageStats(playerId: number, limit = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const stats = await db.select().from(playerStats)
    .where(eq(playerStats.playerId, playerId))
    .orderBy(desc(playerStats.createdAt))
    .limit(limit);

  if (stats.length === 0) return null;

  const avg = {
    minutesPlayed: stats.reduce((sum, s) => sum + (s.minutesPlayed || 0), 0) / stats.length,
    goals: stats.reduce((sum, s) => sum + (s.goals || 0), 0) / stats.length,
    assists: stats.reduce((sum, s) => sum + (s.assists || 0), 0) / stats.length,
    shots: stats.reduce((sum, s) => sum + (s.shots || 0), 0) / stats.length,
    shotsOnTarget: stats.reduce((sum, s) => sum + (s.shotsOnTarget || 0), 0) / stats.length,
    passes: stats.reduce((sum, s) => sum + (s.passes || 0), 0) / stats.length,
    passAccuracy: stats.reduce((sum, s) => sum + (s.passAccuracy || 0), 0) / stats.length,
    tackles: stats.reduce((sum, s) => sum + (s.tackles || 0), 0) / stats.length,
    interceptions: stats.reduce((sum, s) => sum + (s.interceptions || 0), 0) / stats.length,
  };

  return avg;
}
