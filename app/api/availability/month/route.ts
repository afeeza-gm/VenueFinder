import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';

export async function GET(req: NextRequest) {
  const yearParam = req.nextUrl.searchParams.get('year');
  const monthParam = req.nextUrl.searchParams.get('month');
  const hallId = req.nextUrl.searchParams.get('venueId') || req.nextUrl.searchParams.get('hallId') || undefined;

  const now = new Date();
  const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
  const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;

  const data = await dbService.getMonthlyCalendar(year, month, hallId);
  return NextResponse.json(data);
}
