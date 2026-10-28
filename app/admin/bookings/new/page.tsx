import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { dbService } from '@/lib/db/store';
import NewManualBookingView from './NewManualBookingView';

export default async function NewManualBookingPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const venues = await dbService.getHalls();

  return <NewManualBookingView venues={venues} />;
}
