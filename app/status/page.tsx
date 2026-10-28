import type { Metadata } from 'next';
import StatusTracker from './StatusTracker';

export const metadata: Metadata = {
  title: 'Track Reservation Status',
  description:
    'Track your community hall booking request, check administrator approval status, and view the 48-hour payment hold expiration timer.',
  alternates: {
    canonical: '/status',
  },
  openGraph: {
    title: 'Track Reservation Status | VenueFinder',
    description:
      'Track your community hall booking request, check administrator approval status, and view the 48-hour payment hold expiration timer.',
    url: '/status',
  },
};

export default async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolved = await searchParams;
  const initialReference = typeof resolved?.reference === 'string' ? resolved.reference : undefined;
  const initialPhone = typeof resolved?.phone === 'string' ? resolved.phone : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="text-center max-w-xl mx-auto">
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
          Track Booking Status
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 mt-1">
          Enter your unique booking reference and registered contact number to inspect live status, approvals, and pay advance fees.
        </p>
      </div>

      <StatusTracker
        initialReference={initialReference}
        initialPhone={initialPhone}
      />
    </div>
  );
}
