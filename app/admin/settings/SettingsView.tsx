'use client';

import { useState } from 'react';
import {
  Settings,
  Building,
  CheckCircle2,
  AlertCircle,
  Save,
  Sliders,
  DollarSign,
  Clock,
} from 'lucide-react';
import { Hall, Setting, TimeSlot } from '@/types';
import { updateHallAction, updateSettingAction } from '@/app/actions/admin';

interface SettingsViewProps {
  hall: Hall & { facilities: any[]; timeSlots: TimeSlot[] };
  settings: Setting[];
}

export default function SettingsView({ hall, settings }: SettingsViewProps) {
  // Hall State
  const [name, setName] = useState(hall.name);
  const [address, setAddress] = useState(hall.address);
  const [capacity, setCapacity] = useState(hall.capacity);
  const [description, setDescription] = useState(hall.description);
  const [rules, setRules] = useState(hall.rules);
  const [contactPhone, setContactPhone] = useState(hall.contactPhone);
  const [contactEmail, setContactEmail] = useState(hall.contactEmail);

  // Settings Map with case-insensitive support
  const settingsMap = new Map(settings.map((s) => [s.key.toUpperCase(), s.value]));
  const [advancePercent, setAdvancePercent] = useState(
    settingsMap.get('ADVANCE_PERCENTAGE') || settingsMap.get('ADVANCE_PERCENT') || '25'
  );
  const [holdHours, setHoldHours] = useState(
    settingsMap.get('HOLD_HOURS') || settingsMap.get('HOLD_WINDOW_HOURS') || '48'
  );
  const [fullRefundDays, setFullRefundDays] = useState(
    settingsMap.get('CANCELLATION_FULL_DAYS') || settingsMap.get('CANCELLATION_FULL_REFUND_DAYS') || '7'
  );
  const [partialRefundDays, setPartialRefundDays] = useState(
    settingsMap.get('CANCELLATION_PARTIAL_DAYS') || settingsMap.get('CANCELLATION_PARTIAL_REFUND_DAYS') || '3'
  );

  const [savingHall, setSavingHall] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [hallMsg, setHallMsg] = useState<string | null>(null);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  const handleSaveHall = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHall(true);
    setHallMsg(null);

    const res = await updateHallAction({
      name,
      address,
      capacity,
      description,
      rules,
      contactPhone,
      contactEmail,
    });

    setSavingHall(false);
    if (res.success) {
      setHallMsg('Hall details saved successfully.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg(null);

    await Promise.all([
      updateSettingAction('ADVANCE_PERCENTAGE', advancePercent),
      updateSettingAction('advance_percentage', advancePercent),
      updateSettingAction('HOLD_HOURS', holdHours),
      updateSettingAction('hold_window_hours', holdHours),
      updateSettingAction('CANCELLATION_FULL_DAYS', fullRefundDays),
      updateSettingAction('cancellation_full_refund_days', fullRefundDays),
      updateSettingAction('CANCELLATION_PARTIAL_DAYS', partialRefundDays),
      updateSettingAction('cancellation_partial_refund_days', partialRefundDays),
    ]);

    setSavingSettings(false);
    setSettingsMsg('Policy settings updated successfully.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
          Hall Profile & System Configuration
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Update public hall details, advance percentage tariffs, payment hold windows, and cancellation policies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Hall Details Form (FR-2) */}
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-neutral-900 font-bold text-base border-b border-neutral-100 pb-3">
            <Building className="w-4 h-4 text-amber-600" />
            <span>Public Hall Information</span>
          </div>

          {hallMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{hallMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveHall} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Hall Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Capacity (Guests)</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Rules & Guidelines</label>
              <textarea
                rows={4}
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs font-mono focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingHall}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-xs"
            >
              {savingHall ? 'Saving...' : 'Update Hall Details'}
            </button>
          </form>
        </div>

        {/* System Settings & Policies */}
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-neutral-900 font-bold text-base border-b border-neutral-100 pb-3">
            <Sliders className="w-4 h-4 text-amber-600" />
            <span>Booking & Payment Policies</span>
          </div>

          {settingsMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{settingsMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Advance Required Percentage (%)
              </label>
              <input
                type="number"
                step="any"
                min={0}
                max={100}
                value={advancePercent}
                onChange={(e) => setAdvancePercent(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[10px] text-neutral-400 mt-0.5 block">
                Percentage of slot tariff due upon approval to lock reservation.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Hold Window Duration (Hours)
              </label>
              <input
                type="number"
                min={1}
                max={168}
                value={holdHours}
                onChange={(e) => setHoldHours(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[10px] text-neutral-400 mt-0.5 block">
                Hours an approved booking slot is held before auto-releasing if unpaid.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  100% Refund Threshold (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  value={fullRefundDays}
                  onChange={(e) => setFullRefundDays(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  50% Refund Threshold (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  value={partialRefundDays}
                  onChange={(e) => setPartialRefundDays(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-xs"
            >
              {savingSettings ? 'Saving...' : 'Save Policy Settings'}
            </button>
          </form>

          {/* Time Slots Preview */}
          <div className="pt-4 border-t border-neutral-100">
            <div className="font-bold text-neutral-900 text-xs mb-2">Configured Time Slots & Base Prices</div>
            <div className="space-y-2">
              {hall.timeSlots.map((s) => (
                <div key={s.id} className="p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-semibold text-neutral-800">{s.label}</div>
                    <div className="text-[10px] text-neutral-500">{s.startTime} to {s.endTime}</div>
                  </div>
                  <div className="font-mono font-bold text-neutral-900">
                    ₹{(s.basePricePaise / 100).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
