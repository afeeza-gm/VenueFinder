import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { dbService } from '@/lib/db/store';
import PaymentsView from './PaymentsView';

export default async function AdminPaymentsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const [bookings, auditLogs] = await Promise.all([
    dbService.getBookings(),
    dbService.getAuditLogs(),
  ]);

  // Collect all payments
  const payments = bookings.flatMap((b) => b.payments || []);

  return <PaymentsView initialPayments={payments} initialAuditLogs={auditLogs} />;
}
