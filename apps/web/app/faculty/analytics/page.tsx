import { FacultyAnalyticsPanel } from "../../../components/charts/faculty-analytics-panel";
import { DashboardShell } from "../../../components/layout/dashboard-shell";
export default async function FacultyAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ versionId?: string }>;
}) {
  const { versionId } = await searchParams;

  return (
    <DashboardShell
      title="Analytics"
      role="FACULTY"
      description="Review version-level performance, leaderboard data, and question difficulty from a consistent reporting dashboard."
    >
      <FacultyAnalyticsPanel initialVersionId={versionId ?? ""} />
    </DashboardShell>
  );
}
