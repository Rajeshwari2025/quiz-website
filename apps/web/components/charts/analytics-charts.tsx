"use client";

import { Card } from "@quiz/ui";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const palette = ["#2563eb", "#60a5fa", "#0f766e", "#14b8a6", "#94a3b8"];

export function AnalyticsCharts({
  questionAccuracy,
  leaderboard,
}: {
  questionAccuracy: Array<{
    prompt: string;
    accuracyRate: number;
    skippedCount?: number;
  }>;
  leaderboard: Array<{
    studentName: string;
    score: number;
  }>;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <p className="section-title">Question accuracy</p>
        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={questionAccuracy}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="prompt" tick={false} axisLine={false} tickLine={false} />
              <YAxis
                stroke="#64748b"
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  borderRadius: 12,
                  border: "1px solid #cbd5e1",
                  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
                }}
              />
              <Bar dataKey="accuracyRate" radius={[8, 8, 0, 0]}>
                {questionAccuracy.map((entry, index) => (
                  <Cell key={`${entry.prompt}-${index}`} fill={palette[index % palette.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <p className="section-title">Leaderboard share</p>
        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={leaderboard}
                dataKey="score"
                nameKey="studentName"
                innerRadius={68}
                outerRadius={102}
                paddingAngle={4}
              >
                {leaderboard.map((entry, index) => (
                  <Cell key={`${entry.studentName}-${index}`} fill={palette[index % palette.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  borderRadius: 12,
                  border: "1px solid #cbd5e1",
                  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
