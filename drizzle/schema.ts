import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, float, date } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "analyst", "coach"]).default("user").notNull(),
  clubId: int("clubId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Clubs table
export const clubs = mysqlTable("clubs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  logoUrl: text("logoUrl"),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#0E4C92"),
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#E31E24"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Club = typeof clubs.$inferSelect;
export type InsertClub = typeof clubs.$inferInsert;

// Players table
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  clubId: int("clubId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  position: mysqlEnum("position", ["GK", "DEF", "MID", "FWD"]).notNull(),
  number: int("number"),
  birthDate: date("birthDate"),
  nationality: varchar("nationality", { length: 100 }),
  height: float("height"), // em cm
  weight: float("weight"), // em kg
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

// Matches table
export const matches = mysqlTable("matches", {
  id: int("id").autoincrement().primaryKey(),
  clubId: int("clubId").notNull(),
  date: timestamp("date").notNull(),
  opponent: varchar("opponent", { length: 255 }).notNull(),
  competition: varchar("competition", { length: 100 }).notNull(),
  result: mysqlEnum("result", ["W", "D", "L"]),
  goalsFor: int("goalsFor"),
  goalsAgainst: int("goalsAgainst"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;

// Player Stats (por partida)
export const playerStats = mysqlTable("playerStats", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  matchId: int("matchId").notNull(),
  minutesPlayed: int("minutesPlayed"),
  goals: int("goals").default(0),
  assists: int("assists").default(0),
  shots: int("shots").default(0),
  shotsOnTarget: int("shotsOnTarget").default(0),
  passes: int("passes").default(0),
  passAccuracy: float("passAccuracy"), // em %
  tackles: int("tackles").default(0),
  interceptions: int("interceptions").default(0),
  fouls: int("fouls").default(0),
  yellowCards: int("yellowCards").default(0),
  redCards: int("redCards").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerStat = typeof playerStats.$inferSelect;
export type InsertPlayerStat = typeof playerStats.$inferInsert;

// Team Stats (agregado por partida)
export const teamStats = mysqlTable("teamStats", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull(),
  clubId: int("clubId").notNull(),
  possessionPct: float("possessionPct"),
  shots: int("shots").default(0),
  shotsOnTarget: int("shotsOnTarget").default(0),
  passes: int("passes").default(0),
  passAccuracy: float("passAccuracy"),
  tackles: int("tackles").default(0),
  interceptions: int("interceptions").default(0),
  fouls: int("fouls").default(0),
  corners: int("corners").default(0),
  offsides: int("offsides").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamStat = typeof teamStats.$inferSelect;
export type InsertTeamStat = typeof teamStats.$inferInsert;

// KPI Targets (metas fixas G2 e G6)
export const kpiTargets = mysqlTable("kpiTargets", {
  id: int("id").autoincrement().primaryKey(),
  clubId: int("clubId").notNull(),
  kpiName: varchar("kpiName", { length: 255 }).notNull(),
  metaG2: decimal("metaG2", { precision: 10, scale: 4 }),
  metaG6: decimal("metaG6", { precision: 10, scale: 4 }),
  unit: varchar("unit", { length: 50 }),
  category: mysqlEnum("category", ["OFFENSIVE", "DEFENSIVE", "GENERAL"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KpiTarget = typeof kpiTargets.$inferSelect;
export type InsertKpiTarget = typeof kpiTargets.$inferInsert;

// KPI Values (valores reais)
export const kpiValues = mysqlTable("kpiValues", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull(),
  kpiId: int("kpiId").notNull(),
  value: decimal("value", { precision: 10, scale: 4 }),
  period: mysqlEnum("period", ["1T", "2T", "FULL"]).default("FULL"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KpiValue = typeof kpiValues.$inferSelect;
export type InsertKpiValue = typeof kpiValues.$inferInsert;

// Performance Goals (metas individuais/coletivas)
export const performanceGoals = mysqlTable("performanceGoals", {
  id: int("id").autoincrement().primaryKey(),
  clubId: int("clubId").notNull(),
  playerId: int("playerId"),
  kpiId: int("kpiId").notNull(),
  targetValue: decimal("targetValue", { precision: 10, scale: 4 }),
  period: varchar("period", { length: 50 }).notNull(), // "2025-01", "2025-02", etc
  weight: float("weight").default(1), // peso do KPI na meta geral
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PerformanceGoal = typeof performanceGoals.$inferSelect;
export type InsertPerformanceGoal = typeof performanceGoals.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  club: one(clubs, {
    fields: [users.clubId],
    references: [clubs.id],
  }),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  club: one(clubs, {
    fields: [players.clubId],
    references: [clubs.id],
  }),
  stats: many(playerStats),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  club: one(clubs, {
    fields: [matches.clubId],
    references: [clubs.id],
  }),
  playerStats: many(playerStats),
  teamStats: many(teamStats),
  kpiValues: many(kpiValues),
}));

export const playerStatsRelations = relations(playerStats, ({ one }) => ({
  player: one(players, {
    fields: [playerStats.playerId],
    references: [players.id],
  }),
  match: one(matches, {
    fields: [playerStats.matchId],
    references: [matches.id],
  }),
}));

export const teamStatsRelations = relations(teamStats, ({ one }) => ({
  club: one(clubs, {
    fields: [teamStats.clubId],
    references: [clubs.id],
  }),
  match: one(matches, {
    fields: [teamStats.matchId],
    references: [matches.id],
  }),
}));

export const kpiValuesRelations = relations(kpiValues, ({ one }) => ({
  kpi: one(kpiTargets, {
    fields: [kpiValues.kpiId],
    references: [kpiTargets.id],
  }),
  match: one(matches, {
    fields: [kpiValues.matchId],
    references: [matches.id],
  }),
}));

export const performanceGoalsRelations = relations(performanceGoals, ({ one }) => ({
  club: one(clubs, {
    fields: [performanceGoals.clubId],
    references: [clubs.id],
  }),
  player: one(players, {
    fields: [performanceGoals.playerId],
    references: [players.id],
  }),
  kpi: one(kpiTargets, {
    fields: [performanceGoals.kpiId],
    references: [kpiTargets.id],
  }),
}));

export const kpiTargetsRelations = relations(kpiTargets, ({ one, many }) => ({
  club: one(clubs, {
    fields: [kpiTargets.clubId],
    references: [clubs.id],
  }),
  values: many(kpiValues),
  goals: many(performanceGoals),
}));

export const clubsRelations = relations(clubs, ({ many }) => ({
  users: many(users),
  players: many(players),
  matches: many(matches),
  kpiTargets: many(kpiTargets),
  performanceGoals: many(performanceGoals),
  teamStats: many(teamStats),
}));