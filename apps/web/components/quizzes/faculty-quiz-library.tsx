"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge, Card, buttonClassName } from "@quiz/ui";
import Link from "next/link";
import { apiRequest } from "../../lib/api";

type LibraryMode = "all" | "drafts" | "published";

type FacultyQuiz = {
  id: string;
  title: string;
  updatedAt: string;
  versions: Array<{
    id: string;
    title: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    versionNumber: number;
    quizCode: string | null;
    publishedAt: string | null;
  }>;
};

const modeCopy: Record<
  LibraryMode,
  {
    heading: string;
    description: string;
    emptyTitle: string;
    emptyDescription: string;
  }
> = {
  all: {
    heading: "Quiz library",
    description: "View every quiz lineage and open the latest version for editing or review.",
    emptyTitle: "No quizzes yet",
    emptyDescription: "Create a draft to begin building your first assessment.",
  },
  drafts: {
    heading: "Drafts",
    description: "Track quizzes whose latest version is still editable and not yet published.",
    emptyTitle: "No draft quizzes",
    emptyDescription: "Draft versions will appear here after you create or branch one.",
  },
  published: {
    heading: "Created quizzes",
    description: "Review published quiz versions, generated quiz codes, and analytics entry points.",
    emptyTitle: "No published quizzes",
    emptyDescription: "Publish a draft to make it available to students and analytics.",
  },
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not published";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusClasses(status: FacultyQuiz["versions"][number]["status"]) {
  if (status === "PUBLISHED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "DRAFT") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

export function FacultyQuizLibrary({ mode }: { mode: LibraryMode }) {
  const quizzesQuery = useQuery({
    queryKey: ["faculty-quizzes-library"],
    queryFn: () => apiRequest<{ quizzes: FacultyQuiz[] }>("/faculty/quizzes"),
  });

  const quizzes = quizzesQuery.data?.quizzes ?? [];

  const summary = {
    total: quizzes.length,
    drafts: quizzes.filter((quiz) => quiz.versions[0]?.status === "DRAFT").length,
    published: quizzes.filter((quiz) => quiz.versions[0]?.status === "PUBLISHED").length,
  };

  const filtered =
    mode === "drafts"
      ? quizzes.filter((quiz) => quiz.versions[0]?.status === "DRAFT")
      : mode === "published"
        ? quizzes.filter((quiz) => quiz.versions[0]?.status === "PUBLISHED")
        : quizzes;

  const copy = modeCopy[mode];

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total lineages", value: summary.total },
          { label: "Editable drafts", value: summary.drafts },
          { label: "Published quizzes", value: summary.published },
        ].map((item) => (
          <Card key={item.label}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {item.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{item.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-title">{copy.heading}</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">{copy.heading}</h2>
            <p className="mt-2 text-sm text-slate-600">{copy.description}</p>
          </div>
          <Badge>{filtered.length} items</Badge>
        </div>

        {quizzesQuery.isLoading ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
            Loading quizzes...
          </div>
        ) : null}

        {quizzesQuery.isError ? (
          <div className="error-message mt-6">
            Unable to load the quiz library right now. Please refresh and try again.
          </div>
        ) : null}

        {!quizzesQuery.isLoading && !quizzesQuery.isError && filtered.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <h3 className="text-lg font-semibold text-slate-900">{copy.emptyTitle}</h3>
            <p className="mt-2 text-sm text-slate-600">{copy.emptyDescription}</p>
          </div>
        ) : null}

        {!quizzesQuery.isLoading && !quizzesQuery.isError && filtered.length > 0 ? (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left">
                  {["Quiz", "Version", "Status", "Published", "Quiz Code", "Actions"].map((heading) => (
                    <th
                      key={heading}
                      className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((quiz) => {
                  const latest = quiz.versions[0];

                  if (!latest) {
                    return null;
                  }

                  return (
                    <tr key={quiz.id} className="align-top">
                      <td className="border-b border-slate-100 px-4 py-4">
                        <p className="font-medium text-slate-900">{quiz.title}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Updated {formatDate(quiz.updatedAt)}
                        </p>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                        Version {latest.versionNumber}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${statusClasses(latest.status)}`}
                        >
                          {latest.status}
                        </span>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                        {formatDate(latest.publishedAt)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4 text-sm font-medium text-slate-700">
                        {latest.quizCode ?? "Pending"}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/faculty/quizzes/${quiz.id}/builder?versionId=${latest.id}`}
                            className={buttonClassName({ variant: "secondary" })}
                          >
                            Open
                          </Link>
                          {latest.status === "PUBLISHED" ? (
                            <Link
                              href={`/faculty/analytics?versionId=${latest.id}`}
                              className={buttonClassName({})}
                            >
                              Analytics
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
