import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import NewVenueView from './NewVenueView';

export default async function NewVenuePage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  return <NewVenueView />;
}
