'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Users,
  Calendar,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  Building2,
  Phone,
  Mail,
  Sparkles,
  Eye,
  Clock,
  ShieldAlert,
  X,
  CreditCard,
  SlidersHorizontal,
  Heart,
  Star,
  Check,
  Share2,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { Hall, Facility, TimeSlot } from '@/types';
import { getVenueZone, formatImageUrl } from '@/lib/venue-utils';

interface VenuesExplorerProps {
  venues: Array<Hall & { facilities: Facility[]; timeSlots: TimeSlot[] }>;
  locations: string[];
}

const REGION_TABS = [
  { id: 'ALL', name: 'All Regions' },
  { id: 'ZONE_A', name: 'Sullia' },
  { id: 'ZONE_B', name: 'Puttur' },
  { id: 'ZONE_C', name: 'Bantwal & Highway' },
  { id: 'ZONE_D', name: 'Mangalore' },
];

export default function VenuesExplorer({ venues, locations }: VenuesExplorerProps) {
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [minCapacity, setMinCapacity] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'capacity-desc'>('featured');
  const [modalVenue, setModalVenue] = useState<(Hall & { facilities: Facility[]; timeSlots: TimeSlot[] }) | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Extract clean distinct areas
  const cleanLocations = Array.from(
    new Set(
      venues.map((v) => {
        const parts = v.location.split(',');
        return parts[0].trim();
      })
    )
  );

  const filteredVenues = venues
    .filter((venue) => {
      const zoneInfo = getVenueZone(venue);
      const matchesZone = selectedZone === 'ALL' || zoneInfo.id === selectedZone;

      const matchesLoc =
        selectedLocation === 'ALL' ||
        venue.location.toLowerCase().includes(selectedLocation.toLowerCase()) ||
        venue.address.toLowerCase().includes(selectedLocation.toLowerCase());

      const matchesCap = minCapacity === 0 || venue.capacity >= minCapacity;

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        venue.name.toLowerCase().includes(q) ||
        venue.location.toLowerCase().includes(q) ||
        venue.description.toLowerCase().includes(q) ||
        venue.address.toLowerCase().includes(q) ||
        zoneInfo.title.toLowerCase().includes(q) ||
        zoneInfo.code.toLowerCase().includes(q);

      return matchesZone && matchesLoc && matchesCap && matchesSearch;
    })
    .sort((a, b) => {
      const minPriceA = a.timeSlots.length ? Math.min(...a.timeSlots.map((s) => s.basePricePaise)) : 0;
      const minPriceB = b.timeSlots.length ? Math.min(...b.timeSlots.map((s) => s.basePricePaise)) : 0;

      if (sortBy === 'price-asc') return minPriceA - minPriceB;
      if (sortBy === 'price-desc') return minPriceB - minPriceA;
      if (sortBy === 'capacity-desc') return b.capacity - a.capacity;
      return 0;
    });

  return (
    <div className="space-y-8" id="venues-section">
      {/* Regional Filter Navigation Bar */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#717171] mr-1 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-[#ff385c]" />
            <span>Region:</span>
          </div>
          {REGION_TABS.map((tab) => {
            const count =
              tab.id === 'ALL'
                ? venues.length
                : venues.filter((v) => getVenueZone(v).id === tab.id).length;
            const isSelected = selectedZone === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedZone(tab.id);
                  setSelectedLocation('ALL');
                }}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center space-x-2 ${
                  isSelected
                    ? 'bg-[#222222] text-white shadow-sm'
                    : 'bg-white text-[#222222] border border-[#dddddd] hover:border-[#222222]'
                }`}
              >
                <span>{tab.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#f7f7f7] text-[#717171]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Locality Category Tabs (Horizontal Pill Rail) */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none border-b border-[#ebebeb]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#717171] mr-1 shrink-0">
            Local Area:
          </span>
          <button
            onClick={() => setSelectedLocation('ALL')}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedLocation === 'ALL'
                ? 'bg-[#ff385c] text-white shadow-xs'
                : 'bg-white text-[#717171] border border-[#dddddd] hover:border-[#222222] hover:text-[#222222]'
            }`}
          >
            All Localities ({cleanLocations.length})
          </button>
          {cleanLocations.map((loc) => {
            const count = venues.filter((v) => v.location.toLowerCase().includes(loc.toLowerCase())).length;
            const isSelected = selectedLocation.toLowerCase() === loc.toLowerCase();
            return (
              <button
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-[#ff385c] text-white shadow-xs'
                    : 'bg-white text-[#717171] border border-[#dddddd] hover:border-[#222222] hover:text-[#222222]'
                }`}
              >
                <span>{loc}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#f7f7f7] text-[#717171]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Integrated Floating Controls Bar */}
        <div className="bg-white rounded-2xl border border-[#ebebeb] p-3 sm:p-4 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Keyword Search */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-[#717171] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by hall name, location, zone, or features..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium text-[#222222] bg-[#f7f7f7] border border-transparent focus:border-[#222222] focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {/* Min Capacity Filter */}
          <div className="md:col-span-3 relative">
            <Users className="w-4 h-4 text-[#717171] absolute left-3.5 top-3" />
            <select
              value={minCapacity}
              onChange={(e) => setMinCapacity(Number(e.target.value))}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium text-[#222222] bg-[#f7f7f7] border border-transparent focus:border-[#222222] focus:bg-white focus:outline-none transition-colors cursor-pointer"
            >
              <option value={0}>Any Capacity</option>
              <option value={500}>500+ Guests</option>
              <option value={1000}>1,000+ Guests</option>
              <option value={1500}>1,500+ Guests</option>
              <option value={2000}>2,000+ Guests</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="md:col-span-4 relative">
            <SlidersHorizontal className="w-4 h-4 text-[#717171] absolute left-3.5 top-3" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium text-[#222222] bg-[#f7f7f7] border border-transparent focus:border-[#222222] focus:bg-white focus:outline-none transition-colors cursor-pointer"
            >
              <option value="featured">Sort: Featured Hub Order</option>
              <option value="price-asc">Price: Lowest to Highest</option>
              <option value="price-desc">Price: Highest to Lowest</option>
              <option value="capacity-desc">Capacity: Largest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Venues Grid Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-[#222222]">
            Showing {filteredVenues.length} {filteredVenues.length === 1 ? 'venue' : 'venues'}
          </span>
        </div>

        {(selectedZone !== 'ALL' || selectedLocation !== 'ALL' || search || minCapacity > 0) && (
          <button
            onClick={() => {
              setSelectedZone('ALL');
              setSelectedLocation('ALL');
              setSearch('');
              setMinCapacity(0);
              setSortBy('featured');
            }}
            className="text-xs font-semibold text-[#ff385c] hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Nine-Venue Grid */}
      {filteredVenues.length === 0 ? (
        <div className="text-center py-16 bg-[#f7f7f7] rounded-3xl border border-[#ebebeb] space-y-4">
          <Building2 className="w-12 h-12 text-[#b0b0b0] mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#222222]">No venues match your criteria</h3>
            <p className="text-xs text-[#717171] max-w-sm mx-auto">
              Try adjusting your zone selection, locality, guest capacity, or search keyword.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedZone('ALL');
              setSelectedLocation('ALL');
              setSearch('');
              setMinCapacity(0);
            }}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-[#222222] hover:bg-black text-white px-5 py-2.5 rounded-full transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {filteredVenues.map((venue, idx) => {
            const zone = getVenueZone(venue);
            const minPrice = venue.timeSlots.length
              ? Math.min(...venue.timeSlots.map((s) => s.basePricePaise))
              : 2500000;
            const isFav = !!favorites[venue.id];
            const imgSrc = formatImageUrl(venue.imageUrl);

            // Rating
            const rating = (4.88 + ((idx * 3) % 11) / 100).toFixed(2);
            const reviewCount = 34 + (idx * 11) % 65;

            return (
              <div
                key={venue.id}
                className="group cursor-pointer flex flex-col space-y-3 bg-white rounded-2xl transition-all"
              >
                {/* 4:3 Photograph Container */}
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#f7f7f7] border border-[#ebebeb]/80">
                  <Link href={`/venues/${venue.id}`}>
                    <img
                      src={imgSrc}
                      alt={venue.name}
                      onError={(e) => {
                        // graceful fallback if browser fails relative path
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </Link>

                  {/* Top-Left: Region Tag */}
                  <div className="absolute top-3 left-3">
                    <span className="text-[11px] font-medium text-[#222222] bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-xs">
                      {zone.title}
                    </span>
                  </div>

                  {/* Top-Right: Wishlist Heart Button */}
                  <button
                    onClick={(e) => toggleFavorite(venue.id, e)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#222222] hover:bg-white active:scale-90 transition-all shadow-xs"
                    aria-label="Save to Wishlist"
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${
                        isFav ? 'fill-[#ff385c] text-[#ff385c]' : 'text-[#222222]'
                      }`}
                    />
                  </button>

                  {/* Bottom Quick Actions Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setModalVenue(venue)}
                      className="bg-white/95 backdrop-blur-md text-[#222222] hover:bg-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm flex items-center space-x-1 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#717171]" />
                      <span>Quick Details</span>
                    </button>

                    <Link
                      href={`/book?venueId=${venue.id}`}
                      className="bg-[#ff385c] hover:bg-[#e00b41] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-sm flex items-center space-x-1 transition-all"
                    >
                      <span>Reserve</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Typography Metadata */}
                <div className="space-y-1.5 block">
                  {/* Row 1: Location & Rating */}
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-semibold text-xs text-[#555555] tracking-tight truncate flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-[#ff385c] shrink-0 inline" />
                      <span className="truncate">{venue.location}</span>
                    </span>
                    <div className="flex items-center space-x-1 shrink-0 text-xs text-[#222222]">
                      <Star className="w-3.5 h-3.5 fill-[#222222] text-[#222222]" />
                      <span className="font-semibold">{rating}</span>
                      <span className="text-[#717171] text-[11px]">({reviewCount})</span>
                    </div>
                  </div>

                  {/* Row 2: Venue Name */}
                  <Link href={`/venues/${venue.id}`} className="hover:text-[#ff385c] transition-colors block">
                    <h3 className="text-base font-bold text-[#222222] tracking-tight leading-snug">
                      {venue.name}
                    </h3>
                  </Link>

                  {/* Row 3: Description (Exact prompt-provided description) */}
                  <p className="text-xs text-[#555555] line-clamp-2 leading-relaxed">
                    {venue.description}
                  </p>

                  {/* Row 4: Capacity & Slots */}
                  <div className="text-[11px] text-[#717171] flex items-center space-x-2 pt-0.5">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3 h-3 text-[#717171]" />
                      <span>Seats up to {venue.capacity}</span>
                    </span>
                    <span>&middot;</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-[#717171]" />
                      <span>{venue.timeSlots.length} daily slots</span>
                    </span>
                  </div>

                  {/* Row 5: Pricing & Advance */}
                  <div className="pt-1.5 flex items-baseline justify-between border-t border-[#f0f0f0] text-sm text-[#222222]">
                    <div className="flex items-baseline space-x-1">
                      <span className="font-extrabold text-[#222222]">
                        &#8377;{(minPrice / 100).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-[#717171] font-normal">starts per slot</span>
                    </div>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
                      25% Advance Hold
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick View Inspection Modal */}
      {modalVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto airbnb-sticky-shadow border border-[#ebebeb] p-6 sm:p-8 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setModalVenue(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f7f7f7] hover:bg-[#ebebeb] flex items-center justify-center text-[#222222] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Hero */}
            <div className="space-y-4">
              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-[#f7f7f7]">
                <img
                  src={formatImageUrl(modalVenue.imageUrl)}
                  alt={modalVenue.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-[#222222] shadow-xs">
                  {getVenueZone(modalVenue).title}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#222222]">{modalVenue.name}</h3>
                <p className="text-xs text-[#717171] mt-0.5 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-[#ff385c]" />
                  <span>{modalVenue.location}</span>
                </p>
                <p className="text-xs text-[#3f3f3f] mt-3 leading-relaxed bg-[#f9f9f9] p-3 rounded-xl border border-[#ebebeb]">
                  {modalVenue.description}
                </p>
              </div>
            </div>

            {/* Capacity & Contacts */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-[#f7f7f7] rounded-2xl text-xs">
              <div>
                <span className="text-[#717171] block">Capacity</span>
                <span className="font-bold text-[#222222]">{modalVenue.capacity} Guests</span>
              </div>
              <div>
                <span className="text-[#717171] block">Helpline</span>
                <span className="font-bold text-[#222222]">{modalVenue.contactPhone}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[#717171] block">Inquiries</span>
                <span className="font-bold text-[#222222] truncate block">{modalVenue.contactEmail}</span>
              </div>
            </div>

            {/* Amenities Grid */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#222222]">Verified Features & Amenities</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {modalVenue.facilities.map((fac) => (
                  <div key={fac.id} className="flex items-center space-x-2 text-[#3f3f3f] bg-[#fdfdfd] p-2 rounded-lg border border-[#f0f0f0]">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-semibold block">{fac.name}</span>
                      {fac.description && <span className="text-[11px] text-[#717171] block">{fac.description}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Slots & Tariffs */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#222222]">Standard Slots & Tariffs</h4>
              <div className="space-y-2">
                {modalVenue.timeSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex justify-between items-center p-3 rounded-xl border border-[#ebebeb] text-xs bg-white"
                  >
                    <div>
                      <span className="font-semibold text-[#222222]">{slot.label}</span>
                      <span className="text-[#717171] block text-[11px]">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                    <span className="font-bold text-[#222222]">
                      &#8377;{(slot.basePricePaise / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-[#ebebeb] flex justify-end space-x-3">
              <button
                onClick={() => setModalVenue(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#717171] hover:text-[#222222] hover:bg-[#f7f7f7] transition-colors"
              >
                Close
              </button>
              <Link
                href={`/venues/${modalVenue.id}`}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#222222] border border-[#dddddd] hover:border-[#222222] transition-colors"
              >
                Full Details
              </Link>
              <Link
                href={`/book?venueId=${modalVenue.id}`}
                className="px-5 py-2 rounded-full text-xs font-semibold bg-[#ff385c] hover:bg-[#e00b41] text-white transition-colors flex items-center space-x-1"
              >
                <span>Reserve Slot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
