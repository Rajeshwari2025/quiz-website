import { Router } from "express";
import {
  attemptEventSchema,
  saveAnswerSchema,
  startAttemptSchema,
  submitAttemptSchema,
} from "@quiz/shared";
import { z } from "zod";
import { authenticateOptional } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/async-handler";
import {
  getAttemptResult,
  lookupQuizByCode,
  recordAttemptEvent,
  saveAnswer,
  startAttempt,
  submitAttempt,
} from "./attempts.service";

const quizCodeParamsSchema = z.object({
  quizCode: z.string().min(4).max(16),
});

const attemptParamsSchema = z.object({
  attemptId: z.string().min(1),
});

export const studentRouter = Router();
export const attemptRouter = Router();

studentRouter.get(
  "/quizzes/:quizCode",
  validate(quizCodeParamsSchema, "params"),
  asyncHandler(async (request, response) => {
    const quiz = await lookupQuizByCode(String(request.params.quizCode));
    response.json({ quiz });
  }),
);

studentRouter.post(
  "/attempts/start",
  authenticateOptional,
  validate(startAttemptSchema),
  asyncHandler(async (request, response) => {
    const attempt = await startAttempt(
      request.body.quizCode,
      request.body.studentDetails,
      request.auth,
    );
    response.status(201).json(attempt);
  }),
);

attemptRouter.use(authenticateOptional);

attemptRouter.put(
  "/:attemptId/answers",
  validate(attemptParamsSchema, "params"),
  validate(saveAnswerSchema),
  asyncHandler(async (request, response) => {
    const result = await saveAnswer(
      String(request.params.attemptId),
      request.body.questionId,
      request.body.selectedOptionIds,
      request.auth,
      request.header("x-attempt-token"),
    );
    response.json(result);
  }),
);

attemptRouter.post(
  "/:attemptId/events",
  validate(attemptParamsSchema, "params"),
  validate(attemptEventSchema),
  asyncHandler(async (request, response) => {
    await recordAttemptEvent(
      String(request.params.attemptId),
      request.body.type,
      request.body.payload,
      request.auth,
      request.header("x-attempt-token"),
    );
    response.status(204).send();
  }),
);

attemptRouter.post(
  "/:attemptId/submit",
  validate(attemptParamsSchema, "params"),
  validate(submitAttemptSchema),
  asyncHandler(async (request, response) => {
    const result = await submitAttempt(
      String(request.params.attemptId),
      request.body.answers,
      request.auth,
      request.header("x-attempt-token"),
    );
    response.json(result);
  }),
);

attemptRouter.get(
  "/:attemptId/result",
  validate(attemptParamsSchema, "params"),
  asyncHandler(async (request, response) => {
    const result = await getAttemptResult(
      String(request.params.attemptId),
      request.auth,
      request.header("x-attempt-token"),
    );
    response.json(result);
  }),
);
