'use server';

import { dbService } from '@/lib/db/store';
import { revalidatePath } from 'next/cache';

export async function submitBookingAction(formData: {
  hallId?: string;
  slotId: string;
  eventDate: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  organisation?: string;
  eventType: string;
  guestCount: number;
  notes?: string;
}) {
  try {
    const res = await dbService.createBookingRequest(formData);
    if (res.success && res.booking) {
      revalidatePath('/availability');
      return { success: true, reference: res.booking.reference, booking: res.booking };
    }
    return { success: false, error: res.error || 'Failed to submit request' };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}

export async function lookupBookingAction(reference: string, phone: string) {
  try {
    const booking = await dbService.getBookingByReference(reference, phone);
    if (!booking) {
      return { success: false, error: 'No booking found matching that reference and phone number.' };
    }
    return { success: true, booking };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lookup failed.' };
  }
}

export async function cancelBookingApplicantAction(bookingId: string) {
  try {
    const res = await dbService.cancelBooking(bookingId, 'APPLICANT');
    if (res.success) {
      revalidatePath('/status');
      revalidatePath('/availability');
      revalidatePath('/admin/bookings');
      revalidatePath('/admin/payments');
      return { success: true, refundEligibility: res.refundEligibility };
    }
    return { success: false, error: res.error };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
