import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Settings from '@/models/Settings';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { enabledMenus, adminEnabledMenus, userEnabledMenus, trackerLayout, homeLayout, workspaceLayout, messageHelperLayout, templatesLayout, fontFamily, borderRadius, globalLayout, global3DStyle, allowCommandersDock, systemBanner, firebaseUid } = await req.json();
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await connectToDatabase();
    
    // Only super_admin, admin, or refayethossenmd@gmail.com can change settings
    const promoter = await User.findOne({ firebaseUid });
    if (
      promoter?.role !== 'super_admin' && 
      promoter?.role !== 'admin' && 
      promoter?.email !== 'refayethossenmd@gmail.com'
    ) {
      return NextResponse.json({ error: 'Only admin or super_admin can change settings' }, { status: 403 });
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
    if (fontFamily !== undefined) updateData.fontFamily = fontFamily;
    if (borderRadius !== undefined) updateData.borderRadius = borderRadius;
    if (globalLayout !== undefined) updateData.globalLayout = globalLayout;
    if (global3DStyle !== undefined) updateData.global3DStyle = global3DStyle;
    if (allowCommandersDock !== undefined) updateData.allowCommandersDock = allowCommandersDock;
    if (systemBanner !== undefined) updateData.systemBanner = systemBanner;

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
