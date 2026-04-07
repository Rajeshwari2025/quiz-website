import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { generateOpaqueToken } from "../../utils/crypto";

export async function listInvites(createdById: string) {
  return prisma.facultyInvite.findMany({
    where: { createdById },
    orderBy: { createdAt: "desc" },
  });
}

export async function createInvite(createdById: string, email: string) {
  const normalizedEmail = email.toLowerCase();
  const token = generateOpaqueToken();

  return prisma.facultyInvite.create({
    data: {
      email: normalizedEmail,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdById,
    },
  });
}

export async function revokeInvite(createdById: string, inviteId: string) {
  const invite = await prisma.facultyInvite.findFirst({
    where: {
      id: inviteId,
      createdById,
    },
  });

  if (!invite) {
    throw new ApiError(404, "INVITE_NOT_FOUND", "Faculty invite was not found");
  }

  await prisma.facultyInvite.delete({
    where: {
      id: invite.id,
    },
  });
}

