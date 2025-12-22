import { db } from "./db";
import { gameSessions, type GameSession, type GameFlags, type ClassificationHistory, type ConversationEntry } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getSession(id: string): Promise<GameSession | undefined>;
  createSession(id: string): Promise<GameSession>;
  updateSession(id: string, updates: Partial<GameSession>): Promise<GameSession>;
}

export class DatabaseStorage implements IStorage {
  async getSession(id: string): Promise<GameSession | undefined> {
    const [session] = await db.select().from(gameSessions).where(eq(gameSessions.id, id));
    return session;
  }

  async createSession(id: string): Promise<GameSession> {
    const [session] = await db.insert(gameSessions).values({
      id,
      aggressionLevel: 0,
      behaviorSummary: "Interrogation started. Subject is silent.",
      classificationHistory: [],
      conversationHistory: [],
      turnCount: 0,
      flags: {
        askedAboutWindow: false,
        mentionedAlone: false,
        hesitated: false,
      },
      status: "active"
    }).returning();
    return session;
  }

  async updateSession(id: string, updates: Partial<GameSession>): Promise<GameSession> {
    const [session] = await db.update(gameSessions)
      .set({ ...updates, lastInteractionAt: new Date() })
      .where(eq(gameSessions.id, id))
      .returning();
    return session;
  }
}

export const storage = new DatabaseStorage();
