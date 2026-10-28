import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';

export async function GET() {
  try {
    const count = await dbService.autoReleaseExpiredHolds();
    return NextResponse.json({ success: true, releasedCount: count });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
