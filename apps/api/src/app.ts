import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { analyticsRouter } from "./modules/analytics/analytics.routes";
import { attemptRouter, studentRouter } from "./modules/attempts/attempts.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { facultyInviteRouter } from "./modules/faculty-invites/faculty-invites.routes";
import { liveSessionsRouter } from "./modules/live-sessions/live-sessions.routes";
import { facultyQuizRouter } from "./modules/quizzes/quizzes.routes";
import { reportsRouter } from "./modules/reports/reports.routes";
import { usersRouter } from "./modules/users/users.routes";
import { authenticate, authorize } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import { requestContext } from "./middleware/request-context";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.API_CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "2mb" }));
  app.use(requestContext);

  app.get("/health", (_request, response) => {
    response.json({
      ok: true,
      service: "quiz-api",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/v1/auth", authRouter);
  app.use(
    "/api/v1/faculty-invites",
    authenticate,
    authorize("FACULTY"),
    facultyInviteRouter,
  );
  app.use(
    "/api/v1/faculty/quizzes",
    authenticate,
    authorize("FACULTY"),
    facultyQuizRouter,
  );
  app.use(
    "/api/v1/faculty/analytics",
    authenticate,
    authorize("FACULTY"),
    analyticsRouter,
  );
  app.use(
    "/api/v1/faculty/live-sessions",
    authenticate,
    authorize("FACULTY"),
    liveSessionsRouter,
  );
  app.use(
    "/api/v1/faculty/reports",
    authenticate,
    authorize("FACULTY"),
    reportsRouter,
  );
  app.use(
    "/api/v1/users",
    authenticate,
    usersRouter,
  );
  app.use("/api/v1/student", studentRouter);
  app.use("/api/v1/attempts", attemptRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
