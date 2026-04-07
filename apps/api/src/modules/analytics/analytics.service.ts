import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";

function extractStudentName(
  snapshot: Record<string, unknown>,
  user?: { firstName: string; lastName: string } | null,
) {
  if (user) {
    return `${user.firstName} ${user.lastName}`.trim();
  }

  const preferredKeys = ["name", "fullName", "studentName"];

  for (const key of preferredKeys) {
    const value = snapshot[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  const first = snapshot.firstName;
  const last = snapshot.lastName;

  if (typeof first === "string" || typeof last === "string") {
    return `${typeof first === "string" ? first : ""} ${
      typeof last === "string" ? last : ""
    }`.trim();
  }

  return "Guest Student";
}

async function assertFacultyOwnership(quizVersionId: string, facultyId: string) {
  const version = await prisma.quizVersion.findFirst({
    where: {
      id: quizVersionId,
      quiz: {
        createdById: facultyId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!version) {
    throw new ApiError(404, "QUIZ_VERSION_NOT_FOUND", "Quiz version was not found");
  }
}

export async function refreshQuizVersionAnalytics(quizVersionId: string) {
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      quizVersionId,
      status: {
        in: ["SUBMITTED", "AUTO_SUBMITTED"],
      },
    },
    include: {
      answers: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      quizVersion: {
        include: {
          questions: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      },
    },
  });

  const attemptsCount = attempts.length;
  const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
  const totalPercentage = attempts.reduce((sum, attempt) => sum + attempt.percentage, 0);
  const highestScore = attemptsCount ? Math.max(...attempts.map((attempt) => attempt.score)) : 0;
  const lowestScore = attemptsCount ? Math.min(...attempts.map((attempt) => attempt.score)) : 0;

  await prisma.quizVersionAnalytics.upsert({
    where: { quizVersionId },
    update: {
      attemptsCount,
      averageScore: attemptsCount ? totalScore / attemptsCount : 0,
      highestScore,
      lowestScore,
      averagePercentage: attemptsCount ? totalPercentage / attemptsCount : 0,
    },
    create: {
      quizVersionId,
      attemptsCount,
      averageScore: attemptsCount ? totalScore / attemptsCount : 0,
      highestScore,
      lowestScore,
      averagePercentage: attemptsCount ? totalPercentage / attemptsCount : 0,
    },
  });

  const questions = attempts[0]?.quizVersion.questions ?? [];

  await Promise.all(
    questions.map(async (question) => {
      const questionAnswers = attempts.map((attempt) =>
        attempt.answers.find((answer) => answer.questionId === question.id),
      );
      const attemptsForQuestion = attempts.length;
      const correctCount = questionAnswers.filter((answer) => answer?.isCorrect).length;
      const wrongCount = questionAnswers.filter((answer) => {
        const selected = Array.isArray(answer?.selectedOptionIds)
          ? (answer?.selectedOptionIds as unknown[])
          : [];
        return selected.length > 0 && !answer?.isCorrect;
      }).length;
      const skippedCount = attemptsForQuestion - correctCount - wrongCount;
      const averageMarks =
        attemptsForQuestion === 0
          ? 0
          : questionAnswers.reduce((sum, answer) => sum + (answer?.awardedMarks ?? 0), 0) /
            attemptsForQuestion;

      await prisma.questionAnalytics.upsert({
        where: {
          quizVersionId_questionId: {
            quizVersionId,
            questionId: question.id,
          },
        },
        update: {
          attemptsCount: attemptsForQuestion,
          correctCount,
          wrongCount,
          skippedCount,
          accuracyRate: attemptsForQuestion ? (correctCount / attemptsForQuestion) * 100 : 0,
          averageMarks,
        },
        create: {
          quizVersionId,
          questionId: question.id,
          attemptsCount: attemptsForQuestion,
          correctCount,
          wrongCount,
          skippedCount,
          accuracyRate: attemptsForQuestion ? (correctCount / attemptsForQuestion) * 100 : 0,
          averageMarks,
        },
      });
    }),
  );
}

export async function getDashboard(quizVersionId: string, facultyId: string, limit = 10) {
  await assertFacultyOwnership(quizVersionId, facultyId);

  const overview =
    (await prisma.quizVersionAnalytics.findUnique({
      where: { quizVersionId },
    })) ?? null;

  if (!overview) {
    await refreshQuizVersionAnalytics(quizVersionId);
  }

  const refreshedOverview = await prisma.quizVersionAnalytics.findUnique({
    where: { quizVersionId },
  });

  const attempts = await prisma.quizAttempt.findMany({
    where: {
      quizVersionId,
      status: {
        in: ["SUBMITTED", "AUTO_SUBMITTED"],
      },
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: [{ score: "desc" }, { submittedAt: "asc" }],
  });

  const questionAnalytics = await prisma.questionAnalytics.findMany({
    where: { quizVersionId },
    include: {
      question: {
        select: {
          prompt: true,
        },
      },
    },
    orderBy: {
      accuracyRate: "asc",
    },
  });

  return {
    overview: {
      attemptsCount: refreshedOverview?.attemptsCount ?? 0,
      averageScore: refreshedOverview?.averageScore ?? 0,
      highestScore: refreshedOverview?.highestScore ?? 0,
      lowestScore: refreshedOverview?.lowestScore ?? 0,
      averagePercentage: refreshedOverview?.averagePercentage ?? 0,
    },
    studentPerformance: attempts.map((attempt) => ({
      attemptId: attempt.id,
      studentName: extractStudentName(
        attempt.studentProfileSnapshot as Record<string, unknown>,
        attempt.user,
      ),
      email:
        attempt.user?.email ??
        String(
          (attempt.studentProfileSnapshot as Record<string, unknown>).email ?? "",
        ),
      score: attempt.score,
      percentage: attempt.percentage,
      submittedAt: attempt.submittedAt,
    })),
    questionAccuracy: questionAnalytics.map((item) => ({
      questionId: item.questionId,
      prompt: item.question.prompt,
      accuracyRate: item.accuracyRate,
      correctCount: item.correctCount,
      wrongCount: item.wrongCount,
      skippedCount: item.skippedCount,
    })),
    mostDifficultQuestions: questionAnalytics.slice(0, 5).map((item) => ({
      questionId: item.questionId,
      prompt: item.question.prompt,
      accuracyRate: item.accuracyRate,
    })),
    leaderboard: attempts.slice(0, limit).map((attempt) => ({
      attemptId: attempt.id,
      studentName: extractStudentName(
        attempt.studentProfileSnapshot as Record<string, unknown>,
        attempt.user,
      ),
      score: attempt.score,
      percentage: attempt.percentage,
      submittedAt: attempt.submittedAt,
    })),
  };
}

