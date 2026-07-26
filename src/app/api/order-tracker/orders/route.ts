import { NextResponse } from 'next/server';
import Papa from 'papaparse';

export const revalidate = 10; // 10 seconds revalidation

export async function GET() {
  try {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/1IRIDbowvg0qM9wqNMxegwqz4jNGl6bj9UThL0NjYScQ/export?format=csv&gid=453782671';
    const res = await fetch(csvUrl, { next: { revalidate: 10 } });
    
    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch Order Tracker sheet' }, { status: 500 });
    }

    const csvText = await res.text();

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    });

    const orders = parsed.data
      .filter((row: any) => {
        const id = row['Order ID'] || row['OrderID'] || row['Order #'] || row['ID'];
        return id && String(id).trim() !== '';
      })
      .map((row: any, index: number) => {
        // Precise Status detection from CSV columns (Status / status / space column ' ')
        const rawStatusVal = row['Status'] ?? row['status'] ?? row[' '] ?? row[''] ?? '';
        let rawStatusStr = String(rawStatusVal).trim();

        let status = 'WIP';
        if (rawStatusStr.toLowerCase().includes('deliver') || rawStatusStr.toLowerCase().includes('done') || rawStatusStr.toLowerCase().includes('complete')) {
          status = 'Delivered';
        } else if (rawStatusStr.toLowerCase().includes('cancel')) {
          status = 'Cancelled';
        } else if (rawStatusStr.toLowerCase().includes('nra')) {
          status = 'NRA';
        } else if (rawStatusStr.toLowerCase().includes('wip') || rawStatusStr.toLowerCase().includes('progress')) {
          status = 'WIP';
        } else {
          // Fallback check on Deadline string if rawStatusStr is blank or ambiguous
          const deadlineStr = String(row['Deadline'] || '').trim().toLowerCase();
          if (deadlineStr.includes('done') || deadlineStr.includes('delivered')) {
            status = 'Delivered';
          } else {
            status = 'WIP';
          }
        }

        const orderId = String(row['Order ID'] || row['OrderID'] || row['Order #'] || row['ID'] || `ORD-${index}`).trim();
        const serviceLine = String(row['Service Line'] || row['Service'] || row['Category'] || 'Shopify').trim();
        
        // Exact case match for "Client name" in Google Sheet CSV
        const clientName = String(
          row['Client name'] || 
          row['Client Name'] || 
          row['Client'] || 
          row['Buyer'] || 
          row['Customer'] || 
          row['Username'] || 
          'N/A'
        ).trim();

        const value = String(row['Value'] || row['Amount'] || row['Price'] || '$0').trim();
        const profileName = String(row['Profile Name'] || row['Profile'] || row['Account'] || 'Default Profile').trim();
        const storeUrl = String(row['Store Link'] || row['Store URL'] || row['Link'] || row['Website'] || row['URL'] || '').trim();
        const password = String(row['Password'] || row['Pass'] || '').trim();
        const deliveryDate = String(row['Delivery Date'] || row['Deadline'] || '').trim();

        const rawAssignTeam = String(row['Assign Team'] || row['Assignee'] || row['Name'] || '').trim();
        let team = String(row['Team'] || '').trim();
        let person = String(row['Person'] || row['Developer'] || row['Name'] || '').trim();

        if (rawAssignTeam) {
          const parts = rawAssignTeam.split('/').map((s: string) => s.trim()).filter(Boolean);
          parts.forEach((part: string) => {
            if (part.length <= 2 && !team) {
              team = part.toUpperCase();
            } else if (part.length > 2 && !person) {
              person = part;
            }
          });
          if (!team && parts[0]) team = parts[0];
          if (!person && parts[1]) person = parts[1];
        }

        // Formatted Project Name per user requirement: clientName || profileName || orderId
        const formattedProjectName = `${clientName !== 'N/A' ? clientName : serviceLine} || ${profileName} || #${orderId}`;

        return {
          id: `${orderId}_${index}`,
          orderId,
          projectName: formattedProjectName,
          rawServiceLine: serviceLine,
          clientName,
          value,
          profileName,
          storeUrl,
          password,
          status,
          assignTeam: rawAssignTeam,
          serviceLine,
          team: team || 'CC',
          person: person || rawAssignTeam,
          deliveryDate,
          raw: row
        };
      });

    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
