import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';
import { createRazorpayOrder } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const { reference } = await req.json();
    if (!reference) {
      return NextResponse.json({ error: 'Booking reference is required.' }, { status: 400 });
    }

    const booking = await dbService.getBookingByReference(reference);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    if (booking.status !== 'APPROVED_AWAITING_PAYMENT') {
      return NextResponse.json(
        { error: `Booking cannot be paid for. Current status: ${booking.status}` },
        { status: 400 }
      );
    }

    if (booking.holdExpiresAt && new Date(booking.holdExpiresAt).getTime() < Date.now()) {
      await dbService.autoReleaseExpiredHolds();
      return NextResponse.json(
        { error: 'Payment hold window has expired. Please submit a new request.' },
        { status: 400 }
      );
    }

    // Amount due is the advanceAmountPaise
    const amountPaise = booking.advanceAmountPaise;

    const order = await createRazorpayOrder({
      amountPaise,
      currency: 'INR',
      receipt: booking.reference,
      notes: {
        bookingId: booking.id,
        reference: booking.reference,
        applicantName: booking.applicantName,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amountPaise,
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_default_key',
      booking,
    });
  } catch (err: any) {
    console.error('Error in create-order route:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
