import type { AuthUser } from "@quiz/shared";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import {
  buildStudentIdentityKey,
  signAttemptToken,
  verifyAttemptToken,
} from "../../utils/crypto";
import { shuffleArray } from "../../utils/quiz";
import { refreshQuizVersionAnalytics } from "../analytics/analytics.service";
import { getPublishedQuizByCode } from "../quizzes/quizzes.service";
import { gradeAttempt } from "./scoring";

async function getVersionForAttempt(quizCode: string) {
  const version = await prisma.quizVersion.findFirst({
    where: {
      quizCode,
      status: "PUBLISHED",
    },
    include: {
      studentFieldDefinitions: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      questions: {
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          options: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      },
    },
  });

  if (!version) {
    throw new ApiError(404, "QUIZ_NOT_FOUND", "Quiz code is invalid");
  }

  return version;
}

function sanitizeQuizForStudent(version: Awaited<ReturnType<typeof getVersionForAttempt>>) {
  return {
    id: version.id,
    quizId: version.quizId,
    title: version.title,
    durationMinutes: version.durationMinutes,
    deadline: version.deadline,
    attemptLimit: version.attemptLimit,
    shuffleQuestions: version.shuffleQuestions,
    accessMode: version.accessMode,
    resultVisibility: version.resultVisibility,
    quizCode: version.quizCode,
    studentFields: version.studentFieldDefinitions,
    questions: version.questions.map((question) => ({
      id: question.id,
      key: question.key,
      prompt: question.prompt,
      explanation: question.explanation,
      questionType: question.questionType,
      marks: question.marks,
      negativeMarks: question.negativeMarks,
      sortOrder: question.sortOrder,
      options: question.options.map((option) => ({
        id: option.id,
        key: option.key,
        text: option.text,
        sortOrder: option.sortOrder,
      })),
    })),
  };
}

function buildAttemptToken(attemptId: string) {
  return signAttemptToken(attemptId);
}

function verifyGuestAttemptToken(token?: string) {
  if (!token) {
    return null;
  }

  try {
    return verifyAttemptToken(token).sub;
  } catch {
    return null;
  }
}

function validateStudentDetails(
  studentDetails: Record<string, unknown>,
  fieldDefinitions: Array<{
    key: string;
    label: string;
    required: boolean;
    type: "TEXT" | "EMAIL" | "NUMBER" | "PHONE";
  }>,
) {
  const fieldErrors: Record<string, string[]> = {};

  for (const field of fieldDefinitions) {
    const value = studentDetails[field.key];

    if (field.required && (value === undefined || value === null || value === "")) {
      fieldErrors[field.key] = [`${field.label} is required`];
      continue;
    }

    if (value === undefined || value === null || value === "") {
      continue;
    }

    const stringValue = String(value);

    if (field.type === "EMAIL" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
      fieldErrors[field.key] = [`${field.label} must be a valid email`];
    }

    if (field.type === "NUMBER" && Number.isNaN(Number(stringValue))) {
      fieldErrors[field.key] = [`${field.label} must be numeric`];
    }
  }

  if (Object.keys(fieldErrors).length) {
    throw new ApiError(422, "INVALID_STUDENT_DETAILS", "Student details are invalid", fieldErrors);
  }
}

function questionOrder(version: Awaited<ReturnType<typeof getVersionForAttempt>>) {
  const ids = version.questions.map((question) => question.id);
  return version.shuffleQuestions ? shuffleArray(ids) : ids;
}

async function getAttemptWithRelations(attemptId: string) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: {
      id: attemptId,
    },
    include: {
      quizVersion: {
        include: {
          studentFieldDefinitions: {
            orderBy: {
              sortOrder: "asc",
            },
          },
          questions: {
            include: {
              options: {
                orderBy: {
                  sortOrder: "asc",
                },
              },
            },
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      },
      answers: true,
      events: {
        orderBy: {
          createdAt: "asc",
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!attempt) {
    throw new ApiError(404, "ATTEMPT_NOT_FOUND", "Attempt was not found");
  }

  return attempt;
}

function assertAttemptAccess(
  attempt: Awaited<ReturnType<typeof getAttemptWithRelations>>,
  authUser?: AuthUser,
  attemptToken?: string,
) {
  if (attempt.userId) {
    if (!authUser || attempt.userId !== authUser.id) {
      throw new ApiError(403, "FORBIDDEN", "You cannot access this attempt");
    }
    return;
  }

  const tokenAttemptId = verifyGuestAttemptToken(attemptToken);

  if (!tokenAttemptId || tokenAttemptId !== attempt.id) {
    throw new ApiError(401, "INVALID_ATTEMPT_TOKEN", "Attempt token is invalid");
  }
}

function revealDetailedResults(attempt: Awaited<ReturnType<typeof getAttemptWithRelations>>) {
  if (attempt.quizVersion.resultVisibility === "IMMEDIATE") {
    return true;
  }

  if (attempt.quizVersion.resultVisibility === "SCORE_ONLY") {
    return false;
  }

  return Boolean(attempt.resultReleasedAt ?? attempt.quizVersion.resultsPublishedAt);
}

function buildResultPayload(attempt: Awaited<ReturnType<typeof getAttemptWithRelations>>) {
  const detailedVisible = revealDetailedResults(attempt);

  return {
    attempt: {
      id: attempt.id,
      status: attempt.status,
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage,
      correctCount: attempt.correctCount,
      wrongCount: attempt.wrongCount,
      unansweredCount: attempt.unansweredCount,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      expiresAt: attempt.expiresAt,
    },
    quiz: {
      id: attempt.quizVersion.id,
      title: attempt.quizVersion.title,
      quizCode: attempt.quizVersion.quizCode,
      resultVisibility: attempt.quizVersion.resultVisibility,
    },
    studentProfileSnapshot: attempt.studentProfileSnapshot,
    analysis: detailedVisible
      ? attempt.quizVersion.questions.map((question) => {
          const answer = attempt.answers.find((item) => item.questionId === question.id);
          const selectedOptionIds = Array.isArray(answer?.selectedOptionIds)
            ? (answer?.selectedOptionIds as string[])
            : [];

          return {
            questionId: question.id,
            prompt: question.prompt,
            explanation: question.explanation,
            selectedOptionIds,
            correctOptionIds: question.options
              .filter((option) => option.isCorrect)
              .map((option) => option.id),
            awardedMarks: answer?.awardedMarks ?? 0,
            isCorrect: answer?.isCorrect ?? false,
            options: question.options.map((option) => ({
              id: option.id,
              text: option.text,
              isCorrect: option.isCorrect,
            })),
          };
        })
      : null,
    events: attempt.events,
  };
}

async function finalizeAttempt(attemptId: string, finalStatus: "SUBMITTED" | "AUTO_SUBMITTED") {
  const attempt = await getAttemptWithRelations(attemptId);

  if (attempt.status !== "IN_PROGRESS") {
    return buildResultPayload(attempt);
  }

  const graded = gradeAttempt(
    attempt.quizVersion.questions.map((question) => ({
      id: question.id,
      marks: question.marks,
      negativeMarks: question.negativeMarks,
      options: question.options.map((option) => ({
        id: option.id,
        isCorrect: option.isCorrect,
      })),
    })),
    attempt.answers.map((answer) => ({
      questionId: answer.questionId,
      selectedOptionIds: Array.isArray(answer.selectedOptionIds)
        ? (answer.selectedOptionIds as string[])
        : [],
    })),
  );

  await prisma.$transaction(async (transaction) => {
    for (const result of graded.results) {
      await transaction.attemptAnswer.upsert({
        where: {
          attemptId_questionId: {
            attemptId,
            questionId: result.questionId,
          },
        },
        update: {
          selectedOptionIds: result.selectedOptionIds,
          isCorrect: result.isCorrect,
          awardedMarks: result.awardedMarks,
          savedAt: new Date(),
        },
        create: {
          attemptId,
          questionId: result.questionId,
          selectedOptionIds: result.selectedOptionIds,
          isCorrect: result.isCorrect,
          awardedMarks: result.awardedMarks,
        },
      });
    }

    const now = new Date();

    await transaction.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: finalStatus,
        score: graded.score,
        maxScore: graded.maxScore,
        percentage: graded.percentage,
        correctCount: graded.correctCount,
        wrongCount: graded.wrongCount,
        unansweredCount: graded.unansweredCount,
        submittedAt: now,
        resultReleasedAt:
          attempt.quizVersion.resultVisibility === "MANUAL_RELEASE"
            ? attempt.quizVersion.resultsPublishedAt
            : now,
      },
    });

    await transaction.attemptEvent.create({
      data: {
        attemptId,
        type: finalStatus === "AUTO_SUBMITTED" ? "AUTO_SUBMITTED" : "SUBMITTED",
        payload: {
          score: graded.score,
          maxScore: graded.maxScore,
          percentage: graded.percentage,
        },
      },
    });
  });

  await refreshQuizVersionAnalytics(attempt.quizVersionId);

  return buildResultPayload(await getAttemptWithRelations(attemptId));
}

async function finalizeIfExpired(attemptId: string) {
  const attempt = await getAttemptWithRelations(attemptId);

  if (attempt.status === "IN_PROGRESS" && attempt.expiresAt <= new Date()) {
    return finalizeAttempt(attemptId, "AUTO_SUBMITTED");
  }

  return null;
}

export async function lookupQuizByCode(quizCode: string) {
  return getPublishedQuizByCode(quizCode);
}

export async function startAttempt(
  quizCode: string,
  studentDetails: Record<string, unknown>,
  authUser?: AuthUser,
) {
  const version = await getVersionForAttempt(quizCode);

  if (version.deadline && version.deadline <= new Date()) {
    throw new ApiError(410, "QUIZ_CLOSED", "This quiz is no longer accepting attempts");
  }

  if (version.accessMode === "AUTHENTICATED_ONLY" && !authUser) {
    throw new ApiError(401, "LOGIN_REQUIRED", "Please sign in to attempt this quiz");
  }

  validateStudentDetails(studentDetails, version.studentFieldDefinitions);

  const studentIdentityKey = authUser?.id ?? buildStudentIdentityKey(studentDetails);
  const existingAttempt = await prisma.quizAttempt.findFirst({
    where: {
      quizVersionId: version.id,
      status: "IN_PROGRESS",
      OR: authUser
        ? [{ userId: authUser.id }]
        : [{ userId: null, studentIdentityKey }],
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (existingAttempt) {
    if (existingAttempt.expiresAt > new Date()) {
      return {
        attemptId: existingAttempt.id,
        attemptToken: buildAttemptToken(existingAttempt.id),
        expiresAt: existingAttempt.expiresAt,
        quiz: sanitizeQuizForStudent(version),
      };
    }

    await finalizeAttempt(existingAttempt.id, "AUTO_SUBMITTED");
  }

  const attemptsCount = await prisma.quizAttempt.count({
    where: {
      quizVersionId: version.id,
      status: {
        in: ["IN_PROGRESS", "SUBMITTED", "AUTO_SUBMITTED"],
      },
      OR: authUser
        ? [{ userId: authUser.id }]
        : [{ userId: null, studentIdentityKey }],
    },
  });

  if (attemptsCount >= version.attemptLimit) {
    throw new ApiError(409, "ATTEMPT_LIMIT_REACHED", "Attempt limit has been reached");
  }

  const expiresAt = new Date(
    Math.min(
      version.deadline?.getTime() ?? Number.MAX_SAFE_INTEGER,
      Date.now() + version.durationMinutes * 60 * 1000,
    ),
  );

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: version.quizId,
      quizVersionId: version.id,
      userId: authUser?.id,
      status: "IN_PROGRESS",
      accessMode: version.accessMode,
      studentIdentityKey,
      studentProfileSnapshot: studentDetails,
      quizSnapshot: sanitizeQuizForStudent(version),
      shuffledQuestionOrder: questionOrder(version),
      maxScore: version.questions.reduce((sum, question) => sum + question.marks, 0),
      expiresAt,
      events: {
        create: {
          type: "STARTED",
          payload: {
            startedAt: new Date().toISOString(),
          },
        },
      },
    },
  });

  return {
    attemptId: attempt.id,
    attemptToken: buildAttemptToken(attempt.id),
    expiresAt: attempt.expiresAt,
    quiz: sanitizeQuizForStudent(version),
  };
}

export async function saveAnswer(
  attemptId: string,
  questionId: string,
  selectedOptionIds: string[],
  authUser?: AuthUser,
  attemptToken?: string,
) {
  const autoSubmitted = await finalizeIfExpired(attemptId);
  if (autoSubmitted) {
    return {
      autoSubmitted: true,
      result: autoSubmitted,
    };
  }

  const attempt = await getAttemptWithRelations(attemptId);
  assertAttemptAccess(attempt, authUser, attemptToken);

  if (attempt.status !== "IN_PROGRESS") {
    throw new ApiError(409, "ATTEMPT_ALREADY_SUBMITTED", "Attempt is no longer editable");
  }

  const question = attempt.quizVersion.questions.find((item) => item.id === questionId);

  if (!question) {
    throw new ApiError(404, "QUESTION_NOT_FOUND", "Question does not belong to this attempt");
  }

  if (question.questionType === "SINGLE" && selectedOptionIds.length > 1) {
    throw new ApiError(
      422,
      "INVALID_SINGLE_CHOICE",
      "Single-correct questions accept only one selected option",
    );
  }

  await prisma.$transaction([
    prisma.attemptAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
      update: {
        selectedOptionIds,
        savedAt: new Date(),
      },
      create: {
        attemptId,
        questionId,
        selectedOptionIds,
      },
    }),
    prisma.attemptEvent.create({
      data: {
        attemptId,
        type: "AUTOSAVE",
        payload: {
          questionId,
          answerCount: selectedOptionIds.length,
        },
      },
    }),
  ]);

  return {
    saved: true,
    savedAt: new Date().toISOString(),
  };
}

export async function recordAttemptEvent(
  attemptId: string,
  type:
    | "TAB_SWITCH"
    | "COPY_BLOCKED"
    | "PASTE_BLOCKED"
    | "QUESTION_NAVIGATION"
    | "AUTOSAVE",
  payload: Record<string, unknown> | undefined,
  authUser?: AuthUser,
  attemptToken?: string,
) {
  const attempt = await getAttemptWithRelations(attemptId);
  assertAttemptAccess(attempt, authUser, attemptToken);

  await prisma.attemptEvent.create({
    data: {
      attemptId,
      type,
      payload,
    },
  });
}

export async function submitAttempt(
  attemptId: string,
  answers: Array<{ questionId: string; selectedOptionIds: string[] }>,
  authUser?: AuthUser,
  attemptToken?: string,
) {
  const autoSubmitted = await finalizeIfExpired(attemptId);
  if (autoSubmitted) {
    return autoSubmitted;
  }

  const attempt = await getAttemptWithRelations(attemptId);
  assertAttemptAccess(attempt, authUser, attemptToken);

  if (attempt.status !== "IN_PROGRESS") {
    return buildResultPayload(attempt);
  }

  for (const answer of answers) {
    await saveAnswer(
      attemptId,
      answer.questionId,
      answer.selectedOptionIds,
      authUser,
      attemptToken,
    );
  }

  return finalizeAttempt(attemptId, "SUBMITTED");
}

export async function getAttemptResult(
  attemptId: string,
  authUser?: AuthUser,
  attemptToken?: string,
) {
  const autoSubmitted = await finalizeIfExpired(attemptId);
  if (autoSubmitted) {
    return autoSubmitted;
  }

  const attempt = await getAttemptWithRelations(attemptId);
  assertAttemptAccess(attempt, authUser, attemptToken);

  if (attempt.status === "IN_PROGRESS") {
    return {
      attempt: {
        id: attempt.id,
        status: attempt.status,
        expiresAt: attempt.expiresAt,
      },
      quiz: attempt.quizSnapshot,
      answers: attempt.answers,
      events: attempt.events,
    };
  }

  return buildResultPayload(attempt);
}
