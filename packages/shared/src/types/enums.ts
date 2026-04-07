export const userRoles = ["FACULTY", "STUDENT"] as const;
export type UserRole = (typeof userRoles)[number];

export const quizVersionStatuses = ["DRAFT", "PUBLISHED", "RETIRED"] as const;
export type QuizVersionStatus = (typeof quizVersionStatuses)[number];

export const accessModes = ["AUTHENTICATED_ONLY", "GUEST_ALLOWED"] as const;
export type AccessMode = (typeof accessModes)[number];

export const resultVisibilityModes = [
  "IMMEDIATE",
  "SCORE_ONLY",
  "MANUAL_RELEASE",
] as const;
export type ResultVisibility = (typeof resultVisibilityModes)[number];

export const questionTypes = ["SINGLE", "MULTI"] as const;
export type QuestionType = (typeof questionTypes)[number];

export const attemptStatuses = [
  "IN_PROGRESS",
  "SUBMITTED",
  "AUTO_SUBMITTED",
  "ABANDONED",
] as const;
export type AttemptStatus = (typeof attemptStatuses)[number];

export const attemptEventTypes = [
  "STARTED",
  "AUTOSAVE",
  "TAB_SWITCH",
  "COPY_BLOCKED",
  "PASTE_BLOCKED",
  "SUBMITTED",
  "AUTO_SUBMITTED",
  "QUESTION_NAVIGATION",
] as const;
export type AttemptEventType = (typeof attemptEventTypes)[number];

export const studentFieldTypes = ["TEXT", "EMAIL", "NUMBER", "PHONE"] as const;
export type StudentFieldType = (typeof studentFieldTypes)[number];

export const liveSessionStates = ["SCHEDULED", "LIVE", "ENDED"] as const;
export type LiveSessionState = (typeof liveSessionStates)[number];

