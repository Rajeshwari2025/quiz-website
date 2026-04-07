import { SiteShell } from "../../../components/layout/site-shell";
import { JoinQuiz } from "../../../components/quizzes/join-quiz";

export default async function JoinQuizPage({
  params,
}: {
  params: Promise<{ quizCode: string }>;
}) {
  const { quizCode } = await params;

  return (
    <SiteShell
      title="Join Quiz"
      eyebrow="Code entry"
      description="Review the quiz details, complete the required student information, and begin the secure attempt flow."
    >
      <JoinQuiz quizCode={quizCode} />
    </SiteShell>
  );
}
