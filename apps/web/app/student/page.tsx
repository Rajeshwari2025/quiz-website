import Link from "next/link";
import { Card, buttonClassName } from "@quiz/ui";
import { DashboardShell } from "../../components/layout/dashboard-shell";
import { QuizCodeEntry } from "../../components/quizzes/quiz-code-entry";

export default function StudentDashboardPage() {
  return (
    <DashboardShell
      title="Student Dashboard"
      role="STUDENT"
      description="Enter published quiz codes, complete timed assessments, and review your past performance from a simple student workspace."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <p className="section-title">Quiz access</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">
            Join a published quiz with your assigned code.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            The platform verifies deadlines, attempt limits, and timing rules on the server to keep
            the submission flow secure and consistent.
          </p>
          <div className="mt-6">
            <QuizCodeEntry
              title="Enter published code"
              description="Use the code shared by your faculty member to load the quiz instructions and required details form."
            />
          </div>
        </Card>

        <Card>
          <p className="section-title">Student experience</p>
          <div className="mt-6 grid gap-4">
            {[
              "Autosave preserves your selected answers while moving between questions.",
              "Server-authoritative timing prevents local clock manipulation.",
              "History keeps results separated by published quiz version for accurate records.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/quiz" className={buttonClassName({})}>
              Enter Quiz Code
            </Link>
            <Link href="/student/history" className={buttonClassName({ variant: "secondary" })}>
              Open History
            </Link>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
