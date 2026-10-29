import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (process.env.RAZORPAY_WEBHOOK_SECRET && process.env.RAZORPAY_WEBHOOK_SECRET !== 'default_webhook_secret') {
      if (!signature || !verifyWebhookSignature(rawBody, signature)) {
        return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    console.log(`[Razorpay Webhook] Received event: ${event}`);

    if (event === 'payment.captured') {
      const paymentEntity = payload.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      const amount = paymentEntity.amount; // paise

      // Find booking by orderId or notes
      const notes = paymentEntity.notes || {};
      const bookingId = notes.bookingId;

      if (bookingId) {
        await dbService.confirmPayment({
          bookingId,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          amountPaise: amount,
          rawEvent: payload,
        });

        // Instant admin & citizen UI revalidation
        revalidatePath('/admin/payments');
        revalidatePath('/admin/bookings');
        revalidatePath('/availability');
        revalidatePath('/status');
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
