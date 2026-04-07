import { z } from "zod";

export const analyticsFilterSchema = z.object({
  quizVersionId: z.string().min(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

