"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge, Button, buttonClassName } from "@quiz/ui";
import { useAuth } from "../../providers/auth-provider";

type Role = "FACULTY" | "STUDENT";

const navigationByRole: Record<
  Role,
  Array<{ href: string; label: string; match?: (pathname: string) => boolean }>
> = {
  FACULTY: [
    { href: "/faculty/quizzes", label: "Create Quiz", match: (pathname) => pathname.startsWith("/faculty/quizzes") },
    { href: "/faculty/drafts", label: "Drafts" },
    { href: "/faculty/created-quizzes", label: "Created Quizzes" },
    { href: "/faculty/analytics", label: "Analytics", match: (pathname) => pathname.startsWith("/faculty/analytics") },
  ],
  STUDENT: [
    { href: "/student", label: "Attempt Quiz", match: (pathname) => pathname === "/student" || pathname.startsWith("/quiz") || pathname.startsWith("/attempt") },
    { href: "/student/history", label: "History", match: (pathname) => pathname.startsWith("/student/history") },
  ],
};

export function DashboardShell({
  title,
  description,
  role,
  children,
  actions,
}: {
  title: string;
  description?: string;
  role: Role;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isReady, logout, user } = useAuth();
  const navigation = navigationByRole[role];

  return (
    <div className="app-container">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white">
              QF
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-slate-900">Quiz Forge</p>
              <p className="text-xs tracking-wide text-slate-500">Academic quiz management</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Badge>{user?.role ?? role}</Badge>
            {isReady && user ? (
              <Button
                variant="secondary"
                onClick={async () => {
                  await logout();
                  router.push("/login");
                }}
              >
                Logout
              </Button>
            ) : (
              <Link href="/login" className={buttonClassName({ variant: "secondary" })}>
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {role === "FACULTY" ? "Faculty navigation" : "Student navigation"}
          </p>
          <nav className="grid gap-1">
            {navigation.map((item) => {
              const isActive = item.match ? item.match(pathname) : pathname === item.href;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="section-title">{role === "FACULTY" ? "Faculty dashboard" : "Student dashboard"}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
              {description ? <p className="mt-3 max-w-3xl text-sm text-slate-600">{description}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
