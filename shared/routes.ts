import { z } from 'zod';
import { gameSessions } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  serverError: z.object({
    message: z.string(),
  }),
};

export const api = {
  game: {
    start: {
      method: 'POST' as const,
      path: '/api/game/start',
      input: z.object({
        sessionId: z.string().uuid(),
      }),
      responses: {
        200: z.object({
          session: z.custom<typeof gameSessions.$inferSelect>(),
          initialMessage: z.string(),
        }),
        400: errorSchemas.validation,
      },
    },
    chat: {
      method: 'POST' as const,
      path: '/api/game/chat',
      input: z.object({
        sessionId: z.string().uuid(),
        message: z.string(),
      }),
      responses: {
        200: z.object({
          response: z.string(),
          state: z.object({
            aggressionLevel: z.number(),
            aggressionDescriptor: z.enum(["low", "elevated", "high", "critical"]),
            visualEffects: z.array(z.string()),
            isOver: z.boolean(),
          }),
        }),
        400: errorSchemas.validation,
        500: errorSchemas.serverError,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// Convenience inferred types
export type StartGameInput = z.infer<typeof api.game.start.input>;
export type StartGameResponse = z.infer<(typeof api.game.start.responses)[200]>;
export type ChatInput = z.infer<typeof api.game.chat.input>;
export type ChatResponse = z.infer<(typeof api.game.chat.responses)[200]>;
