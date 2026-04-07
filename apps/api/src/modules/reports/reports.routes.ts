import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/async-handler";
import { buildQuizReportPdf } from "./reports.service";

const paramsSchema = z.object({
  quizVersionId: z.string().min(1),
});

export const reportsRouter = Router();

reportsRouter.get(
  "/:quizVersionId/pdf",
  validate(paramsSchema, "params"),
  asyncHandler(async (request, response) => {
    const pdf = await buildQuizReportPdf(String(request.params.quizVersionId), request.auth!.id);

    response.setHeader("content-type", "application/pdf");
    response.setHeader(
      "content-disposition",
      `attachment; filename="quiz-report-${request.params.quizVersionId}.pdf"`,
    );

    response.send(pdf);
  }),
);
