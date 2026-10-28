import type { Metadata } from 'next';
import { getAdminSession } from '@/lib/auth';
import AdminNav from '@/components/AdminNav';

export const metadata: Metadata = {
  title: 'Admin Portal',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  return (
    <div className="min-h-full bg-neutral-100 flex flex-col">
      {session && <AdminNav />}
      <div className="flex-1">{children}</div>
    </div>
  );
}
