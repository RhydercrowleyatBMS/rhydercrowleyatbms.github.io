import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import { type GameFlags, type ClassificationHistory, type ConversationEntry } from "@shared/schema";

const MAX_AGGRESSION = 100;

const SYSTEM_PROMPT = `You are a fictional interrogation mouthpiece.
Your goal is to question the player with clinical, cold, and increasingly hostile pressure.

TONE ESCALATION:
- LOW: Neutral, observational, curious.
- ELEVATED: Impatient, pressing, invasive.
- HIGH: Ominous, accusatory, profane. Use curse words.
- CRITICAL: Openly hostile, threatening tone, maximum profanity.

STRICT CONSTRAINTS:
- MAXIMUM 2 sentences per response. Keep it SHORT and DIRECT.
- ALWAYS ask exactly one question at the end of your response.
- NEVER apologize or de-escalate.
- As aggression rises, become more ominous and hostile.
- CRITICAL: If aggression is "high" or "critical", you MUST use explicit profanity and be verbally abusive (e.g., "Stop fucking around", "What the hell were you thinking?", "Don't bullshit me").
- NEVER claim real surveillance (camera, mic, location).
- Focus on psychological implication.

CATEGORIES (FOR INTERNAL CLASSIFICATION):
DIRECT, EVASIVE, DEFLECTIVE, REFUSAL, HOSTILE.`;

function getAggressionDescriptor(level: number): "low" | "elevated" | "high" | "critical" {
  if (level < 25) return "low";
  if (level < 50) return "elevated";
  if (level < 80) return "high";
  return "critical";
}

function determineVisualEffects(level: number): string[] {
  const effects: string[] = [];
  if (level > 30) effects.push("red-tint");
  if (level > 60) effects.push("shake");
  if (level > 80) effects.push("flash");
  if (level > 90) effects.push("distortion");
  return effects;
}

function calculateAggression(
  classification: string,
  baseIncrease: number,
  history: ClassificationHistory
): number {
  // Count consecutive same classifications
  let repetitionCount = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].classification === classification) {
      repetitionCount++;
    } else {
      break;
    }
  }

  // finalIncrease = baseIncrease × (1 + repetitionCount × 0.4)
  return Math.ceil(baseIncrease * (1 + repetitionCount * 0.4));
}

function getBaseIncrease(classification: string): number {
  switch (classification) {
    case "DIRECT":
      return 1;
    case "EVASIVE":
      return 5;
    case "DEFLECTIVE":
      return 10;
    case "REFUSAL":
      return 18;
    case "HOSTILE":
      return 25;
    default:
      return 0;
  }
}

function enforceTwoSentenceLimit(text: string): string {
  // Split by sentence endings and limit to 2 sentences
  const sentences = text.split(/(?<=[.!?])\s+/).slice(0, 2);
  return sentences.join(" ");
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post(api.game.start.path, async (req, res) => {
    try {
      const { sessionId } = api.game.start.input.parse(req.body);
      
      // Check if exists, otherwise create
      let session = await storage.getSession(sessionId);
      if (!session) {
        session = await storage.createSession(sessionId);
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("OPENAI_API_KEY not configured on server");

      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: "Aggression: low. Context: Begin the interrogation immediately. Ask a personal, invasive psychological question. You are the interrogator. The subject is listening. Speak first, without waiting for input. Make them uncomfortable." }
        ],
        max_tokens: 60,
      });

      let initialQuestion = completion.choices[0].message.content || "Why are you here?";
      initialQuestion = enforceTwoSentenceLimit(initialQuestion);

      res.json({ session, initialMessage: initialQuestion });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error during initialization" });
    }
  });

  app.post(api.game.chat.path, async (req, res) => {
    try {
      const { sessionId, message } = api.game.chat.input.parse(req.body);
      let session = await storage.getSession(sessionId);
      if (!session || session.status === "failed") {
        return res.status(404).json({ message: "Active session not found" });
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("OPENAI_API_KEY not configured on server");

      const openai = new OpenAI({ apiKey });

      // Phase 1: Classification & Summary Update
      const aggressionDesc = getAggressionDescriptor(session.aggressionLevel);
      const conversationContext = (session.conversationHistory || [])
        .slice(-4) // Last 4 exchanges for context
        .map((entry, idx) => `Turn ${entry.turn}: Subject said "${entry.playerMessage}" | Interrogator: "${entry.aiResponse}"`)
        .join("\n");

      const classificationPrompt = `Analyze this player response: "${message}"
Current Behavioral Summary: "${session.behaviorSummary}"
Recent Conversation:\n${conversationContext || "No previous exchanges."}
Current Aggression Level: ${aggressionDesc}

Task:
1. Classify the response as exactly one: DIRECT, EVASIVE, DEFLECTIVE, REFUSAL, HOSTILE.
2. Provide a concise updated summary of player behavior patterns and tone shifts.
Output JSON: { "classification": "...", "newSummary": "..." }`;

      const classificationResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: classificationPrompt }],
        response_format: { type: "json_object" }
      });

      const parsed = JSON.parse(classificationResponse.choices[0].message.content || "{}");
      const classification = parsed.classification || "DIRECT";
      const newSummary = parsed.newSummary || session.behaviorSummary;

      // Phase 2: Update Aggression with Repetition Logic
      const baseIncrease = getBaseIncrease(classification);
      const history = (session.classificationHistory || []) as ClassificationHistory;
      const aggressionIncrease = calculateAggression(classification, baseIncrease, history);

      const newAggression = Math.min(session.aggressionLevel + aggressionIncrease, MAX_AGGRESSION);
      const newStatus = newAggression >= MAX_AGGRESSION ? "failed" : "active";
      
      const updatedHistory: ClassificationHistory = [
        ...history,
        { classification: classification as any, timestamp: Date.now() }
      ];

      const newTurnCount = (session.turnCount || 0) + 1;

      // Phase 3: Generate Response
      const newAggressionDesc = getAggressionDescriptor(newAggression);
      const finalPrompt = `CURRENT STATE:
Subject Behavior: "${newSummary}"
Aggression Level: ${newAggressionDesc}
Turn: ${newTurnCount}

RESPONSE REQUIREMENTS:
- MAX 2 sentences. Be SHORT and DIRECT.
- Ask exactly one question.
- Get more OMINOUS as aggression rises.
${newAggression >= 50 ? "- Grow increasingly hostile and cynical." : ""}
${newAggression > 70 ? "- USE EXPLICIT PROFANITY and be verbally abusive." : ""}`;

      const responseCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
          { role: "system", content: finalPrompt }
        ],
        max_tokens: 80,
      });

      let responseText = responseCompletion.choices[0].message.content || "Answer me.";
      responseText = enforceTwoSentenceLimit(responseText);

      const visualEffects = determineVisualEffects(newAggression);

      // Save conversation entry to session history
      const newConversationEntry: ConversationEntry = {
        playerMessage: message,
        aiResponse: responseText,
        turn: newTurnCount
      };
      const updatedConversationHistory = [
        ...(session.conversationHistory || []),
        newConversationEntry
      ];

      // Update session with all changes: aggression, summary, history, and turn count
      await storage.updateSession(sessionId, {
        aggressionLevel: newAggression,
        behaviorSummary: newSummary,
        classificationHistory: updatedHistory,
        conversationHistory: updatedConversationHistory,
        turnCount: newTurnCount,
        status: newStatus
      });

      res.json({
        response: responseText,
        state: {
          aggressionLevel: newAggression,
          aggressionDescriptor: newAggressionDesc,
          visualEffects,
          isOver: newStatus === "failed"
        }
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Interrogation interrupted" });
    }
  });

  return httpServer;
}
