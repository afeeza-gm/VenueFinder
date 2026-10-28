import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { dbService } from '@/lib/db/store';
import MaintenanceView from './MaintenanceView';

export default async function AdminMaintenancePage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const [maintenance, venues] = await Promise.all([
    dbService.getMaintenance(),
    dbService.getHalls(),
  ]);

  return <MaintenanceView initialMaintenance={maintenance} venues={venues} />;
}
