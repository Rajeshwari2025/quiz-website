import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/async-handler";
import {
  createLiveSession,
  getLiveSession,
  updateLiveSessionState,
} from "./live-sessions.service";

const createLiveSessionSchema = z.object({
  quizVersionId: z.string().min(1),
  startsAt: z.string().datetime().nullable().optional(),
});

const sessionParamsSchema = z.object({
  sessionId: z.string().min(1),
});

export const liveSessionsRouter = Router();

liveSessionsRouter.post(
  "/",
  validate(createLiveSessionSchema),
  asyncHandler(async (request, response) => {
    const liveSession = await createLiveSession(
      request.auth!.id,
      request.body.quizVersionId,
      request.body.startsAt,
    );

    response.status(201).json({ liveSession });
  }),
);

liveSessionsRouter.get(
  "/:sessionId",
  validate(sessionParamsSchema, "params"),
  asyncHandler(async (request, response) => {
    const liveSession = await getLiveSession(request.auth!.id, String(request.params.sessionId));
    response.json({ liveSession });
  }),
);

liveSessionsRouter.post(
  "/:sessionId/start",
  validate(sessionParamsSchema, "params"),
  asyncHandler(async (request, response) => {
    const liveSession = await updateLiveSessionState(
      request.auth!.id,
      String(request.params.sessionId),
      "LIVE",
    );
    response.json({ liveSession });
  }),
);

liveSessionsRouter.post(
  "/:sessionId/end",
  validate(sessionParamsSchema, "params"),
  asyncHandler(async (request, response) => {
    const liveSession = await updateLiveSessionState(
      request.auth!.id,
      String(request.params.sessionId),
      "ENDED",
    );
    response.json({ liveSession });
  }),
);
