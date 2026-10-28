import Link from 'next/link';
import { Building2, Globe, Shield, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#f7f7f7] text-[#222222] border-t border-[#ebebeb] mt-24 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top Directory Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-[#ebebeb]">
          <div className="space-y-3">
            <h4 className="font-semibold text-[#222222]">Explore Localities</h4>
            <ul className="space-y-2 text-[#717171]">
              <li><Link href="/#venues-section" className="hover:underline">Malleshwaram Mandapams</Link></li>
              <li><Link href="/#venues-section" className="hover:underline">Jayanagar Community Halls</Link></li>
              <li><Link href="/#venues-section" className="hover:underline">Indiranagar Event Pavilions</Link></li>
              <li><Link href="/#venues-section" className="hover:underline">Koramangala Banquet Spaces</Link></li>
              <li><Link href="/#venues-section" className="hover:underline">Whitefield Wedding Lawns</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-[#222222]">Booking Assistance</h4>
            <ul className="space-y-2 text-[#717171]">
              <li><Link href="/availability" className="hover:underline">Slot Availability Calendar</Link></li>
              <li><Link href="/book" className="hover:underline">Submit Online Reservation</Link></li>
              <li><Link href="/status" className="hover:underline">Track Booking Application</Link></li>
              <li><span className="hover:underline cursor-pointer">Help Centre & FAQs</span></li>
              <li><span className="hover:underline cursor-pointer">Cancellation & Refund Rules</span></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-[#222222]">Civic Governance</h4>
            <ul className="space-y-2 text-[#717171]">
              <li><span className="hover:underline cursor-pointer">BBMP Multi-Venue Guidelines</span></li>
              <li><span className="hover:underline cursor-pointer">Sound & Decibel Limits</span></li>
              <li><span className="hover:underline cursor-pointer">Fire Safety & Green Protocol</span></li>
              <li><span className="hover:underline cursor-pointer">Waste Segregation Rules</span></li>
              <li><span className="hover:underline cursor-pointer">Catering & Kitchen Norms</span></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-[#222222]">VenueFinder Network</h4>
            <p className="text-[#717171] leading-relaxed">
              Bengaluru's official community hall reservation system. Preventing double-bookings through atomic transactional locks and supporting instant advance payments via Razorpay.
            </p>
            <div className="pt-2">
              <Link
                href="/admin/login"
                className="inline-flex items-center space-x-1.5 font-semibold text-[#ff385c] hover:underline"
              >
                <span>Officer & Admin Login &rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Currency Bar */}
        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[#717171]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>&copy; {new Date().getFullYear()} VenueFinder Inc.</span>
            <span>&middot;</span>
            <span className="hover:underline cursor-pointer">Privacy</span>
            <span>&middot;</span>
            <span className="hover:underline cursor-pointer">Terms</span>
            <span>&middot;</span>
            <span className="hover:underline cursor-pointer">Sitemap</span>
            <span>&middot;</span>
            <span className="hover:underline cursor-pointer">Hall Trust & Safety</span>
          </div>

          <div className="flex items-center space-x-4 font-semibold text-[#222222]">
            <div className="flex items-center space-x-1.5 cursor-pointer hover:underline">
              <Globe className="w-4 h-4" />
              <span>English (IN)</span>
            </div>
            <div className="cursor-pointer hover:underline">
              <span>&#8377; INR</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
