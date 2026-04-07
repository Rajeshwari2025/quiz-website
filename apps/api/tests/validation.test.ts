import { describe, expect, it } from "vitest";
import { registerSchema, quizQuestionSchema } from "@quiz/shared";

describe("validation contracts", () => {
  it("requires invite tokens for faculty registration", () => {
    const parsed = registerSchema.safeParse({
      role: "FACULTY",
      email: "faculty@example.com",
      password: "FacultyPass123",
      firstName: "Demo",
      lastName: "Faculty",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects single-correct questions with multiple correct options", () => {
    const parsed = quizQuestionSchema.safeParse({
      key: "q1",
      prompt: "Which one is correct?",
      questionType: "SINGLE",
      marks: 1,
      negativeMarks: 0,
      sortOrder: 0,
      options: [
        { key: "a", text: "A", isCorrect: true, sortOrder: 0 },
        { key: "b", text: "B", isCorrect: true, sortOrder: 1 },
      ],
    });

    expect(parsed.success).toBe(false);
  });
});
