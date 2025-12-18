import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { eq, sql, desc, gte, and } from "drizzle-orm";
import { 
  evaluationMetrics, 
  apiKeys, 
  type InsertEvaluationMetric, 
  type EvaluationMetric,
  type InsertApiKey,
  type ApiKey,
  type AnalyticsSummary,
  type StrengthLabel
} from "@shared/schema";
import { randomBytes } from "crypto";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

export interface IStorage {
  recordEvaluation(metric: InsertEvaluationMetric): Promise<EvaluationMetric>;
  getAnalyticsSummary(): Promise<AnalyticsSummary>;
  createApiKey(data: InsertApiKey): Promise<ApiKey>;
  validateApiKey(key: string): Promise<ApiKey | null>;
  incrementApiKeyUsage(keyId: string): Promise<void>;
  getApiKeys(): Promise<ApiKey[]>;
  revokeApiKey(keyId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async recordEvaluation(metric: InsertEvaluationMetric): Promise<EvaluationMetric> {
    const [result] = await db.insert(evaluationMetrics).values(metric).returning();
    return result;
  }

  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const allMetrics = await db.select().from(evaluationMetrics);
    const todayMetrics = await db.select().from(evaluationMetrics)
      .where(gte(evaluationMetrics.createdAt, todayStart));
    const weekMetrics = await db.select().from(evaluationMetrics)
      .where(gte(evaluationMetrics.createdAt, weekStart));

    const totalEvaluations = allMetrics.length;
    const evaluationsToday = todayMetrics.length;
    const evaluationsThisWeek = weekMetrics.length;

    const labelCounts: Record<string, number> = {
      VERY_WEAK: 0,
      WEAK: 0,
      MODERATE: 0,
      STRONG: 0,
      VERY_STRONG: 0,
    };

    let totalScore = 0;
    let improvedCount = 0;

    for (const metric of allMetrics) {
      labelCounts[metric.label] = (labelCounts[metric.label] || 0) + 1;
      totalScore += metric.score;
      if (metric.hasImproved) improvedCount++;
    }

    const scoreDistribution = Object.entries(labelCounts).map(([label, count]) => ({
      label: label as StrengthLabel,
      count,
      percentage: totalEvaluations > 0 ? Math.round((count / totalEvaluations) * 100) : 0,
    }));

    return {
      totalEvaluations,
      scoreDistribution,
      averageScore: totalEvaluations > 0 ? Math.round(totalScore / totalEvaluations) : 0,
      improvementRate: totalEvaluations > 0 ? Math.round((improvedCount / totalEvaluations) * 100) : 0,
      evaluationsToday,
      evaluationsThisWeek,
    };
  }

  async createApiKey(data: InsertApiKey): Promise<ApiKey> {
    const key = `pk_${randomBytes(24).toString("hex")}`;
    const [result] = await db.insert(apiKeys).values({
      ...data,
      key,
    }).returning();
    return result;
  }

  async validateApiKey(key: string): Promise<ApiKey | null> {
    const [result] = await db.select().from(apiKeys)
      .where(and(eq(apiKeys.key, key), eq(apiKeys.isActive, true)));
    return result || null;
  }

  async incrementApiKeyUsage(keyId: string): Promise<void> {
    await db.update(apiKeys)
      .set({ 
        usageCount: sql`${apiKeys.usageCount} + 1`,
        lastUsedAt: new Date(),
      })
      .where(eq(apiKeys.id, keyId));
  }

  async getApiKeys(): Promise<ApiKey[]> {
    return db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
  }

  async revokeApiKey(keyId: string): Promise<void> {
    await db.update(apiKeys)
      .set({ isActive: false })
      .where(eq(apiKeys.id, keyId));
  }
}

export const storage = new DatabaseStorage();
