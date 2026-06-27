import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { 
  TemplateModel, NoteModel, ChatSessionModel, StickyNoteModel, DownloadModel, ActivityModel, CredentialModel 
} from '@/models/WorkspaceData';

import SettingsModel from '@/models/Settings';

export async function GET() {
  try {
    await connectToDatabase();

    const [templates, notes, chatSessions, stickyNotes, downloads, recentActivities, credentials, settingsDoc] = await Promise.all([
      TemplateModel.find({}).lean(),
      NoteModel.find({}).sort({ updatedAt: -1 }).lean(),
      ChatSessionModel.find({}).sort({ updatedAt: -1 }).lean(),
      StickyNoteModel.find({}).sort({ updatedAt: -1 }).lean(),
      DownloadModel.find({}).sort({ _id: -1 }).lean(),
      ActivityModel.find({}).sort({ timestamp: -1 }).limit(50).lean(),
      CredentialModel.find({}).lean(),
      SettingsModel.findOne({ id: 'global' }).lean()
    ]);

    let settings = settingsDoc;
    if (!settings) {
      const defaultMenus = ['Home', 'Workspace', 'Message Helper', 'Templates', 'Schema Builder', 'Audit Suite', 'Credentials', 'Mockup Studio', 'AI Assistant', 'Team Notes', 'Downloads', 'Member Profile', 'Settings'];
      settings = await SettingsModel.create({ id: 'global', enabledMenus: defaultMenus });
    }

    return NextResponse.json({
      success: true,
      data: {
        templates,
        notes,
        chatSessions,
        stickyNotes,
        downloads,
        recentActivities,
        credentials,
        settings
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching workspace data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
