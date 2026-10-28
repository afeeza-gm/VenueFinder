'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Printer,
  Calendar,
  Clock,
  User,
  ArrowRight,
  MapPin,
  Lock,
} from 'lucide-react';
import { Booking } from '@/types';

interface PaymentViewProps {
  booking: Booking;
  venueName?: string;
  venueLocation?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentView({
  booking,
  venueName = 'Community Hall',
  venueLocation,
}: PaymentViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  const amountRupees = (booking.advanceAmountPaise / 100).toLocaleString('en-IN');

  const initiatePayment = async (simulate = false) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Create Order server-side
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: booking.reference }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to initialize payment order');
      }

      // 2. If simulation mode or fallback
      if (simulate || !window.Razorpay) {
        const mockPaymentId = `pay_mock_${Date.now()}`;
        const mockSignature = `mock_sig_${Date.now()}`;

        const verifyRes = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: booking.id,
            razorpayOrderId: orderData.orderId,
            razorpayPaymentId: mockPaymentId,
            razorpaySignature: mockSignature,
          }),
        });

        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) {
          throw new Error(verifyData.error || 'Payment verification failed');
        }

        setPaymentSuccess(true);
        setPaymentDetails({
          paymentId: mockPaymentId,
          orderId: orderData.orderId,
          method: 'TEST_SIMULATOR',
          amount: amountRupees,
        });
        setLoading(false);
        return;
      }

      // 3. Open Real Razorpay Checkout modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amountPaise,
        currency: orderData.currency,
        name: venueName,
        description: `Advance Reservation Fee - ${booking.reference}`,
        order_id: orderData.orderId,
        prefill: {
          name: booking.applicantName,
          email: booking.applicantEmail,
          contact: booking.applicantPhone,
        },
        theme: {
          color: '#ff385c',
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookingId: booking.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              setPaymentSuccess(true);
              setPaymentDetails({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                method: 'RAZORPAY_GATEWAY',
                amount: amountRupees,
              });
            } else {
              setError(verifyData.error || 'Payment verification signature failed.');
            }
          } catch (err: any) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setError(`Payment failed: ${resp.error.description || 'Transaction unsuccessful'}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || 'Payment initiation failed.');
      setLoading(false);
    }
  };

  // Payment Confirmation & Receipt Card
  if (paymentSuccess) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-[#ebebeb] p-8 sm:p-12 airbnb-sticky-shadow space-y-8 my-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#222222]">
            Payment Confirmed & Verified!
          </h2>
          <p className="text-xs sm:text-sm text-[#717171]">
            Your hall booking is locked. An official digital receipt has been generated.
          </p>
        </div>

        {/* Printable Digital Receipt */}
        <div className="bg-[#f7f7f7] rounded-2xl p-6 border border-[#ebebeb] space-y-4 print:border-none print:p-0">
          <div className="flex justify-between items-center border-b border-[#ebebeb] pb-4">
            <div>
              <div className="font-bold text-[#222222] text-sm">Official Advance Receipt</div>
              <div className="text-xs text-[#717171]">
                {venueName} {venueLocation && `(${venueLocation})`}
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#222222] bg-white hover:bg-[#f7f7f7] border border-[#dddddd] px-3 py-1.5 rounded-full print:hidden transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[#717171] block">Booking Reference:</span>
              <span className="font-mono font-bold text-[#ff385c]">{booking.reference}</span>
            </div>
            <div>
              <span className="text-[#717171] block">Payment ID:</span>
              <span className="font-mono text-[#222222]">{paymentDetails?.paymentId}</span>
            </div>
            <div>
              <span className="text-[#717171] block">Event Date:</span>
              <span className="font-semibold text-[#222222]">{booking.eventDate}</span>
            </div>
            <div>
              <span className="text-[#717171] block">Time Slot:</span>
              <span className="font-semibold text-[#222222]">{booking.slot?.label || booking.slotId}</span>
            </div>
            <div>
              <span className="text-[#717171] block">Applicant:</span>
              <span className="font-semibold text-[#222222]">{booking.applicantName}</span>
            </div>
            <div>
              <span className="text-[#717171] block">Advance Paid:</span>
              <span className="text-sm font-bold text-emerald-700">&#8377;{amountRupees}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-2 print:hidden">
          <button
            onClick={() => router.push(`/status?reference=${booking.reference}&phone=${booking.applicantPhone}`)}
            className="inline-flex items-center space-x-2 bg-[#222222] hover:bg-black text-white font-semibold text-xs px-6 py-3 rounded-full transition-colors"
          >
            <span>View Reservation Tracker</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => router.push('/')}
            className="bg-white hover:bg-[#f7f7f7] border border-[#dddddd] text-[#222222] font-semibold text-xs px-6 py-3 rounded-full transition-colors"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded-3xl border border-[#ebebeb] p-6 sm:p-10 airbnb-card-shadow space-y-8 my-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-[#ff385c]">
          Secure Payment
        </span>
        <h2 className="text-2xl font-bold text-[#222222] mt-1">
          Pay Advance Reservation Fee
        </h2>
        <p className="text-xs text-[#717171] mt-0.5">
          Complete the advance to seal your booking. Protected by 256-bit encryption.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-[#fff0f2] border border-[#ffccd3] text-[#ff385c] text-xs rounded-2xl flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bill Breakdown Card */}
      <div className="bg-[#f7f7f7] rounded-2xl p-6 border border-[#ebebeb] space-y-3.5 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-[#717171]">Booking Reference</span>
          <span className="font-mono font-bold text-[#222222]">{booking.reference}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[#717171]">Event Date & Slot</span>
          <span className="font-medium text-[#222222]">
            {booking.eventDate} &middot; {booking.slot?.label || booking.slotId}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[#717171]">Applicant</span>
          <span className="font-medium text-[#222222]">{booking.applicantName}</span>
        </div>

        <div className="border-t border-[#ebebeb] pt-3 flex justify-between items-center">
          <span className="text-[#717171]">Full Slot Tariff</span>
          <span className="font-semibold text-[#222222]">
            &#8377;{(booking.totalAmountPaise / 100).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex justify-between items-center text-sm font-bold border-t border-[#ebebeb] pt-3">
          <span className="text-[#222222]">Advance Due Now</span>
          <span className="text-xl font-bold text-[#ff385c]">&#8377;{amountRupees}</span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Real Razorpay Checkout */}
        <button
          type="button"
          disabled={loading}
          onClick={() => initiatePayment(false)}
          className="w-full flex items-center justify-center space-x-2 bg-[#ff385c] hover:bg-[#e00b41] active:scale-95 text-white font-semibold text-sm py-3.5 px-6 rounded-full transition-all shadow-xs disabled:opacity-50"
        >
          <CreditCard className="w-4 h-4" />
          <span>{loading ? 'Opening Gateway...' : `Pay ₹${amountRupees} via Razorpay`}</span>
        </button>

        {/* Academic / Test Simulator Option */}
        <button
          type="button"
          disabled={loading}
          onClick={() => initiatePayment(true)}
          className="w-full text-center text-xs text-[#717171] hover:text-[#222222] border border-[#dddddd] hover:bg-[#f7f7f7] py-2.5 px-4 rounded-full transition-colors"
        >
          Simulate Test Payment (Demo Mode)
        </button>
      </div>

      <div className="flex items-center space-x-2 text-[11px] text-[#717171] justify-center">
        <Lock className="w-3.5 h-3.5 text-emerald-600" />
        <span>End-to-end encrypted. Razorpay HMAC-SHA256 signature verification enabled.</span>
      </div>
    </div>
  );
}
