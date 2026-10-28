import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { dbService } from '@/lib/db/store';
import AdminVenuesView from './AdminVenuesView';

export default async function AdminVenuesPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const venues = await dbService.getHalls();

  return <AdminVenuesView initialVenues={venues} />;
}
