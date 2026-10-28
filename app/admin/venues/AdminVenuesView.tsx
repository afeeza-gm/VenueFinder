'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  PlusCircle,
  MapPin,
  Users,
  Edit3,
  Trash2,
  ExternalLink,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Hall, Facility, TimeSlot } from '@/types';
import { deleteVenueAction } from '@/app/actions/admin';

interface AdminVenuesViewProps {
  initialVenues: Array<Hall & { facilities: Facility[]; timeSlots: TimeSlot[] }>;
}

export default function AdminVenuesView({ initialVenues }: AdminVenuesViewProps) {
  const [venues, setVenues] = useState(initialVenues);
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const distinctLocations = Array.from(new Set(venues.map((v) => v.location)));

  const filteredVenues = venues.filter((v) => {
    const matchesLoc = selectedLocation === 'ALL' || v.location === selectedLocation;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.location.toLowerCase().includes(q) ||
      v.address.toLowerCase().includes(q);
    return matchesLoc && matchesSearch;
  });

  const handleDelete = async (venue: Hall) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete "${venue.name}" in ${venue.location}?\n\nThis will remove the venue, its time slots, facilities, and maintenance blocks.\n\nNote: Deletion will be rejected if there are active pending or confirmed bookings.`
    );
    if (!confirmDelete) return;

    setDeletingId(venue.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await deleteVenueAction(venue.id);
    setDeletingId(null);

    if (res.success) {
      setVenues((prev) => prev.filter((v) => v.id !== venue.id));
      setSuccessMsg(`Venue "${venue.name}" was successfully removed.`);
    } else {
      setErrorMsg(res.error || 'Failed to delete venue.');
    }
  };

  const totalCapacity = venues.reduce((acc, v) => acc + v.capacity, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Venues & Halls Manager
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Add new halls by location, update tariffs and amenities, manage time slots, or remove venues.
          </p>
        </div>

        <Link
          href="/admin/venues/new"
          className="inline-flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Venue</span>
        </Link>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
          <div className="text-xs font-semibold text-neutral-500 uppercase">Total Managed Venues</div>
          <div className="text-3xl font-extrabold text-neutral-900 mt-2">{venues.length}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Active community halls</div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
          <div className="text-xs font-semibold text-neutral-500 uppercase">Locations Covered</div>
          <div className="text-3xl font-extrabold text-amber-600 mt-2">{distinctLocations.length}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Localities across city</div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
          <div className="text-xs font-semibold text-neutral-500 uppercase">Combined Guest Capacity</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">{totalCapacity.toLocaleString()}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Max simultaneous capacity</div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search & Location Filter Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search venue by name, area or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs py-1.5 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-amber-600" />
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Locations ({venues.length})</option>
            {distinctLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Venues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVenues.map((venue) => {
          const minPrice = venue.timeSlots.length
            ? Math.min(...venue.timeSlots.map((s) => s.basePricePaise))
            : 0;

          return (
            <div
              key={venue.id}
              className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 w-full bg-neutral-100">
                  <img
                    src={
                      venue.imageUrl ||
                      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop'
                    }
                    alt={venue.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-neutral-950/80 backdrop-blur-md text-white text-[11px] font-semibold px-2 py-0.5 rounded-lg flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{venue.location}</span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-bold text-neutral-900 text-base">{venue.name}</h3>
                    <p className="text-xs text-neutral-500 line-clamp-2 mt-1">
                      {venue.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] bg-neutral-50 p-2.5 rounded-xl border border-neutral-100 text-center">
                    <div>
                      <span className="text-neutral-400 block">Capacity</span>
                      <strong className="text-neutral-800">{venue.capacity}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Slots</span>
                      <strong className="text-neutral-800">{venue.timeSlots.length}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">From</span>
                      <strong className="text-amber-700">₹{(minPrice / 100).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  <div className="text-[11px] text-neutral-500 space-y-0.5">
                    <div className="truncate"><strong>Address:</strong> {venue.address}</div>
                    <div><strong>Contact:</strong> {venue.contactPhone}</div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-neutral-100 mt-4 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-1">
                  <Link
                    href={`/venues/${venue.id}`}
                    target="_blank"
                    className="text-neutral-600 hover:text-neutral-900 p-1.5 rounded-lg hover:bg-neutral-100 text-xs font-semibold inline-flex items-center space-x-1"
                    title="View Public Page"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View</span>
                  </Link>
                  <Link
                    href={`/availability?venueId=${venue.id}`}
                    target="_blank"
                    className="text-amber-700 hover:text-amber-800 p-1.5 rounded-lg hover:bg-amber-50 text-xs font-semibold inline-flex items-center space-x-1"
                    title="Inspect Calendar"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Calendar</span>
                  </Link>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    href={`/admin/venues/${venue.id}/edit`}
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </Link>

                  <button
                    type="button"
                    disabled={deletingId === venue.id}
                    onClick={() => handleDelete(venue)}
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-200 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deletingId === venue.id ? 'Deleting...' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
