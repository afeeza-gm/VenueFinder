'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Building,
  Users,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  AlertCircle,
  Copy,
  Check,
  MapPin,
  Sparkles,
  ShieldCheck,
  Shield,
  Star,
} from 'lucide-react';
import { TimeSlot, Hall, Facility } from '@/types';
import { submitBookingAction } from '@/app/actions/booking';

interface BookingFormProps {
  venues: Array<Hall & { facilities: Facility[]; timeSlots: TimeSlot[] }>;
  initialVenueId: string;
  preselectedDate?: string;
  preselectedSlotId?: string;
}

export default function BookingForm({
  venues,
  initialVenueId,
  preselectedDate,
  preselectedSlotId,
}: BookingFormProps) {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [selectedVenueId, setSelectedVenueId] = useState(initialVenueId);
  const [locationFilter, setLocationFilter] = useState('ALL');

  const distinctLocations = Array.from(new Set(venues.map((v) => v.location)));

  const filteredVenues =
    locationFilter === 'ALL'
      ? venues
      : venues.filter((v) => v.location.toLowerCase().includes(locationFilter.toLowerCase()));

  const currentVenue = venues.find((v) => v.id === selectedVenueId) || venues[0];

  const [date, setDate] = useState(
    preselectedDate ||
      new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [slotId, setSlotId] = useState(
    preselectedSlotId || currentVenue?.timeSlots[0]?.id || ''
  );

  // Real-time Availability State
  const [availabilityData, setAvailabilityData] = useState<any>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Form Fields
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [eventType, setEventType] = useState('Wedding Reception');
  const [guestCount, setGuestCount] = useState<number>(150);
  const [notes, setNotes] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedSlot = currentVenue?.timeSlots.find((s) => s.id === slotId);

  // Fetch real-time slot availability whenever venue or date changes
  useEffect(() => {
    let isCancelled = false;

    async function checkAvailability() {
      if (!date || !selectedVenueId) return;
      setCheckingAvailability(true);
      try {
        const res = await fetch(`/api/availability?date=${date}&venueId=${selectedVenueId}`);
        if (res.ok && !isCancelled) {
          const data = await res.json();
          setAvailabilityData(data);

          if (data.slots && data.slots.length > 0) {
            const currentSlotData = data.slots.find((s: any) => s.slot.id === slotId);
            if (!currentSlotData || !currentSlotData.isAvailable) {
              const firstAvailable = data.slots.find((s: any) => s.isAvailable);
              if (firstAvailable) {
                setSlotId(firstAvailable.slot.id);
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!isCancelled) {
          setCheckingAvailability(false);
        }
      }
    }

    checkAvailability();

    return () => {
      isCancelled = true;
    };
  }, [date, selectedVenueId]);

  const handleVenueChange = (newVenueId: string) => {
    setSelectedVenueId(newVenueId);
    const v = venues.find((x) => x.id === newVenueId);
    if (v && v.timeSlots.length > 0) {
      setSlotId(v.timeSlots[0].id);
    }
  };

  const validateStep1 = () => {
    if (!date) {
      setErrorMessage('Please select a valid event date.');
      return false;
    }
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      setErrorMessage('Event date cannot be in the past.');
      return false;
    }
    if (!slotId) {
      setErrorMessage('Please select a time slot.');
      return false;
    }

    if (availabilityData?.slots) {
      const slotInfo = availabilityData.slots.find((s: any) => s.slot.id === slotId);
      if (slotInfo && !slotInfo.isAvailable) {
        setErrorMessage(
          `The selected slot is currently ${slotInfo.statusReason || 'unavailable'} on ${date}. Please choose another slot or date.`
        );
        return false;
      }
    }

    setErrorMessage(null);
    return true;
  };

  const validateStep2 = () => {
    if (!applicantName.trim()) {
      setErrorMessage('Applicant full name is required.');
      return false;
    }
    if (!applicantPhone.trim() || applicantPhone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please provide a valid 10-digit contact phone number.');
      return false;
    }
    if (!applicantEmail.trim() || !applicantEmail.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return false;
    }
    if (guestCount <= 0) {
      setErrorMessage('Expected guests must be greater than 0.');
      return false;
    }
    if (guestCount > currentVenue.capacity) {
      setErrorMessage(
        `Guest count cannot exceed ${currentVenue.name} capacity of ${currentVenue.capacity} guests.`
      );
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await submitBookingAction({
      hallId: currentVenue.id,
      slotId,
      eventDate: date,
      applicantName,
      applicantPhone,
      applicantEmail,
      organisation,
      eventType,
      guestCount,
      notes,
    });

    setIsSubmitting(false);

    if (res.success && res.reference) {
      setSubmittedRef(res.reference);
      setStep(4);
    } else {
      setErrorMessage(res.error || 'Failed to submit booking request.');
    }
  };

  const copyReference = () => {
    if (submittedRef) {
      navigator.clipboard.writeText(submittedRef);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Step 4: Submission Confirmation Screen (Airbnb Receipt Style)
  if (step === 4 && submittedRef) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-[#ebebeb] p-8 sm:p-12 airbnb-sticky-shadow text-center space-y-6">
        <div className="w-16 h-16 bg-[#fff0f2] text-[#ff385c] rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#222222]">
            Reservation Request Submitted!
          </h2>
          <p className="text-xs sm:text-sm text-[#717171]">
            Your booking request has been forwarded to the {currentVenue?.name} administrative supervisor.
          </p>
        </div>

        <div className="bg-[#f7f7f7] rounded-2xl p-6 border border-[#ebebeb] text-left space-y-4">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#717171]">
            Your Official Reservation Reference
          </div>
          <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-[#dddddd]">
            <span className="text-lg font-mono font-bold text-[#ff385c] tracking-wider">
              {submittedRef}
            </span>
            <button
              onClick={copyReference}
              className="inline-flex items-center space-x-1 text-xs text-[#222222] hover:bg-[#f7f7f7] border border-[#dddddd] px-3 py-1.5 rounded-full transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="text-xs text-[#3f3f3f] space-y-1.5 pt-1">
            <p>
              <strong>Venue:</strong> {currentVenue?.name} &middot; {currentVenue?.location}
            </p>
            <p>
              <strong>Event Date:</strong> {date} &middot; <strong>Slot:</strong> {selectedSlot?.label}
            </p>
            <p>
              <strong>Applicant:</strong> {applicantName} ({applicantPhone})
            </p>
          </div>
        </div>

        <div className="text-xs text-[#717171] leading-relaxed bg-[#fff0f2]/60 p-4 rounded-2xl border border-[#ffccd3] text-left space-y-1.5">
          <div className="font-semibold text-[#ff385c] flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Next steps for your reservation:</span>
          </div>
          <ul className="list-disc ml-4 space-y-1 text-[#3f3f3f]">
            <li>The hall administrator will review and validate slot availability within 24 hours.</li>
            <li>Upon approval, an exclusive 48-hour payment hold will be activated.</li>
            <li>Pay the 25% advance online via Razorpay to lock your confirmed reservation.</li>
          </ul>
        </div>

        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => router.push(`/status?reference=${submittedRef}&phone=${applicantPhone}`)}
            className="bg-[#222222] hover:bg-black text-white font-semibold text-xs px-6 py-3 rounded-full transition-all"
          >
            Track Request Status
          </button>
          <button
            onClick={() => router.push('/')}
            className="bg-white hover:bg-[#f7f7f7] border border-[#dddddd] text-[#222222] font-semibold text-xs px-6 py-3 rounded-full transition-all"
          >
            Explore More Venues
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* 2-Column Split: Form (65%) vs Live Booking Card (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Main Form Container */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#ebebeb] p-6 sm:p-8 airbnb-card-shadow space-y-8">
          {/* Stepper Header */}
          <div className="flex items-center justify-between border-b border-[#ebebeb] pb-5">
            <div className="flex items-center space-x-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                  step >= 1 ? 'bg-[#222222] text-white' : 'bg-[#f7f7f7] text-[#717171]'
                }`}
              >
                1
              </span>
              <span className={`text-xs font-semibold ${step >= 1 ? 'text-[#222222]' : 'text-[#717171]'}`}>
                Date & Slot
              </span>
            </div>

            <div className="h-0.5 w-8 bg-[#ebebeb]" />

            <div className="flex items-center space-x-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                  step >= 2 ? 'bg-[#222222] text-white' : 'bg-[#f7f7f7] text-[#717171]'
                }`}
              >
                2
              </span>
              <span className={`text-xs font-semibold ${step >= 2 ? 'text-[#222222]' : 'text-[#717171]'}`}>
                Applicant Info
              </span>
            </div>

            <div className="h-0.5 w-8 bg-[#ebebeb]" />

            <div className="flex items-center space-x-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                  step >= 3 ? 'bg-[#222222] text-white' : 'bg-[#f7f7f7] text-[#717171]'
                }`}
              >
                3
              </span>
              <span className={`text-xs font-semibold ${step >= 3 ? 'text-[#222222]' : 'text-[#717171]'}`}>
                Review
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center space-x-2 bg-[#fff0f2] border border-[#ffccd3] text-[#ff385c] text-xs p-3.5 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 1: Venue, Date & Slot */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#222222]">
                  Select Venue, Date & Time Slot
                </h3>
                <p className="text-xs text-[#717171] mt-0.5">
                  Pick your neighborhood hall and inspect real-time slot availability.
                </p>
              </div>

              <div className="space-y-4">
                {/* Locality & Venue Filter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#222222] mb-1.5">
                      Locality
                    </label>
                    <select
                      value={locationFilter}
                      onChange={(e) => {
                        setLocationFilter(e.target.value);
                        const matched =
                          e.target.value === 'ALL'
                            ? venues
                            : venues.filter((v) => v.location.toLowerCase().includes(e.target.value.toLowerCase()));
                        if (matched.length > 0 && !matched.some((m) => m.id === selectedVenueId)) {
                          handleVenueChange(matched[0].id);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#dddddd] text-xs font-semibold focus:border-[#222222] bg-white cursor-pointer"
                    >
                      <option value="ALL">All Localities ({venues.length})</option>
                      {distinctLocations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#222222] mb-1.5">
                      Community Venue
                    </label>
                    <select
                      value={selectedVenueId}
                      onChange={(e) => handleVenueChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#dddddd] text-xs font-semibold focus:border-[#222222] bg-white cursor-pointer"
                    >
                      {filteredVenues.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} (Cap: {v.capacity})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Event Date Picker */}
                <div>
                  <label className="block text-xs font-semibold text-[#222222] mb-1.5">
                    Event Date <span className="text-[#ff385c]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#dddddd] text-xs font-semibold focus:border-[#222222] bg-white"
                    />
                    <Calendar className="w-4 h-4 text-[#717171] absolute left-3.5 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Slot Radio Buttons */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-[#222222]">
                      Available Time Slots on {date}
                    </label>
                    {checkingAvailability && (
                      <span className="text-[10px] text-[#ff385c] animate-pulse">
                        Checking slot records...
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {currentVenue?.timeSlots.map((slot) => {
                      const isChecked = slotId === slot.id;
                      const slotAvailability = availabilityData?.slots?.find((s: any) => s.slot.id === slot.id);
                      const isAvailable = slotAvailability ? slotAvailability.isAvailable : true;
                      const reason = slotAvailability?.statusReason || 'Available';

                      return (
                        <label
                          key={slot.id}
                          className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                            !isAvailable
                              ? 'border-red-100 bg-[#fff0f2]/40 opacity-70 cursor-not-allowed'
                              : isChecked
                              ? 'border-[#222222] bg-[#f7f7f7] ring-1 ring-[#222222] cursor-pointer'
                              : 'border-[#dddddd] hover:border-[#222222] bg-white cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="slot"
                              disabled={!isAvailable}
                              checked={isChecked}
                              onChange={() => {
                                if (isAvailable) setSlotId(slot.id);
                              }}
                              className="w-4 h-4 text-[#ff385c] focus:ring-[#ff385c]"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-[#222222]">{slot.label}</span>
                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                    isAvailable
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-[#fff0f2] text-[#ff385c]'
                                  }`}
                                >
                                  {reason}
                                </span>
                              </div>
                              <div className="text-[11px] text-[#717171] flex items-center space-x-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                <span>{slot.startTime} to {slot.endTime}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-bold text-[#222222]">
                              &#8377;{(slot.basePricePaise / 100).toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px] text-[#717171]">
                              &#8377;{((slot.basePricePaise * 0.25) / 100).toLocaleString('en-IN')} advance
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Applicant Information */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#222222]">Applicant & Event Information</h3>
                <p className="text-xs text-[#717171] mt-0.5">
                  Official contact details for approval notification and booking confirmation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#222222] mb-1.5">
                    Full Name <span className="text-[#ff385c]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#dddddd] text-xs font-medium focus:border-[#222222] bg-white"
                    />
                    <User className="w-4 h-4 text-[#717171] absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#222222] mb-1.5">
                    Phone Number (10 Digits) <span className="text-[#ff385c]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#dddddd] text-xs font-medium focus:border-[#222222] bg-white"
                    />
                    <Phone className="w-4 h-4 text-[#717171] absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#222222] mb-1.5">
                    Email Address <span className="text-[#ff385c]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="e.g. applicant@example.com"
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#dddddd] text-xs font-medium focus:border-[#222222] bg-white"
                    />
                    <Mail className="w-4 h-4 text-[#717171] absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#222222] mb-1.5">
                    Organisation / Society (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. RWA Residents Association"
                      value={organisation}
                      onChange={(e) => setOrganisation(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#dddddd] text-xs font-medium focus:border-[#222222] bg-white"
                    />
                    <Building className="w-4 h-4 text-[#717171] absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#222222] mb-1.5">
                    Event Type <span className="text-[#ff385c]">*</span>
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#dddddd] text-xs font-medium focus:border-[#222222] bg-white cursor-pointer"
                  >
                    <option value="Wedding Reception">Wedding Reception</option>
                    <option value="Birthday Celebration">Birthday Celebration</option>
                    <option value="Cultural Programme">Cultural Programme</option>
                    <option value="Conference / Seminar">Conference / Seminar</option>
                    <option value="Social Gathering">Social Gathering</option>
                    <option value="Other">Other Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#222222] mb-1.5">
                    Expected Guests (Max {currentVenue?.capacity}) <span className="text-[#ff385c]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={10}
                      max={currentVenue?.capacity}
                      value={guestCount}
                      onChange={(e) => setGuestCount(parseInt(e.target.value, 10) || 0)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#dddddd] text-xs font-medium focus:border-[#222222] bg-white"
                    />
                    <Users className="w-4 h-4 text-[#717171] absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#222222] mb-1.5">
                  Special Notes or Setup Requests (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Mandap decoration arrival time, generator backup needs, catering team..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#dddddd] text-xs font-medium focus:border-[#222222] bg-white"
                />
              </div>
            </div>
          )}

          {/* Step 3: Review Booking Request */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#222222]">Review & Confirm Reservation</h3>
                <p className="text-xs text-[#717171] mt-0.5">
                  Verify your reservation parameters before sending for administrator approval.
                </p>
              </div>

              <div className="bg-[#f7f7f7] rounded-2xl p-5 border border-[#ebebeb] space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[#717171] block">Venue</span>
                    <span className="font-semibold text-[#222222]">{currentVenue?.name}</span>
                  </div>
                  <div>
                    <span className="text-[#717171] block">Event Date</span>
                    <span className="font-semibold text-[#222222]">{date}</span>
                  </div>
                  <div>
                    <span className="text-[#717171] block">Selected Slot</span>
                    <span className="font-semibold text-[#222222]">{selectedSlot?.label}</span>
                  </div>
                  <div>
                    <span className="text-[#717171] block">Expected Attendance</span>
                    <span className="font-semibold text-[#222222]">{guestCount} Guests</span>
                  </div>
                  <div>
                    <span className="text-[#717171] block">Applicant</span>
                    <span className="font-semibold text-[#222222]">{applicantName} ({applicantPhone})</span>
                  </div>
                  <div>
                    <span className="text-[#717171] block">Email</span>
                    <span className="font-semibold text-[#222222]">{applicantEmail}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#ebebeb] flex justify-between items-center">
                  <div>
                    <span className="text-[#717171] block text-[11px]">Base Slot Tariff</span>
                    <span className="text-base font-bold text-[#222222]">
                      &#8377;{((selectedSlot?.basePricePaise || 0) / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#717171] block text-[11px]">25% Advance Upon Approval</span>
                    <span className="text-base font-bold text-[#ff385c]">
                      &#8377;{(((selectedSlot?.basePricePaise || 0) * 0.25) / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#fff0f2]/60 p-4 rounded-xl border border-[#ffccd3] text-xs text-[#3f3f3f] space-y-1">
                <div className="font-bold flex items-center space-x-1 text-[#ff385c]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Applicant Declaration</span>
                </div>
                <p>
                  I understand that no fee is charged now. Upon administrator review, a 48-hour payment hold will be activated to pay the 25% advance online via Razorpay.
                </p>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-[#ebebeb]">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold px-4 py-2.5 rounded-full border border-[#dddddd] hover:border-[#222222] text-[#222222] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold px-6 py-2.5 rounded-full bg-[#ff385c] hover:bg-[#e00b41] active:scale-95 text-white transition-all shadow-xs"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold px-7 py-3 rounded-full bg-[#ff385c] hover:bg-[#e00b41] active:scale-95 text-white transition-all shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Submitting Request...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Reserve Hall</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Rail: Airbnb Reservation Summary Card */}
        <div className="lg:col-span-5">
          <div className="sticky top-28 bg-white rounded-3xl border border-[#dddddd] p-6 airbnb-sticky-shadow space-y-4">
            {/* Venue Brief Header */}
            <div className="flex items-center space-x-3.5 pb-4 border-b border-[#ebebeb]">
              <img
                src={
                  currentVenue.imageUrl
                    ? (currentVenue.imageUrl.startsWith('http') || currentVenue.imageUrl.startsWith('/')
                        ? currentVenue.imageUrl
                        : `/${currentVenue.imageUrl}`)
                    : 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=300&auto=format&fit=crop'
                }
                alt={currentVenue.name}
                className="w-20 h-16 rounded-xl object-cover"
              />
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-[#ff385c]">Reserved Hall</span>
                <h4 className="text-xs font-bold text-[#222222] line-clamp-1">{currentVenue.name}</h4>
                <div className="flex items-center space-x-1 text-[11px] text-[#717171]">
                  <MapPin className="w-3 h-3 text-[#ff385c]" />
                  <span>{currentVenue.location}</span>
                </div>
              </div>
            </div>

            {/* Price Details */}
            <div className="space-y-2 text-xs">
              <h5 className="font-bold text-[#222222]">Reservation Details</h5>
              <div className="flex justify-between text-[#717171]">
                <span>Selected Date</span>
                <span className="font-medium text-[#222222]">{date}</span>
              </div>
              <div className="flex justify-between text-[#717171]">
                <span>Selected Slot</span>
                <span className="font-medium text-[#222222]">{selectedSlot?.label || 'Not chosen'}</span>
              </div>
              <div className="flex justify-between text-[#717171]">
                <span>Capacity</span>
                <span className="font-medium text-[#222222]">Up to {currentVenue.capacity}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#ebebeb] space-y-2 text-xs">
              <h5 className="font-bold text-[#222222]">Pricing Breakdown</h5>
              <div className="flex justify-between text-[#717171]">
                <span>Slot Base Tariff</span>
                <span>&#8377;{(((selectedSlot?.basePricePaise || 0)) / 100).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#717171]">
                <span>25% Advance Due Upon Review</span>
                <span className="font-semibold text-[#ff385c]">
                  &#8377;{(((selectedSlot?.basePricePaise || 0) * 0.25) / 100).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-[#717171]">
                <span>Refundable Cleaning Deposit</span>
                <span>&#8377;5,000</span>
              </div>
            </div>

            <div className="p-3 bg-[#f7f7f7] rounded-xl text-[11px] text-[#717171] space-y-1">
              <div className="font-semibold text-[#222222] flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero Upfront Fee</span>
              </div>
              <p>You only pay the advance once your date is reviewed and locked by the supervisor.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
