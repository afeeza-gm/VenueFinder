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
  Edit3,
  DollarSign,
} from 'lucide-react';
import { Booking, Hall, BookingStatus } from '@/types';
import {
  approveBookingAction,
  rejectBookingAction,
  recordBookingPaymentAction,
  updateBookingAmountsAction,
} from '@/app/actions/admin';

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

  // Record Payment modal state
  const [payingBooking, setPayingBooking] = useState<Booking | null>(null);
  const [paymentAmountRupees, setPaymentAmountRupees] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'OFFLINE_UPI' | 'BANK_TRANSFER'>('CASH');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Edit Booking Amounts modal state
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editTotalRupees, setEditTotalRupees] = useState<string>('');
  const [editAdvanceRupees, setEditAdvanceRupees] = useState<string>('');
  const [editStatus, setEditStatus] = useState<BookingStatus>('CONFIRMED');
  const [editError, setEditError] = useState<string | null>(null);

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

  // Quick stats - mathematically accurate
  const pendingCount = bookings.filter((b) => b.status === 'PENDING').length;
  const awaitingPaymentCount = bookings.filter((b) => b.status === 'APPROVED_AWAITING_PAYMENT').length;
  const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const totalRevenuePaise = bookings
    .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.advanceAmountPaise || 0), 0);

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

  // Open Record Payment Modal
  const openRecordPaymentModal = (b: Booking) => {
    setPayingBooking(b);
    setPaymentAmountRupees(String(b.advanceAmountPaise / 100));
    setPaymentMethod('CASH');
    setPaymentNotes('');
    setPaymentError(null);
  };

  // Handle Record Offline Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBooking) return;

    const numRupees = parseFloat(paymentAmountRupees);
    if (isNaN(numRupees) || numRupees < 0) {
      setPaymentError('Please enter a valid positive payment amount.');
      return;
    }

    setActionLoading(true);
    setPaymentError(null);

    const amountPaise = Math.round(numRupees * 100);
    const res = await recordBookingPaymentAction(payingBooking.id, {
      amountPaise,
      method: paymentMethod,
      notes: paymentNotes.trim() || undefined,
    });
    setActionLoading(false);

    if (res.success && res.booking) {
      setBookings((prev) =>
        prev.map((b) => (b.id === payingBooking.id ? { ...b, ...res.booking } : b))
      );
      if (selectedBooking?.id === payingBooking.id) {
        setSelectedBooking((prev) => (prev ? { ...prev, ...res.booking } : null));
      }
      alert(`Payment of ₹${numRupees.toLocaleString('en-IN')} recorded for ${payingBooking.reference}! Booking is now CONFIRMED.`);
      setPayingBooking(null);
    } else {
      setPaymentError(res.error || 'Failed to record payment.');
    }
  };

  // Open Edit Booking Modal
  const openEditBookingModal = (b: Booking) => {
    setEditingBooking(b);
    setEditTotalRupees(String(b.totalAmountPaise / 100));
    setEditAdvanceRupees(String(b.advanceAmountPaise / 100));
    setEditStatus(b.status);
    setEditError(null);
  };

  // Handle Edit Booking Amounts
  const handleSaveBookingAmounts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    const totalNum = parseFloat(editTotalRupees);
    const advNum = parseFloat(editAdvanceRupees);

    if (isNaN(totalNum) || totalNum < 0) {
      setEditError('Please enter a valid total tariff amount.');
      return;
    }

    if (isNaN(advNum) || advNum < 0) {
      setEditError('Please enter a valid advance payment amount.');
      return;
    }

    if (advNum > totalNum) {
      setEditError('Advance payment cannot exceed total slot tariff.');
      return;
    }

    setActionLoading(true);
    setEditError(null);

    const totalAmountPaise = Math.round(totalNum * 100);
    const advanceAmountPaise = Math.round(advNum * 100);

    const res = await updateBookingAmountsAction(editingBooking.id, {
      totalAmountPaise,
      advanceAmountPaise,
      status: editStatus,
    });
    setActionLoading(false);

    if (res.success && res.booking) {
      setBookings((prev) =>
        prev.map((b) => (b.id === editingBooking.id ? { ...b, ...res.booking } : b))
      );
      if (selectedBooking?.id === editingBooking.id) {
        setSelectedBooking((prev) => (prev ? { ...prev, ...res.booking } : null));
      }
      alert(`Booking ${editingBooking.reference} updated successfully: Total ₹${totalNum.toLocaleString('en-IN')}, Advance ₹${advNum.toLocaleString('en-IN')}`);
      setEditingBooking(null);
    } else {
      setEditError(res.error || 'Failed to update booking amounts.');
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
            Review incoming requests across all venues, approve payment holds, issue rejections, edit tariffs, or collect offline payments.
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
          <div className="text-[11px] text-neutral-400 mt-1">Total verified advance collected</div>
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
              <option value="COMPLETED">Completed</option>
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
                <th className="py-3 px-4">Tariff & Balance</th>
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
                filteredBookings.map((b) => {
                  const balanceDue = Math.max(0, (b.totalAmountPaise - b.advanceAmountPaise) / 100);
                  return (
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
                          Total: ₹{(b.totalAmountPaise / 100).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-medium">
                          Adv: ₹{(b.advanceAmountPaise / 100).toLocaleString('en-IN')}
                        </div>
                        {balanceDue > 0 && (
                          <div className="text-[10px] text-neutral-400">
                            Bal: ₹{balanceDue.toLocaleString('en-IN')}
                          </div>
                        )}
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

                        <button
                          onClick={() => openEditBookingModal(b)}
                          className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg inline-flex items-center"
                          title="Edit Booking Tariffs & Amounts"
                        >
                          <Edit3 className="w-4 h-4" />
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

                        {b.status === 'APPROVED_AWAITING_PAYMENT' && (
                          <button
                            disabled={actionLoading}
                            onClick={() => openRecordPaymentModal(b)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2.5 py-1 rounded-lg text-[11px] transition-colors inline-flex items-center space-x-1"
                            title="Record payment collected offline"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Collect</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-xl max-h-[90vh] overflow-y-auto text-xs">
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

            <div className="grid grid-cols-2 gap-4">
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

            {/* Financial Breakdown Card */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center space-x-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Financial & Payment Breakdown</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center pt-1">
                <div className="p-2.5 rounded-xl bg-white border border-neutral-200">
                  <div className="text-[10px] text-neutral-400 font-semibold uppercase">Total Tariff</div>
                  <div className="text-sm font-bold text-neutral-900 mt-0.5">
                    ₹{(selectedBooking.totalAmountPaise / 100).toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-neutral-200">
                  <div className="text-[10px] text-neutral-400 font-semibold uppercase">Advance Paid/Due</div>
                  <div className="text-sm font-bold text-emerald-700 mt-0.5">
                    ₹{(selectedBooking.advanceAmountPaise / 100).toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-neutral-200">
                  <div className="text-[10px] text-neutral-400 font-semibold uppercase">Remaining Balance</div>
                  <div className="text-sm font-bold text-neutral-700 mt-0.5">
                    ₹{Math.max(0, (selectedBooking.totalAmountPaise - selectedBooking.advanceAmountPaise) / 100).toLocaleString('en-IN')}
                  </div>
                </div>
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

            <div className="pt-2 flex justify-between items-center">
              <button
                onClick={() => {
                  const b = selectedBooking;
                  setSelectedBooking(null);
                  openEditBookingModal(b);
                }}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors inline-flex items-center space-x-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Tariffs & Status</span>
              </button>

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

      {/* Record Payment Modal */}
      {payingBooking && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleRecordPayment}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-xl text-xs"
          >
            <div className="flex items-center space-x-2 text-emerald-700">
              <CreditCard className="w-5 h-5" />
              <h3 className="text-base font-bold">Record Payment Collection</h3>
            </div>

            <p className="text-neutral-600">
              Confirm offline cash or bank transfer payment for booking{' '}
              <strong className="font-mono">{payingBooking.reference}</strong> ({getVenueName(payingBooking.hallId)}).
            </p>

            {paymentError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                {paymentError}
              </div>
            )}

            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-500">Applicant:</span>
                <span className="font-semibold text-neutral-900">{payingBooking.applicantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Full Slot Tariff:</span>
                <span className="font-semibold text-neutral-900">₹{(payingBooking.totalAmountPaise / 100).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Required Advance:</span>
                <span className="font-bold text-amber-700">₹{(payingBooking.advanceAmountPaise / 100).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Amount Collected in INR <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min={0}
                required
                value={paymentAmountRupees}
                onChange={(e) => setPaymentAmountRupees(e.target.value)}
                placeholder="Enter collected amount (e.g. 8750)"
                className="w-full p-2.5 rounded-xl border border-neutral-300 font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
              <span className="text-[10px] text-neutral-400 mt-0.5 block">
                Enter any exact amount collected. No fixed step constraints.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="CASH">Cash Collection</option>
                <option value="OFFLINE_UPI">Direct UPI / QR Transfer</option>
                <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Payment Receipt / Administrative Notes
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Cash receipt #1052 issued, money placed in cash drawer."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setPayingBooking(null)}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2 rounded-xl disabled:opacity-50"
              >
                {actionLoading ? 'Recording...' : 'Confirm Payment & Confirm Booking'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Booking Tariffs & Amounts Modal */}
      {editingBooking && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSaveBookingAmounts}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-xl text-xs"
          >
            <div className="flex items-center space-x-2 text-neutral-900">
              <Edit3 className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold">Edit Booking Tariffs & Amounts</h3>
            </div>

            <p className="text-neutral-600">
              Update total slot price, advance payment requirement, or status for booking{' '}
              <strong className="font-mono">{editingBooking.reference}</strong>.
            </p>

            {editError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                {editError}
              </div>
            )}

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Total Slot Tariff in INR <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min={0}
                required
                value={editTotalRupees}
                onChange={(e) => setEditTotalRupees(e.target.value)}
                placeholder="Total venue fee in INR"
                className="w-full p-2.5 rounded-xl border border-neutral-300 font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Advance Payment in INR <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min={0}
                required
                value={editAdvanceRupees}
                onChange={(e) => setEditAdvanceRupees(e.target.value)}
                placeholder="Advance required in INR"
                className="w-full p-2.5 rounded-xl border border-neutral-300 font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>

            {/* Realtime Calculated Balance */}
            {(() => {
              const totalVal = parseFloat(editTotalRupees) || 0;
              const advVal = parseFloat(editAdvanceRupees) || 0;
              const balVal = Math.max(0, totalVal - advVal);
              return (
                <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 flex justify-between items-center text-xs">
                  <span className="text-neutral-600">Calculated Balance Due:</span>
                  <strong className="text-neutral-900 font-bold">₹{balVal.toLocaleString('en-IN')}</strong>
                </div>
              );
            })()}

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Booking Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as BookingStatus)}
                className="w-full p-2.5 rounded-xl border border-neutral-300 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="PENDING">PENDING</option>
                <option value="APPROVED_AWAITING_PAYMENT">APPROVED AWAITING PAYMENT</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-5 py-2 rounded-xl disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Booking Amounts'}
              </button>
            </div>
          </form>
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
