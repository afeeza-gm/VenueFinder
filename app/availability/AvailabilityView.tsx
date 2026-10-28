'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building2,
  MapPin,
  Users,
  Filter,
  Sparkles,
} from 'lucide-react';
import { TimeSlot, Hall, Facility } from '@/types';

interface AvailabilityViewProps {
  venues: Array<Hall & { facilities: Facility[]; timeSlots: TimeSlot[] }>;
  initialVenueId: string;
  initialYear: number;
  initialMonth: number;
  initialCalendar: Array<{
    date: string;
    day: number;
    status: 'AVAILABLE' | 'PARTIAL' | 'BOOKED' | 'MAINTENANCE';
  }>;
  initialDayAvailability?: any;
}

export default function AvailabilityView({
  venues,
  initialVenueId,
  initialYear,
  initialMonth,
  initialCalendar,
  initialDayAvailability,
}: AvailabilityViewProps) {
  const [selectedVenueId, setSelectedVenueId] = useState<string>(initialVenueId);
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [calendarData, setCalendarData] = useState(initialCalendar);
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDayAvailability?.date || new Date().toISOString().split('T')[0]
  );
  const [dayDetails, setDayDetails] = useState<any>(initialDayAvailability || null);
  const [loadingDate, setLoadingDate] = useState(false);

  const distinctLocations = Array.from(new Set(venues.map((v) => v.location)));

  const filteredVenues =
    locationFilter === 'ALL'
      ? venues
      : venues.filter((v) => v.location.toLowerCase().includes(locationFilter.toLowerCase()));

  const currentVenue = venues.find((v) => v.id === selectedVenueId) || venues[0];
  const activeSlots = currentVenue?.timeSlots || [];

  const handleVenueChange = async (venueId: string) => {
    setSelectedVenueId(venueId);
    setLoadingDate(true);
    try {
      const [monthRes, dateRes] = await Promise.all([
        fetch(`/api/availability/month?year=${currentYear}&month=${currentMonth}&venueId=${venueId}`),
        fetch(`/api/availability?date=${selectedDate}&venueId=${venueId}`),
      ]);

      if (monthRes.ok) {
        setCalendarData(await monthRes.json());
      }
      if (dateRes.ok) {
        setDayDetails(await dateRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDate(false);
    }
  };

  const fetchDateAvailability = async (dateStr: string) => {
    setSelectedDate(dateStr);
    setLoadingDate(true);
    try {
      const res = await fetch(`/api/availability?date=${dateStr}&venueId=${selectedVenueId}`);
      if (res.ok) {
        const data = await res.json();
        setDayDetails(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDate(false);
    }
  };

  const handlePrevMonth = async () => {
    let nextY = currentYear;
    let nextM = currentMonth - 1;
    if (nextM < 1) {
      nextM = 12;
      nextY--;
    }
    setCurrentYear(nextY);
    setCurrentMonth(nextM);
    loadMonth(nextY, nextM);
  };

  const handleNextMonth = async () => {
    let nextY = currentYear;
    let nextM = currentMonth + 1;
    if (nextM > 12) {
      nextM = 1;
      nextY++;
    }
    setCurrentYear(nextY);
    setCurrentMonth(nextM);
    loadMonth(nextY, nextM);
  };

  const loadMonth = async (y: number, m: number) => {
    try {
      const res = await fetch(`/api/availability/month?year=${y}&month=${m}&venueId=${selectedVenueId}`);
      if (res.ok) {
        const data = await res.json();
        setCalendarData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('default', {
    month: 'long',
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'PARTIAL':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'BOOKED':
        return 'bg-[#fff0f2] text-[#ff385c] border-[#ffccd3]';
      case 'MAINTENANCE':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-[#f7f7f7] text-[#717171] border-[#ebebeb]';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-500';
      case 'PARTIAL':
        return 'bg-amber-500';
      case 'BOOKED':
        return 'bg-[#ff385c]';
      case 'MAINTENANCE':
        return 'bg-purple-600';
      default:
        return 'bg-[#dddddd]';
    }
  };

  return (
    <div className="bg-white text-[#222222] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-[#ebebeb]">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#ff385c]">
              <CalendarIcon className="w-4 h-4" />
              <span>Public Availability Calendar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#222222]">
              {currentVenue?.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#717171]">
              <span className="flex items-center space-x-1 text-[#222222] font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#ff385c]" />
                <span>{currentVenue?.location}</span>
              </span>
              <span>&middot;</span>
              <span>Up to {currentVenue?.capacity} Guests</span>
              <span>&middot;</span>
              <span>Atomic slot reservation</span>
            </div>
          </div>

          {/* Locality & Venue Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div>
              <select
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value);
                  const matching =
                    e.target.value === 'ALL'
                      ? venues
                      : venues.filter((v) => v.location.toLowerCase().includes(e.target.value.toLowerCase()));
                  if (matching.length > 0 && !matching.some((m) => m.id === selectedVenueId)) {
                    handleVenueChange(matching[0].id);
                  }
                }}
                className="px-4 py-2 rounded-full border border-[#dddddd] text-xs font-semibold focus:outline-none focus:border-[#222222] bg-white cursor-pointer"
              >
                <option value="ALL">All Localities</option>
                {distinctLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedVenueId}
                onChange={(e) => handleVenueChange(e.target.value)}
                className="w-full sm:w-64 px-4 py-2 rounded-full border border-[#dddddd] text-xs font-semibold focus:outline-none focus:border-[#222222] bg-white cursor-pointer"
              >
                {filteredVenues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.location})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2-Column Calendar & Day Inspector Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Monthly Calendar View (Airbnb Circular Day Cell Architecture) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#ebebeb] p-6 sm:p-8 airbnb-card-shadow space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#ebebeb]">
              <h2 className="text-xl font-bold text-[#222222]">
                {monthName} {currentYear}
              </h2>

              <div className="flex items-center space-x-1">
                <button
                  onClick={handlePrevMonth}
                  className="w-9 h-9 rounded-full border border-[#dddddd] hover:border-[#222222] flex items-center justify-center text-[#222222] transition-colors"
                  aria-label="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="w-9 h-9 rounded-full border border-[#dddddd] hover:border-[#222222] flex items-center justify-center text-[#222222] transition-colors"
                  aria-label="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#717171] p-3 rounded-2xl bg-[#f7f7f7]">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Partially Booked</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff385c]"></span>
                <span>Fully Booked</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                <span>Maintenance</span>
              </div>
            </div>

            {/* 7-Column Days Headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#717171]">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* 7-Column Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarData.map((item) => {
                const isSelected = selectedDate === item.date;
                return (
                  <button
                    key={item.date}
                    onClick={() => fetchDateAvailability(item.date)}
                    className={`min-h-[76px] p-2 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-[#222222] bg-[#222222] text-white shadow-md'
                        : 'border-[#ebebeb] hover:border-[#222222] bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-[#222222]'}`}>
                        {item.day}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${getStatusDot(item.status)}`}></span>
                    </div>

                    <div className="mt-1">
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full block text-center truncate ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : getStatusBadge(item.status)
                        }`}
                      >
                        {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Detail & Slot Inspector (Right Column) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#dddddd] p-6 sm:p-7 airbnb-sticky-shadow space-y-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff385c]">
                Slot Breakdown
              </span>
              <h3 className="text-xl font-bold text-[#222222] mt-1">
                {new Date(selectedDate).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </h3>
              <p className="text-xs text-[#717171] mt-0.5">
                Inspect slot tariffs and reserve with an exclusive 48h hold.
              </p>
            </div>

            {loadingDate ? (
              <div className="py-12 text-center text-xs text-[#717171]">
                Checking slot availability...
              </div>
            ) : (
              <div className="space-y-3">
                {activeSlots.map((slot) => {
                  const slotInfo = dayDetails?.slots?.find((s: any) => s.slot.id === slot.id);
                  const isAvailable = slotInfo ? slotInfo.isAvailable : true;
                  const reason = slotInfo?.statusReason || 'Available';

                  return (
                    <div
                      key={slot.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isAvailable
                          ? 'border-[#ebebeb] bg-[#f7f7f7]/60 hover:border-[#222222]'
                          : 'border-red-100 bg-[#fff0f2]/50 opacity-80'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            {isAvailable ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-[#ff385c]" />
                            )}
                            <h4 className="font-semibold text-sm text-[#222222]">{slot.label}</h4>
                          </div>
                          <div className="flex items-center space-x-1.5 text-xs text-[#717171]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{slot.startTime} – {slot.endTime}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-bold text-[#222222]">
                            &#8377;{(slot.basePricePaise / 100).toLocaleString('en-IN')}
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                              isAvailable
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-[#fff0f2] text-[#ff385c]'
                            }`}
                          >
                            {reason}
                          </span>
                        </div>
                      </div>

                      {isAvailable ? (
                        <div className="mt-4 pt-3 border-t border-[#ebebeb] flex justify-end">
                          <Link
                            href={`/book?venueId=${currentVenue.id}&date=${selectedDate}&slotId=${slot.id}`}
                            className="inline-flex items-center space-x-1.5 bg-[#ff385c] hover:bg-[#e00b41] active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-full transition-all shadow-xs"
                          >
                            <span>Reserve This Slot</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      ) : (
                        <div className="mt-3 text-[11px] text-[#717171] flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Currently unavailable for this date.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Atomic Protection Guarantee */}
            <div className="p-4 rounded-2xl bg-[#f7f7f7] border border-[#ebebeb] text-xs text-[#717171] space-y-1">
              <div className="flex items-center space-x-1.5 font-semibold text-[#222222]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Double-Booking Prevention</span>
              </div>
              <p>
                Once approved by the municipal supervisor, your reserved slot is secured with a unique active slot key in MySQL.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
