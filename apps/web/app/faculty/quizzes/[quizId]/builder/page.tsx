import { DashboardShell } from "../../../../../components/layout/dashboard-shell";
import { QuizBuilder } from "../../../../../components/quizzes/quiz-builder";

export default async function FacultyQuizBuilderPage({
  params,
  searchParams,
}: {
  params: Promise<{ quizId: string }>;
  searchParams: Promise<{ versionId?: string }>;
}) {
  const { quizId } = await params;
  const { versionId } = await searchParams;

  return (
    <DashboardShell
      title="Quiz Builder"
      role="FACULTY"
      description="Configure student fields, assessment settings, and questions before publishing a versioned quiz."
    >
      <QuizBuilder quizId={quizId} initialVersionId={versionId} />
    </DashboardShell>
  );
}
