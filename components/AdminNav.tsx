'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAdminAction } from '@/app/actions/admin';
import {
  CalendarDays,
  CreditCard,
  FilePlus2,
  FolderKanban,
  LogOut,
  Settings,
  ShieldCheck,
  Building,
} from 'lucide-react';

export default function AdminNav() {
  const pathname = usePathname();

  const links = [
    { href: '/admin/venues', label: 'Venues Manager', icon: Building },
    { href: '/admin/bookings', label: 'Booking Requests', icon: FolderKanban },
    { href: '/admin/bookings/new', label: 'New Offline Booking', icon: FilePlus2 },
    { href: '/admin/maintenance', label: 'Calendar & Maintenance', icon: CalendarDays },
    { href: '/admin/payments', label: 'Payments & Refunds', icon: CreditCard },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="bg-neutral-900 border-b border-neutral-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500 text-neutral-950 p-1.5 rounded-md font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide block uppercase text-amber-400">
                Admin Control Portal
              </span>
              <span className="text-xs text-neutral-400">Community Hall Management</span>
            </div>
          </div>

          <nav className="hidden lg:flex space-x-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-500 text-neutral-950 font-semibold'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center space-x-1"
            >
              <Building className="w-3.5 h-3.5" />
              <span>Public View</span>
            </Link>

            <form action={logoutAdminAction}>
              <button
                type="submit"
                className="inline-flex items-center space-x-1 text-xs bg-neutral-800 hover:bg-red-900/40 text-neutral-300 hover:text-red-300 px-3 py-1.5 rounded-md border border-neutral-700 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
