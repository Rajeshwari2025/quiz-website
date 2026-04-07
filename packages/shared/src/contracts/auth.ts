import { z } from "zod";
import { userRoles } from "../types/enums";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[0-9]/, "Password must include a number");

export const registerSchema = z
  .object({
    role: z.enum(userRoles),
    email: z.string().email(),
    password: passwordSchema,
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    inviteToken: z.string().trim().min(10).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.role === "FACULTY" && !value.inviteToken) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["inviteToken"],
        message: "Faculty registration requires a valid invite token",
      });
    }
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSessionSchema = z.object({
  refreshToken: z.string().min(10).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

