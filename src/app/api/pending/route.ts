import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import PendingChange from '@/models/PendingChange';
import User from '@/models/User';
import { 
  TemplateModel, NoteModel, ChatSessionModel, StickyNoteModel, DownloadModel, ActivityModel, CredentialModel 
} from '@/models/WorkspaceData';

// GET all pending changes (for admins)
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const changes = await PendingChange.find({ status: 'pending' }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, changes }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST a new pending change (from a user) OR directly update if admin
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firebaseUid, email, action, collectionName, documentId, data } = body;

    if (!firebaseUid || !email || !action || !collectionName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();
    
    // Check user role
    const user = await User.findOne({ firebaseUid });
    const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';
    const bypassPending = isAdmin || collectionName === 'activities' || collectionName === 'chatSessions';

    if (bypassPending) {
      // Direct update to live DB
      let Model;
      switch (collectionName) {
        case 'templates': Model = TemplateModel; break;
        case 'notes': Model = NoteModel; break;
        case 'chatSessions': Model = ChatSessionModel; break;
        case 'stickyNotes': Model = StickyNoteModel; break;
        case 'downloads': Model = DownloadModel; break;
        case 'activities': Model = ActivityModel; break;
        case 'credentials': Model = CredentialModel; break;
      }

      if (Model) {
        if (action === 'create') {
          await Model.create(data);
        } else if (action === 'update' && documentId) {
          await Model.findOneAndUpdate({ id: documentId }, data, { upsert: true });
        } else if (action === 'delete' && documentId) {
          await Model.findOneAndDelete({ id: documentId });
        }
      }
      return NextResponse.json({ success: true, message: 'Directly applied (Admin)' }, { status: 200 });
    } else {
      // Create pending change
      const newChange = await PendingChange.create({
        authorUid: firebaseUid,
        authorEmail: email,
        action,
        collectionName,
        documentId,
        data,
        status: 'pending'
      });
      return NextResponse.json({ success: true, message: 'Pending approval', change: newChange }, { status: 201 });
    }
  } catch (error: any) {
    console.error('Error submitting change:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
