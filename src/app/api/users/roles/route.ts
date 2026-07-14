import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const users = await User.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { promoterUid, targetUserId, newRole, callingAllowed, allowedMenus, showWorkloadMetrics, canViewWorkspaceMonthlyTarget, canViewWorkspaceTeamDelivery } = await req.json();

    if (!promoterUid || !targetUserId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await connectToDatabase();
    
    const promoter = await User.findOne({ firebaseUid: promoterUid });
    if (!promoter || (promoter.role !== 'super_admin' && promoter.role !== 'admin' && promoter.email !== 'refayethossenmd@gmail.com')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updateObj: any = {};
    if (newRole) {
      if (promoter.role !== 'super_admin' && promoter.email !== 'refayethossenmd@gmail.com') {
        return NextResponse.json({ error: 'Only super_admin can change roles' }, { status: 403 });
      }
      updateObj.role = newRole;
    }
    if (callingAllowed !== undefined) {
      updateObj.callingAllowed = callingAllowed;
    }
    if (showWorkloadMetrics !== undefined) {
      if (promoter.email !== 'refayethossenmd@gmail.com') {
        return NextResponse.json({ error: 'Only refayethossenmd@gmail.com can change workload metrics visibility' }, { status: 403 });
      }
      updateObj.showWorkloadMetrics = showWorkloadMetrics;
    }
    if (canViewWorkspaceMonthlyTarget !== undefined) {
      if (promoter.role !== 'super_admin' && promoter.email !== 'refayethossenmd@gmail.com') {
        return NextResponse.json({ error: 'Only super_admin can change workspace tab permissions' }, { status: 403 });
      }
      updateObj.canViewWorkspaceMonthlyTarget = canViewWorkspaceMonthlyTarget;
    }
    if (canViewWorkspaceTeamDelivery !== undefined) {
      if (promoter.role !== 'super_admin' && promoter.email !== 'refayethossenmd@gmail.com') {
        return NextResponse.json({ error: 'Only super_admin can change workspace tab permissions' }, { status: 403 });
      }
      updateObj.canViewWorkspaceTeamDelivery = canViewWorkspaceTeamDelivery;
    }
    if (allowedMenus !== undefined) {
      updateObj.allowedMenus = allowedMenus === null ? undefined : allowedMenus;
      // If allowedMenus is null, we unset it from the document, so mongoose $unset could be needed,
      // but in mongoose, setting to undefined or null will unset if we configure it, or we can use $unset explicitly
    }

    if (allowedMenus === null) {
      await User.findByIdAndUpdate(targetUserId, { $unset: { allowedMenus: 1 }, $set: updateObj });
    } else {
      await User.findByIdAndUpdate(targetUserId, updateObj);
    }
    
    return NextResponse.json({ success: true, message: 'User settings updated' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('id');
    const promoterUid = searchParams.get('promoterUid');

    if (!targetUserId || !promoterUid) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await connectToDatabase();
    
    const promoter = await User.findOne({ firebaseUid: promoterUid });
    const isSuperAdmin = promoter && (promoter.role === 'super_admin' || promoter.email === 'refayethossenmd@gmail.com');
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Only super admin can delete users' }, { status: 403 });
    }

    await User.findByIdAndDelete(targetUserId);
    
    return NextResponse.json({ success: true, message: 'User deleted from database' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
