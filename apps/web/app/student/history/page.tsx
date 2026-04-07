"use client";

import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Input } from "@quiz/ui";
import { DashboardShell } from "../../../components/layout/dashboard-shell";
import { apiRequest } from "../../../lib/api";

const fallback = {
  items: [
    { id: "demo-1", percentage: 84, status: "SUBMITTED", quizVersion: { title: "Demo Quiz" } },
    { id: "demo-2", percentage: 67, status: "AUTO_SUBMITTED", quizVersion: { title: "Networks Quiz" } },
  ],
  trend: [
    { date: "2026-03-01", percentage: 72 },
    { date: "2026-03-14", percentage: 81 },
    { date: "2026-03-27", percentage: 84 },
  ],
};

export default function StudentHistoryPage() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const historyQuery = useQuery({
    queryKey: ["student-history", deferredSearch],
    queryFn: () =>
      apiRequest<typeof fallback>(
        `/users/me/history?search=${encodeURIComponent(deferredSearch)}&page=1&pageSize=10`,
      ),
  });

  const history = historyQuery.data ?? fallback;

  return (
    <DashboardShell
      title="History"
      role="STUDENT"
      description="Search past attempts, review performance percentages, and track progress over time."
    >
      <Card className="mb-6">
        <label className="mb-2 block text-sm font-medium text-slate-700">Search attempted quizzes</label>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by quiz title"
          className="max-w-md"
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-[0.7fr_0.3fr]">
        <Card>
          <p className="section-title">Attempt history</p>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left">
                  {["Quiz", "Status", "Score"].map((heading) => (
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
                {history.items.map((item) => (
                  <tr key={item.id}>
                    <td className="border-b border-slate-100 px-4 py-4 font-medium text-slate-900">
                      {item.quizVersion.title}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-600">
                      {item.status}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4">
                      <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                        {item.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <p className="section-title">Performance trend</p>
          <div className="mt-6 grid gap-3">
            {history.trend.map((point) => (
              <div key={point.date} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{point.date}</p>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <p className="text-2xl font-semibold text-slate-900">{point.percentage}%</p>
                  <div className="h-2 flex-1 rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${Math.max(6, point.percentage)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
