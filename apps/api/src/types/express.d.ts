import type { AuthUser } from "@quiz/shared";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
      requestId: string;
    }
  }
}

export {};

