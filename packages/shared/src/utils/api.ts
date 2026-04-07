import { z } from "zod";

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string(),
    fieldErrors: z.record(z.array(z.string())).optional(),
  }),
});

