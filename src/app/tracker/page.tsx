import TrackerDashboard from '@/components/tracker/TrackerDashboard';

export default async function TrackerPage() {
  // Fetching both the metadata sheet (F_META) and the Issue sheet
  const [resOrders, resIssues] = await Promise.all([
    fetch('https://docs.google.com/spreadsheets/d/1IRIDbowvg0qM9wqNMxegwqz4jNGl6bj9UThL0NjYScQ/export?format=csv&gid=453782671', { next: { revalidate: 60 } }),
    fetch('https://docs.google.com/spreadsheets/d/1ic9UMVX0FFsAyz0TZ-_lGKj_D9NornoGhq38KTRtM54/export?format=csv&gid=1412843338', { next: { revalidate: 60 } })
  ]);
  
  if (!resOrders.ok || !resIssues.ok) {
    return <div className="p-8 text-white">Failed to fetch data from the spreadsheets. Check if the links are public.</div>;
  }
  
  const csvDataOrders = await resOrders.text();
  const csvDataIssues = await resIssues.text();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white uppercase">Order Tracker</h1>
          <p className="text-gray-400 text-sm font-medium">
            Central dashboard for tracking orders and project issues.
          </p>
        </div>
      </div>
      <TrackerDashboard csvDataOrders={csvDataOrders} csvDataIssues={csvDataIssues} />
    </div>
  );
}
