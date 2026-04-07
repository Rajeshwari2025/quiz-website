import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/async-handler";
import { createInvite, listInvites, revokeInvite } from "./faculty-invites.service";

const createInviteSchema = z.object({
  email: z.string().email(),
});

const inviteIdSchema = z.object({
  inviteId: z.string().min(1),
});

export const facultyInviteRouter = Router();

facultyInviteRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const invites = await listInvites(request.auth!.id);
    response.json({ invites });
  }),
);

facultyInviteRouter.post(
  "/",
  validate(createInviteSchema),
  asyncHandler(async (request, response) => {
    const invite = await createInvite(request.auth!.id, request.body.email);
    response.status(201).json({ invite });
  }),
);

facultyInviteRouter.delete(
  "/:inviteId",
  validate(inviteIdSchema, "params"),
  asyncHandler(async (request, response) => {
    await revokeInvite(request.auth!.id, String(request.params.inviteId));
    response.status(204).send();
  }),
);
