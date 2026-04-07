import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@quiz/shared";
import { ApiError } from "../utils/api-error";
import { verifyAccessToken } from "../utils/crypto";

export function authenticate(request: Request, _response: Response, next: NextFunction) {
  const authorization = request.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    next(new ApiError(401, "UNAUTHENTICATED", "Authentication is required"));
    return;
  }

  try {
    const token = authorization.replace("Bearer ", "");
    const payload = verifyAccessToken(token);

    request.auth = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      firstName: payload.firstName,
      lastName: payload.lastName,
    };

    next();
  } catch {
    next(new ApiError(401, "INVALID_TOKEN", "The access token is invalid or expired"));
  }
}

export function authenticateOptional(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  const authorization = request.header("authorization");

  if (!authorization) {
    next();
    return;
  }

  if (!authorization.startsWith("Bearer ")) {
    next(new ApiError(401, "INVALID_TOKEN", "Malformed authorization header"));
    return;
  }

  try {
    const token = authorization.replace("Bearer ", "");
    const payload = verifyAccessToken(token);

    request.auth = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      firstName: payload.firstName,
      lastName: payload.lastName,
    };

    next();
  } catch {
    next(new ApiError(401, "INVALID_TOKEN", "The access token is invalid or expired"));
  }
}

export function authorize(...roles: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.auth) {
      next(new ApiError(401, "UNAUTHENTICATED", "Authentication is required"));
      return;
    }

    if (!roles.includes(request.auth.role)) {
      next(new ApiError(403, "FORBIDDEN", "You do not have permission to access this resource"));
      return;
    }

    next();
  };
}
