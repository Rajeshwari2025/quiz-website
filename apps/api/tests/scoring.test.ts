import { describe, expect, it } from "vitest";
import { gradeAttempt } from "../src/modules/attempts/scoring";

describe("gradeAttempt", () => {
  it("awards full marks for exact single-correct matches", () => {
    const result = gradeAttempt(
      [
        {
          id: "q1",
          marks: 2,
          negativeMarks: 0.5,
          options: [
            { id: "a", isCorrect: true },
            { id: "b", isCorrect: false },
          ],
        },
      ],
      [{ questionId: "q1", selectedOptionIds: ["a"] }],
    );

    expect(result.score).toBe(2);
    expect(result.correctCount).toBe(1);
    expect(result.wrongCount).toBe(0);
  });

  it("supports multi-correct exact matches and negative marking", () => {
    const result = gradeAttempt(
      [
        {
          id: "q1",
          marks: 4,
          negativeMarks: 1,
          options: [
            { id: "a", isCorrect: true },
            { id: "b", isCorrect: true },
            { id: "c", isCorrect: false },
          ],
        },
        {
          id: "q2",
          marks: 2,
          negativeMarks: 0.5,
          options: [
            { id: "d", isCorrect: true },
            { id: "e", isCorrect: false },
          ],
        },
      ],
      [
        { questionId: "q1", selectedOptionIds: ["b", "a"] },
        { questionId: "q2", selectedOptionIds: ["e"] },
      ],
    );

    expect(result.score).toBe(3.5);
    expect(result.correctCount).toBe(1);
    expect(result.wrongCount).toBe(1);
  });

  it("treats unanswered questions as zero marks", () => {
    const result = gradeAttempt(
      [
        {
          id: "q1",
          marks: 1,
          negativeMarks: 0.25,
          options: [
            { id: "a", isCorrect: true },
            { id: "b", isCorrect: false },
          ],
        },
      ],
      [],
    );

    expect(result.score).toBe(0);
    expect(result.unansweredCount).toBe(1);
  });
});

