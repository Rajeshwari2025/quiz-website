"use client";

import { Button, Card, Input } from "@quiz/ui";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { apiRequest } from "../../lib/api";

type QuizPayload = {
  quiz: {
    title: string;
    durationMinutes: number;
    accessMode: "AUTHENTICATED_ONLY" | "GUEST_ALLOWED";
    studentFields: Array<{
      key: string;
      label: string;
      required: boolean;
    }>;
  };
};

function getInputType(fieldKey: string) {
  const normalized = fieldKey.toLowerCase();

  if (normalized.includes("email")) {
    return "email";
  }

  if (normalized.includes("phone") || normalized.includes("mobile")) {
    return "tel";
  }

  return "text";
}

export function JoinQuiz({ quizCode }: { quizCode: string }) {
  const router = useRouter();
  const [studentDetails, setStudentDetails] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const quizQuery = useQuery({
    queryKey: ["quiz-code", quizCode],
    queryFn: () => apiRequest<QuizPayload>(`/student/quizzes/${quizCode}`),
  });

  async function startQuiz() {
    setErrorMessage(null);

    try {
      const payload = await apiRequest<{
        attemptId: string;
        attemptToken: string;
        expiresAt: string;
        quiz: QuizPayload["quiz"];
      }>("/student/attempts/start", {
        method: "POST",
        body: JSON.stringify({
          quizCode,
          studentDetails,
        }),
      });

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          `quiz-attempt:${payload.attemptId}`,
          JSON.stringify({
            attemptToken: payload.attemptToken,
            quiz: payload.quiz,
            expiresAt: payload.expiresAt,
          }),
        );
      }

      startTransition(() => {
        router.push(`/attempt/${payload.attemptId}`);
      });
    } catch (error) {
      setErrorMessage(
        typeof error === "object" && error && "message" in error
          ? String(error.message)
          : "Unable to start the quiz.",
      );
    }
  }

  if (quizQuery.isLoading) {
    return (
      <Card>
        <p className="section-title">Quiz access</p>
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
          Loading quiz details...
        </div>
      </Card>
    );
  }

  if (quizQuery.isError || !quizQuery.data) {
    return (
      <Card>
        <p className="section-title">Quiz access</p>
        <div className="error-message mt-6">
          This quiz code could not be validated. Please check the code and try again.
        </div>
      </Card>
    );
  }

  const quiz = quizQuery.data.quiz;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <Card>
        <p className="section-title">Quiz details</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">{quiz.title}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Complete the required student information below to begin the quiz. Timing and access rules
          are enforced on the server when the attempt starts.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Duration
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {quiz.durationMinutes} minutes
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Access mode
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {quiz.accessMode === "AUTHENTICATED_ONLY" ? "Authenticated only" : "Guest allowed"}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4">
          {quiz.studentFields.map((field) => (
            <div key={field.key}>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {field.label}
                {field.required ? " *" : ""}
              </label>
              <Input
                type={getInputType(field.key)}
                value={studentDetails[field.key] ?? ""}
                onChange={(event) =>
                  setStudentDetails((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))
                }
                placeholder={field.label}
              />
            </div>
          ))}
        </div>

        {errorMessage ? <div className="error-message mt-5">{errorMessage}</div> : null}

        <div className="mt-6">
          <Button onClick={startQuiz}>Start Quiz</Button>
        </div>
      </Card>

      <Card>
        <p className="section-title">Instructions</p>
        <div className="mt-5 grid gap-4 text-sm text-slate-600">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            Make sure the required student information matches your academic records.
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            Your quiz timer starts only after the attempt session is created successfully.
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            Answers are saved during navigation to protect progress during the attempt.
          </div>
        </div>
      </Card>
    </div>
  );
}
