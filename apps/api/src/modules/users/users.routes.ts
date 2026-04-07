import { Router } from "express";
import { historyFilterSchema } from "@quiz/shared";
import { prisma } from "../../lib/prisma";
import { authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/async-handler";
import { ApiError } from "../../utils/api-error";

function buildTrend(attempts: Array<{ submittedAt: Date | null; percentage: number }>) {
  return attempts
    .filter((attempt) => attempt.submittedAt)
    .slice()
    .reverse()
    .map((attempt) => ({
      date: attempt.submittedAt!.toISOString(),
      percentage: attempt.percentage,
    }));
}

export const usersRouter = Router();

usersRouter.get(
  "/me/history",
  authorize("STUDENT"),
  validate(historyFilterSchema, "query"),
  asyncHandler(async (request, response) => {
    const page = Number(request.query.page ?? 1);
    const pageSize = Number(request.query.pageSize ?? 10);
    const search = request.query.search ? String(request.query.search) : "";
    const status = request.query.status ? String(request.query.status) : undefined;

    const where = {
      userId: request.auth!.id,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              {
                quizVersion: {
                  title: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [attempts, total] = await Promise.all([
      prisma.quizAttempt.findMany({
        where,
        include: {
          quizVersion: {
            select: {
              id: true,
              title: true,
              quizCode: true,
              publishedAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.quizAttempt.count({ where }),
    ]);

    response.json({
      items: attempts,
      meta: {
        page,
        pageSize,
        total,
      },
      trend: buildTrend(attempts),
    });
  }),
);

usersRouter.get(
  "/me/history/:attemptId",
  authorize("STUDENT"),
  asyncHandler(async (request, response) => {
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        id: request.params.attemptId,
        userId: request.auth!.id,
      },
      include: {
        quizVersion: {
          include: {
            questions: {
              include: {
                options: true,
              },
              orderBy: {
                sortOrder: "asc",
              },
            },
          },
        },
        answers: true,
        events: true,
      },
    });

    if (!attempt) {
      throw new ApiError(404, "ATTEMPT_NOT_FOUND", "Attempt was not found");
    }

    response.json({ attempt });
  }),
);
