import { z } from "zod";
import {
  accessModes,
  questionTypes,
  resultVisibilityModes,
  studentFieldTypes,
} from "../types/enums";

export const studentFieldSchema = z.object({
  id: z.string().optional(),
  key: z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9_]+$/),
  label: z.string().trim().min(1).max(120),
  type: z.enum(studentFieldTypes),
  required: z.boolean(),
  placeholder: z.string().trim().max(120).nullable().optional(),
  validation: z.record(z.any()).nullable().optional(),
  sortOrder: z.number().int().min(0),
});

export const quizOptionSchema = z.object({
  id: z.string().optional(),
  key: z.string().trim().min(1).max(100),
  text: z.string().trim().min(1).max(500),
  isCorrect: z.boolean(),
  sortOrder: z.number().int().min(0),
});

export const quizQuestionSchema = z
  .object({
    id: z.string().optional(),
    key: z.string().trim().min(1).max(100),
    prompt: z.string().trim().min(1).max(4000),
    explanation: z.string().trim().max(4000).nullable().optional(),
    questionType: z.enum(questionTypes),
    marks: z.number().positive().max(1000),
    negativeMarks: z.number().min(0).max(1000).nullable().optional(),
    sortOrder: z.number().int().min(0),
    options: z.array(quizOptionSchema).min(2),
  })
  .superRefine((value, ctx) => {
    const correctOptions = value.options.filter((option) => option.isCorrect).length;

    if (value.questionType === "SINGLE" && correctOptions !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "Single-correct MCQ questions must have exactly one correct option",
      });
    }

    if (value.questionType === "MULTI" && correctOptions < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "Multi-correct MCQ questions must have at least two correct options",
      });
    }
  });

export const createDraftSchema = z.object({
  title: z.string().trim().min(3).max(160),
});

export const quizStudentSchemaStepSchema = z.object({
  studentFields: z.array(studentFieldSchema),
});

export const quizConfigurationStepSchema = z.object({
  title: z.string().trim().min(3).max(160),
  durationMinutes: z.number().int().positive().max(1440),
  deadline: z.string().datetime().nullable().optional(),
  attemptLimit: z.number().int().positive().max(20),
  shuffleQuestions: z.boolean(),
  accessMode: z.enum(accessModes),
  resultVisibility: z.enum(resultVisibilityModes),
});

export const quizQuestionStepSchema = z.object({
  questions: z.array(quizQuestionSchema).min(1),
});

export const publishQuizSchema = z.object({
  confirmPublish: z.literal(true),
});

export const cloneQuizSchema = z.object({
  sourceVersionId: z.string().min(1),
  title: z.string().trim().min(3).max(160).optional(),
});

export const quizLookupSchema = z.object({
  quizCode: z.string().trim().min(4).max(16),
});

export type StudentFieldInput = z.infer<typeof studentFieldSchema>;
export type QuizQuestionInput = z.infer<typeof quizQuestionSchema>;
export type QuizConfigurationInput = z.infer<typeof quizConfigurationStepSchema>;

