import { SiteShell } from "../../components/layout/site-shell";
import { QuizCodeEntry } from "../../components/quizzes/quiz-code-entry";

export default function QuizCodePage() {
  return (
    <SiteShell
      title="Enter Quiz Code"
      eyebrow="Student access"
      description="Use the published quiz code shared by your faculty member to continue to the attempt details page."
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <QuizCodeEntry />
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="section-title">Before you begin</p>
          <div className="mt-4 grid gap-4 text-sm text-slate-600">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
              Keep your quiz code ready before starting the join flow.
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
              Required student details may vary by quiz and are shown after code validation.
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
              Timers and submission windows are validated on the server for a secure attempt flow.
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
