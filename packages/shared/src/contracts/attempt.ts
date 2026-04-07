import { z } from "zod";
import { attemptEventTypes } from "../types/enums";

export const startAttemptSchema = z.object({
  quizCode: z.string().trim().min(4).max(16),
  studentDetails: z.record(z.union([z.string(), z.number(), z.boolean()])),
});

export const saveAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionIds: z.array(z.string()).default([]),
});

export const submitAttemptSchema = z.object({
  answers: z.array(saveAnswerSchema),
});

export const attemptEventSchema = z.object({
  type: z.enum(attemptEventTypes),
  payload: z.record(z.any()).optional(),
});

export const historyFilterSchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(["IN_PROGRESS", "SUBMITTED", "AUTO_SUBMITTED", "ABANDONED"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(10),
});

