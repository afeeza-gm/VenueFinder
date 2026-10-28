'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  Plus,
  MapPin,
  Building2,
} from 'lucide-react';
import { Hall, Facility, TimeSlot } from '@/types';
import { updateVenueAction } from '@/app/actions/admin';
import ImageUploader from '@/components/ImageUploader';

const POPULAR_LOCATIONS = [
  'Indiranagar, Bengaluru',
  'Koramangala, Bengaluru',
  'Malleshwaram, Bengaluru',
  'Whitefield, Bengaluru',
  'Jayanagar, Bengaluru',
  'Bandra West, Mumbai',
  'Juhu, Mumbai',
  'Andheri East, Mumbai',
  'Connaught Place, New Delhi',
  'Hauz Khas, New Delhi',
  'Mylapore, Chennai',
  'T. Nagar, Chennai',
  'Jubilee Hills, Hyderabad',
  'Banjara Hills, Hyderabad',
  'Salt Lake City, Kolkata',
  'Park Street, Kolkata',
];

const STANDARD_FACILITIES = [
  { name: 'Air Conditioning', description: 'Central HVAC with multi-zone climate control' },
  { name: 'Power Backup', description: '125 kVA auto-switch diesel generator' },
  { name: 'Dining Hall', description: 'Dedicated dining hall with handwash stations' },
  { name: 'Parking Lot', description: 'Spacious four-wheeler & two-wheeler parking' },
  { name: 'Stage & Podium', description: 'Elevated wooden stage with focus spotlights' },
  { name: 'Bridal Suites', description: 'Air-conditioned dressing rooms with private baths' },
  { name: 'Commercial Kitchen', description: 'Industrial gas burners and steam equipment' },
  { name: 'Landscaped Lawns', description: 'Open garden party area' },
];

interface EditVenueViewProps {
  venue: Hall & { facilities?: Facility[]; timeSlots?: TimeSlot[] };
}

export default function EditVenueView({ venue }: EditVenueViewProps) {
  const router = useRouter();

  const [name, setName] = useState(venue.name);
  const [location, setLocation] = useState(venue.location);
  const [address, setAddress] = useState(venue.address);
  const [capacity, setCapacity] = useState<number>(venue.capacity);
  const [imageUrl, setImageUrl] = useState(venue.imageUrl || '');
  const [description, setDescription] = useState(venue.description);
  const [rules, setRules] = useState(venue.rules);
  const [contactPhone, setContactPhone] = useState(venue.contactPhone);
  const [contactEmail, setContactEmail] = useState(venue.contactEmail);

  // Time Slots
  const [slots, setSlots] = useState(
    (venue.timeSlots && venue.timeSlots.length > 0
      ? venue.timeSlots
      : [
          { id: 'morning', label: 'Morning Slot (8:00 AM – 1:00 PM)', startTime: '08:00', endTime: '13:00', priceRupees: 15000 },
          { id: 'evening', label: 'Evening Slot (3:30 PM – 10:30 PM)', startTime: '15:30', endTime: '22:30', priceRupees: 25000 },
          { id: 'fullday', label: 'Full Day (8:00 AM – 10:30 PM)', startTime: '08:00', endTime: '22:30', priceRupees: 35000 },
        ]
    ).map((s: any) => ({
      id: s.id,
      label: s.label,
      startTime: s.startTime,
      endTime: s.endTime,
      priceRupees: s.priceRupees !== undefined ? s.priceRupees : Math.round(s.basePricePaise / 100),
    }))
  );

  // Facilities
  const initialFacNames = venue.facilities?.map((f) => f.name) || [
    'Air Conditioning',
    'Power Backup',
    'Dining Hall',
    'Parking Lot',
  ];
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(initialFacNames);
  const [customFacility, setCustomFacility] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSlot = () => {
    setSlots((prev) => [
      ...prev,
      { id: `slot-new-${Date.now()}`, label: 'Custom Slot', startTime: '09:00', endTime: '15:00', priceRupees: 20000 },
    ]);
  };

  const handleRemoveSlot = (index: number) => {
    if (slots.length <= 1) {
      alert('At least one time slot is required.');
      return;
    }
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateSlot = (index: number, field: string, value: any) => {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const toggleFacility = (facName: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(facName) ? prev.filter((f) => f !== facName) : [...prev, facName]
    );
  };

  const handleAddCustomFacility = () => {
    if (!customFacility.trim()) return;
    if (!selectedFacilities.includes(customFacility.trim())) {
      setSelectedFacilities((prev) => [...prev, customFacility.trim()]);
    }
    setCustomFacility('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim() || !address.trim()) {
      setError('Please fill in venue name, location area, and address.');
      return;
    }

    if (slots.length === 0) {
      setError('Please configure at least one time slot.');
      return;
    }

    setLoading(true);
    setError(null);

    const formattedSlots = slots.map((s) => ({
      id: s.id,
      label: s.label,
      startTime: s.startTime,
      endTime: s.endTime,
      basePricePaise: Math.round(s.priceRupees * 100),
    }));

    const formattedFacilities = selectedFacilities.map((fName) => {
      const match = STANDARD_FACILITIES.find((sf) => sf.name === fName);
      return {
        name: fName,
        description: match?.description || 'Available on premises',
      };
    });

    const res = await updateVenueAction(venue.id, {
      name,
      location,
      address,
      capacity,
      description,
      rules,
      contactPhone,
      contactEmail,
      imageUrl,
      timeSlots: formattedSlots,
      facilities: formattedFacilities,
    });

    setLoading(false);

    if (res.success) {
      alert(`Venue "${name}" updated successfully!`);
      router.push('/admin/venues');
      router.refresh();
    } else {
      setError(res.error || 'Failed to update venue.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Edit Venue: {venue.name}
          </h1>
          <p className="text-xs text-neutral-500">
            Modify hall profile, location, address, tariffs, time slots, and amenities.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-8 text-xs"
      >
        {/* Section 1: Overview */}
        <div className="space-y-4">
          <h3 className="font-bold text-neutral-900 text-sm border-b border-neutral-100 pb-2">
            1. Venue Overview & Location
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1.5">
                Venue Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1.5">
                Location / Area <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                list="popular-locations-edit"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <datalist id="popular-locations-edit">
                {POPULAR_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
              <div className="flex flex-wrap gap-1 mt-1.5">
                <span className="text-[10px] text-neutral-400 mr-1">Quick pick:</span>
                {[
                  { label: 'Bengaluru', val: 'Malleshwaram, Bengaluru' },
                  { label: 'Mumbai', val: 'Bandra West, Mumbai' },
                  { label: 'Delhi', val: 'Connaught Place, New Delhi' },
                  { label: 'Chennai', val: 'Mylapore, Chennai' },
                  { label: 'Hyderabad', val: 'Jubilee Hills, Hyderabad' },
                  { label: 'Kolkata', val: 'Salt Lake City, Kolkata' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.label}
                    onClick={() => setLocation(item.val)}
                    className="text-[10px] text-[#ff385c] hover:text-[#e00b41] bg-[#fff0f2] px-1.5 py-0.5 rounded font-medium"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1.5">
                Full Physical Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1.5">
                Max Guest Capacity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={10}
                required
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 0)}
                className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1.5">
                Contact Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1.5">
                Contact Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <ImageUploader
              value={imageUrl}
              onChange={setImageUrl}
              label="Venue Cover Photo"
              helpText="Upload a high-resolution photo directly to Cloudinary storage or enter an existing image URL."
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1.5">
              Hall Description & Amenities
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1.5">
              Venue Rules & Guidelines
            </label>
            <textarea
              rows={4}
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Section 2: Time Slots & Tariffs */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
            <div>
              <h3 className="font-bold text-neutral-900 text-sm">
                2. Time Slots & Tariffs
              </h3>
              <p className="text-[11px] text-neutral-500">
                Update slot timings and prices for {name}.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddSlot}
              className="inline-flex items-center space-x-1 text-xs text-amber-700 hover:text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Slot</span>
            </button>
          </div>

          <div className="space-y-3">
            {slots.map((slot, index) => (
              <div
                key={index}
                className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
              >
                <div className="sm:col-span-5">
                  <label className="block text-[10px] font-semibold text-neutral-500 mb-0.5">Slot Label</label>
                  <input
                    type="text"
                    required
                    value={slot.label}
                    onChange={(e) => handleUpdateSlot(index, 'label', e.target.value)}
                    className="w-full p-2 rounded-xl border border-neutral-300 bg-white text-xs font-semibold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-semibold text-neutral-500 mb-0.5">Start Time</label>
                  <input
                    type="time"
                    required
                    value={slot.startTime}
                    onChange={(e) => handleUpdateSlot(index, 'startTime', e.target.value)}
                    className="w-full p-2 rounded-xl border border-neutral-300 bg-white text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-semibold text-neutral-500 mb-0.5">End Time</label>
                  <input
                    type="time"
                    required
                    value={slot.endTime}
                    onChange={(e) => handleUpdateSlot(index, 'endTime', e.target.value)}
                    className="w-full p-2 rounded-xl border border-neutral-300 bg-white text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-semibold text-neutral-500 mb-0.5">Tariff (INR)</label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    required
                    value={slot.priceRupees}
                    onChange={(e) => handleUpdateSlot(index, 'priceRupees', parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2 rounded-xl border border-neutral-300 bg-white text-xs font-bold text-amber-700"
                  />
                </div>

                <div className="sm:col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveSlot(index)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove Slot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Facilities */}
        <div className="space-y-4">
          <div className="border-b border-neutral-100 pb-2">
            <h3 className="font-bold text-neutral-900 text-sm">
              3. Amenities & Facilities Checklist
            </h3>
            <p className="text-[11px] text-neutral-500">
              Select or customize amenities for this venue.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STANDARD_FACILITIES.map((fac) => {
              const isChecked = selectedFacilities.includes(fac.name);
              return (
                <label
                  key={fac.name}
                  onClick={() => toggleFacility(fac.name)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-2 ${
                    isChecked
                      ? 'border-amber-600 bg-amber-50/50 text-neutral-900 font-semibold'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="mt-0.5 rounded text-amber-600"
                  />
                  <div>
                    <div className="text-xs">{fac.name}</div>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="text"
              placeholder="Add custom facility (e.g. Lawn Garden, Valet Parking)..."
              value={customFacility}
              onChange={(e) => setCustomFacility(e.target.value)}
              className="flex-1 p-2 rounded-xl border border-neutral-300 text-xs"
            />
            <button
              type="button"
              onClick={handleAddCustomFacility}
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold px-4 py-2 rounded-xl text-xs"
            >
              Add Facility
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold px-4 py-2.5 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-6 py-2.5 rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving Changes...' : 'Save Venue Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
