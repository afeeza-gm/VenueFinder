'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Calendar,
  Clock,
  User,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Timer,
  ArrowRight,
  FileText,
  AlertCircle,
  ShieldCheck,
  Building2,
  MapPin,
} from 'lucide-react';
import { Booking } from '@/types';
import { lookupBookingAction, cancelBookingApplicantAction } from '@/app/actions/booking';

interface StatusTrackerProps {
  initialReference?: string;
  initialPhone?: string;
}

export default function StatusTracker({ initialReference, initialPhone }: StatusTrackerProps) {
  const [reference, setReference] = useState(initialReference || '');
  const [phone, setPhone] = useState(initialPhone || '');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelResult, setCancelResult] = useState<any>(null);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!reference.trim() || !phone.trim()) {
      setErrorMessage('Please enter both your booking reference and registered phone number.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setCancelResult(null);

    const res = await lookupBookingAction(reference, phone);
    setIsLoading(false);

    if (res.success && res.booking) {
      setBooking(res.booking);
    } else {
      setBooking(null);
      setErrorMessage(res.error || 'No matching booking found. Please check your reference code.');
    }
  };

  useEffect(() => {
    if (initialReference && initialPhone) {
      handleLookup();
    }
  }, [initialReference, initialPhone]);

  const handleCancelBooking = async () => {
    if (!booking) return;
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel this booking? This action cannot be reversed.'
    );
    if (!confirmCancel) return;

    setCancelling(true);
    const res = await cancelBookingApplicantAction(booking.id);
    setCancelling(false);

    if (res.success) {
      setCancelResult(res.refundEligibility);
      handleLookup();
    } else {
      alert(`Cancellation failed: ${res.error}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'APPROVED_AWAITING_PAYMENT':
        return 'bg-[#fff0f2] text-[#ff385c] border-[#ffccd3]';
      case 'CONFIRMED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'REJECTED':
      case 'EXPIRED':
      case 'CANCELLED':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'COMPLETED':
        return 'bg-[#f7f7f7] text-[#222222] border-[#dddddd]';
      default:
        return 'bg-[#f7f7f7] text-[#717171] border-[#ebebeb]';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4 sm:px-6">
      {/* Search Header / Lookup Box (Airbnb Style) */}
      <div className="bg-white rounded-3xl border border-[#ebebeb] p-6 sm:p-8 airbnb-card-shadow space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[#222222]">Track Reservation Status</h2>
          <p className="text-xs text-[#717171] mt-0.5">
            Enter your booking reference code and registered mobile number to check approval progress.
          </p>
        </div>

        <form onSubmit={handleLookup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#222222] mb-1.5">
                Booking Reference
              </label>
              <input
                type="text"
                placeholder="e.g. CHMS-20261028-101"
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 rounded-xl border border-[#dddddd] text-xs font-mono uppercase focus:border-[#222222] bg-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#222222] mb-1.5">
                Registered Contact Phone
              </label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#dddddd] text-xs font-medium focus:border-[#222222] bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center space-x-2 bg-[#ff385c] hover:bg-[#e00b41] active:scale-95 text-white text-xs font-semibold px-6 py-2.5 rounded-full transition-all shadow-xs disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Searching...' : 'Find Reservation'}</span>
            </button>
          </div>
        </form>

        {errorMessage && (
          <div className="p-3.5 bg-[#fff0f2] border border-[#ffccd3] text-[#ff385c] text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Booking Details Card & Status Timeline */}
      {booking && (
        <div className="bg-white rounded-3xl border border-[#ebebeb] p-6 sm:p-10 airbnb-card-shadow space-y-8 animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-start gap-4 border-b border-[#ebebeb] pb-6">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#717171]">
                Official Booking Reference
              </span>
              <h3 className="text-2xl font-mono font-bold text-[#222222]">
                {booking.reference}
              </h3>
              {booking.hall && (
                <div className="text-xs font-medium text-[#222222] flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#ff385c]" />
                  <span>{booking.hall.name} &middot; {booking.hall.location}</span>
                </div>
              )}
            </div>

            <div>
              <span
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border inline-block ${getStatusBadge(
                  booking.status
                )}`}
              >
                {booking.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#717171] block">
              Reservation Progress
            </span>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Step 1: Requested */}
              <div className="p-4 rounded-2xl border bg-emerald-50/60 border-emerald-200 space-y-0.5">
                <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>1. Request Submitted</span>
                </div>
                <div className="text-[11px] text-[#717171]">Received by committee</div>
              </div>

              {/* Step 2: Admin Approval */}
              <div
                className={`p-4 rounded-2xl border space-y-0.5 ${
                  booking.status === 'PENDING'
                    ? 'bg-[#f7f7f7] border-[#dddddd] text-[#717171]'
                    : booking.status === 'REJECTED'
                    ? 'bg-[#fff0f2] border-[#ffccd3] text-[#ff385c]'
                    : 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-xs">
                  {booking.status === 'REJECTED' ? (
                    <XCircle className="w-4 h-4 text-[#ff385c]" />
                  ) : booking.status !== 'PENDING' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4 text-[#717171]" />
                  )}
                  <span>2. Committee Review</span>
                </div>
                <div className="text-[11px] text-[#717171]">
                  {booking.status === 'PENDING'
                    ? 'Under verification'
                    : booking.status === 'REJECTED'
                    ? 'Request declined'
                    : 'Approved & Held'}
                </div>
              </div>

              {/* Step 3: Advance Payment */}
              <div
                className={`p-4 rounded-2xl border space-y-0.5 ${
                  booking.status === 'CONFIRMED' || booking.status === 'COMPLETED'
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                    : booking.status === 'APPROVED_AWAITING_PAYMENT'
                    ? 'bg-[#fff0f2] border-[#ffccd3] text-[#ff385c] ring-1 ring-[#ff385c]'
                    : 'bg-[#f7f7f7] border-[#dddddd] text-[#717171]'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-xs">
                  {booking.status === 'CONFIRMED' || booking.status === 'COMPLETED' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  <span>3. Advance Payment</span>
                </div>
                <div className="text-[11px] text-[#717171]">
                  {booking.status === 'APPROVED_AWAITING_PAYMENT'
                    ? 'Hold window open'
                    : booking.status === 'CONFIRMED' || booking.status === 'COMPLETED'
                    ? `₹${((booking.advanceAmountPaise || 0) / 100).toLocaleString('en-IN')} paid`
                    : 'Awaiting approval'}
                </div>
              </div>

              {/* Step 4: Confirmed */}
              <div
                className={`p-4 rounded-2xl border space-y-0.5 ${
                  booking.status === 'COMPLETED' || booking.status === 'CONFIRMED'
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                    : 'bg-[#f7f7f7] border-[#dddddd] text-[#717171]'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-xs">
                  {booking.status === 'COMPLETED' || booking.status === 'CONFIRMED' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Calendar className="w-4 h-4" />
                  )}
                  <span>4. Locked Booking</span>
                </div>
                <div className="text-[11px] text-[#717171]">
                  {booking.status === 'CONFIRMED'
                    ? 'Confirmed'
                    : booking.status === 'COMPLETED'
                    ? 'Event completed'
                    : 'Pending payment'}
                </div>
              </div>
            </div>
          </div>

          {/* Action Callout if Approved - Awaiting Payment */}
          {booking.status === 'APPROVED_AWAITING_PAYMENT' && (
            <div className="bg-[#fff0f2] border border-[#ffccd3] rounded-3xl p-6 sm:p-7 space-y-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-full bg-[#ff385c] text-white flex items-center justify-center shrink-0">
                  <Timer className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-[#222222]">
                    Your Booking Request is Approved!
                  </h4>
                  <p className="text-xs text-[#3f3f3f] leading-relaxed">
                    Your selected slot has been locked for you. Please complete the advance payment of{' '}
                    <strong>₹{((booking.advanceAmountPaise || 0) / 100).toLocaleString('en-IN')}</strong>{' '}
                    to finalize your reservation before the 48-hour hold window expires.
                  </p>
                  {booking.holdExpiresAt && (
                    <div className="text-xs font-semibold text-[#ff385c] pt-1">
                      Hold Closes At:{' '}
                      {new Date(booking.holdExpiresAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/pay/${booking.reference}`}
                  className="inline-flex items-center space-x-2 bg-[#ff385c] hover:bg-[#e00b41] text-white font-semibold text-xs px-6 py-3 rounded-full transition-all shadow-xs"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    Pay Advance Online (₹{((booking.advanceAmountPaise || 0) / 100).toLocaleString('en-IN')})
                  </span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          )}

          {/* Booking Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-[#f7f7f7] rounded-2xl p-6 border border-[#ebebeb] text-xs">
            <div>
              <span className="text-[#717171] block">Venue</span>
              <span className="font-bold text-[#222222] text-sm">
                {booking.hall?.name || booking.hallId}
              </span>
              {booking.hall?.location && (
                <span className="text-[11px] text-[#ff385c] block">{booking.hall.location}</span>
              )}
            </div>

            <div>
              <span className="text-[#717171] block">Event Date</span>
              <span className="font-bold text-[#222222] text-sm">{booking.eventDate}</span>
            </div>

            <div>
              <span className="text-[#717171] block">Time Slot</span>
              <span className="font-bold text-[#222222] text-sm">
                {booking.slot?.label || booking.slotId}
              </span>
            </div>

            <div>
              <span className="text-[#717171] block">Event Purpose</span>
              <span className="font-bold text-[#222222] text-sm">{booking.eventType}</span>
            </div>

            <div>
              <span className="text-[#717171] block">Applicant Name</span>
              <span className="font-bold text-[#222222] text-sm">{booking.applicantName}</span>
            </div>

            <div>
              <span className="text-[#717171] block">Contact Phone</span>
              <span className="font-bold text-[#222222] text-sm">{booking.applicantPhone}</span>
            </div>

            <div>
              <span className="text-[#717171] block">Expected Guests</span>
              <span className="font-bold text-[#222222] text-sm">{booking.guestCount} Persons</span>
            </div>

            <div>
              <span className="text-[#717171] block">Total Tariff</span>
              <span className="font-bold text-[#222222] text-sm">
                &#8377;{(booking.totalAmountPaise / 100).toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <span className="text-[#717171] block">Advance Required</span>
              <span className="font-bold text-[#ff385c] text-sm">
                &#8377;{(booking.advanceAmountPaise / 100).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Cancellation Option */}
          {!['CANCELLED', 'REJECTED', 'EXPIRED', 'COMPLETED'].includes(booking.status) && (
            <div className="border-t border-[#ebebeb] pt-6 flex justify-between items-center text-xs">
              <span className="text-[#717171]">
                Need to cancel this reservation? Municipal refund rules apply.
              </span>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelBooking}
                className="text-xs text-red-600 hover:text-red-700 font-semibold px-4 py-2 rounded-full border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            </div>
          )}

          {cancelResult && (
            <div className="bg-[#fff0f2] border border-[#ffccd3] p-4 rounded-2xl text-xs text-[#222222]">
              <div className="font-bold text-[#ff385c]">Booking Cancelled</div>
              <p className="mt-1">{cancelResult.policyNote}</p>
              {cancelResult.eligibleRefundPaise > 0 && (
                <p className="font-semibold mt-1">
                  Refund due: ₹{(cancelResult.eligibleRefundPaise / 100).toLocaleString('en-IN')}.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
