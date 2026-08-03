import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import TimelineItem from '@/models/TimelineItem';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const query: any = {};
    if (status && ['running', 'delivered'].includes(status)) {
      query.status = status;
    }

    const items = await TimelineItem.find(query).sort({ targetEndDate: 1 });

    return NextResponse.json({ success: true, items }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { clientName, memberName, projectTitle, orderId, targetEndDate, notes, createdBy } = await req.json();

    if (!clientName || !memberName || !projectTitle || !targetEndDate) {
      return NextResponse.json({ error: 'Client Name, Member Name, Project Title, and Target End Date are required.' }, { status: 400 });
    }

    await connectToDatabase();

    const newItem = await TimelineItem.create({
      clientName: clientName.trim(),
      memberName: memberName.trim(),
      projectTitle: projectTitle.trim(),
      orderId: (orderId || '').trim(),
      targetEndDate: new Date(targetEndDate),
      status: 'running',
      notes: (notes || '').trim(),
      createdBy: (createdBy || '').trim()
    });

    return NextResponse.json({ success: true, item: newItem }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, status, clientName, memberName, projectTitle, orderId, targetEndDate, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Timeline Item ID is required.' }, { status: 400 });
    }

    await connectToDatabase();

    const item = await TimelineItem.findById(id);
    if (!item) {
      return NextResponse.json({ error: 'Timeline item not found.' }, { status: 404 });
    }

    if (status) {
      if (!['running', 'delivered'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status value.' }, { status: 400 });
      }
      item.status = status;
      if (status === 'delivered') {
        item.deliveredAt = new Date();
      } else if (status === 'running') {
        item.deliveredAt = undefined;
      }
    }

    if (clientName !== undefined) item.clientName = clientName.trim();
    if (memberName !== undefined) item.memberName = memberName.trim();
    if (projectTitle !== undefined) item.projectTitle = projectTitle.trim();
    if (orderId !== undefined) item.orderId = orderId.trim();
    if (targetEndDate !== undefined) item.targetEndDate = new Date(targetEndDate);
    if (notes !== undefined) item.notes = notes.trim();

    item.updatedAt = new Date();
    await item.save();

    return NextResponse.json({ success: true, item }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Timeline Item ID is required.' }, { status: 400 });
    }

    await connectToDatabase();
    await TimelineItem.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Timeline item deleted successfully.' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
