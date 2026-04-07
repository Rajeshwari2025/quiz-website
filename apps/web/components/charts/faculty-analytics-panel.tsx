"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Input } from "@quiz/ui";
import { apiRequest } from "../../lib/api";
import { AnalyticsCharts } from "./analytics-charts";

const fallbackDashboard = {
  overview: {
    attemptsCount: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    averagePercentage: 0,
  },
  questionAccuracy: [
    { prompt: "Question 1", accuracyRate: 82, skippedCount: 2 },
    { prompt: "Question 2", accuracyRate: 56, skippedCount: 5 },
    { prompt: "Question 3", accuracyRate: 71, skippedCount: 1 },
  ],
  leaderboard: [
    { studentName: "Student A", score: 18 },
    { studentName: "Student B", score: 16 },
    { studentName: "Student C", score: 15 },
  ],
};

export function FacultyAnalyticsPanel({
  initialVersionId,
}: {
  initialVersionId: string;
}) {
  const [versionId, setVersionId] = useState(initialVersionId);

  const dashboardQuery = useQuery({
    queryKey: ["faculty-analytics", versionId],
    queryFn: () =>
      apiRequest<{
        overview: typeof fallbackDashboard.overview;
        questionAccuracy: typeof fallbackDashboard.questionAccuracy;
        leaderboard: typeof fallbackDashboard.leaderboard;
      }>(`/faculty/analytics/${versionId}/dashboard`),
    enabled: Boolean(versionId),
  });

  const dashboard = dashboardQuery.data ?? fallbackDashboard;

  const difficultQuestions = [...dashboard.questionAccuracy]
    .sort((left, right) => left.accuracyRate - right.accuracyRate)
    .slice(0, 5);

  return (
    <div className="grid gap-6">
      <Card>
        <p className="section-title">Version scope</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Published version ID
            </label>
            <Input
              value={versionId}
              onChange={(event) => setVersionId(event.target.value)}
              placeholder="Paste a published version ID"
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            Load a published quiz version to view attempt volume, question accuracy, and leaderboard
            performance without affecting historical data from older versions.
          </div>
        </div>
        {dashboardQuery.isError ? (
          <div className="error-message mt-4">
            Unable to load analytics for this version. Confirm the published version ID and try
            again.
          </div>
        ) : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-5">
        {[
          ["Attempts", dashboard.overview.attemptsCount],
          ["Average score", dashboard.overview.averageScore.toFixed(1)],
          ["Average %", `${dashboard.overview.averagePercentage.toFixed(1)}%`],
          ["Highest", dashboard.overview.highestScore.toFixed(1)],
          ["Lowest", dashboard.overview.lowestScore.toFixed(1)],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
          </Card>
        ))}
      </div>

      <AnalyticsCharts
        questionAccuracy={dashboard.questionAccuracy}
        leaderboard={dashboard.leaderboard}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <p className="section-title">Question-wise accuracy</p>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left">
                  {["Question", "Accuracy", "Skipped"].map((heading) => (
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
                {dashboard.questionAccuracy.map((question) => (
                  <tr key={question.prompt}>
                    <td className="border-b border-slate-100 px-4 py-4 text-sm font-medium text-slate-900">
                      {question.prompt}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                      {question.accuracyRate}%
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                      {question.skippedCount ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <p className="section-title">Leaderboard</p>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left">
                  {["Rank", "Student", "Score"].map((heading) => (
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
                {dashboard.leaderboard.map((student, index) => (
                  <tr key={`${student.studentName}-${index}`}>
                    <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                      {index + 1}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4 text-sm font-medium text-slate-900">
                      {student.studentName}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                      {student.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card>
        <p className="section-title">Most difficult questions</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {difficultQuestions.map((question) => (
            <div key={question.prompt} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">{question.prompt}</p>
              <p className="mt-2 text-sm text-slate-600">
                Accuracy: <span className="font-medium text-slate-900">{question.accuracyRate}%</span>
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Skipped: <span className="font-medium text-slate-900">{question.skippedCount ?? 0}</span>
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
