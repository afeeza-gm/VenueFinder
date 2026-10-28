import type { Metadata } from 'next';
import { dbService } from '@/lib/db/store';
import AvailabilityView from './AvailabilityView';

export const metadata: Metadata = {
  title: 'Real-Time Slot Availability & Calendar',
  description:
    'Check real-time morning, evening, and full-day slot availability and maintenance calendars for all community halls across Dakshina Kannada.',
  alternates: {
    canonical: '/availability',
  },
  openGraph: {
    title: 'Real-Time Hall Availability & Slot Calendar | VenueFinder',
    description:
      'Check real-time morning, evening, and full-day slot availability and maintenance calendars for all community halls across Dakshina Kannada.',
    url: '/availability',
  },
};

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolved = await searchParams;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const todayStr = now.toISOString().split('T')[0];

  const venues = await dbService.getHalls();
  const selectedVenueId =
    typeof resolved?.venueId === 'string' && venues.some((v) => v.id === resolved.venueId)
      ? resolved.venueId
      : venues[0]?.id || 'hall-1';

  const [calendar, initialDayAvailability] = await Promise.all([
    dbService.getMonthlyCalendar(year, month, selectedVenueId),
    dbService.getAvailability(todayStr, selectedVenueId),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
          Public Availability & Slot Calendar
        </h1>
        <p className="text-sm text-neutral-600 mt-1 max-w-2xl">
          Select any community hall or auditorium by location to inspect real-time morning, evening, and full-day slot reservations.
        </p>
      </div>

      <AvailabilityView
        venues={venues}
        initialVenueId={selectedVenueId}
        initialYear={year}
        initialMonth={month}
        initialCalendar={calendar}
        initialDayAvailability={initialDayAvailability}
      />
    </div>
  );
}
