import TrackerDashboard from '@/components/tracker/TrackerDashboard';

export default async function TrackerPage() {
  const resOrders = await fetch('https://docs.google.com/spreadsheets/d/1IRIDbowvg0qM9wqNMxegwqz4jNGl6bj9UThL0NjYScQ/export?format=csv&gid=453782671', { next: { revalidate: 60 } });
  
  if (!resOrders.ok) {
    return <div className="p-8 text-white">Failed to fetch data from the spreadsheet. Check if the link is public.</div>;
  }
  
  const csvDataOrders = await resOrders.text();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white uppercase">Order Tracker</h1>
          <p className="text-gray-400 text-sm font-medium">
            Central dashboard for tracking orders.
          </p>
        </div>
      </div>
      <TrackerDashboard csvDataOrders={csvDataOrders} />
    </div>
  );
}
