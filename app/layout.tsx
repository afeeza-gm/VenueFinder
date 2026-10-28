import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://venuefinder.in';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'VenueFinder | Community Halls & Auditoriums in Dakshina Kannada',
    template: '%s | VenueFinder',
  },
  description:
    'Discover and reserve verified community halls, marriage mandapams, and cultural auditoriums across Sullia, Puttur, Bantwal, and Mangalore. Real-time slot availability calendar and 48-hour advance hold.',
  keywords: [
    'community hall booking',
    'marriage halls dakshina kannada',
    'auditorium booking sullia',
    'kalyana mantapa puttur',
    'wedding venues mangalore',
    'samudaya bhavana booking karnataka',
    'hall reservation online',
    'marriage mandapam bantwal',
    'reception hall booking',
    'dakshina kannada venues',
    'venuefinder',
  ],
  authors: [{ name: 'VenueFinder Karnataka' }],
  creator: 'VenueFinder',
  publisher: 'VenueFinder',
  applicationName: 'VenueFinder',
  formatDetection: {
    email: false,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'VenueFinder | Community Halls & Auditoriums in Dakshina Kannada',
    description:
      'Discover and reserve verified community halls, marriage mandapams, and cultural auditoriums across Sullia, Puttur, Bantwal, and Mangalore. Real-time availability and 48-hour slot hold.',
    url: '/',
    siteName: 'VenueFinder',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/assets/images/sullia_navoor_ansariya_auditorium.jpg',
        width: 1200,
        height: 630,
        alt: 'VenueFinder Community Halls in Dakshina Kannada',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VenueFinder | Community Halls & Auditoriums in Dakshina Kannada',
    description:
      'Book verified community halls, marriage mandapams, and auditoriums across Sullia, Puttur, Bantwal, and Mangalore.',
    images: ['/assets/images/sullia_navoor_ansariya_auditorium.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'VenueFinder Dakshina Kannada',
  description:
    'Online community hall and auditorium reservation network across Sullia, Puttur, Bantwal, and Mangalore.',
  url: siteUrl,
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'Dakshina Kannada, Karnataka, India',
  },
  priceRange: '₹₹ - ₹₹₹₹',
  paymentAccepted: 'UPI, Credit Card, Net Banking, Razorpay',
  currenciesAccepted: 'INR',
};

const webSiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'VenueFinder',
  url: siteUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-[#222222] selection:bg-[#fff0f2] selection:text-[#ff385c]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
