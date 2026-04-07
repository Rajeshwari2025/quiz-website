"use client";

import Link from "next/link";
import { Button, Card, Input, buttonClassName } from "@quiz/ui";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { DashboardShell } from "../../../components/layout/dashboard-shell";
import { FacultyQuizLibrary } from "../../../components/quizzes/faculty-quiz-library";
import { apiRequest } from "../../../lib/api";

export default function FacultyQuizzesPage() {
  const router = useRouter();
  const [title, setTitle] = useState("Distributed Systems Midterm");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function createDraft() {
    const payload = await apiRequest<{ quizId: string; version: { id: string } }>(
      "/faculty/quizzes/drafts",
      {
        method: "POST",
        body: JSON.stringify({ title }),
      },
    );

    setStatusMessage("Draft created successfully.");

    startTransition(() => {
      router.push(`/faculty/quizzes/${payload.quizId}/builder?versionId=${payload.version.id}`);
    });
  }

  return (
    <DashboardShell
      title="Create Quiz"
      role="FACULTY"
      description="Start a new draft, then continue editing quiz versions from the library below."
      actions={
        <Link href="/faculty/analytics" className={buttonClassName({ variant: "secondary" })}>
          Analytics
        </Link>
      }
    >
      <div className="grid gap-6">
        <Card>
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="section-title">New draft</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                Create a new quiz lineage
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Each quiz lineage can contain multiple versions. Drafts remain editable until
                published.
              </p>
            </div>
            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Quiz title</label>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={createDraft}>Create Draft</Button>
                <Link href="/faculty/drafts" className={buttonClassName({ variant: "secondary" })}>
                  View Drafts
                </Link>
              </div>
              {statusMessage ? <div className="status-message">{statusMessage}</div> : null}
            </div>
          </div>
        </Card>

        <FacultyQuizLibrary mode="all" />
      </div>
    </DashboardShell>
  );
}
