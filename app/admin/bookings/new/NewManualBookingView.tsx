'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FilePlus2,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Building,
  Users,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { TimeSlot, Hall, Facility } from '@/types';
import { createManualBookingAction } from '@/app/actions/admin';

interface NewManualBookingViewProps {
  venues: Array<Hall & { facilities: Facility[]; timeSlots: TimeSlot[] }>;
}

export default function NewManualBookingView({ venues }: NewManualBookingViewProps) {
  const router = useRouter();

  const [selectedHallId, setSelectedHallId] = useState(venues[0]?.id || '');
  const currentVenue = venues.find((v) => v.id === selectedHallId) || venues[0];

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotId, setSlotId] = useState(currentVenue?.timeSlots[0]?.id || '');
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [eventType, setEventType] = useState('Community Gathering');
  const [guestCount, setGuestCount] = useState(150);
  const [notes, setNotes] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'OFFLINE_UPI'>('CASH');

  const selectedSlot = currentVenue?.timeSlots.find((s) => s.id === slotId);
  const defaultAdvance = selectedSlot ? Math.round(selectedSlot.basePricePaise * 0.25) : 0;
  const [amountCollectedPaise, setAmountCollectedPaise] = useState(defaultAdvance);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVenueChange = (newVenueId: string) => {
    setSelectedHallId(newVenueId);
    const v = venues.find((x) => x.id === newVenueId);
    if (v && v.timeSlots.length > 0) {
      setSlotId(v.timeSlots[0].id);
      setAmountCollectedPaise(Math.round(v.timeSlots[0].basePricePaise * 0.25));
    }
  };

  const handleSlotChange = (newSlotId: string) => {
    setSlotId(newSlotId);
    const slot = currentVenue?.timeSlots.find((s) => s.id === newSlotId);
    if (slot) {
      setAmountCollectedPaise(Math.round(slot.basePricePaise * 0.25));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !applicantPhone.trim() || !applicantEmail.trim()) {
      setError('Please fill in applicant full name, phone and email.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await createManualBookingAction({
      hallId: selectedHallId,
      slotId,
      eventDate: date,
      applicantName,
      applicantPhone,
      applicantEmail,
      organisation,
      eventType,
      guestCount,
      notes,
      paymentMethod,
      amountCollectedPaise,
    });

    setLoading(false);

    if (res.success && res.booking) {
      alert(`Manual booking created successfully! Reference: ${res.booking.reference}`);
      router.push('/admin/bookings');
      router.refresh();
    } else {
      setError(res.error || 'Failed to create manual booking.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Record Offline / Walk-in Booking
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Direct reservation for phone or counter inquiries with recorded cash/offline payment across any venue.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Select Venue <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedHallId}
              onChange={(e) => handleVenueChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Event Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Time Slot for {currentVenue?.name} <span className="text-red-500">*</span>
            </label>
            <select
              value={slotId}
              onChange={(e) => handleSlotChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {currentVenue?.timeSlots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} – ₹{(s.basePricePaise / 100).toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Applicant Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Anand Murthy"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Contact Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="10-digit mobile number"
              value={applicantPhone}
              onChange={(e) => setApplicantPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="applicant@example.com"
              value={applicantEmail}
              onChange={(e) => setApplicantEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Organisation (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Rotary Club"
              value={organisation}
              onChange={(e) => setOrganisation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Event Type <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Wedding Reception"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Guest Count (Max {currentVenue?.capacity}) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={currentVenue?.capacity}
              value={guestCount}
              onChange={(e) => setGuestCount(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Offline Payment Details */}
        <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center space-x-1.5">
            <CreditCard className="w-4 h-4 text-amber-600" />
            <span>Offline Payment Collection</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Payment Method
              </label>
              <div className="flex space-x-3">
                <label className="flex items-center space-x-1.5 text-xs text-neutral-700 cursor-pointer">
                  <input
                    type="radio"
                    name="method"
                    value="CASH"
                    checked={paymentMethod === 'CASH'}
                    onChange={() => setPaymentMethod('CASH')}
                    className="text-amber-600"
                  />
                  <span>Cash Payment</span>
                </label>
                <label className="flex items-center space-x-1.5 text-xs text-neutral-700 cursor-pointer">
                  <input
                    type="radio"
                    name="method"
                    value="OFFLINE_UPI"
                    checked={paymentMethod === 'OFFLINE_UPI'}
                    onChange={() => setPaymentMethod('OFFLINE_UPI')}
                    className="text-amber-600"
                  />
                  <span>UPI / Bank Transfer (Direct)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Amount Collected (INR)
              </label>
              <input
                type="number"
                step="any"
                min={0}
                value={amountCollectedPaise / 100}
                onChange={(e) => setAmountCollectedPaise(Math.round(parseFloat(e.target.value || '0') * 100))}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
              <span className="text-[10px] text-neutral-400 mt-0.5 block">
                Recommended 25% advance: ₹{((selectedSlot ? Math.round(selectedSlot.basePricePaise * 0.25) : 0) / 100).toLocaleString('en-IN')}.
              </span>
            </div>
          </div>

          {/* Mathematical Summary Card */}
          <div className="bg-white p-3 rounded-xl border border-neutral-200 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-[10px] text-neutral-400 font-semibold uppercase">Total Tariff</div>
              <div className="font-bold text-neutral-900 mt-0.5">
                ₹{((selectedSlot?.basePricePaise || 0) / 100).toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-400 font-semibold uppercase">Collecting Now</div>
              <div className="font-bold text-emerald-700 mt-0.5">
                ₹{(amountCollectedPaise / 100).toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-400 font-semibold uppercase">Balance Remaining</div>
              <div className="font-bold text-amber-700 mt-0.5">
                ₹{Math.max(0, ((selectedSlot?.basePricePaise || 0) - amountCollectedPaise) / 100).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
            Administrative Notes
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Receipt #1042 issued; verified in office register."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold px-4 py-2.5 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-xs disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Confirm & Save Offline Booking'}
          </button>
        </div>
      </form>
    </div>
  );
}
