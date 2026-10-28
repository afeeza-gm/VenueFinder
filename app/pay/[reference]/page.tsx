import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { dbService } from '@/lib/db/store';
import PaymentView from './PaymentView';

export const metadata: Metadata = {
  title: 'Secure Advance Payment Checkout',
  description: 'Complete your 25% advance reservation fee securely via Razorpay to confirm your slot lock.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params; // Await params in Next.js 16

  if (!reference) {
    notFound();
  }

  const booking = await dbService.getBookingByReference(reference);

  if (!booking) {
    notFound();
  }

  const venue = await dbService.getHall(booking.hallId);

  if (booking.status === 'CONFIRMED') {
    // Already paid, redirect to status
    redirect(`/status?reference=${booking.reference}&phone=${booking.applicantPhone}`);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <PaymentView booking={booking} venueName={venue?.name || 'Community Hall'} venueLocation={venue?.location} />
    </div>
  );
}
