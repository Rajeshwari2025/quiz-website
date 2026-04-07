import { DashboardShell } from "../../../components/layout/dashboard-shell";
import { FacultyQuizLibrary } from "../../../components/quizzes/faculty-quiz-library";

export default function FacultyCreatedQuizzesPage() {
  return (
    <DashboardShell
      title="Created Quizzes"
      role="FACULTY"
      description="Review the latest published quiz versions, generated codes, and entry points to analytics."
    >
      <FacultyQuizLibrary mode="published" />
    </DashboardShell>
  );
}
