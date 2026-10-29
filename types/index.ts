export type BookingStatus =
  | 'PENDING'
  | 'APPROVED_AWAITING_PAYMENT'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'COMPLETED';

export type PaymentStatus = 'CREATED' | 'PAID' | 'FAILED' | 'REFUNDED';

export type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';

export type AdminRole = 'ADMIN' | 'SUPER_ADMIN';

export interface Hall {
  id: string;
  name: string;
  location: string;
  address: string;
  capacity: number;
  description: string;
  rules: string;
  contactPhone: string;
  contactEmail: string;
  imageUrl?: string;
  zone?: string;
  facilities?: Facility[];
  timeSlots?: TimeSlot[];
}

export interface Facility {
  id: string;
  hallId: string;
  name: string;
  description?: string | null;
}

export interface TimeSlot {
  id: string;
  hallId: string;
  label: string;
  startTime: string; // "08:00"
  endTime: string;   // "13:00"
  basePricePaise: number;
}

export interface Booking {
  id: string;
  reference: string;
  hallId: string;
  slotId: string;
  eventDate: string; // YYYY-MM-DD
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  organisation?: string | null;
  eventType: string;
  guestCount: number;
  notes?: string | null;
  status: BookingStatus;
  rejectionReason?: string | null;
  holdExpiresAt?: string | null; // ISO string
  totalAmountPaise: number;
  advanceAmountPaise: number;
  activeSlotKey?: string | null;
  createdAt: string;
  updatedAt: string;
  slot?: TimeSlot;
  hall?: Hall;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  bookingId: string;
  bookingReference?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  amountPaise: number;
  currency: string;
  status: PaymentStatus;
  method?: string | null;
  paidAt?: string | null;
  rawEvent?: any;
  createdAt: string;
}

export interface Refund {
  id: string;
  paymentId?: string;
  bookingId?: string;
  razorpayRefundId?: string | null;
  amountPaise: number;
  status: string;
  reason?: string | null;
  processedAt?: string;
  createdAt: string;
}

export interface Maintenance {
  id: string;
  hallId: string;
  slotId?: string | null;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  description: string;
  reason?: string;
  createdBy?: string;
  status: MaintenanceStatus;
  createdAt: string;
  slot?: TimeSlot | null;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface AuditLog {
  id: string;
  adminId?: string | null;
  adminName?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  oldValue?: any;
  newValue?: any;
  createdAt: string;
}

export interface Setting {
  id?: string;
  key: string;
  value: string;
  description?: string;
}
