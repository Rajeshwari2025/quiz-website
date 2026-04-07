"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, buttonClassName } from "@quiz/ui";
import { useAuth } from "../../providers/auth-provider";

export function SiteShell({
  title,
  eyebrow,
  description,
  children,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isReady, logout, user } = useAuth();

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
              <p className="text-xs tracking-wide text-slate-500">
                Academic quiz management
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {eyebrow ? <Badge>{eyebrow}</Badge> : null}
            {isReady && user ? (
              <>
                <Badge>{user.role === "FACULTY" ? "Faculty" : "Student"}</Badge>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await logout();
                    router.push("/login");
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className={buttonClassName({ variant: "secondary" })}>
                  Login
                </Link>
                <Link
                  href="/register"
                  className={buttonClassName({ className: "hidden sm:inline-flex" })}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="section-title">{eyebrow ?? "Quiz platform"}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {title}
          </h1>
          {description ? <p className="mt-3 max-w-3xl text-sm text-slate-600 sm:text-base">{description}</p> : null}
        </div>
        <div>{children}</div>
      </main>
    </div>
  );
}
