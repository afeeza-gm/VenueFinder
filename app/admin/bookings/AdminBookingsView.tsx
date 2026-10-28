'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  CreditCard,
  AlertCircle,
  Download,
  PlusCircle,
  Building2,
} from 'lucide-react';
import { Booking, Hall } from '@/types';
import { approveBookingAction, rejectBookingAction } from '@/app/actions/admin';

interface AdminBookingsViewProps {
  initialBookings: Booking[];
  venues: Hall[];
}

export default function AdminBookingsView({ initialBookings, venues }: AdminBookingsViewProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [venueFilter, setVenueFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Rejection modal
  const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Filtered list
  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchesVenue = venueFilter === 'ALL' || b.hallId === venueFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      b.reference.toLowerCase().includes(q) ||
      b.applicantName.toLowerCase().includes(q) ||
      b.applicantPhone.includes(q) ||
      b.eventType.toLowerCase().includes(q);
    return matchesStatus && matchesVenue && matchesSearch;
  });

  const getVenueName = (hallId: string) => {
    return venues.find((v) => v.id === hallId)?.name || hallId;
  };

  // Quick stats
  const pendingCount = bookings.filter((b) => b.status === 'PENDING').length;
  const awaitingPaymentCount = bookings.filter((b) => b.status === 'APPROVED_AWAITING_PAYMENT').length;
  const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const totalRevenuePaise = bookings
    .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + b.advanceAmountPaise, 0);

  const handleApprove = async (booking: Booking) => {
    const venueName = getVenueName(booking.hallId);
    const confirmApprove = window.confirm(
      `Approve request for ${booking.applicantName} at ${venueName} on ${booking.eventDate}? This will lock the slot and start a 48h payment hold.`
    );
    if (!confirmApprove) return;

    setActionLoading(true);
    const res = await approveBookingAction(booking.id);
    setActionLoading(false);

    if (res.success && res.booking) {
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, ...res.booking } : b))
      );
      if (selectedBooking?.id === booking.id) {
        setSelectedBooking((prev) => (prev ? { ...prev, ...res.booking } : null));
      }
    } else {
      alert(`Approval failed: ${res.error}`);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingBooking) return;
    if (!rejectionReason.trim()) {
      alert('A mandatory rejection reason is required.');
      return;
    }

    setActionLoading(true);
    const res = await rejectBookingAction(rejectingBooking.id, rejectionReason.trim());
    setActionLoading(false);

    if (res.success && res.booking) {
      setBookings((prev) =>
        prev.map((b) => (b.id === rejectingBooking.id ? { ...b, ...res.booking } : b))
      );
      if (selectedBooking?.id === rejectingBooking.id) {
        setSelectedBooking((prev) => (prev ? { ...prev, ...res.booking } : null));
      }
      setRejectingBooking(null);
      setRejectionReason('');
    } else {
      alert(`Rejection failed: ${res.error}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'APPROVED_AWAITING_PAYMENT':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'CONFIRMED':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'REJECTED':
      case 'EXPIRED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-900 border-red-300';
      case 'COMPLETED':
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Quick Stats */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Booking Requests & Queue
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Review incoming requests across all venues, approve payment holds, issue rejections, or create offline bookings.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/bookings/new"
            className="inline-flex items-center space-x-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Record Offline Booking</span>
          </Link>
          <a
            href="/api/export/bookings"
            download
            className="inline-flex items-center space-x-1.5 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold px-4 py-2 rounded-xl border border-neutral-300 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
          <div className="text-xs font-semibold text-neutral-500 uppercase">Pending Requests</div>
          <div className="text-3xl font-extrabold text-amber-600 mt-2">{pendingCount}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Requires admin approval</div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
          <div className="text-xs font-semibold text-neutral-500 uppercase">Awaiting Payment</div>
          <div className="text-3xl font-extrabold text-blue-600 mt-2">{awaitingPaymentCount}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Held within 48h window</div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
          <div className="text-xs font-semibold text-neutral-500 uppercase">Confirmed Bookings</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">{confirmedCount}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Advance/offline collected</div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
          <div className="text-xs font-semibold text-neutral-500 uppercase">Revenue Collected</div>
          <div className="text-3xl font-extrabold text-neutral-900 mt-2">
            ₹{(totalRevenuePaise / 100).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">Total verified payments</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by reference, applicant, phone or event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs py-1.5 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-3">
          {/* Venue Filter */}
          <div className="flex items-center space-x-1.5">
            <Building2 className="w-4 h-4 text-neutral-400" />
            <select
              value={venueFilter}
              onChange={(e) => setVenueFilter(e.target.value)}
              className="text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Venues</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5">
            <Filter className="w-4 h-4 text-neutral-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED_AWAITING_PAYMENT">Awaiting Payment</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Queue Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Venue</th>
                <th className="py-3 px-4">Date & Slot</th>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Tariff</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-500">
                    No bookings found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-neutral-900">
                      {b.reference}
                    </td>
                    <td className="py-3 px-4 font-semibold text-neutral-800">
                      {getVenueName(b.hallId)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-900">{b.eventDate}</div>
                      <div className="text-[11px] text-neutral-500">{b.slot?.label || b.slotId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-900">{b.applicantName}</div>
                      <div className="text-[11px] text-neutral-500">{b.applicantPhone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-neutral-900">{b.eventType}</div>
                      <div className="text-[11px] text-neutral-500">{b.guestCount} Guests</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-900">
                        ₹{(b.totalAmountPaise / 100).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-amber-700">
                        Adv: ₹{(b.advanceAmountPaise / 100).toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                          b.status
                        )}`}
                      >
                        {b.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg inline-flex items-center"
                        title="View Full Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {b.status === 'PENDING' && (
                        <>
                          <button
                            disabled={actionLoading}
                            onClick={() => handleApprove(b)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2.5 py-1 rounded-lg text-[11px] transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            disabled={actionLoading}
                            onClick={() => {
                              setRejectingBooking(b);
                              setRejectionReason('');
                            }}
                            className="bg-red-600 hover:bg-red-500 text-white font-semibold px-2.5 py-1 rounded-lg text-[11px] transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-neutral-200 pb-4">
              <div>
                <div className="text-xs uppercase font-bold text-neutral-400">Booking Record</div>
                <h3 className="text-xl font-mono font-bold text-neutral-900">{selectedBooking.reference}</h3>
                <div className="text-xs font-semibold text-amber-700 mt-0.5">
                  Venue: {getVenueName(selectedBooking.hallId)}
                </div>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-neutral-500 block">Status:</span>
                <span className={`font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${getStatusBadge(selectedBooking.status)}`}>
                  {selectedBooking.status}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block">Event Date:</span>
                <span className="font-semibold text-neutral-900">{selectedBooking.eventDate}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Time Slot:</span>
                <span className="font-semibold text-neutral-900">{selectedBooking.slot?.label || selectedBooking.slotId}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Event Type:</span>
                <span className="font-semibold text-neutral-900">{selectedBooking.eventType}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Applicant:</span>
                <span className="font-semibold text-neutral-900">{selectedBooking.applicantName}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Contact Phone:</span>
                <span className="font-semibold text-neutral-900">{selectedBooking.applicantPhone}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Email:</span>
                <span className="font-semibold text-neutral-900">{selectedBooking.applicantEmail}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Organisation:</span>
                <span className="font-semibold text-neutral-900">{selectedBooking.organisation || 'None'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Expected Attendance:</span>
                <span className="font-semibold text-neutral-900">{selectedBooking.guestCount} Guests</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Active Slot Key:</span>
                <span className="font-mono text-neutral-800">{selectedBooking.activeSlotKey || 'None'}</span>
              </div>
            </div>

            {selectedBooking.notes && (
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-xs">
                <span className="font-semibold text-neutral-700 block">Special Notes:</span>
                <p className="text-neutral-600 mt-1">{selectedBooking.notes}</p>
              </div>
            )}

            {selectedBooking.rejectionReason && (
              <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-xs text-red-800">
                <span className="font-semibold block">Rejection Reason:</span>
                <p className="mt-1">{selectedBooking.rejectionReason}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedBooking(null)}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Rejection Reason Modal */}
      {rejectingBooking && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleReject}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-xl"
          >
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-lg font-bold">Reject Booking Request</h3>
            </div>

            <p className="text-xs text-neutral-600">
              Provide a clear reason for rejecting the request of <strong>{rejectingBooking.applicantName}</strong> for <strong>{rejectingBooking.eventDate}</strong> at <strong>{getVenueName(rejectingBooking.hallId)}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Mandatory Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Guest capacity exceeded, hall undergoing maintenance, invalid event type..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingBooking(null)}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-5 py-2 rounded-xl disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
