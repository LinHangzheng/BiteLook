export interface SessionData {
  sessionId: string;
  userId: string;
  inviteCode: string;
  createdAt: number;
  expiresAt: number;
}

export const SESSION_TTL_SECONDS = 604800; // 7 days
