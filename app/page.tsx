import type { Metadata } from 'next';
import Link from 'next/link';
import { dbService } from '@/lib/db/store';
import VenuesExplorer from '@/components/VenuesExplorer';
import {
  Sparkles,
  Calendar,
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Clock,
  ArrowRight,
  MapPin,
  Users,
  Search,
  Star,
  Shield,
  Award,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Community Halls & Marriage Auditoriums in Dakshina Kannada',
  description:
    'Browse verified community halls, samudaya bhavanas, and cultural auditoriums across Sullia, Puttur, Bantwal, and Mangalore. Real-time availability calendar, transparent pricing, and instant 48-hour slot reservations.',
  alternates: {
    canonical: '/',
  },
};

export default async function HomePage() {
  const [venues, locations] = await Promise.all([
    dbService.getHalls(),
    dbService.getLocations(),
  ]);

  const totalCapacity = venues.reduce((acc, v) => acc + v.capacity, 0);

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://venuefinder.in';
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Verified Community Venues & Auditoriums in Dakshina Kannada',
    description: 'Community halls, wedding mandapams, and auditoriums across Sullia, Puttur, Bantwal, and Mangalore.',
    itemListElement: venues.map((venue, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: venue.name,
      url: `${siteUrl}/venues/${venue.id}`,
    })),
  };

  return (
    <div className="bg-white text-[#222222]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      {/* Airbnb Hero Banner: Clean, Spacious Canvas with Intentional Typography */}
      <section className="pt-12 pb-14 px-4 sm:px-6 lg:px-8 border-b border-[#ebebeb]">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 bg-[#fff0f2] text-[#ff385c] px-4 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dakshina Kannada Community Venue Network</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#222222] leading-[1.12]">
            Discover & book community halls <br className="hidden sm:inline" />
            <span className="text-[#ff385c]">across Dakshina Kannada</span>
          </h1>

          <p className="text-sm sm:text-base text-[#717171] max-w-2xl mx-auto leading-relaxed">
            Browse verified auditoriums, samudaya bhavanas, and cultural pavilions across Sullia, Puttur, Bantwal, and Mangalore. Real-time availability, clear pricing, and 48-hour reservation holds.
          </p>

          {/* Quick Stats Ticker (Subtle 4-Pill Grid) */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-xs">
            <div className="p-3.5 rounded-2xl bg-[#f7f7f7] border border-[#ebebeb] text-center">
              <div className="text-xl font-bold text-[#222222]">{venues.length} Venues</div>
              <div className="text-[#717171] mt-0.5 text-[11px]">Dakshina Kannada</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#f7f7f7] border border-[#ebebeb] text-center">
              <div className="text-xl font-bold text-[#222222]">4 Regions</div>
              <div className="text-[#717171] mt-0.5 text-[11px]">Sullia, Puttur, Bantwal, Mangalore</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#f7f7f7] border border-[#ebebeb] text-center">
              <div className="text-xl font-bold text-[#222222]">{totalCapacity.toLocaleString()}</div>
              <div className="text-[#717171] mt-0.5 text-[11px]">Combined Guest Capacity</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#f7f7f7] border border-[#ebebeb] text-center">
              <div className="text-xl font-bold text-emerald-600">0 Double Bookings</div>
              <div className="text-[#717171] mt-0.5 text-[11px]">Atomic Slot Locks</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Browse & Explore Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">
        <div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-[#222222]">
              Explore Community Venues in Dakshina Kannada
            </h2>
            <p className="text-xs sm:text-sm text-[#717171] mt-1">
              Browse by region (Sullia, Puttur, Bantwal, Mangalore), guest capacity, and date availability.
            </p>
          </div>

          <VenuesExplorer venues={venues} locations={locations} />
        </div>

        {/* Airbnb Guest Favorite Award Lockup (Signature Component) */}
        <section className="bg-[#f7f7f7] rounded-3xl p-8 sm:p-14 border border-[#ebebeb] text-center max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-center space-x-4">
            {/* Left Laurel Wreath SVG */}
            <svg className="w-10 h-14 text-[#222222]" viewBox="0 0 40 56" fill="currentColor">
              <path d="M18 4C14 12 10 24 12 36C8 30 6 22 8 14C5 22 5 32 10 40C6 36 4 30 5 24C3 32 5 42 12 48C8 46 6 42 6 36C6 44 12 50 18 52C16 46 16 38 18 30C16 38 18 46 22 50C20 42 22 32 26 24C24 32 26 40 30 46C28 36 30 26 36 18C32 26 32 36 36 42C34 30 36 18 40 10C36 18 34 28 36 36C34 22 32 10 18 4Z" />
            </svg>

            <div className="space-y-1">
              <div className="text-5xl font-black tracking-tight text-[#222222]">4.94</div>
              <div className="flex justify-center text-[#222222] space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#222222]" />
                ))}
              </div>
            </div>

            {/* Right Laurel Wreath SVG */}
            <svg className="w-10 h-14 text-[#222222] scale-x-[-1]" viewBox="0 0 40 56" fill="currentColor">
              <path d="M18 4C14 12 10 24 12 36C8 30 6 22 8 14C5 22 5 32 10 40C6 36 4 30 5 24C3 32 5 42 12 48C8 46 6 42 6 36C6 44 12 50 18 52C16 46 16 38 18 30C16 38 18 46 22 50C20 42 22 32 26 24C24 32 26 40 30 46C28 36 30 26 36 18C32 26 32 36 36 42C34 30 36 18 40 10C36 18 34 28 36 36C34 22 32 10 18 4Z" />
            </svg>
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h3 className="text-xl font-bold tracking-tight text-[#222222]">
              Guest Favorite Community Venues
            </h3>
            <p className="text-xs sm:text-sm text-[#717171] leading-relaxed">
              Venues awarded Guest Favorite status are the top 5% of community halls across India based on host responsiveness, verified amenities, cleanliness, and punctual slot handover.
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/availability"
              className="inline-flex items-center space-x-2 bg-[#222222] hover:bg-black text-white text-xs font-semibold px-6 py-3 rounded-full transition-all"
            >
              <Calendar className="w-4 h-4 text-[#ff385c]" />
              <span>Check Live Calendar Availability</span>
            </Link>
          </div>
        </section>

        {/* 4-Step Reservation Architecture */}
        <section className="space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#ff385c]">
              Reservation Blueprint
            </span>
            <h3 className="text-2xl font-bold text-[#222222] mt-1">
              How booking a hall works
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-[#ebebeb] space-y-3 airbnb-card-hover">
              <div className="w-8 h-8 rounded-full bg-[#f7f7f7] border border-[#dddddd] text-[#222222] font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h4 className="font-semibold text-[#222222] text-sm">Pick Venue & Slot</h4>
              <p className="text-xs text-[#717171] leading-relaxed">
                Filter by neighborhood (Malleshwaram, Jayanagar, Whitefield), choose standard morning, evening, or full-day slots, and review transparent tariffs.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#ebebeb] space-y-3 airbnb-card-hover">
              <div className="w-8 h-8 rounded-full bg-[#f7f7f7] border border-[#dddddd] text-[#222222] font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h4 className="font-semibold text-[#222222] text-sm">Submit Online Request</h4>
              <p className="text-xs text-[#717171] leading-relaxed">
                Enter event details, expected guest count, and contact information with ₹0 upfront payment. Instant booking reference generated.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#ebebeb] space-y-3 airbnb-card-hover">
              <div className="w-8 h-8 rounded-full bg-[#f7f7f7] border border-[#dddddd] text-[#222222] font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h4 className="font-semibold text-[#222222] text-sm">Officer Review & 48h Hold</h4>
              <p className="text-xs text-[#717171] leading-relaxed">
                The hall authority reviews event purpose and grants approval, locking the slot with an exclusive 48-hour advance payment hold window.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#ebebeb] space-y-3 airbnb-card-hover">
              <div className="w-8 h-8 rounded-full bg-[#f7f7f7] border border-[#dddddd] text-[#222222] font-bold text-xs flex items-center justify-center">
                4
              </div>
              <h4 className="font-semibold text-[#222222] text-sm">Pay Advance & Confirm</h4>
              <p className="text-xs text-[#717171] leading-relaxed">
                Complete the 25% advance payment securely via Razorpay to receive an official booking confirmation and printable receipt.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Tracking Strip */}
        <section className="bg-white rounded-3xl p-8 border border-[#ebebeb] airbnb-card-shadow flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#ff385c]">
              Already reserved a date?
            </span>
            <h3 className="text-xl font-bold text-[#222222]">
              Track your reservation status & pay advance
            </h3>
            <p className="text-xs text-[#717171]">
              Use your reference code (e.g. CHMS-20261028-101) to verify committee approval and payment timers.
            </p>
          </div>

          <Link
            href="/status"
            className="shrink-0 px-6 py-3 rounded-full bg-[#222222] hover:bg-black text-white text-xs font-semibold transition-colors flex items-center space-x-2"
          >
            <Search className="w-4 h-4 text-[#ff385c]" />
            <span>Track Booking Status</span>
          </Link>
        </section>

        {/* Airbnb Inspiration Grid (Signature Component) */}
        <section className="space-y-6 pt-6 border-t border-[#ebebeb]">
          <div>
            <h3 className="text-xl font-bold text-[#222222]">
              Inspiration for community events in Bengaluru
            </h3>
            <p className="text-xs text-[#717171] mt-0.5">
              Popular community hall searches and event types across the city.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 text-xs">
            <div className="space-y-0.5">
              <div className="font-semibold text-[#222222]">Malleshwaram</div>
              <div className="text-[#717171] text-[11px]">Traditional Kalyana Mandapams</div>
            </div>
            <div className="space-y-0.5">
              <div className="font-semibold text-[#222222]">Jayanagar</div>
              <div className="text-[#717171] text-[11px]">Heritage Cultural Halls</div>
            </div>
            <div className="space-y-0.5">
              <div className="font-semibold text-[#222222]">Indiranagar</div>
              <div className="text-[#717171] text-[11px]">Boutique Party Pavilions</div>
            </div>
            <div className="space-y-0.5">
              <div className="font-semibold text-[#222222]">Koramangala</div>
              <div className="text-[#717171] text-[11px]">Modern Banquet Suites</div>
            </div>
            <div className="space-y-0.5">
              <div className="font-semibold text-[#222222]">Basavanagudi</div>
              <div className="text-[#717171] text-[11px]">Temple Adjacent Halls</div>
            </div>
            <div className="space-y-0.5">
              <div className="font-semibold text-[#222222]">Whitefield</div>
              <div className="text-[#717171] text-[11px]">Spacious Reception Lawns</div>
            </div>
            <div className="space-y-0.5">
              <div className="font-semibold text-[#222222]">Rajajinagar</div>
              <div className="text-[#717171] text-[11px]">Civic Community Centres</div>
            </div>
            <div className="space-y-0.5">
              <div className="font-semibold text-[#222222]">HSR Layout</div>
              <div className="text-[#717171] text-[11px]">Corporate & Seminar Spaces</div>
            </div>
            <div className="space-y-0.5">
              <div className="font-semibold text-[#222222]">Hebbal</div>
              <div className="text-[#717171] text-[11px]">Lakefront Banquet Halls</div>
            </div>
            <div className="space-y-0.5">
              <div className="font-semibold text-[#222222]">Banashankari</div>
              <div className="text-[#717171] text-[11px]">Grand Wedding Mandapams</div>
            </div>
            <div className="space-y-0.5">
              <div className="font-semibold text-[#222222]">Frazer Town</div>
              <div className="text-[#717171] text-[11px]">Community Social Halls</div>
            </div>
            <div className="space-y-0.5">
              <div className="font-semibold text-[#222222]">BTM Layout</div>
              <div className="text-[#717171] text-[11px]">Celebration & Sangeet Venues</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
