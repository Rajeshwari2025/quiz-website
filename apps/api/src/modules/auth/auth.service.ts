import type { AuthUser, LoginInput, RegisterInput } from "@quiz/shared";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../utils/api-error";
import {
  generateOpaqueToken,
  hashPassword,
  hashToken,
  signAccessToken,
  verifyPassword,
} from "../../utils/crypto";

export const REFRESH_COOKIE_NAME = "quiz_refresh_token";

interface SessionContext {
  userAgent?: string;
  ipAddress?: string;
}

function mapUser(user: {
  id: string;
  email: string;
  role: "FACULTY" | "STUDENT";
  firstName: string;
  lastName: string;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

async function issueSession(
  user: AuthUser,
  context: SessionContext,
  client: Pick<typeof prisma, "authSession"> = prisma,
) {
  const refreshToken = generateOpaqueToken();
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(
    Date.now() + env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  );

  await client.authSession.create({
    data: {
      userId: user.id,
      refreshTokenHash,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      expiresAt,
    },
  });

  return {
    accessToken: signAccessToken(user),
    refreshToken,
    user,
  };
}

export function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax" as const,
    maxAge: env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

export async function register(input: RegisterInput, context: SessionContext) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (existingUser) {
    throw new ApiError(409, "EMAIL_ALREADY_IN_USE", "An account with this email already exists");
  }

  const user = await prisma.$transaction(async (transaction) => {
    if (input.role === "FACULTY") {
      const invite = await transaction.facultyInvite.findUnique({
        where: { token: input.inviteToken! },
      });

      if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
        throw new ApiError(403, "INVALID_INVITE", "Faculty invite is invalid or has expired");
      }

      if (invite.email.toLowerCase() !== input.email.toLowerCase()) {
        throw new ApiError(403, "INVITE_EMAIL_MISMATCH", "Invite token does not match this email");
      }

      await transaction.facultyInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });
    }

    return transaction.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash: await hashPassword(input.password),
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
      },
    });
  });

  return issueSession(mapUser(user), context);
}

export async function login(input: LoginInput, context: SessionContext) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (!user) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
  }

  const isValidPassword = await verifyPassword(input.password, user.passwordHash);

  if (!isValidPassword) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
  }

  return issueSession(mapUser(user), context);
}

export async function refresh(refreshToken: string, context: SessionContext) {
  if (!refreshToken) {
    throw new ApiError(401, "INVALID_SESSION", "Refresh token is missing");
  }

  const hashedToken = hashToken(refreshToken);
  const session = await prisma.authSession.findFirst({
    where: {
      refreshTokenHash: hashedToken,
      revokedAt: null,
    },
    include: {
      user: true,
    },
  });

  if (!session || session.expiresAt < new Date()) {
    throw new ApiError(401, "INVALID_SESSION", "Refresh session is invalid or expired");
  }

  return prisma.$transaction(async (transaction) => {
    await transaction.authSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return issueSession(mapUser(session.user), context, transaction);
  });
}

export async function logout(refreshToken?: string) {
  if (!refreshToken) {
    return;
  }

  await prisma.authSession.updateMany({
    where: {
      refreshTokenHash: hashToken(refreshToken),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User was not found");
  }

  return mapUser(user);
}

export async function revokeAllUserSessions(userId: string) {
  await prisma.authSession.updateMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: {
        gte: new Date(),
      },
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
