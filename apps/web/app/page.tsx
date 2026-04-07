import Link from "next/link";
import { Badge, Card, buttonClassName } from "@quiz/ui";
import { QuizCodeEntry } from "../components/quizzes/quiz-code-entry";

const features = [
  "Secure faculty and student access with role-based controls",
  "Draft-first quiz creation with publishing, version history, and analytics integrity",
  "Structured student attempts with timers, result analysis, and academic reporting",
];

const quickNotes = [
  { label: "Faculty tools", value: "Create, draft, publish, analyse" },
  { label: "Student flow", value: "Code entry, attempt, history" },
  { label: "Platform focus", value: "Readable, secure, professional" },
];

export default function HomePage() {
  return (
    <main className="app-container">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white">
              QF
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-slate-900">Quiz Forge</p>
              <p className="text-xs tracking-wide text-slate-500">Academic quiz management</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/login" className={buttonClassName({ variant: "secondary" })}>
              Login
            </Link>
            <Link href="/quiz" className={buttonClassName({})}>
              Enter Quiz Code
            </Link>
          </div>
        </header>

        <section className="grid gap-8 py-14 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-blue-50 px-8 py-12 shadow-sm">
            <Badge>Academic Assessment Platform</Badge>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              A clean academic workspace for building, publishing, and reviewing quizzes.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              Quiz Forge helps faculty create structured assessments, publish secure quiz versions,
              and review student performance through a formal dashboard designed for classrooms,
              departments, and institutional workflows.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className={buttonClassName({})}>
                Login
              </Link>
              <Link href="/quiz" className={buttonClassName({ variant: "secondary" })}>
                Enter Quiz Code
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {quickNotes.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-sm font-medium text-slate-800">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <QuizCodeEntry />
            <Card>
              <p className="section-title">Platform highlights</p>
              <div className="mt-5 grid gap-3">
                {features.map((feature) => (
                  <div
                    key={feature}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700"
                  >
                    {feature}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
