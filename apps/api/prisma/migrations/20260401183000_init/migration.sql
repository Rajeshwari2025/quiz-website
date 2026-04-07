-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FACULTY', 'STUDENT');

-- CreateEnum
CREATE TYPE "QuizVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RETIRED');

-- CreateEnum
CREATE TYPE "AccessMode" AS ENUM ('AUTHENTICATED_ONLY', 'GUEST_ALLOWED');

-- CreateEnum
CREATE TYPE "ResultVisibility" AS ENUM ('IMMEDIATE', 'SCORE_ONLY', 'MANUAL_RELEASE');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SINGLE', 'MULTI');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "AttemptEventType" AS ENUM ('STARTED', 'AUTOSAVE', 'TAB_SWITCH', 'COPY_BLOCKED', 'PASTE_BLOCKED', 'SUBMITTED', 'AUTO_SUBMITTED', 'QUESTION_NAVIGATION');

-- CreateEnum
CREATE TYPE "StudentFieldType" AS ENUM ('TEXT', 'EMAIL', 'NUMBER', 'PHONE');

-- CreateEnum
CREATE TYPE "LiveSessionState" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "profile" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacultyInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "latestVersionNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizVersion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "parentVersionId" TEXT,
    "createdById" TEXT NOT NULL,
    "status" "QuizVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "deadline" TIMESTAMP(3),
    "attemptLimit" INTEGER NOT NULL DEFAULT 1,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "accessMode" "AccessMode" NOT NULL DEFAULT 'AUTHENTICATED_ONLY',
    "resultVisibility" "ResultVisibility" NOT NULL DEFAULT 'IMMEDIATE',
    "quizCode" TEXT,
    "publishedAt" TIMESTAMP(3),
    "resultsPublishedAt" TIMESTAMP(3),
    "retiredAt" TIMESTAMP(3),
    "negativeMarkingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentFieldDefinition" (
    "id" TEXT NOT NULL,
    "quizVersionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "StudentFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL,
    "placeholder" TEXT,
    "validation" JSONB,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentFieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "quizVersionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "explanation" TEXT,
    "questionType" "QuestionType" NOT NULL,
    "marks" DOUBLE PRECISION NOT NULL,
    "negativeMarks" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "QuizOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "quizVersionId" TEXT NOT NULL,
    "userId" TEXT,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "accessMode" "AccessMode" NOT NULL,
    "studentIdentityKey" TEXT NOT NULL,
    "studentProfileSnapshot" JSONB NOT NULL,
    "quizSnapshot" JSONB NOT NULL,
    "shuffledQuestionOrder" JSONB NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "unansweredCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "resultReleasedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionIds" JSONB NOT NULL,
    "isCorrect" BOOLEAN,
    "awardedMarks" DOUBLE PRECISION,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptEvent" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "type" "AttemptEventType" NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttemptEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizVersionAnalytics" (
    "id" TEXT NOT NULL,
    "quizVersionId" TEXT NOT NULL,
    "attemptsCount" INTEGER NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "highestScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lowestScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averagePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizVersionAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionAnalytics" (
    "id" TEXT NOT NULL,
    "quizVersionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "attemptsCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "accuracyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveSession" (
    "id" TEXT NOT NULL,
    "quizVersionId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "state" "LiveSessionState" NOT NULL DEFAULT 'SCHEDULED',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AuthSession_userId_expiresAt_idx" ON "AuthSession"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyInvite_token_key" ON "FacultyInvite"("token");

-- CreateIndex
CREATE INDEX "FacultyInvite_email_expiresAt_idx" ON "FacultyInvite"("email", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_slug_key" ON "Quiz"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "QuizVersion_quizCode_key" ON "QuizVersion"("quizCode");

-- CreateIndex
CREATE INDEX "QuizVersion_quizId_status_idx" ON "QuizVersion"("quizId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "QuizVersion_quizId_versionNumber_key" ON "QuizVersion"("quizId", "versionNumber");

-- CreateIndex
CREATE INDEX "StudentFieldDefinition_quizVersionId_sortOrder_idx" ON "StudentFieldDefinition"("quizVersionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "StudentFieldDefinition_quizVersionId_key_key" ON "StudentFieldDefinition"("quizVersionId", "key");

-- CreateIndex
CREATE INDEX "QuizQuestion_quizVersionId_sortOrder_idx" ON "QuizQuestion"("quizVersionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "QuizQuestion_quizVersionId_key_key" ON "QuizQuestion"("quizVersionId", "key");

-- CreateIndex
CREATE INDEX "QuizOption_questionId_sortOrder_idx" ON "QuizOption"("questionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "QuizOption_questionId_key_key" ON "QuizOption"("questionId", "key");

-- CreateIndex
CREATE INDEX "QuizAttempt_quizVersionId_status_idx" ON "QuizAttempt"("quizVersionId", "status");

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_createdAt_idx" ON "QuizAttempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "QuizAttempt_quizVersionId_studentIdentityKey_idx" ON "QuizAttempt"("quizVersionId", "studentIdentityKey");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptAnswer_attemptId_questionId_key" ON "AttemptAnswer"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "AttemptEvent_attemptId_createdAt_idx" ON "AttemptEvent"("attemptId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuizVersionAnalytics_quizVersionId_key" ON "QuizVersionAnalytics"("quizVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionAnalytics_quizVersionId_questionId_key" ON "QuestionAnalytics"("quizVersionId", "questionId");

-- CreateIndex
CREATE INDEX "LiveSession_quizVersionId_state_idx" ON "LiveSession"("quizVersionId", "state");

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyInvite" ADD CONSTRAINT "FacultyInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizVersion" ADD CONSTRAINT "QuizVersion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizVersion" ADD CONSTRAINT "QuizVersion_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "QuizVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizVersion" ADD CONSTRAINT "QuizVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFieldDefinition" ADD CONSTRAINT "StudentFieldDefinition_quizVersionId_fkey" FOREIGN KEY ("quizVersionId") REFERENCES "QuizVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizVersionId_fkey" FOREIGN KEY ("quizVersionId") REFERENCES "QuizVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizOption" ADD CONSTRAINT "QuizOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_quizVersionId_fkey" FOREIGN KEY ("quizVersionId") REFERENCES "QuizVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptEvent" ADD CONSTRAINT "AttemptEvent_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizVersionAnalytics" ADD CONSTRAINT "QuizVersionAnalytics_quizVersionId_fkey" FOREIGN KEY ("quizVersionId") REFERENCES "QuizVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAnalytics" ADD CONSTRAINT "QuestionAnalytics_quizVersionId_fkey" FOREIGN KEY ("quizVersionId") REFERENCES "QuizVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAnalytics" ADD CONSTRAINT "QuestionAnalytics_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_quizVersionId_fkey" FOREIGN KEY ("quizVersionId") REFERENCES "QuizVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

