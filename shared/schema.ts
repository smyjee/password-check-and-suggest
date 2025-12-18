import { z } from "zod";

export const StrengthLabel = z.enum([
  "VERY_WEAK",
  "WEAK", 
  "MODERATE",
  "STRONG",
  "VERY_STRONG"
]);

export type StrengthLabel = z.infer<typeof StrengthLabel>;

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
});

export type PasswordEvaluationRequest = z.infer<typeof PasswordEvaluationRequest>;

export const PasswordEvaluationResponse = z.object({
  score: z.number().min(0).max(100),
  label: StrengthLabel,
  factors: z.array(PasswordFactor),
  suggestions: z.array(PasswordSuggestion),
  crackTime: z.string().optional(),
});

export type PasswordEvaluationResponse = z.infer<typeof PasswordEvaluationResponse>;

export const ExamplePasswordsRequest = z.object({
  password: z.string(),
  count: z.number().min(1).max(5).default(3),
});

export type ExamplePasswordsRequest = z.infer<typeof ExamplePasswordsRequest>;

export const ExamplePasswordsResponse = z.object({
  examples: z.array(z.string()),
});

export type ExamplePasswordsResponse = z.infer<typeof ExamplePasswordsResponse>;

export const strengthConfig: Record<StrengthLabel, { color: string; bgColor: string; label: string }> = {
  VERY_WEAK: { color: "text-strength-very-weak", bgColor: "bg-strength-very-weak", label: "Very Weak" },
  WEAK: { color: "text-strength-weak", bgColor: "bg-strength-weak", label: "Weak" },
  MODERATE: { color: "text-strength-moderate", bgColor: "bg-strength-moderate", label: "Moderate" },
  STRONG: { color: "text-strength-strong", bgColor: "bg-strength-strong", label: "Strong" },
  VERY_STRONG: { color: "text-strength-very-strong", bgColor: "bg-strength-very-strong", label: "Very Strong" },
};
