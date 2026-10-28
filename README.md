# VenueFinder — Community Hall & Auditorium Reservation Network

A full-stack web application for discovering, checking real-time availability, and reserving community halls, marriage mandapams, and cultural auditoriums across **Dakshina Kannada, Karnataka** (covering **Sullia, Puttur, Bantwal & Highway, and Mangalore**).

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **Native MySQL (`mysql2` connection pooling)**, **Cloudinary**, and **Razorpay**.

---

## 🏛️ System Features

### Public Portal (Applicant / Visitor)
- **Modern Venue Explorer (`/`)**:
  - Filter across 4 regional territories: **Sullia**, **Puttur**, **Bantwal & Highway**, and **Mangalore**.
  - Secondary filter by specific locality (Navoor, Tenkila, Bannur, Neralkatte, Panemangalore, Adyar, Maravoor, etc.).
  - Instant search by hall name, location, or description.
  - Guest capacity threshold selector (500+, 1,000+, 1,500+, 2,000+).
  - Sorting by featured hub order, starting price, and guest capacity.
- **Venue Profile & Showcase (`/venues/[id]`)**:
  - 5-photograph showcase gallery with authentic venue photography.
  - Comprehensive venue profile: seating capacity, rules & civic guidelines, contact details, daily slot pricing breakdowns.
  - Interactive facility chips (dining halls, generator backup, AC, bridal dressing suites, parking capacity).
- **Interactive Availability Calendar (`/availability`)**:
  - Monthly calendar view with real-time indicators: *Available*, *Partially Booked*, *Booked*, and *Under Maintenance*.
  - Slot-level inspection: inspect morning, evening, and full-day booking status for any date.
- **3-Step Booking Request Form (`/book`)**:
  - Stepwise venue and slot selection with live availability validation.
  - Contact information and guest count verification.
  - Instant unique reference generation (e.g. `DK-YYYYMMDD-XXX`) with automatic 25% advance calculation.
- **Booking Status Tracker (`/status`)**:
  - Lookup by reference number and registered phone number.
  - Visual 4-step lifecycle stepper (*Pending Review* → *Approved / Awaiting Payment* → *Confirmed* / *Rejected*).
  - Live 48-hour payment hold countdown timer.
  - Self-service cancellation with automatic policy refund estimation.
- **Razorpay Checkout & Payment (`/pay/[reference]`)**:
  - 25% advance fee collection via Razorpay (UPI, NetBanking, Debit/Credit Cards).
  - Server-side cryptographic HMAC-SHA256 signature verification.
  - Simulation mode for local test checkout without live credentials.
  - Downloadable printable confirmation receipts.

---

### Administrator Portal (`/admin`)
- **Secure Authentication (`/admin/login`)**:
  - Bcrypt hashed passwords, HTTP-only JWT sessions, role-based authorization (*SUPER_ADMIN* and *ADMIN*).
- **Booking Review Queue (`/admin/bookings`)**:
  - Real-time review queue of pending applicant submissions.
  - **One-click Approval**: Atomically locks the slot with an `active_slot_key` and initiates the 48-hour advance payment hold window.
  - **Rejection with Reason**: Releases pending holds with mandatory applicant justification.
- **Offline / Walk-in Booking (`/admin/bookings/new`)**:
  - Manual booking entry for telephone and walk-in applicants.
  - Direct recording of cash / offline UPI payments with instant slot confirmation.
- **Venue & Hall Manager (`/admin/venues`)**:
  - Full CRUD management of community halls.
  - Cloudinary direct image uploads for venue cover photography.
  - Configure daily time slots (morning, evening, full day) and custom pricing in paise.
- **Calendar & Maintenance Scheduler (`/admin/maintenance`)**:
  - Block whole days or specific time slots for routine maintenance, inspections, or VIP civic events.
  - Overlap collision detection warning against existing confirmed bookings.
- **Payments, Refunds & CSV Export (`/admin/payments`)**:
  - Transaction ledger monitoring all Razorpay and offline transactions.
  - Issue full or partial refunds via the Razorpay Refunds API.
  - One-click CSV export (`/api/export/bookings`) of all bookings with status, revenue, and contact metadata.
  - Complete immutable audit log trail recording all administrator actions.
- **Hall & Policy Settings (`/admin/settings`)**:
  - Configurable advance payment percentage (default 25%).
  - Configurable payment hold window (default 48 hours).
  - Configurable cancellation refund thresholds (100% refund for 7+ days, 50% for 3–7 days).

---

## 🔍 Strong SEO & Structured Data

The application includes full native Next.js 16 SEO architecture:
- **Dynamic Metadata & OpenGraph**: Customized titles, descriptions, and OpenGraph/Twitter summary cards on all public pages.
- **Venue Detail SEO (`/venues/[id]`)**: Live dynamic `generateMetadata()` tailored per venue with pricing, location, and canonical tags.
- **Schema.org Structured Data (JSON-LD)**:
  - `WebSite` with `SearchAction` capability.
  - `LocalBusiness` / `Organization` schema representing the Dakshina Kannada network.
  - `ItemList` schema for Google search rich result carousels on the homepage.
  - `EventVenue` schema with attendee capacity, amenity feature specifications, and pricing.
  - `BreadcrumbList` navigation schema for Google search result trails.
- **Automated XML Sitemap (`/sitemap.xml`)**: Generated by [`app/sitemap.ts`](file:///D:/Project/community%20project/venuefinder/app/sitemap.ts) including all static routes and dynamic venue pages.
- **Crawler Directives (`/robots.txt`)**: Generated by [`app/robots.ts`](file:///D:/Project/community%20project/venuefinder/app/robots.ts) with `disallow` protection for `/admin/`, `/api/`, and checkout pages.

---

## 🔒 Double-Booking Prevention & Concurrency

Double bookings are strictly prevented at both the database and application levels:
1. **Unique Key Constraint**:
   - The database maintains a unique constraint on `active_slot_key` formatted as:
     ```
     [hall_id]_[event_date]_[slot_id]
     ```
   - This key is populated only when a booking enters `APPROVED_AWAITING_PAYMENT` or `CONFIRMED`. Any conflicting reservation attempt is rejected immediately.
2. **Atomic Verification**:
   - Availability checking, supervisor approvals, and manual bookings verify slot status and maintenance conflicts before committing state.
3. **Automated Expiry Cron (`/api/cron/release-holds`)**:
   - Approved bookings that are not paid within the configured hold window (48 hours) auto-expire, releasing the slot lock for other applicants.

---

## 🔐 Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@communityhall.gov.in` | `admin123` |
| **Venue Supervisor** | `supervisor@communityhall.gov.in` | `supervisor123` |

### Sample Bookings for Evaluation
- **Confirmed Booking**: Reference `DK-20261028-101`, Phone `9448112233`
- **Pending Review**: Reference `DK-20261030-102`, Phone `9448223344`
- **Approved (Hold Active)**: Reference `DK-20261102-103`, Phone `9448334455`

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory (see `.env.example`):
```env
# Database Connection (MySQL / XAMPP)
DATABASE_URL="mysql://root:@localhost:3306/venuefinder_db"

# Admin Auth Session
JWT_SECRET="super-secret-jwt-key-for-admin-session-change-in-production"

# Razorpay Configuration (Test Mode)
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_default_key"
RAZORPAY_KEY_SECRET="default_secret_key"
RAZORPAY_WEBHOOK_SECRET="default_webhook_secret"

# Cloudinary Configuration (Image Uploads)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Initialize Database & Seed Sample Data
Run the database setup script to create the MySQL database, tables, indexes, and seed all 9 venues, time slots, facilities, and demo admins:
```bash
npm run db:setup
```

> **Note on Database Connection**: The application connects to MySQL via native `mysql2` connection pooling. If MySQL is not running locally, the system seamlessly operates on a local persistent fallback store (`lib/db/storage.json`), allowing you to test all workflows right away without prerequisites.

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm run start
```

---

## 📁 Project Architecture

```
venuefinder/
├── app/
│   ├── actions/                  # Server Actions (Admin Auth, Bookings, Venues)
│   ├── admin/                    # Admin Portal
│   │   ├── bookings/             # Booking Queue & Walk-in Bookings
│   │   ├── login/                # Admin Authentication
│   │   ├── maintenance/          # Maintenance Scheduler
│   │   ├── payments/             # Transactions, Refunds & CSV Export
│   │   ├── settings/             # System Policies & Holds
│   │   └── venues/               # Venue CRUD & Image Uploads
│   ├── api/                      # Route Handlers
│   │   ├── availability/         # Availability & Monthly Calendar Endpoints
│   │   ├── cron/release-holds/   # Automated Hold Expiry Engine
│   │   ├── export/bookings/      # CSV Export Endpoint
│   │   ├── payments/             # Razorpay Order Creation & Verification
│   │   ├── upload/               # Cloudinary Direct Upload Handler
│   │   └── webhooks/razorpay/    # Razorpay Webhook Signature Verification
│   ├── availability/             # Public Slot Availability Calendar Page
│   ├── book/                     # Public 3-Step Booking Request Page
│   ├── pay/[reference]/          # Razorpay Payment Checkout Page
│   ├── status/                   # Public Booking Status Lookup Page
│   ├── venues/[id]/              # Public Venue Showcase & Profile Page
│   ├── robots.ts                 # Dynamic /robots.txt Generator
│   ├── sitemap.ts                # Dynamic /sitemap.xml Generator
│   ├── layout.tsx                # Root Layout with Global SEO & Schema.org JSON-LD
│   └── page.tsx                  # Public Homepage & Venues Explorer
├── components/                   # Reusable UI Components
│   ├── AdminNav.tsx              # Admin Navigation Bar
│   ├── Footer.tsx                # Public Footer
│   ├── ImageUploader.tsx         # Cloudinary Drag & Drop Uploader
│   ├── Navbar.tsx                # Public Header & Navigation
│   └── VenuesExplorer.tsx        # Multi-Region Venue Explorer & Filter Rail
├── lib/                          # Core Services & Utilities
│   ├── auth.ts                   # JWT & Bcrypt Authentication Utilities
│   ├── cloudinary.ts             # Cloudinary Media SDK Configuration
│   ├── razorpay.ts               # Razorpay SDK & Signature Verifier
│   ├── venue-utils.ts            # Regional & Image Utilities (SSR Compatible)
│   └── db/
│       ├── mysql.ts              # Native MySQL Pool & Schema Initializer
│       ├── store.ts              # Central Data Access Service (dbService)
│       ├── mock-data.ts          # Default Seed Data (9 Venues, Slots, Admins)
│       └── storage.json          # Persistent Local Fallback Store
├── scripts/
│   └── setup-db.mjs              # Standalone MySQL Database Setup & Seeder
├── types/
│   └── index.ts                  # Domain TypeScript Interfaces
├── next.config.ts                # Next.js Configuration
├── package.json                  # Dependencies & Project Scripts
└── tsconfig.json                 # TypeScript Configuration
```

---

## 📄 License
Private Community Hall Booking & Management Project.
