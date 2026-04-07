import bcrypt from "bcrypt";
import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { customAlphabet } from "nanoid";
import type { AuthUser } from "@quiz/shared";
import { env } from "../config/env";

const quizCodeAlphabet = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: AuthUser["role"];
  firstName: string;
  lastName: string;
  tokenType: "access";
}

interface AttemptTokenPayload {
  sub: string;
  tokenType: "attempt";
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function generateOpaqueToken() {
  return crypto.randomBytes(48).toString("hex");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function signAccessToken(user: AuthUser) {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    tokenType: "access",
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string) {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as Partial<AccessTokenPayload>;

  if (payload.tokenType !== "access") {
    throw new Error("Invalid access token type");
  }

  return payload as AccessTokenPayload;
}

export function signAttemptToken(attemptId: string) {
  const payload: AttemptTokenPayload = {
    sub: attemptId,
    tokenType: "attempt",
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: "2d",
  });
}

export function verifyAttemptToken(token: string) {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as Partial<AttemptTokenPayload>;

  if (payload.tokenType !== "attempt") {
    throw new Error("Invalid attempt token type");
  }

  return payload as AttemptTokenPayload;
}

export function generateQuizCode() {
  return quizCodeAlphabet();
}

export function buildStudentIdentityKey(studentDetails: Record<string, unknown>) {
  const normalized = JSON.stringify(
    Object.keys(studentDetails)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = studentDetails[key];
        return accumulator;
      }, {}),
  );

  return hashToken(normalized);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}
