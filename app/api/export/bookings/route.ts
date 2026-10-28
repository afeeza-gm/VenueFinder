import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';
import { getAdminSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;
  const status = searchParams.get('status') || undefined;

  const bookings = await dbService.getBookings({ startDate, endDate, status });

  // Build CSV content
  const headers = [
    'Reference',
    'Event Date',
    'Time Slot',
    'Applicant Name',
    'Phone',
    'Email',
    'Organisation',
    'Event Type',
    'Guests',
    'Status',
    'Total Amount (INR)',
    'Advance Paid (INR)',
    'Hold Expiry',
    'Created At',
  ];

  const rows = bookings.map((b) => [
    `"${b.reference}"`,
    `"${b.eventDate}"`,
    `"${b.slot?.label || b.slotId}"`,
    `"${b.applicantName.replace(/"/g, '""')}"`,
    `"${b.applicantPhone}"`,
    `"${b.applicantEmail}"`,
    `"${(b.organisation || '').replace(/"/g, '""')}"`,
    `"${b.eventType}"`,
    b.guestCount,
    `"${b.status}"`,
    (b.totalAmountPaise / 100).toFixed(2),
    (b.advanceAmountPaise / 100).toFixed(2),
    `"${b.holdExpiresAt || 'N/A'}"`,
    `"${b.createdAt}"`,
  ]);

  const csvString = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  return new NextResponse(csvString, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="chms-bookings-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
