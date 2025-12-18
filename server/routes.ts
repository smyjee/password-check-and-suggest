import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { z } from "zod";
import { analyzePassword, generateStrongPasswords } from "./password-analyzer";
import { PasswordEvaluationRequest, ExamplePasswordsRequest } from "@shared/schema";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

async function getAISuggestions(password: string, baseAnalysis: ReturnType<typeof analyzePassword>) {
  try {
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a password security expert. Analyze the given password and provide additional insights. 
Be concise and helpful. Focus on practical, easy-to-understand advice. 
Do NOT include the actual password in your response.
Return JSON with this exact structure:
{
  "additionalFactor": { "type": "positive" | "negative", "message": "brief insight" } | null,
  "improvementTip": { "title": "short title", "description": "practical advice" } | null
}`
        },
        {
          role: "user",
          content: `Analyze this password pattern (length: ${password.length}, score: ${baseAnalysis.score}/100, label: ${baseAnalysis.label}, entropy: ${baseAnalysis.entropy.toFixed(1)} bits). Current factors detected: ${baseAnalysis.factors.map(f => f.message).join(", ")}. Provide one additional security insight if relevant.`
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 200,
    });
    
    const content = response.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("AI suggestion error:", error);
  }
  return null;
}

async function generateAIExamples(password: string, count: number): Promise<string[]> {
  try {
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a password generator. Create ${count} strong, memorable passwords.
Rules:
- Each password should be 14-20 characters
- Use a mix of words, numbers, and symbols
- Make them memorable but secure
- Do NOT use any words from the user's password
- Return JSON: { "passwords": ["password1", "password2", "password3"] }`
        },
        {
          role: "user",
          content: `Generate ${count} strong alternative passwords. The user's current password is ${password.length} characters long. Create secure alternatives that are easy to remember but hard to crack.`
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 300,
    });
    
    const content = response.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.passwords)) {
        return parsed.passwords.slice(0, count);
      }
    }
  } catch (error) {
    console.error("AI example generation error:", error);
  }
  
  return generateStrongPasswords(password, count);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/evaluate", async (req, res) => {
    try {
      const parseResult = PasswordEvaluationRequest.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "INVALID_REQUEST",
          message: parseResult.error.errors[0]?.message || "Invalid request"
        });
      }
      
      const { password } = parseResult.data;
      
      if (password.length === 0) {
        return res.status(400).json({ 
          error: "MISSING_PASSWORD",
          message: "Password is required"
        });
      }
      
      if (password.length > 256) {
        return res.status(400).json({ 
          error: "PASSWORD_TOO_LONG",
          message: "Password must be 256 characters or less"
        });
      }
      
      const analysis = analyzePassword(password);
      
      const aiInsights = await getAISuggestions(password, analysis);
      
      if (aiInsights?.additionalFactor) {
        analysis.factors.push(aiInsights.additionalFactor);
      }
      
      if (aiInsights?.improvementTip && analysis.suggestions.length < 5) {
        analysis.suggestions.push({
          id: analysis.suggestions.length + 1,
          title: aiInsights.improvementTip.title,
          description: aiInsights.improvementTip.description,
        });
      }
      
      return res.json({
        score: analysis.score,
        label: analysis.label,
        factors: analysis.factors,
        suggestions: analysis.suggestions,
      });
      
    } catch (error) {
      console.error("Evaluation error:", error);
      return res.status(500).json({ 
        error: "INTERNAL_ERROR",
        message: "An error occurred during evaluation"
      });
    }
  });
  
  app.post("/api/examples", async (req, res) => {
    try {
      const parseResult = ExamplePasswordsRequest.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "INVALID_REQUEST",
          message: "Invalid request"
        });
      }
      
      const { password, count } = parseResult.data;
      
      const examples = await generateAIExamples(password, count);
      
      return res.json({ examples });
      
    } catch (error) {
      console.error("Example generation error:", error);
      const fallbackExamples = generateStrongPasswords("", 3);
      return res.json({ examples: fallbackExamples });
    }
  });

  return httpServer;
}
