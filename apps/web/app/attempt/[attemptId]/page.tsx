import { SiteShell } from "../../../components/layout/site-shell";
import { StudentAttempt } from "../../../components/quizzes/student-attempt";

export default async function AttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  return (
    <SiteShell
      title="Quiz Attempt"
      eyebrow="Timed mode"
      description="Complete the assessment within the allotted time. Answers are saved while you navigate."
    >
      <StudentAttempt attemptId={attemptId} />
    </SiteShell>
  );
}
