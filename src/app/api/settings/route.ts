import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Settings from '@/models/Settings';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { enabledMenus, adminEnabledMenus, userEnabledMenus, trackerLayout, homeLayout, workspaceLayout, messageHelperLayout, templatesLayout, firebaseUid } = await req.json();
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await connectToDatabase();
    
    // Only super_admin can change settings
    const promoter = await User.findOne({ firebaseUid });
    if (promoter?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super_admin can change menu settings' }, { status: 403 });
    }

    const updateData: any = {};
    if (enabledMenus) updateData.enabledMenus = enabledMenus;
    if (adminEnabledMenus) updateData.adminEnabledMenus = adminEnabledMenus;
    if (userEnabledMenus) updateData.userEnabledMenus = userEnabledMenus;
    if (trackerLayout !== undefined) updateData.trackerLayout = trackerLayout;
    if (homeLayout !== undefined) updateData.homeLayout = homeLayout;
    if (workspaceLayout !== undefined) updateData.workspaceLayout = workspaceLayout;
    if (messageHelperLayout !== undefined) updateData.messageHelperLayout = messageHelperLayout;
    if (templatesLayout !== undefined) updateData.templatesLayout = templatesLayout;

    const settings = await Settings.findOneAndUpdate(
      { id: 'global' }, 
      { $set: updateData }, 
      { new: true, upsert: true }
    );
    
    return NextResponse.json({ success: true, settings }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
