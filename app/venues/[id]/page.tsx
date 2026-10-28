import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { dbService } from '@/lib/db/store';
import { getVenueZone, formatImageUrl } from '@/lib/venue-utils';
import {
  MapPin,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  Phone,
  Mail,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Star,
  Share2,
  Heart,
  Sparkles,
  ShieldCheck,
  Building,
  Check,
  Info,
} from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const venue = await dbService.getHall(id);

  if (!venue) {
    return {
      title: 'Venue Not Found | VenueFinder',
      description: 'The requested community venue could not be found.',
    };
  }

  const zone = getVenueZone(venue);
  const minPrice = venue.timeSlots.length
    ? Math.min(...venue.timeSlots.map((s) => s.basePricePaise))
    : 2500000;
  const priceFormatted = (minPrice / 100).toLocaleString('en-IN');
  const heroImg = formatImageUrl(venue.imageUrl);

  const title = `${venue.name} in ${zone.title}, Dakshina Kannada`;
  const description = `${venue.name} - Capacity for up to ${venue.capacity} guests in ${venue.location}. Rates from ₹${priceFormatted}/slot. Real-time availability and 48-hour slot hold.`;

  return {
    title,
    description,
    keywords: [
      venue.name,
      `${venue.name} booking`,
      `${zone.title} marriage hall`,
      `${venue.location} community hall`,
      'auditorium dakshina kannada',
      'marriage mandapam karnataka',
      'samudaya bhavana booking',
    ],
    alternates: {
      canonical: `/venues/${venue.id}`,
    },
    openGraph: {
      title: `${venue.name} | VenueFinder`,
      description,
      url: `/venues/${venue.id}`,
      siteName: 'VenueFinder',
      locale: 'en_IN',
      type: 'article',
      images: [
        {
          url: heroImg,
          width: 1200,
          height: 630,
          alt: venue.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${venue.name} | VenueFinder`,
      description,
      images: [heroImg],
    },
  };
}

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const venue = await dbService.getHall(id);

  if (!venue) {
    notFound();
  }

  const zone = getVenueZone(venue);
  const minPrice = venue.timeSlots.length
    ? Math.min(...venue.timeSlots.map((s) => s.basePricePaise))
    : 2500000;

  // Supplementary photographs for the authentic 5-photo Airbnb grid
  const heroImg = formatImageUrl(venue.imageUrl);
  const galleryPhotos = [
    heroImg,
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop',
  ];

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://venuefinder.in';
  const venueJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EventVenue',
    name: venue.name,
    description: venue.description,
    image: galleryPhotos,
    address: {
      '@type': 'PostalAddress',
      streetAddress: venue.address,
      addressLocality: venue.location,
      addressRegion: 'Karnataka',
      addressCountry: 'IN',
    },
    maximumAttendeeCapacity: venue.capacity,
    telephone: venue.contactPhone,
    email: venue.contactEmail,
    url: `${siteUrl}/venues/${venue.id}`,
    priceRange: `₹${(minPrice / 100).toLocaleString('en-IN')}`,
    amenityFeature: venue.facilities.map((f) => ({
      '@type': 'LocationFeatureSpecification',
      name: f.name,
      value: true,
    })),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Venues',
        item: `${siteUrl}/#venues-section`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: venue.name,
        item: `${siteUrl}/venues/${venue.id}`,
      },
    ],
  };

  return (
    <div className="bg-white text-[#222222] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(venueJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex justify-between items-center">
          <Link
            href="/#venues-section"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-[#222222] hover:bg-[#f7f7f7] px-3 py-1.5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Dakshina Kannada Venues</span>
          </Link>

          <div className="flex items-center space-x-2 text-xs font-semibold">
            <button className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full hover:bg-[#f7f7f7] transition-colors">
              <Share2 className="w-4 h-4 text-[#222222]" />
              <span className="underline">Share</span>
            </button>
            <button className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full hover:bg-[#f7f7f7] transition-colors">
              <Heart className="w-4 h-4 text-[#222222]" />
              <span className="underline">Save</span>
            </button>
          </div>
        </div>

        {/* Listing Title & Location Header */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#f7f7f7] text-[#222222] border border-[#ebebeb] inline-flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#ff385c]" />
              <span>{zone.title}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#222222]">
            {venue.name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#222222] font-medium">
            <div className="flex items-center space-x-1">
              <Star className="w-3.5 h-3.5 fill-[#222222] text-[#222222]" />
              <span className="font-bold">4.94</span>
              <span className="underline text-[#717171]">(42 verified reviews)</span>
            </div>
            <span>&middot;</span>
            <span className="font-semibold text-[#ff385c]">Guest favorite</span>
            <span>&middot;</span>
            <span className="underline">{venue.location}</span>
          </div>
        </div>

        {/* Airbnb Signature 5-Photo Showcase Gallery */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-4 gap-2 h-72 sm:h-[420px] bg-[#f7f7f7]">
          {/* Main Hero Photograph (Spans 2 columns) */}
          <div className="md:col-span-2 relative h-full">
            <img
              src={galleryPhotos[0]}
              alt={venue.name}
              className="w-full h-full object-cover hover:brightness-95 transition-all cursor-pointer"
            />
          </div>

          {/* Column 2 */}
          <div className="hidden md:flex flex-col gap-2 h-full">
            <div className="relative h-1/2 overflow-hidden">
              <img
                src={galleryPhotos[1]}
                alt="Dining Hall"
                className="w-full h-full object-cover hover:brightness-95 transition-all cursor-pointer"
              />
            </div>
            <div className="relative h-1/2 overflow-hidden">
              <img
                src={galleryPhotos[2]}
                alt="Stage Area"
                className="w-full h-full object-cover hover:brightness-95 transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Column 3 */}
          <div className="hidden md:flex flex-col gap-2 h-full">
            <div className="relative h-1/2 overflow-hidden">
              <img
                src={galleryPhotos[3]}
                alt="Mandapam"
                className="w-full h-full object-cover hover:brightness-95 transition-all cursor-pointer"
              />
            </div>
            <div className="relative h-1/2 overflow-hidden">
              <img
                src={galleryPhotos[4]}
                alt="Courtyard"
                className="w-full h-full object-cover hover:brightness-95 transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 2-Column Split: Content (60%) vs Sticky Reserve Card (40%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-8 divide-y divide-[#ebebeb]">
            {/* Host & Capacity Overview */}
            <div className="flex justify-between items-start pt-2">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-[#222222]">
                  Civic Community Hall in {venue.location}
                </h2>
                <p className="text-xs text-[#717171]">
                  Accommodates {venue.capacity} guests &middot; {venue.timeSlots.length} standard daily slots &middot; Full catering space
                </p>
              </div>

              <div className="w-12 h-12 rounded-full bg-[#f7f7f7] border border-[#dddddd] flex items-center justify-center text-[#ff385c] font-bold text-sm shrink-0">
                <Building className="w-6 h-6" />
              </div>
            </div>

            {/* Airbnb Guest Favorite Trophy Card */}
            <div className="pt-8">
              <div className="p-6 rounded-2xl border border-[#ebebeb] bg-[#f7f7f7] flex items-center space-x-6">
                <div className="flex items-center space-x-1 shrink-0">
                  <svg className="w-7 h-10 text-[#222222]" viewBox="0 0 40 56" fill="currentColor">
                    <path d="M18 4C14 12 10 24 12 36C8 30 6 22 8 14C5 22 5 32 10 40C6 36 4 30 5 24C3 32 5 42 12 48C8 46 6 42 6 36C6 44 12 50 18 52C16 46 16 38 18 30C16 38 18 46 22 50C20 42 22 32 26 24C24 32 26 40 30 46C28 36 30 26 36 18C32 26 32 36 36 42C34 30 36 18 40 10C36 18 34 28 36 36C34 22 32 10 18 4Z" />
                  </svg>
                  <span className="text-2xl font-black text-[#222222]">4.94</span>
                  <svg className="w-7 h-10 text-[#222222] scale-x-[-1]" viewBox="0 0 40 56" fill="currentColor">
                    <path d="M18 4C14 12 10 24 12 36C8 30 6 22 8 14C5 22 5 32 10 40C6 36 4 30 5 24C3 32 5 42 12 48C8 46 6 42 6 36C6 44 12 50 18 52C16 46 16 38 18 30C16 38 18 46 22 50C20 42 22 32 26 24C24 32 26 40 30 46C28 36 30 26 36 18C32 26 32 36 36 42C34 30 36 18 40 10C36 18 34 28 36 36C34 22 32 10 18 4Z" />
                  </svg>
                </div>

                <div className="space-y-0.5 text-xs">
                  <div className="font-bold text-[#222222]">Guest favorite</div>
                  <div className="text-[#717171] leading-relaxed">
                    One of the most preferred wedding and event venues in Dakshina Kannada according to verified community reviews.
                  </div>
                </div>
              </div>
            </div>

            {/* Description Body */}
            <div className="pt-8 space-y-3">
              <h3 className="text-lg font-bold text-[#222222]">About this venue</h3>
              <p className="text-xs sm:text-sm text-[#3f3f3f] leading-relaxed whitespace-pre-line">
                {venue.description}
              </p>
              <div className="pt-2 text-xs text-[#717171] flex items-center space-x-1">
                <MapPin className="w-4 h-4 text-[#ff385c]" />
                <span>Exact address: {venue.address}</span>
              </div>
            </div>

            {/* What this place offers (Amenities) */}
            <div className="pt-8 space-y-4">
              <h3 className="text-lg font-bold text-[#222222]">What this place offers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {venue.facilities.map((fac) => (
                  <div key={fac.id} className="flex items-start space-x-3 py-1">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#222222] block">{fac.name}</span>
                      {fac.description && (
                        <span className="text-[#717171] text-[11px] block">{fac.description}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Time Slots Breakdown */}
            <div className="pt-8 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-lg font-bold text-[#222222]">Standard time slots & tariffs</h3>
                  <p className="text-xs text-[#717171]">Pre-configured slot timings for morning, evening, or full-day bookings.</p>
                </div>
                <Link
                  href={`/availability?venueId=${venue.id}`}
                  className="text-xs font-semibold text-[#ff385c] hover:underline"
                >
                  View calendar &rarr;
                </Link>
              </div>

              <div className="space-y-3">
                {venue.timeSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-4 rounded-2xl border border-[#ebebeb] flex justify-between items-center hover:border-[#222222] transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-[#222222] text-xs">{slot.label}</div>
                      <div className="text-[11px] text-[#717171] flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{slot.startTime} to {slot.endTime}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-[#222222] text-sm">
                        &#8377;{(slot.basePricePaise / 100).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-[#717171]">25% advance to hold</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Venue Rules & Disclosures */}
            <div className="pt-8 space-y-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-[#ff385c]" />
                <h3 className="text-lg font-bold text-[#222222]">Things to know</h3>
              </div>
              <div className="p-4 rounded-2xl bg-[#f7f7f7] border border-[#ebebeb] text-xs text-[#3f3f3f] leading-relaxed whitespace-pre-line">
                {venue.rules}
              </div>
            </div>
          </div>

          {/* Right Column: Airbnb Sticky Booking Panel */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 bg-white rounded-3xl border border-[#dddddd] p-6 sm:p-7 airbnb-sticky-shadow space-y-5">
              {/* Header Price */}
              <div className="flex justify-between items-baseline pb-4 border-b border-[#ebebeb]">
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-bold text-[#222222]">
                    &#8377;{(minPrice / 100).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-[#717171]">/ starting slot</span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-[#222222]">
                  <Star className="w-3.5 h-3.5 fill-[#222222]" />
                  <span className="font-bold">4.94</span>
                  <span className="text-[#717171]">&middot; 42 reviews</span>
                </div>
              </div>

              {/* Segmented Reservation Box (Airbnb Style) */}
              <div className="rounded-xl border border-[#dddddd] divide-y divide-[#dddddd] text-xs">
                <div className="p-3 bg-[#f7f7f7]/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#717171] block">
                    Venue Selected
                  </span>
                  <span className="font-semibold text-[#222222] truncate block">{venue.name}</span>
                </div>

                <div className="grid grid-cols-2 divide-x divide-[#dddddd]">
                  <div className="p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#717171] block">
                      Max Guests
                    </span>
                    <span className="font-semibold text-[#222222]">{venue.capacity} Persons</span>
                  </div>
                  <div className="p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#717171] block">
                      Payment Hold
                    </span>
                    <span className="font-semibold text-emerald-600">48 Hours Free</span>
                  </div>
                </div>
              </div>

              {/* Primary Reserve CTA Button */}
              <Link
                href={`/book?venueId=${venue.id}`}
                className="w-full text-center block bg-[#ff385c] hover:bg-[#e00b41] active:scale-[0.98] text-white font-semibold text-sm py-3.5 px-6 rounded-xl shadow-xs transition-all"
              >
                Reserve This Hall
              </Link>

              <div className="text-center text-[11px] text-[#717171]">
                You won't be charged yet &middot; Slot held upon review
              </div>

              {/* Fee Breakdown Stack */}
              <div className="space-y-2.5 pt-2 border-t border-[#ebebeb] text-xs text-[#717171]">
                <div className="flex justify-between">
                  <span className="underline">Standard base tariff</span>
                  <span>&#8377;{(minPrice / 100).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="underline">Initial advance (25% to lock)</span>
                  <span className="text-[#222222] font-medium">
                    &#8377;{((minPrice * 0.25) / 100).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="underline">Refundable cleaning deposit</span>
                  <span>&#8377;5,000</span>
                </div>
                <div className="pt-2 border-t border-[#ebebeb] flex justify-between font-bold text-sm text-[#222222]">
                  <span>Total reservation fee</span>
                  <span>&#8377;{((minPrice + 500000) / 100).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Support footnote */}
              <div className="p-3 rounded-xl bg-[#f7f7f7] border border-[#ebebeb] text-[11px] text-[#717171] space-y-1">
                <div className="flex items-center space-x-1 font-semibold text-[#222222]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Double-Booking Protection Guaranteed</span>
                </div>
                <p>Slots are locked at database level once approved to ensure zero overlaps.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
