import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const StrengthLabel = z.enum([
  "VERY_WEAK",
  "WEAK", 
  "MODERATE",
  "STRONG",
  "VERY_STRONG"
]);

export type StrengthLabel = z.infer<typeof StrengthLabel>;

export const RiskLevel = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH"
]);

export type RiskLevel = z.infer<typeof RiskLevel>;

export const PasswordFactor = z.object({
  type: z.enum(["positive", "negative"]),
  message: z.string(),
});

export type PasswordFactor = z.infer<typeof PasswordFactor>;

export const PasswordSuggestion = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
});

export type PasswordSuggestion = z.infer<typeof PasswordSuggestion>;

export const PasswordEvaluationRequest = z.object({
  password: z.string().min(1, "Password is required").max(256, "Password too long"),
  riskLevel: RiskLevel.optional().default("MEDIUM"),
});

export type PasswordEvaluationRequest = z.infer<typeof PasswordEvaluationRequest>;

export const PasswordEvaluationResponse = z.object({
  score: z.number().min(0).max(100),
  label: StrengthLabel,
  factors: z.array(PasswordFactor),
  suggestions: z.array(PasswordSuggestion),
  crackTime: z.string().optional(),
  entropy: z.number().optional(),
});

export type PasswordEvaluationResponse = z.infer<typeof PasswordEvaluationResponse>;

export const ExamplePasswordsRequest = z.object({
  password: z.string(),
  count: z.number().min(1).max(5).default(3),
  type: z.enum(["password", "passphrase"]).optional().default("password"),
});

export type ExamplePasswordsRequest = z.infer<typeof ExamplePasswordsRequest>;

export const ExamplePasswordsResponse = z.object({
  examples: z.array(z.object({
    password: z.string(),
    entropy: z.number().optional(),
  })),
});

export type ExamplePasswordsResponse = z.infer<typeof ExamplePasswordsResponse>;

export const strengthConfig: Record<StrengthLabel, { color: string; bgColor: string; label: string }> = {
  VERY_WEAK: { color: "text-strength-very-weak", bgColor: "bg-strength-very-weak", label: "Very Weak" },
  WEAK: { color: "text-strength-weak", bgColor: "bg-strength-weak", label: "Weak" },
  MODERATE: { color: "text-strength-moderate", bgColor: "bg-strength-moderate", label: "Moderate" },
  STRONG: { color: "text-strength-strong", bgColor: "bg-strength-strong", label: "Strong" },
  VERY_STRONG: { color: "text-strength-very-strong", bgColor: "bg-strength-very-strong", label: "Very Strong" },
};

export const evaluationMetrics = pgTable("evaluation_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  score: integer("score").notNull(),
  label: text("label").notNull(),
  riskLevel: text("risk_level").notNull().default("MEDIUM"),
  passwordLength: integer("password_length").notNull(),
  hasImproved: boolean("has_improved").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEvaluationMetricSchema = createInsertSchema(evaluationMetrics).omit({
  id: true,
  createdAt: true,
});

export type InsertEvaluationMetric = z.infer<typeof insertEvaluationMetricSchema>;
export type EvaluationMetric = typeof evaluationMetrics.$inferSelect;

export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
  usageCount: true,
});

export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

export const AnalyticsSummary = z.object({
  totalEvaluations: z.number(),
  scoreDistribution: z.array(z.object({
    label: StrengthLabel,
    count: z.number(),
    percentage: z.number(),
  })),
  averageScore: z.number(),
  improvementRate: z.number(),
  evaluationsToday: z.number(),
  evaluationsThisWeek: z.number(),
});

export type AnalyticsSummary = z.infer<typeof AnalyticsSummary>;
