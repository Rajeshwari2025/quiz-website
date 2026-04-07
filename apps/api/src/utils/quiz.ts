import type { QuizQuestionInput, StudentFieldInput } from "@quiz/shared";

export function shuffleArray<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export function serializeStudentFields(fields: StudentFieldInput[]) {
  return fields
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((field) => ({
      ...field,
      placeholder: field.placeholder ?? null,
      validation: field.validation ?? null,
    }));
}

export function serializeQuestions(questions: QuizQuestionInput[]) {
  return questions
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((question) => ({
      ...question,
      explanation: question.explanation ?? null,
      negativeMarks: question.negativeMarks ?? null,
      options: question.options
        .slice()
        .sort((left, right) => left.sortOrder - right.sortOrder),
    }));
}

