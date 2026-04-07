export interface ScoringQuestion {
  id: string;
  marks: number;
  negativeMarks: number | null;
  options: Array<{
    id: string;
    isCorrect: boolean;
  }>;
}

export interface ScoringAnswer {
  questionId: string;
  selectedOptionIds: string[];
}

export function gradeAttempt(
  questions: ScoringQuestion[],
  answers: ScoringAnswer[],
) {
  const answersByQuestionId = new Map(
    answers.map((answer) => [
      answer.questionId,
      Array.from(new Set(answer.selectedOptionIds)).sort(),
    ]),
  );

  let score = 0;
  let maxScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  const results = questions.map((question) => {
    maxScore += question.marks;

    const selectedOptionIds = answersByQuestionId.get(question.id) ?? [];
    const correctOptionIds = question.options
      .filter((option) => option.isCorrect)
      .map((option) => option.id)
      .sort();

    const isAnswered = selectedOptionIds.length > 0;
    const isCorrect =
      isAnswered &&
      selectedOptionIds.length === correctOptionIds.length &&
      selectedOptionIds.every((value, index) => value === correctOptionIds[index]);
    const awardedMarks = isCorrect
      ? question.marks
      : isAnswered
        ? -(question.negativeMarks ?? 0)
        : 0;

    if (isCorrect) {
      correctCount += 1;
    } else if (isAnswered) {
      wrongCount += 1;
    } else {
      unansweredCount += 1;
    }

    score += awardedMarks;

    return {
      questionId: question.id,
      selectedOptionIds,
      isCorrect,
      awardedMarks,
    };
  });

  const clampedScore = Math.max(0, Number(score.toFixed(2)));

  return {
    score: clampedScore,
    maxScore,
    percentage: maxScore ? Number(((clampedScore / maxScore) * 100).toFixed(2)) : 0,
    correctCount,
    wrongCount,
    unansweredCount,
    results,
  };
}

