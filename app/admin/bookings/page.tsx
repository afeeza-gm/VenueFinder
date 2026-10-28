import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { dbService } from '@/lib/db/store';
import AdminBookingsView from './AdminBookingsView';

export default async function AdminBookingsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const [bookings, venues] = await Promise.all([
    dbService.getBookings(),
    dbService.getHalls(),
  ]);

  return <AdminBookingsView initialBookings={bookings} venues={venues} />;
}
