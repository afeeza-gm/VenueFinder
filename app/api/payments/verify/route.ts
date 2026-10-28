import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';
import { verifyPaymentSignature } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: 'Missing required payment verification fields.' }, { status: 400 });
    }

    const isValid = verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid payment signature. Verification failed.' }, { status: 400 });
    }

    const booking = (await dbService.getBookings()).find((b) => b.id === bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    const res = await dbService.confirmPayment({
      bookingId,
      razorpayOrderId,
      razorpayPaymentId,
      amountPaise: booking.advanceAmountPaise,
      rawEvent: { method: 'CHECKOUT_CALLBACK', orderId: razorpayOrderId, paymentId: razorpayPaymentId },
    });

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, booking: res.booking });
  } catch (err: any) {
    console.error('Error verifying payment:', err);
    return NextResponse.json({ error: err.message || 'Verification error' }, { status: 500 });
  }
}
