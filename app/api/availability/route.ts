import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date');
  const hallId = req.nextUrl.searchParams.get('venueId') || req.nextUrl.searchParams.get('hallId') || undefined;

  if (!date) {
    return NextResponse.json({ error: 'Date parameter required (YYYY-MM-DD).' }, { status: 400 });
  }

  const availability = await dbService.getAvailability(date, hallId);
  return NextResponse.json(availability);
}
