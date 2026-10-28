import { notFound, redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { dbService } from '@/lib/db/store';
import EditVenueView from './EditVenueView';

export default async function EditVenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const { id } = await params;
  const venue = await dbService.getHall(id);

  if (!venue) {
    notFound();
  }

  return <EditVenueView venue={venue} />;
}
