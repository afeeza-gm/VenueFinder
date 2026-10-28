import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { dbService } from '@/lib/db/store';
import SettingsView from './SettingsView';

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const [hall, settings] = await Promise.all([
    dbService.getHall(),
    dbService.getSettings(),
  ]);

  if (!hall) {
    redirect('/admin/venues');
  }

  return <SettingsView hall={hall} settings={settings} />;
}
