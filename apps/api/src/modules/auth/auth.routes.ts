import { Router } from "express";
import {
  loginSchema,
  refreshSessionSchema,
  registerSchema,
} from "@quiz/shared";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/async-handler";
import {
  getCurrentUser,
  getRefreshCookieOptions,
  login,
  logout,
  REFRESH_COOKIE_NAME,
  refresh,
  register,
} from "./auth.service";

export const authRouter = Router();

function getSessionContext(request: Parameters<typeof register>[1] & { ipAddress?: string }) {
  return {
    userAgent: request.userAgent,
    ipAddress: request.ipAddress,
  };
}

authRouter.post(
  "/register",
  validate(registerSchema),
  asyncHandler(async (request, response) => {
    const payload = await register(request.body, {
      userAgent: request.header("user-agent"),
      ipAddress: request.ip,
    });

    response.cookie(
      REFRESH_COOKIE_NAME,
      payload.refreshToken,
      getRefreshCookieOptions(),
    );

    response.status(201).json({
      user: payload.user,
      accessToken: payload.accessToken,
    });
  }),
);

authRouter.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (request, response) => {
    const payload = await login(request.body, {
      userAgent: request.header("user-agent"),
      ipAddress: request.ip,
    });

    response.cookie(
      REFRESH_COOKIE_NAME,
      payload.refreshToken,
      getRefreshCookieOptions(),
    );

    response.json({
      user: payload.user,
      accessToken: payload.accessToken,
    });
  }),
);

authRouter.post(
  "/refresh",
  validate(refreshSessionSchema),
  asyncHandler(async (request, response) => {
    const token =
      request.cookies?.[REFRESH_COOKIE_NAME] ?? request.body.refreshToken;
    const payload = await refresh(token, {
      userAgent: request.header("user-agent"),
      ipAddress: request.ip,
    });

    response.cookie(
      REFRESH_COOKIE_NAME,
      payload.refreshToken,
      getRefreshCookieOptions(),
    );

    response.json({
      user: payload.user,
      accessToken: payload.accessToken,
    });
  }),
);

authRouter.post(
  "/logout",
  asyncHandler(async (request, response) => {
    await logout(request.cookies?.[REFRESH_COOKIE_NAME]);
    response.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
    response.status(204).send();
  }),
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (request, response) => {
    const user = await getCurrentUser(request.auth!.id);
    response.json({ user });
  }),
);

