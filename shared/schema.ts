import { pgTable, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TYPES ===
export type GameFlags = {
  askedAboutWindow: boolean;
  mentionedAlone: boolean;
  hesitated: boolean;
  [key: string]: boolean;
};

export type ClassificationHistory = Array<{
  classification: "DIRECT" | "EVASIVE" | "DEFLECTIVE" | "REFUSAL" | "HOSTILE";
  timestamp: number;
}>;

export type ConversationEntry = {
  playerMessage: string;
  aiResponse: string;
  turn: number;
};

// === TABLE DEFINITIONS ===
export const gameSessions = pgTable("game_sessions", {
  id: text("id").primaryKey(), // client-generated UUID
  aggressionLevel: integer("aggression_level").notNull().default(0),
  complianceScore: integer("compliance_score").notNull().default(0),
  deflectionCount: integer("deflection_count").notNull().default(0),
  silenceCount: integer("silence_count").notNull().default(0),
  flags: jsonb("flags").notNull().$type<GameFlags>().default({
    askedAboutWindow: false,
    mentionedAlone: false,
    hesitated: false,
  }),
  behaviorSummary: text("behavior_summary").notNull().default("Initial state. Subject is being interrogated."),
  classificationHistory: jsonb("classification_history").notNull().$type<ClassificationHistory>().default([]),
  conversationHistory: jsonb("conversation_history").notNull().$type<ConversationEntry[]>().default([]),
  turnCount: integer("turn_count").notNull().default(0),
  status: text("status").notNull().default("active"), // active, failed
  lastInteractionAt: timestamp("last_interaction_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===
export const insertSessionSchema = createInsertSchema(gameSessions);

// === EXPLICIT API CONTRACT TYPES ===
export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = z.infer<typeof insertSessionSchema>;

export type ChatResponse = {
  response: string;
  state: {
    aggressionLevel: number;
    aggressionDescriptor: "low" | "elevated" | "high" | "critical";
    visualEffects: string[];
    isOver: boolean;
  };
};
