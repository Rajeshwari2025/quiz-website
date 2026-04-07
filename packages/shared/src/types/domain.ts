import type {
  AccessMode,
  AttemptEventType,
  AttemptStatus,
  LiveSessionState,
  QuestionType,
  QuizVersionStatus,
  ResultVisibility,
  StudentFieldType,
  UserRole,
} from "./enums";

export interface ApiErrorShape {
  error: {
    code: string;
    message: string;
    requestId: string;
    fieldErrors?: Record<string, string[]>;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface StudentFieldDefinition {
  id?: string;
  key: string;
  label: string;
  type: StudentFieldType;
  required: boolean;
  placeholder?: string | null;
  validation?: Record<string, unknown> | null;
  sortOrder: number;
}

export interface QuizOption {
  id?: string;
  key: string;
  text: string;
  isCorrect: boolean;
  sortOrder: number;
}

export interface QuizQuestion {
  id?: string;
  key: string;
  prompt: string;
  explanation?: string | null;
  questionType: QuestionType;
  marks: number;
  negativeMarks?: number | null;
  sortOrder: number;
  options: QuizOption[];
}

export interface QuizVersionSummary {
  id: string;
  quizId: string;
  versionNumber: number;
  status: QuizVersionStatus;
  title: string;
  durationMinutes: number;
  deadline: string | null;
  attemptLimit: number;
  shuffleQuestions: boolean;
  accessMode: AccessMode;
  resultVisibility: ResultVisibility;
  quizCode: string | null;
  publishedAt: string | null;
}

export interface QuizBuilderState extends QuizVersionSummary {
  studentFields: StudentFieldDefinition[];
  questions: QuizQuestion[];
}

export interface AttemptAnswerPayload {
  questionId: string;
  selectedOptionIds: string[];
}

export interface AttemptEventRecord {
  type: AttemptEventType;
  createdAt: string;
  payload?: Record<string, unknown>;
}

export interface AttemptSummary {
  id: string;
  status: AttemptStatus;
  score: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  startedAt: string;
  submittedAt: string | null;
}

export interface AttemptDetail extends AttemptSummary {
  quizVersion: QuizVersionSummary;
  studentProfileSnapshot: Record<string, unknown>;
  answers: Array<
    AttemptAnswerPayload & {
      awardedMarks: number;
      isCorrect: boolean;
    }
  >;
  events: AttemptEventRecord[];
}

export interface AnalyticsOverview {
  attemptsCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  averagePercentage: number;
}

export interface QuestionAccuracy {
  questionId: string;
  prompt: string;
  accuracyRate: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
}

export interface LeaderboardEntry {
  attemptId: string;
  studentName: string;
  score: number;
  percentage: number;
  submittedAt: string | null;
}

export interface LiveSessionSummary {
  id: string;
  quizVersionId: string;
  state: LiveSessionState;
  startsAt: string | null;
  endsAt: string | null;
}

