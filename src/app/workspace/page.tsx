import WorkspaceDashboard from '@/components/workspace/WorkspaceDashboard';

export default async function WorkspacePage() {
  let csvDataOrders = '';

  try {
    const resOrders = await fetch('https://docs.google.com/spreadsheets/d/1IRIDbowvg0qM9wqNMxegwqz4jNGl6bj9UThL0NjYScQ/export?format=csv&gid=453782671', { next: { revalidate: 60 } });
    if (resOrders.ok) {
      csvDataOrders = await resOrders.text();
    }
  } catch (err) {
    console.error("Failed to fetch order data for workspace:", err);
  }

  return <WorkspaceDashboard csvDataOrders={csvDataOrders} />;
}
