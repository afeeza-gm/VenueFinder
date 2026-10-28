import type { Metadata } from 'next';
import { dbService } from '@/lib/db/store';
import BookingForm from './BookingForm';

export const metadata: Metadata = {
  title: 'Reserve a Community Hall Online',
  description:
    'Submit an instant reservation request for verified community halls and auditoriums in Sullia, Puttur, Bantwal, and Mangalore with a 48-hour payment hold.',
  alternates: {
    canonical: '/book',
  },
  openGraph: {
    title: 'Reserve a Community Hall Online | VenueFinder',
    description:
      'Submit an instant reservation request for verified community halls and auditoriums in Sullia, Puttur, Bantwal, and Mangalore with a 48-hour payment hold.',
    url: '/book',
  },
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const venues = await dbService.getHalls();

  const preselectedVenueId =
    typeof resolvedSearchParams?.venueId === 'string' &&
    venues.some((v) => v.id === resolvedSearchParams.venueId)
      ? resolvedSearchParams.venueId
      : venues[0]?.id || 'hall-1';

  const preselectedDate =
    typeof resolvedSearchParams?.date === 'string' ? resolvedSearchParams.date : undefined;
  const preselectedSlotId =
    typeof resolvedSearchParams?.slotId === 'string' ? resolvedSearchParams.slotId : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="text-center max-w-xl mx-auto">
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
          Community Hall Booking Request
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 mt-1">
          Select any community hall, pick your slot, and submit your reservation request.
        </p>
      </div>

      <BookingForm
        venues={venues}
        initialVenueId={preselectedVenueId}
        preselectedDate={preselectedDate}
        preselectedSlotId={preselectedSlotId}
      />
    </div>
  );
}
