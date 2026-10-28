import crypto from 'crypto';
import Razorpay from 'razorpay';

const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_default_key';
const keySecret = process.env.RAZORPAY_KEY_SECRET || 'default_secret_key';
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'default_webhook_secret';

export const razorpayClient = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export async function createRazorpayOrder(params: {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}) {
  try {
    const isMock = keyId === 'rzp_test_default_key' || !keySecret || keySecret === 'default_secret_key';
    if (isMock) {
      // Mock order generation for local offline prototype evaluation
      return {
        id: `order_mock_${Date.now()}`,
        entity: 'order',
        amount: params.amountPaise,
        amount_paid: 0,
        amount_due: params.amountPaise,
        currency: params.currency || 'INR',
        receipt: params.receipt,
        status: 'created',
        created_at: Math.floor(Date.now() / 1000),
      };
    }

    const order = await razorpayClient.orders.create({
      amount: params.amountPaise,
      currency: params.currency || 'INR',
      receipt: params.receipt,
      notes: params.notes,
    });
    return order;
  } catch (err: any) {
    console.error('Error creating Razorpay order:', err);
    throw err;
  }
}

export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const isMock = keyId === 'rzp_test_default_key' || !keySecret || keySecret === 'default_secret_key';
  if (isMock && params.signature.startsWith('mock_sig_')) {
    return true;
  }

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest('hex');

  return generatedSignature === params.signature;
}

export function verifyWebhookSignature(body: string, receivedSignature: string): boolean {
  if (!webhookSecret) return false;
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  return expectedSignature === receivedSignature;
}
