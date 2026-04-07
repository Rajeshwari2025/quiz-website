"use client";

import { Button, Card, Input } from "@quiz/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function QuizCodeEntry({
  title = "Enter Quiz Code",
  description = "Type the published quiz code shared by your faculty member to continue.",
}: {
  title?: string;
  description?: string;
}) {
  const router = useRouter();
  const [quizCode, setQuizCode] = useState("");

  return (
    <Card className="max-w-xl">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Input
          value={quizCode}
          onChange={(event) => setQuizCode(event.target.value.toUpperCase())}
          placeholder="e.g. AB12CD34"
          className="sm:flex-1"
        />
        <Button
          onClick={() => {
            if (quizCode.trim()) {
              router.push(`/quiz/${quizCode.trim()}`);
            }
          }}
        >
          Continue
        </Button>
      </div>
    </Card>
  );
}

