'use client';

import { useState } from 'react';
import {
  CalendarDays,
  Wrench,
  AlertTriangle,
  PlusCircle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Building2,
} from 'lucide-react';
import { Maintenance, TimeSlot, Hall, Facility } from '@/types';
import { createMaintenanceAction } from '@/app/actions/admin';

interface MaintenanceViewProps {
  initialMaintenance: Maintenance[];
  venues: Array<Hall & { facilities: Facility[]; timeSlots: TimeSlot[] }>;
}

export default function MaintenanceView({
  initialMaintenance,
  venues,
}: MaintenanceViewProps) {
  const [maintenanceList, setMaintenanceList] = useState<Maintenance[]>(initialMaintenance);

  const [selectedHallId, setSelectedHallId] = useState<string>(venues[0]?.id || '');
  const [filterHallId, setFilterHallId] = useState<string>('ALL');

  const currentVenue = venues.find((v) => v.id === selectedHallId) || venues[0];

  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotId, setSlotId] = useState<string>(''); // empty means full day
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !description.trim()) {
      setError('Please provide start date, end date, and maintenance description.');
      return;
    }

    setLoading(true);
    setError(null);
    setWarnings([]);
    setSuccessMsg(null);

    const res = await createMaintenanceAction({
      hallId: selectedHallId,
      slotId: slotId || null,
      startDate,
      endDate,
      description: description.trim(),
    });

    setLoading(false);

    if (res.success && res.maintenance) {
      setMaintenanceList((prev) => [res.maintenance!, ...prev]);
      setSuccessMsg(`Maintenance blockout scheduled for ${currentVenue?.name}.`);
      setDescription('');
      if (res.warnings && res.warnings.length > 0) {
        setWarnings(res.warnings);
      }
    } else {
      setError(res.error || 'Failed to schedule maintenance.');
    }
  };

  const filteredMaintenance =
    filterHallId === 'ALL'
      ? maintenanceList
      : maintenanceList.filter((m) => m.hallId === filterHallId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
          Calendar & Maintenance Management
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Schedule repair windows, deep cleaning, or facility upgrades across any community venue to block public slots.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Create Maintenance Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-neutral-900 font-bold text-base border-b border-neutral-100 pb-3">
            <Wrench className="w-4 h-4 text-amber-600" />
            <span>Schedule Maintenance Window</span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl space-y-1">
              <div className="font-bold flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Conflict Warnings Detected (FR-28)</span>
              </div>
              <ul className="list-disc ml-4 space-y-0.5">
                {warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Select Venue <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedHallId}
                onChange={(e) => {
                  setSelectedHallId(e.target.value);
                  setSlotId('');
                }}
                className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.location})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Affected Slot (Leave empty for Full Day)
              </label>
              <select
                value={slotId}
                onChange={(e) => setSlotId(e.target.value)}
                className="w-full p-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Entire Day (All Slots Blocked)</option>
                {currentVenue?.timeSlots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Description / Purpose <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Electrical rewiring, floor polishing, generator maintenance..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors shadow-xs disabled:opacity-50"
            >
              {loading ? 'Scheduling...' : 'Save Maintenance Blockout'}
            </button>
          </form>
        </div>

        {/* Existing Maintenance Windows List */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap justify-between items-center border-b border-neutral-100 pb-3 gap-2">
            <div className="font-bold text-neutral-900 text-base">
              Scheduled Maintenance Entries ({filteredMaintenance.length})
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-neutral-500">Filter:</span>
              <select
                value={filterHallId}
                onChange={(e) => setFilterHallId(e.target.value)}
                className="p-1.5 rounded-lg border border-neutral-200 text-xs"
              >
                <option value="ALL">All Venues</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredMaintenance.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                No active maintenance windows scheduled for this selection.
              </div>
            ) : (
              filteredMaintenance.map((m) => {
                const venueObj = venues.find((v) => v.id === m.hallId);
                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-neutral-900 flex items-center space-x-1.5">
                          <Building2 className="w-3.5 h-3.5 text-amber-600" />
                          <span>{venueObj?.name || m.hallId}</span>
                        </div>
                        <div className="text-[11px] text-neutral-500 flex items-center space-x-2 mt-0.5">
                          <span>
                            {m.startDate} {m.startDate !== m.endDate && `to ${m.endDate}`}
                          </span>
                          <span>•</span>
                          <span>
                            {m.slot?.label || (m.slotId ? `Slot: ${m.slotId}` : 'All Day Blockout')}
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        {m.status}
                      </span>
                    </div>

                    <p className="text-neutral-700 bg-white p-2.5 rounded-xl border border-neutral-200 leading-relaxed">
                      {m.description}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
