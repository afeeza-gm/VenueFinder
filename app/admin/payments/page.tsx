import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { dbService } from '@/lib/db/store';
import PaymentsView from './PaymentsView';

export default async function AdminPaymentsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const [payments, auditLogs] = await Promise.all([
    dbService.getPayments(),
    dbService.getAuditLogs(),
  ]);

  return <PaymentsView initialPayments={payments} initialAuditLogs={auditLogs} />;
}
