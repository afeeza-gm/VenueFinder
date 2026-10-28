'use server';

import { dbService } from '@/lib/db/store';
import { getAdminSession, setAdminSessionCookie, clearAdminSessionCookie, createSessionToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function loginAdminAction(formData: { email: string; password: string }) {
  try {
    const adminWithPass = await dbService.findAdminByEmail(formData.email);
    if (!adminWithPass) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const isValid = await bcrypt.compare(formData.password, adminWithPass.passwordHash);
    if (!isValid) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const token = await createSessionToken({
      id: adminWithPass.id,
      name: adminWithPass.name,
      email: adminWithPass.email,
      role: adminWithPass.role,
    });

    await setAdminSessionCookie(token);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Login failed.' };
  }
}

export async function logoutAdminAction() {
  await clearAdminSessionCookie();
  redirect('/admin/login');
}

export async function approveBookingAction(bookingId: string) {
  const session = await getAdminSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const res = await dbService.approveBooking(bookingId, session.adminId, session.name);
  if (res.success) {
    revalidatePath('/admin/bookings');
    revalidatePath('/availability');
    return { success: true, booking: res.booking };
  }
  return { success: false, error: res.error };
}

export async function rejectBookingAction(bookingId: string, reason: string) {
  const session = await getAdminSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const res = await dbService.rejectBooking(bookingId, reason, session.adminId, session.name);
  if (res.success) {
    revalidatePath('/admin/bookings');
    revalidatePath('/availability');
    return { success: true, booking: res.booking };
  }
  return { success: false, error: res.error };
}

export async function createManualBookingAction(formData: {
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
  paymentMethod: 'CASH' | 'OFFLINE_UPI';
  amountCollectedPaise: number;
}) {
  const session = await getAdminSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const res = await dbService.createManualBooking(formData, session.adminId, session.name);
  if (res.success) {
    revalidatePath('/admin/bookings');
    revalidatePath('/admin/calendar');
    revalidatePath('/availability');
    return { success: true, booking: res.booking };
  }
  return { success: false, error: res.error };
}

export async function cancelBookingAdminAction(bookingId: string) {
  const session = await getAdminSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const res = await dbService.cancelBooking(bookingId, 'ADMIN', session.adminId, session.name);
  if (res.success) {
    revalidatePath('/admin/bookings');
    revalidatePath('/availability');
    return { success: true, refundEligibility: res.refundEligibility };
  }
  return { success: false, error: res.error };
}

export async function createMaintenanceAction(formData: {
  hallId?: string;
  slotId?: string | null;
  startDate: string;
  endDate: string;
  description: string;
}) {
  const session = await getAdminSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const res = await dbService.createMaintenance(formData, session.adminId, session.name);
  if (res.success) {
    revalidatePath('/admin/maintenance');
    revalidatePath('/availability');
    return { success: true, maintenance: res.maintenance, warnings: res.warnings };
  }
  return { success: false, error: res.error };
}

export async function issueRefundAction(paymentId: string, amountPaise: number, reason: string) {
  const session = await getAdminSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const res = await dbService.issueRefund(paymentId, amountPaise, reason, session.adminId, session.name);
  if (res.success) {
    revalidatePath('/admin/payments');
    return { success: true, refund: res.refund };
  }
  return { success: false, error: res.error };
}

export async function updateSettingAction(key: string, value: string) {
  const session = await getAdminSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  await dbService.updateSetting(key, value, session.adminId, session.name);
  revalidatePath('/admin/settings');
  return { success: true };
}

export async function createVenueAction(formData: {
  name: string;
  location: string;
  address: string;
  capacity: number;
  description: string;
  rules: string;
  contactPhone: string;
  contactEmail: string;
  imageUrl?: string;
  timeSlots?: Array<{
    label: string;
    startTime: string;
    endTime: string;
    basePricePaise: number;
  }>;
  facilities?: Array<{
    name: string;
    description?: string;
  }>;
}) {
  const session = await getAdminSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const newVenue = await dbService.createHall(formData, session.adminId, session.name);
  revalidatePath('/');
  revalidatePath('/admin/venues');
  revalidatePath('/availability');
  revalidatePath('/book');
  return { success: true, venue: newVenue };
}

export async function updateVenueAction(
  id: string,
  formData: {
    name?: string;
    location?: string;
    address?: string;
    capacity?: number;
    description?: string;
    rules?: string;
    contactPhone?: string;
    contactEmail?: string;
    imageUrl?: string;
    timeSlots?: Array<{
      id?: string;
      label: string;
      startTime: string;
      endTime: string;
      basePricePaise: number;
    }>;
    facilities?: Array<{
      id?: string;
      name: string;
      description?: string;
    }>;
  }
) {
  const session = await getAdminSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const updated = await dbService.updateHall(id, formData, session.adminId, session.name);
  if (!updated) return { success: false, error: 'Venue not found.' };

  revalidatePath('/');
  revalidatePath(`/venues/${id}`);
  revalidatePath('/admin/venues');
  revalidatePath('/availability');
  revalidatePath('/book');
  return { success: true, venue: updated };
}

export async function deleteVenueAction(id: string) {
  const session = await getAdminSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const res = await dbService.deleteHall(id, session.adminId, session.name);
  if (res.success) {
    revalidatePath('/');
    revalidatePath('/admin/venues');
    revalidatePath('/availability');
  }
  return res;
}

export async function updateHallAction(data: {
  name?: string;
  address?: string;
  capacity?: number;
  description?: string;
  rules?: string;
  contactPhone?: string;
  contactEmail?: string;
}) {
  const session = await getAdminSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const halls = await dbService.getHalls();
  const firstHallId = halls[0]?.id;
  if (firstHallId) {
    await dbService.updateHall(firstHallId, data, session.adminId, session.name);
  }
  revalidatePath('/');
  revalidatePath('/admin/settings');
  return { success: true };
}
