import IssuesDashboard from '@/components/tracker/IssuesDashboard';

export default async function IssuesPage() {
  const resIssues = await fetch('https://docs.google.com/spreadsheets/d/1ic9UMVX0FFsAyz0TZ-_lGKj_D9NornoGhq38KTRtM54/export?format=csv&gid=1412843338', { next: { revalidate: 60 } });

  if (!resIssues.ok) {
    return <div className="p-8 text-white">Failed to fetch issues data from spreadsheet. Check if the link is public.</div>;
  }

  const csvDataIssues = await resIssues.text();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white uppercase">Project Issues</h1>
          <p className="text-gray-400 text-sm font-medium">
            Centralized tracking and management for project issues.
          </p>
        </div>
      </div>
      <IssuesDashboard csvData={csvDataIssues} activeLayout="default" />
    </div>
  );
}
