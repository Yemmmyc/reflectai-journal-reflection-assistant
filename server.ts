import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { rateLimit } from "express-rate-limit";

dotenv.config();

// Initialize Firebase Admin SDK using Application Default Credentials
if (getApps().length === 0) {
  initializeApp({
    projectId: "gen-lang-client-0182667440",
  });
}

const PORT = Number(process.env.PORT) || 3000;

// Lazy initialization for Gemini SDK
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

const FALLBACK_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.7-flash",
];

interface AuthenticatedRequest extends express.Request {
  user?: DecodedIdToken;
}

/**
 * Reusable Express Middleware to verify Firebase Auth ID Token in Authorization header
 */
async function verifyFirebaseToken(
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Missing or malformed Authorization header.",
    });
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Missing authentication token.",
    });
  }

  try {
    const decoded = await getAuth().verifyIdToken(token);
    req.user = decoded;
    return next();
  } catch (err: any) {
    // Log safe warning without revealing sensitive token data
    console.warn("[Auth Middleware] Token verification failed:", err?.message || "Invalid token");
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Invalid or expired authentication token.",
    });
  }
}

/**
 * Express Rate Limiter for Gemini AI Endpoints
 */
const geminiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests from this IP, please try again after a minute.",
  },
});

async function generateContentWithFallback(
  contents: any,
  systemInstruction?: string
): Promise<{ text: string; modelUsed: string }> {
  const ai = getGeminiClient();
  let lastError: any = null;

  for (const modelName of FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      if (response && response.text) {
        return {
          text: response.text,
          modelUsed: modelName,
        };
      }
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Model ${modelName} failed:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini models in fallback ladder failed to generate content.");
}

async function startServer() {
  const app = express();

  // Top-Level Request Deserialization
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true, limit: "5mb" }));

  // Apply Rate Limiting exclusively to Gemini API Endpoints
  app.use("/api/gemini", geminiRateLimiter);

  // API Health Check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "ReflectAI Backend",
    });
  });

  // Gemini Multi-turn Reflection Endpoint (Protected by Firebase Auth)
  app.post("/api/gemini/reflect", verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Authenticated UID comes exclusively from req.user.uid
      const authenticatedUid = req.user?.uid;
      if (!authenticatedUid) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized user identity.",
        });
      }

      // Defensive Payload Ingestion
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const {
        prompt = "",
        history = [],
        mode = "reflection",
        journalTitle = "",
      } = body;

      const sanitizedPrompt = typeof prompt === "string" ? prompt.trim() : "";
      if (!sanitizedPrompt) {
        return res.status(400).json({
          success: false,
          error: "Prompt cannot be empty.",
        });
      }

      // Format conversational history
      const formattedContents: any[] = [];

      if (Array.isArray(history)) {
        for (const item of history) {
          if (item && typeof item === "object" && item.content) {
            const role = item.role === "assistant" || item.role === "model" ? "model" : "user";
            formattedContents.push({
              role,
              parts: [{ text: String(item.content) }],
            });
          }
        }
      }

      // Add current user prompt
      formattedContents.push({
        role: "user",
        parts: [{ text: sanitizedPrompt }],
      });

      let systemInstruction = `You are ReflectAI, an empathetic, insightful, and thoughtful personal reflection and journaling companion.
Your goal is to help the user unpack their thoughts, gain clarity, process emotions, celebrate wins, and discover actionable wisdom.

Guidelines:
1. Tone: Warm, grounded, intelligent, empathetic, and constructive.
2. Structure: Use markdown with clean paragraphs, bullet points, or bold highlights where appropriate.
3. Respect user privacy: Treat all journal reflections as confidential, safe personal reflections.
4. Adapt to Mode:
   - "reflection": Deep empathetic listening, thoughtful inquiry, reframing perspectives, and gentle follow-up prompts.
   - "brainstorm": Creative brainstorming, practical micro-steps, divergent options, and structured action items.
   - "summary": Clear synthesis of core themes, emotional tone, key milestones, and highlighted insights.
   - "clarity": Identifying cognitive patterns, blind spots, core values, and decisive takeaways.`;

      if (journalTitle) {
        systemInstruction += `\nCurrent Journal Context Title: "${journalTitle}"`;
      }

      if (mode === "brainstorm") {
        systemInstruction += `\nMode Focus: Brainstorming & Action Ideation. Provide 3-5 creative, actionable, and structured pathways forward.`;
      } else if (mode === "summary") {
        systemInstruction += `\nMode Focus: Synthesis & Takeaways. Provide a succinct high-impact summary with Key Insights, Emotional Themes, and Suggested Next Step.`;
      } else if (mode === "clarity") {
        systemInstruction += `\nMode Focus: Mental Clarity & Perspective. Unpack assumptions, highlight what truly matters, and suggest 2 reflective questions.`;
      }

      const result = await generateContentWithFallback(formattedContents, systemInstruction);

      return res.json({
        success: true,
        text: result.text,
        modelUsed: result.modelUsed,
      });
    } catch (error: any) {
      console.error("[Reflect API Error]:", error?.message || "Internal error");
      return res.status(500).json({
        success: false,
        error: "Failed to process reflection with Gemini.",
      });
    }
  });

  // Quick Summarizer / Title Generator for Journal Entries (Protected by Firebase Auth)
  app.post("/api/gemini/summarize", verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
    try {
      const authenticatedUid = req.user?.uid;
      if (!authenticatedUid) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized user identity.",
        });
      }

      const body = req.body && typeof req.body === "object" ? req.body : {};
      const { content = "", title = "" } = body;

      const sanitizedContent = typeof content === "string" ? content.trim() : "";
      if (!sanitizedContent) {
        return res.status(400).json({
          success: false,
          error: "Content is required for summarization.",
        });
      }

      const prompt = `Analyze this journal/reflection content and return a JSON object with:
1. "suggestedTitle": A concise, evocative 3-6 word title (if current title "${title}" is blank or generic).
2. "executiveSummary": A 2-3 sentence executive summary of the core thoughts.
3. "keyThemes": An array of 2-4 key theme tags (e.g. ["Gratitude", "Career Growth", "Mindfulness"]).
4. "actionInsight": One clear, actionable reflection or step for the user.

Format response ONLY as raw valid JSON without markdown fences.

Content to analyze:
${sanitizedContent.slice(0, 4000)}`;

      const result = await generateContentWithFallback(
        [{ role: "user", parts: [{ text: prompt }] }],
        "You are an expert mental health & productivity journaling synthesizer. Output strictly valid JSON."
      );

      let parsed: any = {};
      try {
        const cleanedText = result.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsed = JSON.parse(cleanedText);
      } catch {
        parsed = {
          suggestedTitle: title || "Reflective Journal Entry",
          executiveSummary: result.text.slice(0, 200),
          keyThemes: ["Reflection", "Insights"],
          actionInsight: "Take a moment to appreciate your ongoing growth and self-awareness.",
        };
      }

      return res.json({
        success: true,
        data: parsed,
        modelUsed: result.modelUsed,
      });
    } catch (error: any) {
      console.error("[Summarize API Error]:", error?.message || "Internal error");
      return res.status(500).json({
        success: false,
        error: "Failed to summarize journal entry.",
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ReflectAI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err?.message || err);
  process.exit(1);
});

