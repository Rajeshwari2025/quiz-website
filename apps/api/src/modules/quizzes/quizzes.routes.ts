import { Router } from "express";
import {
  cloneQuizSchema,
  createDraftSchema,
  publishQuizSchema,
  quizConfigurationStepSchema,
  quizQuestionStepSchema,
  quizStudentSchemaStepSchema,
} from "@quiz/shared";
import { z } from "zod";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/async-handler";
import {
  cloneQuizVersion,
  createDraftQuiz,
  createEditDraft,
  generateQuizQrCode,
  getQuizVersion,
  getQuizVersionHistory,
  listFacultyQuizzes,
  publishQuizVersion,
  releaseManualResults,
  replaceQuestionStep,
  updateConfigurationStep,
  updateStudentSchemaStep,
} from "./quizzes.service";

const versionParamsSchema = z.object({
  versionId: z.string().min(1),
});

const quizParamsSchema = z.object({
  quizId: z.string().min(1),
});

export const facultyQuizRouter = Router();

facultyQuizRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const quizzes = await listFacultyQuizzes(request.auth!.id);
    response.json({ quizzes });
  }),
);

facultyQuizRouter.post(
  "/drafts",
  validate(createDraftSchema),
  asyncHandler(async (request, response) => {
    const draft = await createDraftQuiz(request.auth!.id, request.body.title);
    response.status(201).json(draft);
  }),
);

facultyQuizRouter.get(
  "/:quizId/versions",
  validate(quizParamsSchema, "params"),
  asyncHandler(async (request, response) => {
    const versions = await getQuizVersionHistory(request.auth!.id, String(request.params.quizId));
    response.json({ versions });
  }),
);

facultyQuizRouter.get(
  "/versions/:versionId",
  validate(versionParamsSchema, "params"),
  asyncHandler(async (request, response) => {
    const version = await getQuizVersion(request.auth!.id, String(request.params.versionId));
    response.json({ version });
  }),
);

facultyQuizRouter.put(
  "/versions/:versionId/student-schema",
  validate(versionParamsSchema, "params"),
  validate(quizStudentSchemaStepSchema),
  asyncHandler(async (request, response) => {
    const version = await updateStudentSchemaStep(
      request.auth!.id,
      String(request.params.versionId),
      request.body.studentFields,
    );
    response.json({ version });
  }),
);

facultyQuizRouter.put(
  "/versions/:versionId/configuration",
  validate(versionParamsSchema, "params"),
  validate(quizConfigurationStepSchema),
  asyncHandler(async (request, response) => {
    const version = await updateConfigurationStep(
      request.auth!.id,
      String(request.params.versionId),
      request.body,
    );
    response.json({ version });
  }),
);

facultyQuizRouter.put(
  "/versions/:versionId/questions",
  validate(versionParamsSchema, "params"),
  validate(quizQuestionStepSchema),
  asyncHandler(async (request, response) => {
    const version = await replaceQuestionStep(
      request.auth!.id,
      String(request.params.versionId),
      request.body.questions,
    );
    response.json({ version });
  }),
);

facultyQuizRouter.post(
  "/versions/:versionId/publish",
  validate(versionParamsSchema, "params"),
  validate(publishQuizSchema),
  asyncHandler(async (request, response) => {
    const version = await publishQuizVersion(request.auth!.id, String(request.params.versionId));
    response.json({ version });
  }),
);

facultyQuizRouter.post(
  "/versions/:versionId/edit-draft",
  validate(versionParamsSchema, "params"),
  asyncHandler(async (request, response) => {
    const version = await createEditDraft(request.auth!.id, String(request.params.versionId));
    response.json({ version });
  }),
);

facultyQuizRouter.post(
  "/clone",
  validate(cloneQuizSchema),
  asyncHandler(async (request, response) => {
    const version = await cloneQuizVersion(
      request.auth!.id,
      request.body.sourceVersionId,
      request.body.title,
    );
    response.status(201).json({ version });
  }),
);

facultyQuizRouter.post(
  "/versions/:versionId/release-results",
  validate(versionParamsSchema, "params"),
  asyncHandler(async (request, response) => {
    const version = await releaseManualResults(request.auth!.id, String(request.params.versionId));
    response.json({ version });
  }),
);

facultyQuizRouter.get(
  "/versions/:versionId/qr",
  validate(versionParamsSchema, "params"),
  asyncHandler(async (request, response) => {
    const qr = await generateQuizQrCode(request.auth!.id, String(request.params.versionId));
    response.json(qr);
  }),
);
