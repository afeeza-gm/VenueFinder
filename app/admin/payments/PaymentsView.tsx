'use client';

import { useState } from 'react';
import {
  CreditCard,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertTriangle,
  History,
  Clock,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { Payment, AuditLog } from '@/types';
import { issueRefundAction } from '@/app/actions/admin';

interface PaymentsViewProps {
  initialPayments: Payment[];
  initialAuditLogs: AuditLog[];
}

export default function PaymentsView({
  initialPayments,
  initialAuditLogs,
}: PaymentsViewProps) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [activeTab, setActiveTab] = useState<'PAYMENTS' | 'AUDIT'>('PAYMENTS');

  // Refund Modal state
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
  const [refundAmountPaise, setRefundAmountPaise] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openRefundModal = (payment: Payment) => {
    setRefundTarget(payment);
    setRefundAmountPaise(payment.amountPaise);
    setRefundReason('Applicant cancellation requested within refund window');
    setError(null);
  };

  const handleIssueRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTarget) return;

    if (refundAmountPaise <= 0 || refundAmountPaise > refundTarget.amountPaise) {
      setError(`Refund amount must be between ₹1 and ₹${(refundTarget.amountPaise / 100).toLocaleString('en-IN')}`);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await issueRefundAction(refundTarget.id, refundAmountPaise, refundReason);
    setLoading(false);

    if (res.success && res.refund) {
      alert(`Refund of ₹${(refundAmountPaise / 100).toLocaleString('en-IN')} successfully processed!`);
      setPayments((prev) =>
        prev.map((p) => (p.id === refundTarget.id ? { ...p, status: 'REFUNDED' } : p))
      );
      setRefundTarget(null);
    } else {
      setError(res.error || 'Failed to issue refund.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Payments, Refunds & Audit Trail
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Verified Razorpay and offline transactions, refund management, and immutable system audit log.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="/api/export/bookings"
            download
            className="inline-flex items-center space-x-1.5 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold px-4 py-2 rounded-xl border border-neutral-300 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export Transactions CSV</span>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-neutral-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('PAYMENTS')}
          className={`px-4 py-2 rounded-xl transition-colors ${
            activeTab === 'PAYMENTS'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          Payment Transactions ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`px-4 py-2 rounded-xl transition-colors ${
            activeTab === 'AUDIT'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {activeTab === 'PAYMENTS' ? (
        <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-neutral-900">
                        {p.razorpayPaymentId || p.id}
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-600">{p.bookingId}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-neutral-800">{p.method || 'GATEWAY'}</span>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-neutral-900">
                        ₹{(p.amountPaise / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            p.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : p.status === 'REFUNDED'
                              ? 'bg-purple-100 text-purple-800 border-purple-300'
                              : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-500">
                        {p.paidAt
                          ? new Date(p.paidAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {p.status === 'PAID' ? (
                          <button
                            onClick={() => openRefundModal(p)}
                            className="inline-flex items-center space-x-1 text-[11px] font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors border border-red-200"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Issue Refund</span>
                          </button>
                        ) : (
                          <span className="text-neutral-400 text-[11px]">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Audit Logs Tab */
        <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-neutral-900">
                      {log.adminName || 'System'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        {log.entityType} ({log.entityId})
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-neutral-900">{log.action}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-neutral-600 max-w-xs truncate">
                      {JSON.stringify(log.newValue || log.oldValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Refund Modal (FR-23) */}
      {refundTarget && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleIssueRefund}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-xl text-xs"
          >
            <div className="flex items-center space-x-2 text-red-600">
              <RotateCcw className="w-5 h-5" />
              <h3 className="text-base font-bold text-neutral-900">Process Refund</h3>
            </div>

            <p className="text-neutral-600">
              Initiate a full or partial refund for transaction{' '}
              <strong className="font-mono">{refundTarget.razorpayPaymentId || refundTarget.id}</strong>.
            </p>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Refund Amount in INR (Max: ₹{(refundTarget.amountPaise / 100).toLocaleString('en-IN')})
              </label>
              <input
                type="number"
                step="any"
                min={1}
                max={refundTarget.amountPaise / 100}
                value={refundAmountPaise / 100}
                onChange={(e) =>
                  setRefundAmountPaise(Math.round(parseFloat(e.target.value || '0') * 100))
                }
                className="w-full p-2.5 rounded-xl border border-neutral-300 font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Refund Reason / Administrative Note <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRefundTarget(null)}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-500 text-white font-semibold px-5 py-2 rounded-xl disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Confirm & Process Refund'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
