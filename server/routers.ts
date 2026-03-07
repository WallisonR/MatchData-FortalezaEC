import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ CLUB ============
  club: router({
    getOrCreate: protectedProcedure.query(async () => {
      try {
        const club = await db.getOrCreateFortalezaClub();
        return club;
      } catch (error) {
        console.error("Error getting/creating club:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get/create club" });
      }
    }),

    initializeKpis: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .mutation(async ({ input }) => {
        try {
          const kpis = await db.initializeKpiTargets(input.clubId);
          return { success: true, count: kpis.length };
        } catch (error) {
          console.error("Error initializing KPIs:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to initialize KPIs" });
        }
      }),
  }),

  // ============ PLAYERS ============
  // players router removed per request (management of players not needed)

  // ============ MATCHES ============
  matches: router({
    create: protectedProcedure
      .input(z.object({
        clubId: z.number(),
        date: z.date(),
        opponent: z.string(),
        competition: z.string(),
        result: z.enum(["W", "D", "L"]).optional(),
        goalsFor: z.number().optional(),
        goalsAgainst: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const match = await db.createMatch(input);
          return match;
        } catch (error) {
          console.error("Error creating match:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create match" });
        }
      }),

    list: protectedProcedure
      .input(z.object({ clubId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        try {
          const matches = await db.getMatchesByClub(input.clubId, input.limit);
          return matches;
        } catch (error) {
          console.error("Error listing matches:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to list matches" });
        }
      }),

    getById: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        try {
          const match = await db.getMatchById(input.matchId);
          return match;
        } catch (error) {
          console.error("Error getting match:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get match" });
        }
      }),

    update: protectedProcedure
      .input(z.object({
        matchId: z.number(),
        result: z.enum(["W", "D", "L"]).optional(),
        goalsFor: z.number().optional(),
        goalsAgainst: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { matchId, ...data } = input;
          const match = await db.updateMatch(matchId, data);
          return match;
        } catch (error) {
          console.error("Error updating match:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update match" });
        }
      }),

    getStats: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        try {
          const teamStats = await db.getTeamStatsByMatch(input.matchId);
          const kpiValues = await db.getKpiValuesByMatch(input.matchId);
          return { teamStats, kpiValues };
        } catch (error) {
          console.error("Error getting match stats:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get match stats" });
        }
      }),
  }),

  // ============ KPIs ============
  kpis: router({
    getByClub: protectedProcedure
      .input(z.object({ clubId: z.number() }))
      .query(async ({ input }) => {
        try {
          const kpis = await db.getKpiTargetsByClub(input.clubId);
          const offensive = kpis.filter(k => k.category === "OFFENSIVE");
          const defensive = kpis.filter(k => k.category === "DEFENSIVE");
          const general = kpis.filter(k => k.category === "GENERAL");
          return { all: kpis, offensive, defensive, general };
        } catch (error) {
          console.error("Error getting KPIs:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get KPIs" });
        }
      }),

    getByCategory: protectedProcedure
      .input(z.object({
        clubId: z.number(),
        category: z.enum(["OFFENSIVE", "DEFENSIVE", "GENERAL"]),
      }))
      .query(async ({ input }) => {
        try {
          const kpis = await db.getKpiTargetsByCategory(input.clubId, input.category);
          return kpis;
        } catch (error) {
          console.error("Error getting KPIs by category:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get KPIs" });
        }
      }),

    getValues: protectedProcedure
      .input(z.object({ kpiId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        try {
          const values = await db.getKpiValuesByKpi(input.kpiId, input.limit);
          return values;
        } catch (error) {
          console.error("Error getting KPI values:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get KPI values" });
        }
      }),

    createValue: protectedProcedure
      .input(z.object({
        matchId: z.number(),
        kpiId: z.number(),
        value: z.number(),
        period: z.enum(["1T", "2T", "FULL"]).default("FULL"),
      }))
      .mutation(async ({ input }) => {
        try {
          const kpiData = {
            matchId: input.matchId,
            kpiId: input.kpiId,
            value: input.value?.toString() ?? null,
            period: input.period,
          };
          const value = await db.createKpiValue(kpiData);
          return value;
        } catch (error) {
          console.error("Error creating KPI value:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create KPI value" });
        }
      }),
  }),

  // ============ STATS & ANALYTICS ============
  stats: router({
    getClubByPeriod: protectedProcedure
      .input(z.object({
        clubId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        try {
          const matches = await db.getClubStatsByPeriod(input.clubId, input.startDate, input.endDate);
          return matches;
        } catch (error) {
          console.error("Error getting club stats by period:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get club stats" });
        }
      }),

    getPlayerComparison: protectedProcedure
      .input(z.object({
        playerId1: z.number(),
        playerId2: z.number(),
        limit: z.number().default(10),
      }))
      .query(async ({ input }) => {
        try {
          const stats1 = await db.getPlayerAverageStats(input.playerId1, input.limit);
          const stats2 = await db.getPlayerAverageStats(input.playerId2, input.limit);
          return { player1: stats1, player2: stats2 };
        } catch (error) {
          console.error("Error comparing players:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to compare players" });
        }
      }),
  }),

  // playerStats router removed — per request, player-level stats APIs are not needed now

  // ============ TEAM STATS ============
  teamStats: router({
    create: protectedProcedure
      .input(z.object({
        matchId: z.number(),
        clubId: z.number(),
        possessionPct: z.number().optional(),
        shots: z.number().default(0),
        shotsOnTarget: z.number().default(0),
        passes: z.number().default(0),
        passAccuracy: z.number().optional(),
        tackles: z.number().default(0),
        interceptions: z.number().default(0),
        fouls: z.number().default(0),
        corners: z.number().default(0),
        offsides: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        try {
          const stat = await db.createTeamStat(input);
          return stat;
        } catch (error) {
          console.error("Error creating team stat:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create team stat" });
        }
      }),

    getByMatch: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        try {
          const stat = await db.getTeamStatsByMatch(input.matchId);
          return stat;
        } catch (error) {
          console.error("Error getting team stats by match:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get team stats" });
        }
      }),
  }),

  // ============ PERFORMANCE GOALS ============
  performanceGoals: router({
    create: protectedProcedure
      .input(z.object({
        clubId: z.number(),
        playerId: z.number().optional(),
        kpiId: z.number(),
        targetValue: z.number(),
        period: z.string(),
        weight: z.number().default(1),
      }))
      .mutation(async ({ input }) => {
        try {
          const goalData = {
            clubId: input.clubId,
            playerId: input.playerId,
            kpiId: input.kpiId,
            targetValue: input.targetValue?.toString() ?? null,
            period: input.period,
            weight: input.weight,
          };
          const goal = await db.createPerformanceGoal(goalData);
          return goal;
        } catch (error) {
          console.error("Error creating performance goal:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create performance goal" });
        }
      }),

    getByClub: protectedProcedure
      .input(z.object({ clubId: z.number(), period: z.string().optional() }))
      .query(async ({ input }) => {
        try {
          const goals = await db.getPerformanceGoalsByClub(input.clubId, input.period);
          return goals;
        } catch (error) {
          console.error("Error getting performance goals by club:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get performance goals" });
        }
      }),

    getByPlayer: protectedProcedure
      .input(z.object({ playerId: z.number(), period: z.string().optional() }))
      .query(async ({ input }) => {
        try {
          const goals = await db.getPerformanceGoalsByPlayer(input.playerId, input.period);
          return goals;
        } catch (error) {
          console.error("Error getting performance goals by player:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get performance goals" });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
