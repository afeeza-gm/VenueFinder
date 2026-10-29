# Product Requirements Document: Community Hall Booking and Management System
**Version 1.0 (Draft)** | **Author:** Arshad | **Date:** 23 October 2026 | **Stack:** Next.js, MySQL, Razorpay

---

## 1. Overview
The Community Hall Booking and Management System is a centralised web application for viewing hall details and availability, submitting booking requests, paying online, and letting a hall administrator review requests and maintain booking and maintenance records. It begins as a small-scale academic prototype for one selected community hall and supports, rather than replaces, the administrator's decisions.

**Scope update from the synopsis:** the synopsis listed online payment as out of scope. This PRD brings it into scope using Razorpay. The synopsis should be revised to match, or payment can be treated as a clearly labelled enhancement phase (see Section 16).

---

## 2. Problem Statement
Bookings and hall information are handled through phone calls, paper registers and informal messages. This makes it hard to confirm whether a date and slot are free, find the latest booking status, retrieve past records and track maintenance. Manual handling leads to duplicate entries, missed updates and communication delays. Money handling (advance, deposit, refund) adds further risk when tracked on paper.

---

## 3. Goals and Non-Goals

### Goals
- **G1:** Let any visitor see hall details, facilities and slot availability without contacting anyone.
- **G2:** Let applicants submit a booking request in under 3 minutes.
- **G3:** Give the administrator one place to review, approve or reject requests, and record maintenance.
- **G4:** Eliminate double bookings through database-level conflict prevention.
- **G5:** Collect advance payments online and reconcile them automatically against bookings.
- **G6:** Keep structured, searchable records of bookings, payments and maintenance.

### Non-Goals (initial version)
- Multiple halls or multi-tenant support
- Identity verification (Aadhaar, KYC)
- Automated SMS or WhatsApp messaging (email only)
- External calendar sync (Google Calendar, iCal)
- Native mobile apps (responsive web only)
- Dynamic or seasonal pricing engines

---

## 4. Users and Roles

| Role | Description | Key Needs |
| :--- | :--- | :--- |
| **Visitor / Applicant** | Resident, organisation or local group wanting the hall | See availability, request a slot, pay, track status |
| **Administrator** | Hall manager or committee member | Review requests, manage calendar, record maintenance, view payments and refunds |
| **Super Admin (optional)** | Prototype owner or committee head | Manage admin accounts, edit pricing and rules |

> **Note:** Applicants do not need full accounts in v1. They provide name, phone and email, receive a booking reference, and track status using reference plus phone number. Administrators sign in with email and password.

---

## 5. Scope

### In Scope
- Hall profile, facilities, photos, rules and contact details
- Public availability calendar by date and time slot
- Booking request form and status tracking
- Administrator dashboard: review, approve, reject, cancel, manually add bookings
- Online payment of advance or full amount via Razorpay, plus refunds
- Maintenance entries that block dates
- Booking, payment and maintenance records with search, filters and CSV export
- Email notifications for key status changes

### Out of Scope
See Non-Goals. Actual policies, rules and data fields will be confirmed during the field study and kept configurable wherever possible.

---

## 6. User Stories

### Applicant
- As an applicant, I can view the hall's facilities, capacity and rules so I know if it suits my event.
- As an applicant, I can see which dates and slots are free so I do not request unavailable times.
- As an applicant, I can submit a request with event details and contact information.
- As an applicant, I can pay the advance online once my request is approved.
- As an applicant, I can check my request status using my booking reference.
- As an applicant, I can cancel a booking and see what refund applies.

### Administrator
- As an administrator, I can see all pending requests in one queue and approve or reject with a reason.
- As an administrator, I can see a calendar of bookings and maintenance at a glance.
- As an administrator, I can block dates for maintenance so they cannot be booked.
- As an administrator, I can add an offline booking (phone or walk-in) and record cash payment.
- As an administrator, I can issue a full or partial refund and see its status.
- As an administrator, I can export records for a date range.

---

## 7. Functional Requirements
*(Priority: P0 = must have for prototype, P1 = should have, P2 = nice to have)*

### 7.1 Hall Information
- **FR-1 [P0]:** Display hall name, address, capacity, facilities, photos, rules and contact details.
- **FR-2 [P0]:** Admin can edit hall details, facilities and rules.
- **FR-3 [P0]:** Admin can define time slots (e.g., Morning, Evening, Full Day) and base price per slot.

### 7.2 Availability
- **FR-4 [P0]:** Monthly calendar shows each date as Available, Partially booked, Booked, or Under maintenance.
- **FR-5 [P0]:** Selecting a date shows slot-level availability and price.
- **FR-6 [P0]:** Pending-payment holds appear as unavailable until they expire.

### 7.3 Booking Requests
- **FR-7 [P0]:** Form captures applicant name, phone, email, organisation (optional), event type, expected guests, date, slot(s) and notes.
- **FR-8 [P0]:** Server validates inputs, rejects past dates, guest count over capacity, and conflicting slots.
- **FR-9 [P0]:** On submit, system generates a unique booking reference and emails a confirmation of receipt.
- **FR-10 [P0]:** Applicant can look up status using reference plus phone number.
- **FR-11 [P1]:** Applicant can cancel before the event, subject to the cancellation policy.

### 7.4 Administrator Review
- **FR-12 [P0]:** Secure admin login with hashed passwords and session expiry.
- **FR-13 [P0]:** Pending queue with filters by date, status and applicant.
- **FR-14 [P0]:** Approve or reject with a mandatory reason on rejection.
- **FR-15 [P0]:** Approval triggers a payment link and starts a hold timer.
- **FR-16 [P1]:** Admin can create manual bookings and mark offline payments (cash, UPI outside gateway).
- **FR-17 [P1]:** Audit log records who changed what and when.

### 7.5 Payments (Razorpay)
- **FR-18 [P0]:** Create a Razorpay Order server-side for the amount due, in paise.
- **FR-19 [P0]:** Open Razorpay Checkout on the client; never trust client-reported success.
- **FR-20 [P0]:** Verify the payment signature on the server before marking a payment as paid.
- **FR-21 [P0]:** Process Razorpay webhooks (payment captured, payment failed, refund processed) idempotently as the source of truth.
- **FR-22 [P0]:** Store payment records linked to bookings, including Razorpay order ID, payment ID, amount, status and timestamps.
- **FR-23 [P1]:** Admin can initiate full or partial refunds via the Razorpay Refunds API and view refund status.
- **FR-24 [P0]:** Auto-release the hold and mark the booking Expired if payment is not completed within the window.
- **FR-25 [P2]:** Downloadable payment receipt (PDF) for applicants.

#### 7.5.1 Recommended Payment Model
**Approve first, then pay.** The applicant submits a request with no charge. If the administrator approves, the applicant receives a payment link and the slot is held for a fixed window (suggested 48 hours). Payment confirms the booking. This avoids charging for requests that are later rejected and keeps the administrator in control.

### 7.6 Maintenance
- **FR-26 [P0]:** Admin can create maintenance entries with date range, optional slots, description and status (Scheduled, In progress, Completed).
- **FR-27 [P0]:** Maintenance entries block the affected dates and slots from booking.
- **FR-28 [P1]:** If a maintenance entry overlaps existing approved bookings, the system warns the admin and lists the affected bookings.

### 7.7 Records and Reporting
- **FR-29 [P0]:** Search and filter bookings by date, status, applicant name, phone or reference.
- **FR-30 [P1]:** Export bookings and payments to CSV for a date range.
- **FR-31 [P2]:** Dashboard summary: pending count, upcoming events, monthly bookings, collected amount.

### 7.8 Notifications
- **FR-32 [P1]:** Email on request received, approved, rejected, payment received, cancelled and refunded.
- **FR-33 [P1]:** Email admin on new request.

---

## 8. Booking Lifecycle
- **Pending:** Request submitted, awaiting admin review $\rightarrow$ Approved, Rejected, Cancelled.
- **Approved - Awaiting Payment:** Slot held, payment link sent $\rightarrow$ Confirmed, Expired, Cancelled.
- **Confirmed:** Advance or full payment received, or admin recorded offline payment $\rightarrow$ Completed, Cancelled.
- **Rejected:** Terminal state (with mandatory rejection reason).
- **Expired:** Payment window lapsed, slot released $\rightarrow$ Terminal state.
- **Cancelled:** By applicant or admin; refund evaluated per policy $\rightarrow$ Terminal state.
- **Completed:** Event date passed $\rightarrow$ Terminal state.

*Note:* Only `Approved - Awaiting Payment` and `Confirmed` bookings (and maintenance) block a slot for conflict prevention. Every transition is validated server-side and recorded in `audit_logs`.

---

## 9. Razorpay Integration Design
1. Admin approves a request. Server computes the amount due (advance percentage or full amount, configurable).
2. Applicant opens the payment page from the emailed link. Server calls Razorpay Orders API and stores the order ID with status `Created`.
3. Client opens Razorpay Checkout with the order ID and public key.
4. On success callback, client posts order ID, payment ID and signature to the server. Server verifies the HMAC-SHA256 signature using the key secret and marks the payment `Paid`.
5. Razorpay webhook independently confirms the event. The handler verifies the webhook signature, is idempotent on event ID, and updates the payment and booking if not already updated.
6. Booking moves to `Confirmed` and a confirmation email is sent.

### Rules
- Amounts stored and calculated in **paise** (integer) to eliminate floating-point rounding errors.
- API key secret and webhook secret live only in server environment variables.
- Razorpay test mode for local/prototype environments.
- Handle failed, abandoned, and duplicate attempts: allow retry while hold is active.

---

## 10. Data Model (MySQL)

- **`vf_halls`**: `id`, `name`, `address`, `capacity`, `description`, `rules`, `contact_phone`, `contact_email`
- **`vf_facilities`**: `id`, `hall_id`, `name`, `description`
- **`vf_time_slots`**: `id`, `hall_id`, `label`, `start_time`, `end_time`, `base_price_paise`
- **`vf_bookings`**: `id`, `reference`, `hall_id`, `event_date`, `slot_id`, `applicant_name`, `applicant_phone`, `applicant_email`, `organisation`, `event_type`, `guest_count`, `notes`, `status`, `rejection_reason`, `hold_expires_at`, `total_amount_paise`, `advance_amount_paise`, `active_slot_key`, `created_at`, `updated_at`
- **`vf_payments`**: `id`, `booking_id`, `razorpay_order_id`, `razorpay_payment_id`, `amount_paise`, `currency`, `status`, `method`, `paid_at`, `raw_event`
- **`vf_refunds`**: `id`, `payment_id`, `razorpay_refund_id`, `amount_paise`, `status`, `reason`, `created_at`
- **`vf_maintenance`**: `id`, `hall_id`, `start_date`, `end_date`, `slot_id` (nullable), `description`, `status`
- **`vf_admins`**: `id`, `name`, `email`, `password_hash`, `role`, `last_login_at`
- **`vf_audit_logs`**: `id`, `admin_id`, `entity_type`, `entity_id`, `action`, `old_value`, `new_value`, `created_at`
- **`vf_webhook_events`**: `id`, `provider_event_id` (unique), `event_type`, `processed_at`
- **`vf_settings`**: `key`, `value` (advance percentage, hold window hours, cancellation rules)

### Double-Booking Prevention
MySQL does not support partial unique indexes. We use `active_slot_key` (e.g., `CONCAT(hall_id, '_', event_date, '_', slot_id)`) populated only when status is in an active state (`APPROVED_AWAITING_PAYMENT`, `CONFIRMED`), and `NULL` otherwise, with a `UNIQUE` index. Combined with transactional execution, this provides hard database-level conflict prevention.

---

## 11. Technical Architecture & Non-Functional Requirements
- **Framework:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Database / Driver:** MySQL 8 with Native mysql2 Driver (Connection Pool & Direct SQL)
- **Security:** Password hashing (argon2 / bcrypt), HTTP-only cookies / JWT session tokens, CSRF protection, server-side parameterised queries.
- **Amounts:** Always integer paise.
- **Timezone:** Dates stored in UTC/DATE, displayed in IST (`Asia/Kolkata`).

---

## 12. Milestones & Implementation Plan
- **Phase 1: Architecture & Data Layer:** Native MySQL schema & connection pooling, seed script with default venues & slots, authentication setup.
- **Phase 2: Public Booking Flow:** Hall info page, availability calendar, stepwise booking form, booking confirmation & reference generation, status tracking page.
- **Phase 3: Admin Management:** Admin auth, review queue (approve/reject), manual booking entry, maintenance scheduler, booking record filters & CSV export.
- **Phase 4: Payment Gateway (Razorpay):** Order generation, Razorpay Checkout modal, server signature verification, webhook handler, hold expiry cron/worker, refund processing.
- **Phase 5: Notifications & Hardening:** Email notifications (mock/SMTP/Resend), audit logging, double-booking stress testing, polishing UI/UX.
