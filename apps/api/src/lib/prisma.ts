import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __quizPrisma__: PrismaClient | undefined;
}

export const prisma =
  global.__quizPrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__quizPrisma__ = prisma;
}

