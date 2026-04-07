import QRCode from "qrcode";
import type {
  QuizConfigurationInput,
  QuizQuestionInput,
  StudentFieldInput,
} from "@quiz/shared";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../utils/api-error";
import { generateQuizCode, slugify } from "../../utils/crypto";
import { serializeQuestions, serializeStudentFields } from "../../utils/quiz";

const versionInclude = {
  studentFieldDefinitions: {
    orderBy: {
      sortOrder: "asc" as const,
    },
  },
  questions: {
    orderBy: {
      sortOrder: "asc" as const,
    },
    include: {
      options: {
        orderBy: {
          sortOrder: "asc" as const,
        },
      },
    },
  },
  quiz: {
    select: {
      id: true,
      title: true,
      createdById: true,
      latestVersionNumber: true,
    },
  },
} as const;

type OwnedVersion = Awaited<ReturnType<typeof getOwnedVersion>>;

async function buildUniqueSlug(title: string) {
  const base = slugify(title) || "quiz";
  let value = base;
  let suffix = 1;

  while (await prisma.quiz.findUnique({ where: { slug: value } })) {
    value = `${base}-${suffix}`;
    suffix += 1;
  }

  return value;
}

async function buildUniqueQuizCode() {
  let code = generateQuizCode();

  while (await prisma.quizVersion.findUnique({ where: { quizCode: code } })) {
    code = generateQuizCode();
  }

  return code;
}

async function getOwnedVersion(versionId: string, facultyId: string) {
  const version = await prisma.quizVersion.findFirst({
    where: {
      id: versionId,
      quiz: {
        createdById: facultyId,
      },
    },
    include: versionInclude,
  });

  if (!version) {
    throw new ApiError(404, "QUIZ_VERSION_NOT_FOUND", "Quiz version was not found");
  }

  return version;
}

async function ensureDraft(versionId: string, facultyId: string) {
  const version = await getOwnedVersion(versionId, facultyId);

  if (version.status !== "DRAFT") {
    throw new ApiError(
      409,
      "QUIZ_VERSION_NOT_EDITABLE",
      "Only draft quiz versions can be updated directly",
    );
  }

  return version;
}

function buildVersionResponse(version: OwnedVersion) {
  return {
    id: version.id,
    quizId: version.quizId,
    versionNumber: version.versionNumber,
    status: version.status,
    title: version.title,
    durationMinutes: version.durationMinutes,
    deadline: version.deadline,
    attemptLimit: version.attemptLimit,
    shuffleQuestions: version.shuffleQuestions,
    accessMode: version.accessMode,
    resultVisibility: version.resultVisibility,
    quizCode: version.quizCode,
    publishedAt: version.publishedAt,
    studentFields: version.studentFieldDefinitions,
    questions: version.questions,
  };
}

function nestedFieldClone(source: OwnedVersion) {
  return source.studentFieldDefinitions.map((field) => ({
    key: field.key,
    label: field.label,
    type: field.type,
    required: field.required,
    placeholder: field.placeholder,
    validation: field.validation,
    sortOrder: field.sortOrder,
  }));
}

function nestedQuestionClone(source: OwnedVersion) {
  return source.questions.map((question) => ({
    key: question.key,
    prompt: question.prompt,
    explanation: question.explanation,
    questionType: question.questionType,
    marks: question.marks,
    negativeMarks: question.negativeMarks,
    sortOrder: question.sortOrder,
    options: {
      create: question.options.map((option) => ({
        key: option.key,
        text: option.text,
        isCorrect: option.isCorrect,
        sortOrder: option.sortOrder,
      })),
    },
  }));
}

export async function createDraftQuiz(facultyId: string, title: string) {
  const slug = await buildUniqueSlug(title);

  const quiz = await prisma.quiz.create({
    data: {
      slug,
      title,
      createdById: facultyId,
      versions: {
        create: {
          versionNumber: 1,
          createdById: facultyId,
          title,
        },
      },
    },
    include: {
      versions: {
        include: versionInclude,
      },
    },
  });

  return {
    quizId: quiz.id,
    version: buildVersionResponse(quiz.versions[0] as OwnedVersion),
  };
}

export async function listFacultyQuizzes(facultyId: string) {
  return prisma.quiz.findMany({
    where: {
      createdById: facultyId,
    },
    include: {
      versions: {
        orderBy: {
          versionNumber: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function getQuizVersion(facultyId: string, versionId: string) {
  const version = await getOwnedVersion(versionId, facultyId);
  return buildVersionResponse(version);
}

export async function getQuizVersionHistory(facultyId: string, quizId: string) {
  const quiz = await prisma.quiz.findFirst({
    where: {
      id: quizId,
      createdById: facultyId,
    },
    include: {
      versions: {
        orderBy: {
          versionNumber: "desc",
        },
      },
    },
  });

  if (!quiz) {
    throw new ApiError(404, "QUIZ_NOT_FOUND", "Quiz was not found");
  }

  return quiz.versions;
}

export async function updateStudentSchemaStep(
  facultyId: string,
  versionId: string,
  studentFields: StudentFieldInput[],
) {
  await ensureDraft(versionId, facultyId);
  const fields = serializeStudentFields(studentFields);

  await prisma.$transaction([
    prisma.studentFieldDefinition.deleteMany({
      where: { quizVersionId: versionId },
    }),
    prisma.studentFieldDefinition.createMany({
      data: fields.map((field) => ({
        quizVersionId: versionId,
        key: field.key,
        label: field.label,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder,
        validation: field.validation,
        sortOrder: field.sortOrder,
      })),
    }),
  ]);

  return getQuizVersion(facultyId, versionId);
}

export async function updateConfigurationStep(
  facultyId: string,
  versionId: string,
  configuration: QuizConfigurationInput,
) {
  await ensureDraft(versionId, facultyId);

  await prisma.quizVersion.update({
    where: { id: versionId },
    data: {
      title: configuration.title,
      durationMinutes: configuration.durationMinutes,
      deadline: configuration.deadline ? new Date(configuration.deadline) : null,
      attemptLimit: configuration.attemptLimit,
      shuffleQuestions: configuration.shuffleQuestions,
      accessMode: configuration.accessMode,
      resultVisibility: configuration.resultVisibility,
    },
  });

  return getQuizVersion(facultyId, versionId);
}

export async function replaceQuestionStep(
  facultyId: string,
  versionId: string,
  questions: QuizQuestionInput[],
) {
  await ensureDraft(versionId, facultyId);
  const serializedQuestions = serializeQuestions(questions);

  await prisma.$transaction(async (transaction) => {
    await transaction.quizQuestion.deleteMany({
      where: { quizVersionId: versionId },
    });

    for (const question of serializedQuestions) {
      await transaction.quizQuestion.create({
        data: {
          quizVersionId: versionId,
          key: question.key,
          prompt: question.prompt,
          explanation: question.explanation,
          questionType: question.questionType,
          marks: question.marks,
          negativeMarks: question.negativeMarks,
          sortOrder: question.sortOrder,
          options: {
            create: question.options.map((option) => ({
              key: option.key,
              text: option.text,
              isCorrect: option.isCorrect,
              sortOrder: option.sortOrder,
            })),
          },
        },
      });
    }

    await transaction.quizVersion.update({
      where: { id: versionId },
      data: {
        negativeMarkingEnabled: serializedQuestions.some(
          (question) => (question.negativeMarks ?? 0) > 0,
        ),
      },
    });
  });

  return getQuizVersion(facultyId, versionId);
}

export async function publishQuizVersion(facultyId: string, versionId: string) {
  const version = await ensureDraft(versionId, facultyId);

  if (!version.questions.length) {
    throw new ApiError(422, "QUIZ_REQUIRES_QUESTIONS", "Add at least one question before publishing");
  }

  const quizCode = await buildUniqueQuizCode();

  await prisma.$transaction([
    prisma.quizVersion.update({
      where: { id: versionId },
      data: {
        status: "PUBLISHED",
        quizCode,
        publishedAt: new Date(),
      },
    }),
    prisma.quiz.update({
      where: { id: version.quizId },
      data: {
        title: version.title,
        latestVersionNumber: version.versionNumber,
      },
    }),
  ]);

  return getQuizVersion(facultyId, versionId);
}

export async function createEditDraft(facultyId: string, versionId: string) {
  const source = await getOwnedVersion(versionId, facultyId);

  if (source.status === "DRAFT") {
    return buildVersionResponse(source);
  }

  const existingDraft = await prisma.quizVersion.findFirst({
    where: {
      parentVersionId: source.id,
      status: "DRAFT",
      quiz: {
        createdById: facultyId,
      },
    },
    orderBy: {
      versionNumber: "desc",
    },
  });

  if (existingDraft) {
    return getQuizVersion(facultyId, existingDraft.id);
  }

  const nextVersionNumber = source.quiz.latestVersionNumber + 1;

  const draft = await prisma.$transaction(async (transaction) => {
    await transaction.quiz.update({
      where: { id: source.quizId },
      data: {
        latestVersionNumber: nextVersionNumber,
      },
    });

    return transaction.quizVersion.create({
      data: {
        quizId: source.quizId,
        versionNumber: nextVersionNumber,
        parentVersionId: source.id,
        createdById: facultyId,
        status: "DRAFT",
        title: source.title,
        durationMinutes: source.durationMinutes,
        deadline: source.deadline,
        attemptLimit: source.attemptLimit,
        shuffleQuestions: source.shuffleQuestions,
        accessMode: source.accessMode,
        resultVisibility: source.resultVisibility,
        negativeMarkingEnabled: source.negativeMarkingEnabled,
        studentFieldDefinitions: {
          create: nestedFieldClone(source),
        },
        questions: {
          create: nestedQuestionClone(source),
        },
      },
    });
  });

  return getQuizVersion(facultyId, draft.id);
}

export async function cloneQuizVersion(
  facultyId: string,
  sourceVersionId: string,
  titleOverride?: string,
) {
  const source = await getOwnedVersion(sourceVersionId, facultyId);
  const title = titleOverride ?? `${source.title} Copy`;
  const slug = await buildUniqueSlug(title);

  const quiz = await prisma.quiz.create({
    data: {
      slug,
      title,
      createdById: facultyId,
      latestVersionNumber: 1,
      versions: {
        create: {
          versionNumber: 1,
          createdById: facultyId,
          status: "DRAFT",
          title,
          durationMinutes: source.durationMinutes,
          deadline: source.deadline,
          attemptLimit: source.attemptLimit,
          shuffleQuestions: source.shuffleQuestions,
          accessMode: source.accessMode,
          resultVisibility: source.resultVisibility,
          negativeMarkingEnabled: source.negativeMarkingEnabled,
          studentFieldDefinitions: {
            create: nestedFieldClone(source),
          },
          questions: {
            create: nestedQuestionClone(source),
          },
        },
      },
    },
    include: {
      versions: true,
    },
  });

  return getQuizVersion(facultyId, quiz.versions[0].id);
}

export async function releaseManualResults(facultyId: string, versionId: string) {
  await getOwnedVersion(versionId, facultyId);

  const now = new Date();

  await prisma.$transaction([
    prisma.quizVersion.update({
      where: { id: versionId },
      data: {
        resultsPublishedAt: now,
      },
    }),
    prisma.quizAttempt.updateMany({
      where: {
        quizVersionId: versionId,
        status: {
          in: ["SUBMITTED", "AUTO_SUBMITTED"],
        },
      },
      data: {
        resultReleasedAt: now,
      },
    }),
  ]);

  return getQuizVersion(facultyId, versionId);
}

export async function generateQuizQrCode(facultyId: string, versionId: string) {
  const version = await getOwnedVersion(versionId, facultyId);

  if (!version.quizCode) {
    throw new ApiError(409, "QUIZ_NOT_PUBLISHED", "Publish the quiz before generating a QR code");
  }

  const joinUrl = `${env.WEB_APP_URL}/quiz/${version.quizCode}`;

  return {
    joinUrl,
    dataUrl: await QRCode.toDataURL(joinUrl),
  };
}

export async function getPublishedQuizByCode(quizCode: string) {
  const version = await prisma.quizVersion.findFirst({
    where: {
      quizCode,
      status: "PUBLISHED",
      OR: [{ retiredAt: null }, { retiredAt: { gt: new Date() } }],
    },
    include: versionInclude,
  });

  if (!version) {
    throw new ApiError(404, "QUIZ_NOT_FOUND", "Quiz code is invalid");
  }

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
      questionType: question.questionType,
      marks: question.marks,
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
