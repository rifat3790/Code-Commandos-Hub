import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import PendingChange from '@/models/PendingChange';
import User from '@/models/User';
import { 
  TemplateModel, NoteModel, ChatSessionModel, StickyNoteModel, DownloadModel, ActivityModel, CredentialModel 
} from '@/models/WorkspaceData';

export async function POST(req: Request) {
  try {
    const { changeId, firebaseUid, decision } = await req.json();

    if (!changeId || !firebaseUid || !decision) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await connectToDatabase();
    
    // Verify admin
    const admin = await User.findOne({ firebaseUid });
    if (admin?.role !== 'super_admin' && admin?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const change = await PendingChange.findById(changeId);
    if (!change) return NextResponse.json({ error: 'Change not found' }, { status: 404 });

    if (decision === 'reject') {
      change.status = 'rejected';
      await change.save();
      return NextResponse.json({ success: true, message: 'Change rejected' }, { status: 200 });
    }

    if (decision === 'approve') {
      if (change.collectionName === 'workspaceTargets') {
        const WorkspaceTarget = (await import('@/models/WorkspaceTarget')).default;
        const { targetId, memberEmployeeId, requestedAchieved } = change.data;
        const target = await WorkspaceTarget.findById(targetId);
        if (target) {
          const member = target.members.find((m: any) => m.employeeId === memberEmployeeId);
          if (member) {
            member.achieved = Number(requestedAchieved);
            target.markModified('members');
            await target.save();
          }
        }
      } else {
        // Merge into Live DB
        let Model;
        switch (change.collectionName) {
          case 'templates': Model = TemplateModel; break;
          case 'notes': Model = NoteModel; break;
          case 'chatSessions': Model = ChatSessionModel; break;
          case 'stickyNotes': Model = StickyNoteModel; break;
          case 'downloads': Model = DownloadModel; break;
          case 'activities': Model = ActivityModel; break;
          case 'credentials': Model = CredentialModel; break;
        }

        if (Model) {
          if (change.action === 'create') {
            await Model.create(change.data);
          } else if (change.action === 'update' && change.documentId) {
            await Model.findOneAndUpdate({ id: change.documentId }, change.data, { upsert: true });
          } else if (change.action === 'delete' && change.documentId) {
            await Model.findOneAndDelete({ id: change.documentId });
          }
        }
      }

      change.status = 'approved';
      await change.save();
      return NextResponse.json({ success: true, message: 'Change approved and merged' }, { status: 200 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
