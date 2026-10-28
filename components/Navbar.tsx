'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Calendar, FileText, Search, ShieldCheck, Sparkles, Globe, User } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null; // Admin has its own nav
  }

  const links = [
    { href: '/', label: 'Explore Venues' },
    { href: '/availability', label: 'Availability' },
    { href: '/book', label: 'Book a Hall' },
    { href: '/status', label: 'Check Status' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#ebebeb] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center gap-4">
          {/* Left: Brand Identity */}
          <div className="flex items-center shrink-0">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-full bg-[#ff385c] flex items-center justify-center text-white shadow-xs group-hover:bg-[#e00b41] transition-colors">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-[#ff385c] leading-none">
                  venuefinder
                </span>
                <span className="text-[11px] font-medium text-[#717171] mt-0.5">
                  Community Halls Network
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Search / Filter Capsule (Airbnb Signature Component) */}
          <div className="hidden md:flex items-center">
            <Link
              href="/#venues-section"
              className="inline-flex items-center bg-white border border-[#dddddd] rounded-full py-2 pl-6 pr-2 airbnb-search-shadow hover:shadow-md transition-shadow cursor-pointer text-sm font-medium text-[#222222]"
            >
              <span className="px-2 font-semibold text-xs border-r border-[#ebebeb]">Venues Across India</span>
              <span className="px-2 font-normal text-xs text-[#717171] border-r border-[#ebebeb]">Real-time Dates</span>
              <span className="px-2 font-normal text-xs text-[#717171]">50 - 2,000+ Guests</span>
              <div className="w-8 h-8 rounded-full bg-[#ff385c] text-white flex items-center justify-center ml-2 hover:bg-[#e00b41] transition-colors">
                <Search className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>

          {/* Right Navigation & Portal Access */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            <nav className="hidden lg:flex items-center space-x-1">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#f7f7f7] text-[#222222]'
                        : 'text-[#222222] hover:bg-[#f7f7f7]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <Link
              href="/admin/login"
              className="flex items-center space-x-2 border border-[#dddddd] rounded-full py-1.5 px-3 hover:shadow-sm transition-all text-[#222222] bg-white text-xs font-semibold"
              title="Official Portal Login"
            >
              <ShieldCheck className="w-4 h-4 text-[#ff385c]" />
              <span className="hidden sm:inline">Admin Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
