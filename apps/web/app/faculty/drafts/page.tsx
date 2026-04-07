import { DashboardShell } from "../../../components/layout/dashboard-shell";
import { FacultyQuizLibrary } from "../../../components/quizzes/faculty-quiz-library";

export default function FacultyDraftsPage() {
  return (
    <DashboardShell
      title="Drafts"
      role="FACULTY"
      description="Continue editing unpublished quiz versions and keep assessment changes organized before release."
    >
      <FacultyQuizLibrary mode="drafts" />
    </DashboardShell>
  );
}
