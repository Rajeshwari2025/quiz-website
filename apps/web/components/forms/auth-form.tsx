"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthUser } from "@quiz/shared";
import { loginSchema, passwordSchema } from "@quiz/shared";
import { Button, Card, Input } from "@quiz/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "../../lib/api";
import { useAuth } from "../../providers/auth-provider";

const registerFormSchema = z.object({
  role: z.enum(["FACULTY", "STUDENT"]),
  email: z.string().email(),
  password: passwordSchema,
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  inviteToken: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(10).optional(),
  ),
}).superRefine((value, ctx) => {
  if (value.role === "FACULTY" && !value.inviteToken) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["inviteToken"],
      message: "Faculty registration requires a valid invite token",
    });
  }
});

type AuthMode = "login" | "register";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { setSession } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(mode === "login" ? loginSchema : registerFormSchema),
    defaultValues:
      mode === "login"
        ? {
            email: "",
            password: "",
          }
        : {
            role: "STUDENT" as const,
            email: "",
            password: "",
            firstName: "",
            lastName: "",
            inviteToken: "",
          },
  });

  const role = mode === "register" ? String(form.watch("role" as never) ?? "STUDENT") : undefined;

  async function onSubmit(values: Record<string, unknown>) {
    setErrorMessage(null);
    form.clearErrors();

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const payloadBody =
        mode === "register"
          ? {
              ...values,
              inviteToken:
                typeof values.inviteToken === "string" && values.inviteToken.trim() === ""
                  ? undefined
                  : values.inviteToken,
            }
          : values;

      const payload = await apiRequest<{ accessToken: string; user: AuthUser }>(
        endpoint,
        {
          method: "POST",
          body: JSON.stringify(payloadBody),
        },
      );

      setSession(payload);

      startTransition(() => {
        router.push(payload.user.role === "FACULTY" ? "/faculty" : "/student");
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error &&
        "fieldErrors" in error &&
        error.fieldErrors &&
        typeof error.fieldErrors === "object"
      ) {
        Object.entries(error.fieldErrors as Record<string, string[]>).forEach(([name, messages]) => {
          if (messages?.[0]) {
            form.setError(name as never, {
              type: "server",
              message: messages[0],
            });
          }
        });
      }

      setErrorMessage(
        typeof error === "object" && error && "message" in error
          ? String(error.message)
          : "Authentication failed",
      );
    }
  }

  function fieldError(name: string) {
    const error = form.formState.errors[name as keyof typeof form.formState.errors];

    if (!error || typeof error.message !== "string") {
      return null;
    }

    return <p className="mt-1 text-xs text-rose-600">{error.message}</p>;
  }

  return (
    <Card className="mx-auto max-w-xl">
      <div className="mb-8">
        <p className="section-title">
          {mode === "login" ? "Welcome back" : "Create account"}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
          {mode === "login" ? "Sign in to continue" : "Create an academic platform account"}
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          {mode === "login"
            ? "Access the academic quiz dashboard with your registered account."
            : "Create a student account or register as faculty with a valid invite token."}
        </p>
      </div>

      <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        {mode === "register" ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">First name</label>
                <Input {...form.register("firstName" as never)} />
                {fieldError("firstName")}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Last name</label>
                <Input {...form.register("lastName" as never)} />
                {fieldError("lastName")}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Role</label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                {...form.register("role" as never)}
              >
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty</option>
              </select>
            </div>
          </>
        ) : null}

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
          <Input type="email" {...form.register("email" as never)} />
          {fieldError("email")}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
          <Input type="password" {...form.register("password" as never)} />
          {fieldError("password")}
        </div>

        {mode === "register" && role === "FACULTY" ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Faculty invite token</label>
            <Input {...form.register("inviteToken" as never)} />
            {fieldError("inviteToken")}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="error-message">
            {errorMessage}
          </div>
        ) : null}

        <Button type="submit" className="mt-2 w-full py-3">
          {mode === "login" ? "Login" : "Register"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        {mode === "login" ? "Need an account?" : "Already have an account?"}{" "}
        <Link href={mode === "login" ? "/register" : "/login"} className="font-medium text-blue-600">
          {mode === "login" ? "Register" : "Login"}
        </Link>
      </p>
    </Card>
  );
}
