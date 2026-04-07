"use client";

import { Button, Card } from "@quiz/ui";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type QuizSnapshot = {
  title: string;
  questions: Array<{
    id: string;
    prompt: string;
    questionType: "SINGLE" | "MULTI";
    options: Array<{ id: string; text: string }>;
  }>;
};

type AttemptState = {
  quiz: QuizSnapshot;
  expiresAt: string;
  attemptToken: string;
};

type AttemptResult = {
  attempt: {
    id?: string;
    score: number;
    maxScore: number;
    percentage: number;
    correctCount: number;
    wrongCount: number;
    unansweredCount: number;
    status: string;
    expiresAt?: string;
  };
  quiz: {
    title: string;
  };
  analysis: Array<{
    questionId: string;
    prompt: string;
    selectedOptionIds: string[];
    correctOptionIds: string[];
    awardedMarks: number;
    isCorrect: boolean;
    options: Array<{ id: string; text: string; isCorrect: boolean }>;
  }> | null;
};

type AttemptProgress = {
  attempt: {
    id: string;
    status: "IN_PROGRESS";
    expiresAt: string;
  };
  quiz: QuizSnapshot;
  answers: Array<{
    questionId: string;
    selectedOptionIds: string[];
  }>;
};

function formatClock(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function StudentAttempt({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<AttemptState | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);

  const questions = attempt?.quiz.questions ?? [];
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.values(answers).filter((selected) => selected.length > 0).length;

  async function submitNow(currentAttempt: AttemptState) {
    const headers = currentAttempt.attemptToken
      ? { "x-attempt-token": currentAttempt.attemptToken }
      : undefined;

    const payload = await apiRequest<AttemptResult>(`/attempts/${attemptId}/submit`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        answers: Object.entries(answers).map(([questionId, selectedOptionIds]) => ({
          questionId,
          selectedOptionIds,
        })),
      }),
    });

    setResult(payload);

    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(`quiz-attempt:${attemptId}`);
    }
  }

  async function sendEvent(type: string, payload?: Record<string, unknown>) {
    if (!attempt) return;

    const headers = attempt.attemptToken ? { "x-attempt-token": attempt.attemptToken } : undefined;

    await apiRequest<void>(`/attempts/${attemptId}/events`, {
      method: "POST",
      headers,
      body: JSON.stringify({ type, payload }),
    });
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const cached = window.sessionStorage.getItem(`quiz-attempt:${attemptId}`);

    if (cached) {
      const parsed = JSON.parse(cached) as AttemptState;
      setAttempt(parsed);
      setSecondsLeft(
        Math.max(0, Math.floor((new Date(parsed.expiresAt).getTime() - Date.now()) / 1000)),
      );
      setLoading(false);
      return;
    }

    apiRequest<AttemptProgress | AttemptResult>(`/attempts/${attemptId}/result`)
      .then((payload) => {
        if ("analysis" in payload || payload.attempt.status !== "IN_PROGRESS") {
          setResult(payload as AttemptResult);
          setLoading(false);
          return;
        }

        setAttempt({
          quiz: payload.quiz,
          expiresAt: payload.attempt.expiresAt,
          attemptToken: "",
        });
        setAnswers(
          Object.fromEntries(
            payload.answers.map((answer) => [answer.questionId, answer.selectedOptionIds]),
          ),
        );
        setSecondsLeft(
          Math.max(0, Math.floor((new Date(payload.attempt.expiresAt).getTime() - Date.now()) / 1000)),
        );
        setLoading(false);
      })
      .catch(() => {
        setResult({
          attempt: {
            score: 0,
            maxScore: 0,
            percentage: 0,
            correctCount: 0,
            wrongCount: 0,
            unansweredCount: 0,
            status: "UNAVAILABLE",
          },
          quiz: {
            title: "Attempt session unavailable",
          },
          analysis: null,
        });
        setLoading(false);
      });
  }, [attemptId]);

  useEffect(() => {
    if (!attempt || result) return;

    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          void submitNow(attempt);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [attempt, result, answers, attemptId]);

  useEffect(() => {
    if (!attempt || result) return;

    function handleVisibility() {
      if (document.visibilityState === "hidden") {
        void sendEvent("TAB_SWITCH", { direction: "hidden" });
      }
    }

    function blockClipboard(event: ClipboardEvent) {
      event.preventDefault();
      void sendEvent(event.type === "copy" ? "COPY_BLOCKED" : "PASTE_BLOCKED", {
        type: event.type,
      });
    }

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("copy", blockClipboard);
    document.addEventListener("paste", blockClipboard);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("copy", blockClipboard);
      document.removeEventListener("paste", blockClipboard);
    };
  }, [attempt, result]);

  async function toggleOption(optionId: string) {
    if (!attempt || !currentQuestion) {
      return;
    }

    const selected = answers[currentQuestion.id] ?? [];
    const nextSelected =
      currentQuestion.questionType === "SINGLE"
        ? [optionId]
        : selected.includes(optionId)
          ? selected.filter((item) => item !== optionId)
          : [...selected, optionId];

    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: nextSelected,
    }));

    const headers = attempt.attemptToken ? { "x-attempt-token": attempt.attemptToken } : undefined;

    await apiRequest(`/attempts/${attemptId}/answers`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        questionId: currentQuestion.id,
        selectedOptionIds: nextSelected,
      }),
    });
  }

  async function moveToQuestion(index: number) {
    setCurrentIndex(index);
    await sendEvent("QUESTION_NAVIGATION", { index });
  }

  if (loading) {
    return <Card>Loading attempt...</Card>;
  }

  if (result) {
    return (
      <div className="grid gap-6">
        <Card>
          <p className="section-title">Quiz complete</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">{result.quiz.title}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-5">
            {[
              ["Score", `${result.attempt.score}/${result.attempt.maxScore}`],
              ["Percentage", `${result.attempt.percentage}%`],
              ["Correct", result.attempt.correctCount],
              ["Wrong", result.attempt.wrongCount],
              ["Unanswered", result.attempt.unansweredCount],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </Card>

        {result.analysis ? (
          <div className="grid gap-4">
            {result.analysis.map((item, index) => (
              <Card key={item.questionId}>
                <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Question {index + 1}</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.prompt}</h3>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                      item.isCorrect
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {item.isCorrect ? "Correct" : "Incorrect"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    Awarded marks: <span className="font-medium text-slate-900">{item.awardedMarks}</span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    Selected options:{" "}
                    <span className="font-medium text-slate-900">
                      {item.selectedOptionIds.length || "None"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {item.options.map((option) => {
                    const selectedOption = item.selectedOptionIds.includes(option.id);
                    const correctOption = item.correctOptionIds.includes(option.id);

                    return (
                      <div
                        key={option.id}
                        className={`rounded-xl border px-4 py-3 text-sm ${
                          correctOption
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : selectedOption
                              ? "border-rose-200 bg-rose-50 text-rose-800"
                              : "border-slate-200 bg-slate-50 text-slate-700"
                        }`}
                      >
                        {option.text}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>Detailed analysis is not available yet for this quiz version.</Card>
        )}

        <Button
          onClick={() =>
            startTransition(() => {
              router.push("/student/history");
            })
          }
        >
          View History
        </Button>
      </div>
    );
  }

  if (!attempt || !currentQuestion) {
    return <Card>Attempt data is unavailable.</Card>;
  }

  const selected = answers[currentQuestion.id] ?? [];

  return (
    <div className="grid gap-6 xl:grid-cols-[0.72fr_0.28fr]">
      <Card>
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="section-title">In progress</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">{attempt.quiz.title}</h2>
            <p className="mt-2 text-sm text-slate-600">
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-lg font-semibold text-blue-700">
            {formatClock(secondsLeft)}
          </div>
        </div>

        <div className="mt-6 h-2 rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${((currentIndex + 1) / Math.max(questions.length, 1)) * 100}%` }}
          />
        </div>

        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-slate-900">{currentQuestion.prompt}</h3>
          <p className="mt-2 text-sm text-slate-600">
            {currentQuestion.questionType === "SINGLE"
              ? "Select one correct option."
              : "Select all applicable correct options."}
          </p>
        </div>

        <div className="mt-6 grid gap-3">
          {currentQuestion.options.map((option) => {
            const isSelected = selected.includes(option.id);

            return (
              <button
                type="button"
                key={option.id}
                onClick={() => void toggleOption(option.id)}
                className={`rounded-xl border px-4 py-4 text-left text-sm transition-colors ${
                  isSelected
                    ? "border-blue-200 bg-blue-50 text-blue-800"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                }`}
              >
                {option.text}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            disabled={currentIndex === 0}
            onClick={() => void moveToQuestion(Math.max(0, currentIndex - 1))}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            disabled={currentIndex === questions.length - 1}
            onClick={() => void moveToQuestion(Math.min(questions.length - 1, currentIndex + 1))}
          >
            Next
          </Button>
          <Button onClick={() => void submitNow(attempt)}>Submit Quiz</Button>
        </div>
      </Card>

      <div className="grid gap-6">
        <Card>
          <p className="section-title">Attempt status</p>
          <div className="mt-5 grid gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Answered
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {answeredCount}/{questions.length}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Remaining time
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatClock(secondsLeft)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <p className="section-title">Question navigator</p>
          <div className="mt-5 grid grid-cols-4 gap-3">
            {questions.map((question, index) => (
              <button
                key={question.id}
                type="button"
                onClick={() => void moveToQuestion(index)}
                className={`rounded-lg border px-3 py-3 text-sm font-medium ${
                  index === currentIndex
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : answers[question.id]?.length
                      ? "border-slate-300 bg-white text-slate-900"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
