import Link from "next/link";
import { Card, buttonClassName } from "@quiz/ui";
import { DashboardShell } from "../../components/layout/dashboard-shell";

const sections = [
  {
    title: "Create quiz",
    description: "Start a new assessment draft with student fields, configuration, and questions.",
    href: "/faculty/quizzes",
  },
  {
    title: "Drafts",
    description: "Continue editing unpublished versions and keep changes organized before release.",
    href: "/faculty/drafts",
  },
  {
    title: "Created quizzes",
    description: "Review published quiz versions, generated quiz codes, and ready-to-share assessments.",
    href: "/faculty/created-quizzes",
  },
  {
    title: "Analytics",
    description: "Study learner performance, leaderboard trends, and question difficulty.",
    href: "/faculty/analytics",
  },
];

export default function FacultyDashboardPage() {
  return (
    <DashboardShell
      title="Faculty Dashboard"
      role="FACULTY"
      description="Manage assessment drafts, publish controlled quiz versions, and review student outcomes from a structured academic workspace."
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <p className="section-title">Overview</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">
            Draft, publish, and track assessments with controlled version history.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Published quizzes remain immutable so analytics, student attempts, and result records
            stay accurate. When a published quiz needs changes, the platform branches it into a new
            editable draft instead of mutating past data.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/faculty/quizzes" className={buttonClassName({})}>
              Open Quiz Builder
            </Link>
            <Link href="/faculty/analytics" className={buttonClassName({ variant: "secondary" })}>
              Open Analytics
            </Link>
          </div>
        </Card>

        <Card>
          <p className="section-title">Workflow</p>
          <div className="mt-5 grid gap-4">
            {[
              "Create drafts with configurable student fields and assessment rules.",
              "Publish unique quiz versions with generated access codes.",
              "Protect past analytics by editing published quizzes through version forks.",
              "Review results with question accuracy and leaderboard insights.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {sections.map((item) => (
          <Card key={item.title}>
            <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            <Link
              href={item.href}
              className={buttonClassName({ variant: "secondary", className: "mt-5" })}
            >
              Open section
            </Link>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
