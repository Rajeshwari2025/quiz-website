import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/async-handler";
import { getDashboard } from "./analytics.service";

const paramsSchema = z.object({
  quizVersionId: z.string().min(1),
});

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const analyticsRouter = Router();

analyticsRouter.get(
  "/:quizVersionId/dashboard",
  validate(paramsSchema, "params"),
  validate(querySchema, "query"),
  asyncHandler(async (request, response) => {
    const dashboard = await getDashboard(
      String(request.params.quizVersionId),
      request.auth!.id,
      Number(request.query.limit),
    );

    response.json(dashboard);
  }),
);
