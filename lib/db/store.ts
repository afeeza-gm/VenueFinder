import fs from 'fs';
import path from 'path';
import { getPool, query, execute, initSchema } from './mysql';
import {
  INITIAL_HALLS,
  INITIAL_TIME_SLOTS,
  INITIAL_FACILITIES,
  INITIAL_SETTINGS,
  INITIAL_ADMINS,
  INITIAL_SAMPLE_BOOKINGS,
  INITIAL_MAINTENANCE,
} from './mock-data';
import {
  Hall,
  TimeSlot,
  Facility,
  Booking,
  Payment,
  Refund,
  Maintenance,
  Admin,
  AuditLog,
  Setting,
} from '@/types';

const STORAGE_FILE = path.join(process.cwd(), 'lib', 'db', 'storage.json');

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    bookingId: 'bk-1',
    razorpayOrderId: 'order_test_987654321',
    razorpayPaymentId: 'pay_test_123456789',
    amountPaise: 625000,
    currency: 'INR',
    status: 'PAID',
    method: 'RAZORPAY',
    paidAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    adminId: 'admin-1',
    adminName: 'District Reservation Officer',
    entityType: 'Booking',
    entityId: 'bk-1',
    action: 'APPROVE',
    newValue: { status: 'CONFIRMED', advancePaid: 625000 },
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

// Persistent File & In-Memory storage fallback engine
class MemoryStorage {
  halls: Hall[] = [];
  timeSlots: TimeSlot[] = [];
  facilities: Facility[] = [];
  settings: Map<string, string> = new Map();
  admins: Array<Admin & { passwordHash: string }> = [];
  bookings: Booking[] = [];
  payments: Payment[] = [];
  refunds: Refund[] = [];
  maintenance: Maintenance[] = [];
  auditLogs: AuditLog[] = [];

  constructor() {
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data.halls && data.halls.length > 0) {
          this.halls = data.halls;
          this.timeSlots = data.timeSlots || [...INITIAL_TIME_SLOTS];
          this.facilities = data.facilities || [...INITIAL_FACILITIES];
          this.settings = new Map(
            data.settings
              ? Object.entries(data.settings)
              : INITIAL_SETTINGS.map((s) => [s.key, s.value])
          );
          this.admins = (data.admins && data.admins.length > 0)
            ? data.admins.map((a: any) => {
                if (!a.passwordHash || !a.passwordHash.startsWith('$2')) {
                  const defaultMatch = INITIAL_ADMINS.find(
                    (ia) => ia.email.toLowerCase() === a.email.toLowerCase()
                  );
                  return { ...a, passwordHash: defaultMatch ? defaultMatch.passwordHash : a.passwordHash };
                }
                return a;
              })
            : [...INITIAL_ADMINS];
          this.bookings = data.bookings || [...INITIAL_SAMPLE_BOOKINGS];
          this.payments = data.payments || [...INITIAL_PAYMENTS];
          this.refunds = data.refunds || [];
          this.maintenance = data.maintenance || [...INITIAL_MAINTENANCE];
          this.auditLogs = data.auditLogs || [...INITIAL_AUDIT_LOGS];
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load storage.json, initializing from default seeds', e);
    }

    this.halls = [...INITIAL_HALLS];
    this.timeSlots = [...INITIAL_TIME_SLOTS];
    this.facilities = [...INITIAL_FACILITIES];
    this.settings = new Map(INITIAL_SETTINGS.map((s) => [s.key, s.value]));
    this.admins = [...INITIAL_ADMINS];
    this.bookings = [...INITIAL_SAMPLE_BOOKINGS];
    this.payments = [...INITIAL_PAYMENTS];
    this.refunds = [];
    this.maintenance = [...INITIAL_MAINTENANCE];
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
    this.save();
  }

  save() {
    try {
      const data = {
        halls: this.halls,
        timeSlots: this.timeSlots,
        facilities: this.facilities,
        settings: Object.fromEntries(this.settings.entries()),
        admins: this.admins,
        bookings: this.bookings,
        payments: this.payments,
        refunds: this.refunds,
        maintenance: this.maintenance,
        auditLogs: this.auditLogs,
      };
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write storage.json', e);
    }
  }
}

const globalMemory = global as unknown as { __chms_memory?: MemoryStorage };
if (!globalMemory.__chms_memory || !globalMemory.__chms_memory.halls) {
  globalMemory.__chms_memory = new MemoryStorage();
}
const mem = globalMemory.__chms_memory;

let isDbReachable: boolean | null = null;
let dbAutoSeeded = false;

async function checkDbConnection(): Promise<boolean> {
  try {
    const pool = getPool();
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    isDbReachable = true;

    if (!dbAutoSeeded) {
      await initSchema();
      await autoSeedMysqlIfEmpty();
      dbAutoSeeded = true;
    }
    return true;
  } catch (err: any) {
    isDbReachable = false;
    return false;
  }
}

async function autoSeedMysqlIfEmpty() {
  try {
    const rows = await query<{ count: number }>('SELECT COUNT(*) AS count FROM vf_halls');
    const hallCount = rows[0]?.count || 0;

    if (hallCount === 0) {
      console.log('[MySQL] Database tables are empty. Auto-seeding initial records...');

      // Seed Admins
      for (const a of INITIAL_ADMINS) {
        await execute(
          `INSERT IGNORE INTO vf_admins (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
          [a.id, a.name, a.email, a.passwordHash, a.role]
        );
      }

      // Seed Settings
      for (const s of INITIAL_SETTINGS) {
        await execute(
          `INSERT IGNORE INTO vf_settings (\`key\`, value) VALUES (?, ?)`,
          [s.key, s.value]
        );
      }

      // Seed Halls
      for (const h of INITIAL_HALLS) {
        await execute(
          `INSERT IGNORE INTO vf_halls (id, name, location, address, capacity, description, rules, contact_phone, contact_email, image_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            h.id,
            h.name,
            h.location,
            h.address,
            h.capacity,
            h.description,
            h.rules,
            h.contactPhone,
            h.contactEmail,
            h.imageUrl || null,
          ]
        );
      }

      // Seed TimeSlots
      for (const ts of INITIAL_TIME_SLOTS) {
        await execute(
          `INSERT IGNORE INTO vf_time_slots (id, hall_id, label, start_time, end_time, base_price_paise)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [ts.id, ts.hallId, ts.label, ts.startTime, ts.endTime, ts.basePricePaise]
        );
      }

      // Seed Facilities
      for (const f of INITIAL_FACILITIES) {
        await execute(
          `INSERT IGNORE INTO vf_facilities (id, hall_id, name, description)
           VALUES (?, ?, ?, ?)`,
          [f.id, f.hallId, f.name, f.description || null]
        );
      }

      // Seed Sample Bookings
      for (const b of INITIAL_SAMPLE_BOOKINGS) {
        await execute(
          `INSERT IGNORE INTO vf_bookings (
            id, reference, hall_id, slot_id, event_date, applicant_name, applicant_phone, applicant_email,
            organisation, event_type, guest_count, notes, status, hold_expires_at, total_amount_paise,
            advance_amount_paise, active_slot_key, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            b.id,
            b.reference,
            b.hallId,
            b.slotId,
            b.eventDate,
            b.applicantName,
            b.applicantPhone,
            b.applicantEmail,
            b.organisation || null,
            b.eventType,
            b.guestCount,
            b.notes || null,
            b.status,
            b.holdExpiresAt ? new Date(b.holdExpiresAt) : null,
            b.totalAmountPaise,
            b.advanceAmountPaise,
            b.activeSlotKey || null,
            new Date(b.createdAt),
            new Date(b.updatedAt),
          ]
        );
      }

      // Seed Maintenance
      for (const m of INITIAL_MAINTENANCE) {
        await execute(
          `INSERT IGNORE INTO vf_maintenance (id, hall_id, slot_id, start_date, end_date, description, status, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            m.id,
            m.hallId,
            m.slotId || null,
            m.startDate,
            m.endDate,
            m.description,
            m.status,
            m.createdBy || 'District Reservation Officer',
            new Date(m.createdAt),
          ]
        );
      }

      console.log('[MySQL] Auto-seed complete!');
    } else {
      // Ensure admins table is populated even if halls already existed
      const adminRows = await query<{ count: number }>('SELECT COUNT(*) AS count FROM vf_admins');
      if ((adminRows[0]?.count || 0) === 0) {
        for (const a of INITIAL_ADMINS) {
          await execute(
            `INSERT IGNORE INTO vf_admins (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
            [a.id, a.name, a.email, a.passwordHash, a.role]
          );
        }
      }
    }

    // Repair any corrupted or placeholder password hashes in vf_admins
    for (const a of INITIAL_ADMINS) {
      await execute(
        `UPDATE vf_admins SET password_hash = ? WHERE email = ? AND (password_hash NOT LIKE '$2%')`,
        [a.passwordHash, a.email]
      );
    }
  } catch (seedErr) {
    console.error('[MySQL] Auto-seed encountered an issue:', seedErr);
  }
}

function parseJsonSafe(val: any): any {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

function formatDateString(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') {
    return val.includes('T') ? val.split('T')[0] : val;
  }
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  return String(val);
}

function formatIsoString(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'string') {
    return val.includes('T') ? val : new Date(val).toISOString();
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  return String(val);
}

export const dbService = {
  // Get all venues with optional filters
  async getHalls(filters?: {
    location?: string;
    search?: string;
    minCapacity?: number;
  }): Promise<Array<Hall & { facilities: Facility[]; timeSlots: TimeSlot[] }>> {
    const isDb = await checkDbConnection();

    if (isDb) {
      try {
        const whereClauses: string[] = ['1=1'];
        const params: any[] = [];

        if (filters?.minCapacity) {
          whereClauses.push('h.capacity >= ?');
          params.push(filters.minCapacity);
        }

        if (filters?.location && filters.location !== 'ALL') {
          whereClauses.push('(h.location LIKE ? OR h.address LIKE ?)');
          const locParam = `%${filters.location}%`;
          params.push(locParam, locParam);
        }

        if (filters?.search) {
          const qParam = `%${filters.search.trim()}%`;
          whereClauses.push('(h.name LIKE ? OR h.location LIKE ? OR h.description LIKE ?)');
          params.push(qParam, qParam, qParam);
        }

        const sql = `
          SELECT 
            h.id, h.name, h.location, h.address, h.capacity, h.description, h.rules,
            h.contact_phone AS contactPhone,
            h.contact_email AS contactEmail,
            h.image_url AS imageUrl
          FROM vf_halls h
          WHERE ${whereClauses.join(' AND ')}
          ORDER BY h.name ASC
        `;

        const halls = await query<any>(sql, params);

        if (halls.length > 0) {
          const hallIds = halls.map((h) => h.id);
          const placeholders = hallIds.map(() => '?').join(',');

          const allFacilities = await query<any>(
            `SELECT id, hall_id AS hallId, name, description FROM vf_facilities WHERE hall_id IN (${placeholders})`,
            hallIds
          );

          const allSlots = await query<any>(
            `SELECT id, hall_id AS hallId, label, start_time AS startTime, end_time AS endTime, base_price_paise AS basePricePaise
             FROM vf_time_slots WHERE hall_id IN (${placeholders}) ORDER BY start_time ASC`,
            hallIds
          );

          return halls.map((h) => ({
            ...h,
            facilities: allFacilities.filter((f) => f.hallId === h.id),
            timeSlots: allSlots.filter((s) => s.hallId === h.id),
          }));
        }
      } catch (err) {
        console.error('[MySQL] getHalls error, falling back to local memory:', err);
      }
    }

    // Fallback to memory
    let result = mem.halls.map((h) => ({
      ...h,
      facilities: mem.facilities.filter((f) => f.hallId === h.id),
      timeSlots: mem.timeSlots.filter((s) => s.hallId === h.id),
    }));

    if (filters?.location && filters.location !== 'ALL') {
      const loc = filters.location.toLowerCase();
      result = result.filter(
        (h) => h.location.toLowerCase().includes(loc) || h.address.toLowerCase().includes(loc)
      );
    }

    if (filters?.minCapacity) {
      result = result.filter((h) => h.capacity >= filters.minCapacity!);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.location.toLowerCase().includes(q) ||
          h.address.toLowerCase().includes(q) ||
          h.description.toLowerCase().includes(q)
      );
    }

    return result;
  },

  // Get distinct locations for filtering
  async getLocations(): Promise<string[]> {
    const isDb = await checkDbConnection();
    if (isDb) {
      try {
        const rows = await query<{ location: string }>(
          `SELECT DISTINCT location FROM vf_halls WHERE location IS NOT NULL AND location != '' ORDER BY location ASC`
        );
        if (rows.length > 0) {
          return rows.map((r) => r.location);
        }
      } catch (err) {
        console.error('[MySQL] getLocations error:', err);
      }
    }
    const locs = new Set(mem.halls.map((h) => h.location));
    return Array.from(locs);
  },

  // Get specific hall or first default
  async getHall(
    id?: string
  ): Promise<(Hall & { facilities: Facility[]; timeSlots: TimeSlot[] }) | null> {
    const isDb = await checkDbConnection();
    if (isDb) {
      try {
        let sql = `
          SELECT 
            id, name, location, address, capacity, description, rules,
            contact_phone AS contactPhone,
            contact_email AS contactEmail,
            image_url AS imageUrl
          FROM vf_halls
        `;
        const params: any[] = [];
        if (id) {
          sql += ' WHERE id = ? LIMIT 1';
          params.push(id);
        } else {
          sql += ' ORDER BY name ASC LIMIT 1';
        }

        const halls = await query<any>(sql, params);
        if (halls.length > 0) {
          const h = halls[0];
          const facilities = await query<any>(
            `SELECT id, hall_id AS hallId, name, description FROM vf_facilities WHERE hall_id = ?`,
            [h.id]
          );
          const timeSlots = await query<any>(
            `SELECT id, hall_id AS hallId, label, start_time AS startTime, end_time AS endTime, base_price_paise AS basePricePaise
             FROM vf_time_slots WHERE hall_id = ? ORDER BY start_time ASC`,
            [h.id]
          );
          return {
            ...h,
            facilities,
            timeSlots,
          };
        }
      } catch (err) {
        console.error('[MySQL] getHall error:', err);
      }
    }

    const h = id ? mem.halls.find((x) => x.id === id) : mem.halls[0];
    if (!h) return null;
    return {
      ...h,
      facilities: mem.facilities.filter((f) => f.hallId === h.id),
      timeSlots: mem.timeSlots.filter((s) => s.hallId === h.id),
    };
  },

  // Create new Hall (Admin)
  async createHall(
    data: {
      name: string;
      location: string;
      address: string;
      capacity: number;
      description: string;
      rules: string;
      contactPhone: string;
      contactEmail: string;
      imageUrl?: string;
      facilities?: Array<{ name: string; description?: string }>;
      timeSlots?: Array<{
        label: string;
        startTime: string;
        endTime: string;
        basePricePaise: number;
      }>;
    },
    adminId: string,
    adminName: string
  ): Promise<Hall & { facilities: Facility[]; timeSlots: TimeSlot[] }> {
    const hallId = `hall-${Date.now()}`;
    const isDb = await checkDbConnection();

    if (isDb) {
      try {
        await execute(
          `INSERT INTO vf_halls (id, name, location, address, capacity, description, rules, contact_phone, contact_email, image_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            hallId,
            data.name,
            data.location,
            data.address,
            data.capacity,
            data.description,
            data.rules,
            data.contactPhone,
            data.contactEmail,
            data.imageUrl || null,
          ]
        );

        const createdFacilities: Facility[] = [];
        if (data.facilities && data.facilities.length > 0) {
          for (let i = 0; i < data.facilities.length; i++) {
            const f = data.facilities[i];
            const facId = `fac-${hallId}-${i + 1}`;
            await execute(
              `INSERT INTO vf_facilities (id, hall_id, name, description) VALUES (?, ?, ?, ?)`,
              [facId, hallId, f.name, f.description || null]
            );
            createdFacilities.push({
              id: facId,
              hallId,
              name: f.name,
              description: f.description || null,
            });
          }
        }

        const createdSlots: TimeSlot[] = [];
        if (data.timeSlots && data.timeSlots.length > 0) {
          for (let i = 0; i < data.timeSlots.length; i++) {
            const s = data.timeSlots[i];
            const slotId = `slot-${hallId}-${i + 1}`;
            await execute(
              `INSERT INTO vf_time_slots (id, hall_id, label, start_time, end_time, base_price_paise) VALUES (?, ?, ?, ?, ?, ?)`,
              [slotId, hallId, s.label, s.startTime, s.endTime, s.basePricePaise]
            );
            createdSlots.push({
              id: slotId,
              hallId,
              label: s.label,
              startTime: s.startTime,
              endTime: s.endTime,
              basePricePaise: s.basePricePaise,
            });
          }
        }

        // Audit Log
        await execute(
          `INSERT INTO vf_audit_logs (id, admin_id, admin_name, entity_type, entity_id, action, new_value)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [`log-${Date.now()}`, adminId, adminName, 'Hall', hallId, 'CREATE_HALL', JSON.stringify(data)]
        ).catch(() => {});

        return {
          id: hallId,
          name: data.name,
          location: data.location,
          address: data.address,
          capacity: data.capacity,
          description: data.description,
          rules: data.rules,
          contactPhone: data.contactPhone,
          contactEmail: data.contactEmail,
          imageUrl: data.imageUrl,
          facilities: createdFacilities,
          timeSlots: createdSlots,
        };
      } catch (err) {
        console.error('[MySQL] createHall error, fallback to mem:', err);
      }
    }

    // Mem fallback
    const newHall: Hall = {
      id: hallId,
      name: data.name,
      location: data.location,
      address: data.address,
      capacity: data.capacity,
      description: data.description,
      rules: data.rules,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop',
    };
    mem.halls.push(newHall);

    const addedFacilities: Facility[] = [];
    if (data.facilities && data.facilities.length > 0) {
      data.facilities.forEach((f, idx) => {
        const newFac: Facility = {
          id: `fac-${hallId}-${idx + 1}`,
          hallId,
          name: f.name,
          description: f.description || null,
        };
        mem.facilities.push(newFac);
        addedFacilities.push(newFac);
      });
    }

    const addedSlots: TimeSlot[] = [];
    if (data.timeSlots && data.timeSlots.length > 0) {
      data.timeSlots.forEach((s, idx) => {
        const newSlot: TimeSlot = {
          id: `slot-${hallId}-${idx + 1}`,
          hallId,
          label: s.label,
          startTime: s.startTime,
          endTime: s.endTime,
          basePricePaise: s.basePricePaise,
        };
        mem.timeSlots.push(newSlot);
        addedSlots.push(newSlot);
      });
    }

    mem.auditLogs.push({
      id: `log-${Date.now()}`,
      adminId,
      adminName,
      entityType: 'Hall',
      entityId: hallId,
      action: 'CREATE_HALL',
      newValue: data,
      createdAt: new Date().toISOString(),
    });

    mem.save();
    return {
      ...newHall,
      facilities: addedFacilities,
      timeSlots: addedSlots,
    };
  },

  // Update existing Hall
  async updateHall(
    id: string,
    data: {
      name?: string;
      location?: string;
      address?: string;
      capacity?: number;
      description?: string;
      rules?: string;
      contactPhone?: string;
      contactEmail?: string;
      imageUrl?: string;
    },
    adminId?: string,
    adminName?: string
  ): Promise<Hall | null> {
    const isDb = await checkDbConnection();
    if (isDb) {
      try {
        const fields: string[] = [];
        const params: any[] = [];

        if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name); }
        if (data.location !== undefined) { fields.push('location = ?'); params.push(data.location); }
        if (data.address !== undefined) { fields.push('address = ?'); params.push(data.address); }
        if (data.capacity !== undefined) { fields.push('capacity = ?'); params.push(data.capacity); }
        if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
        if (data.rules !== undefined) { fields.push('rules = ?'); params.push(data.rules); }
        if (data.contactPhone !== undefined) { fields.push('contact_phone = ?'); params.push(data.contactPhone); }
        if (data.contactEmail !== undefined) { fields.push('contact_email = ?'); params.push(data.contactEmail); }
        if (data.imageUrl !== undefined) { fields.push('image_url = ?'); params.push(data.imageUrl); }

        if (fields.length > 0) {
          params.push(id);
          await execute(`UPDATE vf_halls SET ${fields.join(', ')} WHERE id = ?`, params);

          await execute(
            `INSERT INTO vf_audit_logs (id, admin_id, admin_name, entity_type, entity_id, action, new_value)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [`log-${Date.now()}`, adminId || null, adminName || null, 'Hall', id, 'UPDATE_HALL', JSON.stringify(data)]
          ).catch(() => {});
        }

        const updated = await this.getHall(id);
        return updated;
      } catch (err) {
        console.error('[MySQL] updateHall error:', err);
      }
    }

    const idx = mem.halls.findIndex((h) => h.id === id);
    if (idx === -1) return null;

    mem.halls[idx] = {
      ...mem.halls[idx],
      ...data,
    };

    mem.auditLogs.push({
      id: `log-${Date.now()}`,
      adminId,
      adminName,
      entityType: 'Hall',
      entityId: id,
      action: 'UPDATE_HALL',
      newValue: data,
      createdAt: new Date().toISOString(),
    });

    mem.save();
    return mem.halls[idx];
  },

  // Delete a Hall
  async deleteHall(id: string, adminId?: string, adminName?: string): Promise<{ success: boolean; error?: string }> {
    const isDb = await checkDbConnection();
    if (isDb) {
      try {
        await execute('DELETE FROM vf_facilities WHERE hall_id = ?', [id]);
        await execute('DELETE FROM vf_time_slots WHERE hall_id = ?', [id]);
        await execute('DELETE FROM vf_halls WHERE id = ?', [id]);

        await execute(
          `INSERT INTO vf_audit_logs (id, admin_id, admin_name, entity_type, entity_id, action, new_value)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [`log-${Date.now()}`, adminId || null, adminName || null, 'Hall', id, 'DELETE_HALL', JSON.stringify({ deletedHallId: id })]
        ).catch(() => {});

        return { success: true };
      } catch (err: any) {
        console.error('[MySQL] deleteHall error:', err);
      }
    }

    const idx = mem.halls.findIndex((h) => h.id === id);
    if (idx === -1) return { success: false, error: 'Venue not found' };

    mem.halls.splice(idx, 1);
    mem.facilities = mem.facilities.filter((f) => f.hallId !== id);
    mem.timeSlots = mem.timeSlots.filter((s) => s.hallId !== id);

    mem.auditLogs.push({
      id: `log-${Date.now()}`,
      adminId,
      adminName,
      entityType: 'Hall',
      entityId: id,
      action: 'DELETE_HALL',
      newValue: { deletedHallId: id },
      createdAt: new Date().toISOString(),
    });

    mem.save();
    return { success: true };
  },

  // Get time slots
  async getTimeSlots(hallId?: string): Promise<TimeSlot[]> {
    const isDb = await checkDbConnection();
    if (isDb) {
      try {
        let sql = `
          SELECT 
            id, hall_id AS hallId, label, start_time AS startTime, end_time AS endTime,
            base_price_paise AS basePricePaise
          FROM vf_time_slots
        `;
        const params: any[] = [];
        if (hallId) {
          sql += ' WHERE hall_id = ?';
          params.push(hallId);
        }
        sql += ' ORDER BY start_time ASC';

        const slots = await query<TimeSlot>(sql, params);
        if (slots.length > 0) return slots;
      } catch (err) {
        console.error('[MySQL] getTimeSlots error:', err);
      }
    }
    if (!hallId) return mem.timeSlots;
    return mem.timeSlots.filter((s) => s.hallId === hallId);
  },

  // Get availability for a specific date and hall
  async getAvailability(dateStr: string, hallId?: string) {
    const isDb = await checkDbConnection();
    const effectiveHallId = hallId || (mem.halls[0]?.id ?? 'hall-ansariya');

    if (isDb) {
      try {
        const slots = await query<TimeSlot>(
          `SELECT id, hall_id AS hallId, label, start_time AS startTime, end_time AS endTime, base_price_paise AS basePricePaise
           FROM vf_time_slots WHERE hall_id = ? ORDER BY start_time ASC`,
          [effectiveHallId]
        );

        const bookings = await query<{ slotId: string; status: string }>(
          `SELECT slot_id AS slotId, status FROM vf_bookings
           WHERE hall_id = ? AND event_date = ? AND status IN ('APPROVED_AWAITING_PAYMENT', 'CONFIRMED')`,
          [effectiveHallId, dateStr]
        );

        const maintenance = await query<{ slotId: string | null; status: string }>(
          `SELECT slot_id AS slotId, status FROM vf_maintenance
           WHERE hall_id = ? AND start_date <= ? AND end_date >= ? AND status IN ('SCHEDULED', 'IN_PROGRESS')`,
          [effectiveHallId, dateStr, dateStr]
        );

        const slotStatus = slots.map((s) => {
          const booked = bookings.find((b) => b.slotId === s.id);
          const maint = maintenance.find((m) => !m.slotId || m.slotId === s.id);

          let isAvailable = true;
          let statusReason = 'Available';

          if (maint) {
            isAvailable = false;
            statusReason = 'Under Maintenance';
          } else if (booked) {
            isAvailable = false;
            statusReason = booked.status === 'CONFIRMED' ? 'Confirmed Booking' : 'Held (Awaiting Payment)';
          }

          return { slot: s, isAvailable, statusReason };
        });

        const hasAvailable = slotStatus.some((s) => s.isAvailable);
        const hasBooked = slotStatus.some((s) => !s.isAvailable);

        let overallStatus = 'AVAILABLE';
        if (maintenance.some((m) => !m.slotId)) {
          overallStatus = 'MAINTENANCE';
        } else if (!hasAvailable) {
          overallStatus = 'BOOKED';
        } else if (hasBooked) {
          overallStatus = 'PARTIAL';
        }

        return {
          date: dateStr,
          hallId: effectiveHallId,
          status: overallStatus,
          slots: slotStatus,
        };
      } catch (err) {
        console.error('[MySQL] getAvailability error:', err);
      }
    }

    // Mem Fallback
    const slots = mem.timeSlots.filter((s) => s.hallId === effectiveHallId);
    const bookings = mem.bookings.filter(
      (b) =>
        b.hallId === effectiveHallId &&
        b.eventDate === dateStr &&
        ['APPROVED_AWAITING_PAYMENT', 'CONFIRMED'].includes(b.status)
    );
    const maintenance = mem.maintenance.filter(
      (m) =>
        m.hallId === effectiveHallId &&
        m.startDate <= dateStr &&
        m.endDate >= dateStr &&
        ['SCHEDULED', 'IN_PROGRESS'].includes(m.status)
    );

    const slotStatus = slots.map((s) => {
      const booked = bookings.find((b) => b.slotId === s.id);
      const maint = maintenance.find((m) => !m.slotId || m.slotId === s.id);

      let isAvailable = true;
      let statusReason = 'Available';

      if (maint) {
        isAvailable = false;
        statusReason = 'Under Maintenance';
      } else if (booked) {
        isAvailable = false;
        statusReason = booked.status === 'CONFIRMED' ? 'Confirmed Booking' : 'Held (Awaiting Payment)';
      }

      return { slot: s, isAvailable, statusReason };
    });

    const hasAvailable = slotStatus.some((s) => s.isAvailable);
    const hasBooked = slotStatus.some((s) => !s.isAvailable);

    let overallStatus = 'AVAILABLE';
    if (maintenance.some((m) => !m.slotId)) {
      overallStatus = 'MAINTENANCE';
    } else if (!hasAvailable) {
      overallStatus = 'BOOKED';
    } else if (hasBooked) {
      overallStatus = 'PARTIAL';
    }

    return {
      date: dateStr,
      hallId: effectiveHallId,
      status: overallStatus,
      slots: slotStatus,
    };
  },

  // Monthly calendar
  async getMonthlyCalendar(
    year: number,
    month: number,
    hallId?: string
  ): Promise<
    Array<{
      date: string;
      day: number;
      status: 'AVAILABLE' | 'MAINTENANCE' | 'BOOKED' | 'PARTIAL';
    }>
  > {
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: Array<{
      date: string;
      day: number;
      status: 'AVAILABLE' | 'MAINTENANCE' | 'BOOKED' | 'PARTIAL';
    }> = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const avail = await this.getAvailability(dateStr, hallId);
      days.push({
        date: dateStr,
        day,
        status: (['AVAILABLE', 'MAINTENANCE', 'BOOKED', 'PARTIAL'].includes(avail.status)
          ? avail.status
          : 'AVAILABLE') as 'AVAILABLE' | 'MAINTENANCE' | 'BOOKED' | 'PARTIAL',
      });
    }

    return days;
  },

  // Create applicant booking request
  async createBookingRequest(data: {
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
  }): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const isDb = await checkDbConnection();

    let hallId = data.hallId;
    if (!hallId) {
      const allSlots = await this.getTimeSlots();
      const s = allSlots.find((x) => x.id === data.slotId);
      if (s) hallId = s.hallId;
    }
    if (!hallId) {
      return { success: false, error: 'Could not determine venue for selected slot.' };
    }

    // Check availability
    const avail = await this.getAvailability(data.eventDate, hallId);
    const targetSlot = avail.slots.find((s) => s.slot.id === data.slotId);

    if (!targetSlot || !targetSlot.isAvailable) {
      return { success: false, error: 'The selected time slot is unavailable on this date.' };
    }

    const slot = targetSlot.slot;
    const totalAmount = slot.basePricePaise;
    const advanceAmount = Math.round(totalAmount * 0.25); // 25% advance
    const reference = `DK-${data.eventDate.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const newId = `bk-${Date.now()}`;
    const nowIso = new Date().toISOString();

    if (isDb) {
      try {
        await execute(
          `INSERT INTO vf_bookings (
            id, reference, hall_id, slot_id, event_date, applicant_name, applicant_phone, applicant_email,
            organisation, event_type, guest_count, notes, status, total_amount_paise, advance_amount_paise,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, NOW(), NOW())`,
          [
            newId,
            reference,
            hallId,
            data.slotId,
            data.eventDate,
            data.applicantName,
            data.applicantPhone,
            data.applicantEmail,
            data.organisation || null,
            data.eventType,
            data.guestCount,
            data.notes || null,
            totalAmount,
            advanceAmount,
          ]
        );

        const createdBooking: Booking = {
          id: newId,
          reference,
          hallId,
          slotId: data.slotId,
          eventDate: data.eventDate,
          applicantName: data.applicantName,
          applicantPhone: data.applicantPhone,
          applicantEmail: data.applicantEmail,
          organisation: data.organisation,
          eventType: data.eventType,
          guestCount: data.guestCount,
          notes: data.notes,
          status: 'PENDING',
          holdExpiresAt: null,
          totalAmountPaise: totalAmount,
          advanceAmountPaise: advanceAmount,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        return { success: true, booking: createdBooking };
      } catch (err: any) {
        console.error('[MySQL] createBookingRequest error:', err);
      }
    }

    const newBooking: Booking = {
      id: newId,
      reference,
      hallId,
      slotId: data.slotId,
      eventDate: data.eventDate,
      applicantName: data.applicantName,
      applicantPhone: data.applicantPhone,
      applicantEmail: data.applicantEmail,
      organisation: data.organisation,
      eventType: data.eventType,
      guestCount: data.guestCount,
      notes: data.notes,
      status: 'PENDING',
      holdExpiresAt: null,
      totalAmountPaise: totalAmount,
      advanceAmountPaise: advanceAmount,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    mem.bookings.push(newBooking);
    mem.save();
    return { success: true, booking: newBooking };
  },

  // Lookup booking
  async getBookingByReference(
    reference: string,
    phone?: string
  ): Promise<(Booking & { hall?: Hall; slot?: TimeSlot }) | null> {
    const isDb = await checkDbConnection();

    if (isDb) {
      try {
        let sql = `
          SELECT 
            b.id, b.reference, b.hall_id AS hallId, b.slot_id AS slotId,
            b.event_date AS eventDate,
            b.applicant_name AS applicantName, b.applicant_phone AS applicantPhone, b.applicant_email AS applicantEmail,
            b.organisation, b.event_type AS eventType, b.guest_count AS guestCount, b.notes,
            b.status, b.rejection_reason AS rejectionReason,
            b.hold_expires_at AS holdExpiresAt,
            b.total_amount_paise AS totalAmountPaise, b.advance_amount_paise AS advanceAmountPaise,
            b.active_slot_key AS activeSlotKey,
            b.created_at AS createdAt, b.updated_at AS updatedAt
          FROM vf_bookings b
          WHERE UPPER(TRIM(b.reference)) = UPPER(TRIM(?))
        `;
        const params: any[] = [reference];

        if (phone) {
          sql += ' AND b.applicant_phone LIKE ?';
          params.push(`%${phone.trim()}%`);
        }
        sql += ' LIMIT 1';

        const rows = await query<any>(sql, params);
        if (rows.length > 0) {
          const b = rows[0];
          const hall = await this.getHall(b.hallId);
          const allSlots = await this.getTimeSlots(b.hallId);
          const slot = allSlots.find((s) => s.id === b.slotId);

          return {
            ...b,
            eventDate: formatDateString(b.eventDate),
            holdExpiresAt: formatIsoString(b.holdExpiresAt),
            createdAt: formatIsoString(b.createdAt) || '',
            updatedAt: formatIsoString(b.updatedAt) || '',
            hall: hall || undefined,
            slot,
          };
        }
      } catch (err) {
        console.error('[MySQL] getBookingByReference error:', err);
      }
    }

    const b = mem.bookings.find(
      (x) =>
        x.reference.toUpperCase() === reference.toUpperCase().trim() &&
        (!phone || x.applicantPhone.replace(/\D/g, '') === phone.replace(/\D/g, ''))
    );
    if (!b) return null;

    const hall = mem.halls.find((h) => h.id === b.hallId);
    const slot = mem.timeSlots.find((s) => s.id === b.slotId);

    return { ...b, hall, slot };
  },

  // Get all bookings (Admin Queue)
  async getBookings(filters?: {
    status?: string;
    hallId?: string;
    fromDate?: string;
    toDate?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Array<Booking & { hall?: Hall; slot?: TimeSlot }>> {
    const isDb = await checkDbConnection();
    const fromDate = filters?.fromDate || filters?.startDate;
    const toDate = filters?.toDate || filters?.endDate;

    if (isDb) {
      try {
        const whereClauses: string[] = ['1=1'];
        const params: any[] = [];

        if (filters?.status && filters.status !== 'ALL') {
          whereClauses.push('b.status = ?');
          params.push(filters.status);
        }
        if (filters?.hallId && filters.hallId !== 'ALL') {
          whereClauses.push('b.hall_id = ?');
          params.push(filters.hallId);
        }
        if (fromDate) {
          whereClauses.push('b.event_date >= ?');
          params.push(fromDate);
        }
        if (toDate) {
          whereClauses.push('b.event_date <= ?');
          params.push(toDate);
        }

        const sql = `
          SELECT 
            b.id, b.reference, b.hall_id AS hallId, b.slot_id AS slotId,
            b.event_date AS eventDate,
            b.applicant_name AS applicantName, b.applicant_phone AS applicantPhone, b.applicant_email AS applicantEmail,
            b.organisation, b.event_type AS eventType, b.guest_count AS guestCount, b.notes,
            b.status, b.rejection_reason AS rejectionReason,
            b.hold_expires_at AS holdExpiresAt,
            b.total_amount_paise AS totalAmountPaise, b.advance_amount_paise AS advanceAmountPaise,
            b.active_slot_key AS activeSlotKey,
            b.created_at AS createdAt, b.updated_at AS updatedAt
          FROM vf_bookings b
          WHERE ${whereClauses.join(' AND ')}
          ORDER BY b.created_at DESC
        `;

        const bookings = await query<any>(sql, params);
        const halls = await this.getHalls();
        const slots = await this.getTimeSlots();

        return bookings.map((b) => ({
          ...b,
          eventDate: formatDateString(b.eventDate),
          holdExpiresAt: formatIsoString(b.holdExpiresAt),
          createdAt: formatIsoString(b.createdAt) || '',
          updatedAt: formatIsoString(b.updatedAt) || '',
          hall: halls.find((h) => h.id === b.hallId),
          slot: slots.find((s) => s.id === b.slotId),
        }));
      } catch (err) {
        console.error('[MySQL] getBookings error:', err);
      }
    }

    let result = mem.bookings.map((b) => ({
      ...b,
      hall: mem.halls.find((h) => h.id === b.hallId),
      slot: mem.timeSlots.find((s) => s.id === b.slotId),
    }));

    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((b) => b.status === filters.status);
    }
    if (filters?.hallId && filters.hallId !== 'ALL') {
      result = result.filter((b) => b.hallId === filters.hallId);
    }
    if (fromDate) {
      result = result.filter((b) => b.eventDate >= fromDate);
    }
    if (toDate) {
      result = result.filter((b) => b.eventDate <= toDate);
    }

    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  // Approve booking request (Admin)
  async approveBooking(
    bookingId: string,
    adminId?: string,
    adminName?: string
  ): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const holdHours = 48;
    const holdExpiresAt = new Date(Date.now() + holdHours * 3600000);
    const isDb = await checkDbConnection();

    if (isDb) {
      try {
        const rows = await query<any>(`SELECT * FROM vf_bookings WHERE id = ?`, [bookingId]);
        if (rows.length === 0) return { success: false, error: 'Booking not found' };

        const b = rows[0];
        const eventDateStr = formatDateString(b.event_date);
        const activeKey = `${b.hall_id}_${eventDateStr}_${b.slot_id}`;

        // Verify slot lock
        const conflicts = await query<any>(
          `SELECT id FROM vf_bookings WHERE id != ? AND active_slot_key = ?`,
          [bookingId, activeKey]
        );

        if (conflicts.length > 0) {
          return { success: false, error: 'Slot is already locked by another confirmed or held booking.' };
        }

        await execute(
          `UPDATE vf_bookings SET status = 'APPROVED_AWAITING_PAYMENT', active_slot_key = ?, hold_expires_at = ?, updated_at = NOW() WHERE id = ?`,
          [activeKey, holdExpiresAt, bookingId]
        );

        await execute(
          `INSERT INTO vf_audit_logs (id, admin_id, admin_name, entity_type, entity_id, action, new_value)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [`log-${Date.now()}`, adminId || null, adminName || null, 'Booking', bookingId, 'APPROVE', JSON.stringify({ status: 'APPROVED_AWAITING_PAYMENT', holdExpiresAt })]
        ).catch(() => {});

        const updated = await this.getBookingByReference(b.reference);
        return {
          success: true,
          booking: updated || undefined,
        };
      } catch (err: any) {
        console.error('[MySQL] approveBooking error:', err);
      }
    }

    const b = mem.bookings.find((x) => x.id === bookingId);
    if (!b) return { success: false, error: 'Booking not found' };

    const activeKey = `${b.hallId}_${b.eventDate}_${b.slotId}`;
    const conflict = mem.bookings.find(
      (x) => x.id !== bookingId && x.activeSlotKey === activeKey
    );

    if (conflict) {
      return { success: false, error: 'Slot is already locked by another held or confirmed booking.' };
    }

    b.status = 'APPROVED_AWAITING_PAYMENT';
    b.activeSlotKey = activeKey;
    b.holdExpiresAt = holdExpiresAt.toISOString();
    b.updatedAt = new Date().toISOString();

    mem.auditLogs.push({
      id: `log-${Date.now()}`,
      adminId,
      adminName,
      entityType: 'Booking',
      entityId: bookingId,
      action: 'APPROVE',
      newValue: { status: b.status, holdExpiresAt: b.holdExpiresAt },
      createdAt: new Date().toISOString(),
    });

    mem.save();
    return { success: true, booking: b };
  },

  // Reject booking request
  async rejectBooking(
    bookingId: string,
    reason: string,
    adminId?: string,
    adminName?: string
  ): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const isDb = await checkDbConnection();
    if (isDb) {
      try {
        const rows = await query<any>(`SELECT reference FROM vf_bookings WHERE id = ?`, [bookingId]);
        if (rows.length === 0) return { success: false, error: 'Booking not found' };

        await execute(
          `UPDATE vf_bookings SET status = 'REJECTED', rejection_reason = ?, active_slot_key = NULL, hold_expires_at = NULL, updated_at = NOW() WHERE id = ?`,
          [reason, bookingId]
        );

        await execute(
          `INSERT INTO vf_audit_logs (id, admin_id, admin_name, entity_type, entity_id, action, new_value)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [`log-${Date.now()}`, adminId || null, adminName || null, 'Booking', bookingId, 'REJECT', JSON.stringify({ reason })]
        ).catch(() => {});

        const updated = await this.getBookingByReference(rows[0].reference);
        return {
          success: true,
          booking: updated || undefined,
        };
      } catch (err: any) {
        console.error('[MySQL] rejectBooking error:', err);
      }
    }

    const b = mem.bookings.find((x) => x.id === bookingId);
    if (!b) return { success: false, error: 'Booking not found' };

    b.status = 'REJECTED';
    b.rejectionReason = reason;
    b.activeSlotKey = undefined;
    b.holdExpiresAt = null;
    b.updatedAt = new Date().toISOString();

    mem.auditLogs.push({
      id: `log-${Date.now()}`,
      adminId,
      adminName,
      entityType: 'Booking',
      entityId: bookingId,
      action: 'REJECT',
      newValue: { reason },
      createdAt: new Date().toISOString(),
    });

    mem.save();
    return { success: true, booking: b };
  },

  // Create manual / walk-in booking (Admin)
  async createManualBooking(
    formData: {
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
      markAsPaid?: boolean;
      paymentMethod?: string;
      amountCollectedPaise?: number;
      adminId?: string;
      adminName?: string;
    },
    adminIdArg?: string,
    adminNameArg?: string
  ): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const adminId = adminIdArg || formData.adminId || 'admin-1';
    const adminName = adminNameArg || formData.adminName || 'District Reservation Officer';

    let hallId = formData.hallId;
    if (!hallId) {
      const allSlots = await this.getTimeSlots();
      const s = allSlots.find((x) => x.id === formData.slotId);
      if (s) hallId = s.hallId;
    }
    if (!hallId) {
      return { success: false, error: 'Venue not found for selected slot.' };
    }

    const activeKey = `${hallId}_${formData.eventDate}_${formData.slotId}`;
    const isDb = await checkDbConnection();

    if (isDb) {
      try {
        const conflict = await query<any>(
          `SELECT id FROM vf_bookings WHERE active_slot_key = ?`,
          [activeKey]
        );

        if (conflict.length > 0) {
          return { success: false, error: 'Slot is already locked on this date.' };
        }

        const slotRows = await query<any>(`SELECT base_price_paise FROM vf_time_slots WHERE id = ?`, [formData.slotId]);
        const totalAmount = slotRows[0]?.base_price_paise || 2000000;
        const advanceAmount = Math.round(totalAmount * 0.25);
        const reference = `MAN-${formData.eventDate.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
        const newId = `bk-${Date.now()}`;
        const holdExpiresAt = formData.markAsPaid ? null : new Date(Date.now() + 48 * 3600000);
        const status = formData.markAsPaid ? 'CONFIRMED' : 'APPROVED_AWAITING_PAYMENT';

        await execute(
          `INSERT INTO vf_bookings (
            id, reference, hall_id, slot_id, event_date, applicant_name, applicant_phone, applicant_email,
            organisation, event_type, guest_count, notes, status, active_slot_key, hold_expires_at,
            total_amount_paise, advance_amount_paise, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            newId,
            reference,
            hallId,
            formData.slotId,
            formData.eventDate,
            formData.applicantName,
            formData.applicantPhone,
            formData.applicantEmail,
            formData.organisation || null,
            formData.eventType,
            formData.guestCount,
            formData.notes || null,
            status,
            activeKey,
            holdExpiresAt,
            totalAmount,
            advanceAmount,
          ]
        );

        if (formData.markAsPaid) {
          await execute(
            `INSERT INTO vf_payments (id, booking_id, amount_paise, currency, status, method, paid_at, created_at)
             VALUES (?, ?, ?, 'INR', 'PAID', ?, NOW(), NOW())`,
            [
              `pay-${Date.now()}`,
              newId,
              formData.amountCollectedPaise || advanceAmount,
              formData.paymentMethod || 'CASH_OFFLINE',
            ]
          );
        }

        await execute(
          `INSERT INTO vf_audit_logs (id, admin_id, admin_name, entity_type, entity_id, action, new_value)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [`log-${Date.now()}`, adminId, adminName, 'Booking', newId, 'MANUAL_BOOKING', JSON.stringify({ reference, status, totalAmount })]
        ).catch(() => {});

        const created = await this.getBookingByReference(reference);
        return {
          success: true,
          booking: created || undefined,
        };
      } catch (err: any) {
        console.error('[MySQL] createManualBooking error:', err);
      }
    }

    // Mem fallback
    const conflict = mem.bookings.find((b) => b.activeSlotKey === activeKey);
    if (conflict) {
      return { success: false, error: 'Slot is already locked on this date.' };
    }

    const slot = mem.timeSlots.find((s) => s.id === formData.slotId);
    const totalAmount = slot?.basePricePaise || 2000000;
    const advanceAmount = Math.round(totalAmount * 0.25);
    const reference = `MAN-${formData.eventDate.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      reference,
      hallId,
      slotId: formData.slotId,
      eventDate: formData.eventDate,
      applicantName: formData.applicantName,
      applicantPhone: formData.applicantPhone,
      applicantEmail: formData.applicantEmail,
      organisation: formData.organisation,
      eventType: formData.eventType,
      guestCount: formData.guestCount,
      notes: formData.notes,
      status: formData.markAsPaid ? 'CONFIRMED' : 'APPROVED_AWAITING_PAYMENT',
      activeSlotKey: activeKey,
      holdExpiresAt: formData.markAsPaid ? null : new Date(Date.now() + 48 * 3600000).toISOString(),
      totalAmountPaise: totalAmount,
      advanceAmountPaise: advanceAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mem.bookings.push(newBooking);

    if (formData.markAsPaid) {
      mem.payments.push({
        id: `pay-${Date.now()}`,
        bookingId: newBooking.id,
        amountPaise: formData.amountCollectedPaise || advanceAmount,
        currency: 'INR',
        status: 'PAID',
        method: formData.paymentMethod || 'CASH',
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    }

    mem.save();
    return { success: true, booking: newBooking };
  },

  // Confirm payment via Razorpay
  async confirmPayment(data: {
    bookingId: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    amountPaise?: number;
    method?: string;
    rawEvent?: any;
  }): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const isDb = await checkDbConnection();

    if (isDb) {
      try {
        const rows = await query<any>(`SELECT * FROM vf_bookings WHERE id = ?`, [data.bookingId]);
        if (rows.length === 0) return { success: false, error: 'Booking not found' };

        const b = rows[0];
        const eventDateStr = formatDateString(b.event_date);
        const activeKey = `${b.hall_id}_${eventDateStr}_${b.slot_id}`;

        await execute(
          `UPDATE vf_bookings SET status = 'CONFIRMED', active_slot_key = ?, hold_expires_at = NULL, updated_at = NOW() WHERE id = ?`,
          [activeKey, data.bookingId]
        );

        await execute(
          `INSERT INTO vf_payments (id, booking_id, razorpay_order_id, razorpay_payment_id, amount_paise, currency, status, method, paid_at, raw_event, created_at)
           VALUES (?, ?, ?, ?, ?, 'INR', 'PAID', ?, NOW(), ?, NOW())`,
          [
            `pay-${Date.now()}`,
            data.bookingId,
            data.razorpayOrderId || null,
            data.razorpayPaymentId || null,
            data.amountPaise || b.advance_amount_paise,
            data.method || 'RAZORPAY',
            data.rawEvent ? JSON.stringify(data.rawEvent) : null,
          ]
        );

        const updated = await this.getBookingByReference(b.reference);
        return {
          success: true,
          booking: updated || undefined,
        };
      } catch (err: any) {
        console.error('[MySQL] confirmPayment error:', err);
      }
    }

    const b = mem.bookings.find((x) => x.id === data.bookingId);
    if (!b) return { success: false, error: 'Booking not found' };

    b.status = 'CONFIRMED';
    b.activeSlotKey = `${b.hallId}_${b.eventDate}_${b.slotId}`;
    b.holdExpiresAt = null;
    b.updatedAt = new Date().toISOString();

    mem.payments.push({
      id: `pay-${Date.now()}`,
      bookingId: b.id,
      razorpayOrderId: data.razorpayOrderId,
      razorpayPaymentId: data.razorpayPaymentId,
      amountPaise: data.amountPaise || b.advanceAmountPaise,
      currency: 'INR',
      status: 'PAID',
      method: data.method || 'RAZORPAY',
      paidAt: new Date().toISOString(),
      rawEvent: data.rawEvent,
      createdAt: new Date().toISOString(),
    });

    mem.save();
    return { success: true, booking: b };
  },

  // Cancel booking with refund calculation
  async cancelBooking(
    bookingId: string,
    cancelledBy: string = 'APPLICANT',
    roleOrAdminId?: string,
    adminName?: string
  ): Promise<{ success: boolean; error?: string; refundEligibility?: any }> {
    const isDb = await checkDbConnection();

    if (isDb) {
      try {
        const rows = await query<any>(`SELECT * FROM vf_bookings WHERE id = ?`, [bookingId]);
        if (rows.length === 0) return { success: false, error: 'Booking not found' };

        const b = rows[0];
        const eventDateStr = formatDateString(b.event_date);
        const daysUntilEvent = Math.ceil(
          (new Date(eventDateStr).getTime() - Date.now()) / 86400000
        );

        let refundPercentage = 0;
        let policyNote = 'Cancelled under 3 days prior to event; advance non-refundable.';

        if (daysUntilEvent >= 7) {
          refundPercentage = 100;
          policyNote = 'Cancelled 7+ days in advance: 100% advance refund eligible.';
        } else if (daysUntilEvent >= 3) {
          refundPercentage = 50;
          policyNote = 'Cancelled 3–7 days in advance: 50% advance refund eligible.';
        }

        const eligibleRefundPaise = Math.round((b.advance_amount_paise * refundPercentage) / 100);

        await execute(
          `UPDATE vf_bookings SET status = 'CANCELLED', active_slot_key = NULL, hold_expires_at = NULL, updated_at = NOW() WHERE id = ?`,
          [bookingId]
        );

        await execute(
          `INSERT INTO vf_audit_logs (id, admin_id, admin_name, entity_type, entity_id, action, new_value)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            `log-${Date.now()}`,
            roleOrAdminId || null,
            adminName || cancelledBy,
            'Booking',
            bookingId,
            'CANCEL',
            JSON.stringify({ cancelledBy, refundPercentage, eligibleRefundPaise }),
          ]
        ).catch(() => {});

        return {
          success: true,
          refundEligibility: {
            daysUntilEvent,
            refundPercentage,
            eligibleRefundPaise,
            policyNote,
          },
        };
      } catch (err: any) {
        console.error('[MySQL] cancelBooking error:', err);
      }
    }

    // Mem fallback
    const b = mem.bookings.find((x) => x.id === bookingId);
    if (!b) return { success: false, error: 'Booking not found' };

    const daysUntilEvent = Math.ceil(
      (new Date(b.eventDate).getTime() - Date.now()) / 86400000
    );

    let refundPercentage = 0;
    let policyNote = 'Cancelled under 3 days prior to event; advance non-refundable.';

    if (daysUntilEvent >= 7) {
      refundPercentage = 100;
      policyNote = 'Cancelled 7+ days in advance: 100% advance refund eligible.';
    } else if (daysUntilEvent >= 3) {
      refundPercentage = 50;
      policyNote = 'Cancelled 3–7 days in advance: 50% advance refund eligible.';
    }

    const eligibleRefundPaise = Math.round((b.advanceAmountPaise * refundPercentage) / 100);

    b.status = 'CANCELLED';
    b.activeSlotKey = undefined;
    b.holdExpiresAt = null;
    b.updatedAt = new Date().toISOString();

    mem.save();
    return {
      success: true,
      refundEligibility: {
        daysUntilEvent,
        refundPercentage,
        eligibleRefundPaise,
        policyNote,
      },
    };
  },

  // Issue refund (Admin)
  async issueRefund(
    paymentIdOrData:
      | string
      | {
          paymentId?: string;
          bookingId?: string;
          amountPaise: number;
          reason: string;
          adminId?: string;
          adminName?: string;
        },
    amountPaise?: number,
    reason?: string,
    adminId?: string,
    adminName?: string
  ): Promise<{ success: boolean; refund?: any; error?: string }> {
    const paymentId = typeof paymentIdOrData === 'string' ? paymentIdOrData : paymentIdOrData.paymentId;
    const effectiveAmount = typeof paymentIdOrData === 'string' ? (amountPaise || 0) : paymentIdOrData.amountPaise;
    const effectiveReason = typeof paymentIdOrData === 'string' ? (reason || 'Admin refund') : paymentIdOrData.reason;

    const isDb = await checkDbConnection();
    if (isDb) {
      try {
        let pId = paymentId;
        if (!pId && typeof paymentIdOrData === 'object' && paymentIdOrData.bookingId) {
          const pays = await query<any>(`SELECT id FROM vf_payments WHERE booking_id = ? LIMIT 1`, [paymentIdOrData.bookingId]);
          if (pays.length > 0) pId = pays[0].id;
        }

        if (pId) {
          const refundId = `ref-${Date.now()}`;
          await execute(
            `INSERT INTO vf_refunds (id, payment_id, amount_paise, status, reason, created_at)
             VALUES (?, ?, ?, 'PROCESSED', ?, NOW())`,
            [refundId, pId, effectiveAmount, effectiveReason]
          );

          await execute(
            `INSERT INTO vf_audit_logs (id, admin_id, admin_name, entity_type, entity_id, action, new_value)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [`log-${Date.now()}`, adminId || null, adminName || null, 'Refund', refundId, 'REFUND', JSON.stringify({ paymentId: pId, amountPaise: effectiveAmount, reason: effectiveReason })]
          ).catch(() => {});

          return {
            success: true,
            refund: {
              id: refundId,
              paymentId: pId,
              amountPaise: effectiveAmount,
              reason: effectiveReason,
              status: 'PROCESSED',
              createdAt: new Date().toISOString(),
            },
          };
        }
      } catch (err: any) {
        console.error('[MySQL] issueRefund error:', err);
      }
    }

    const ref = {
      id: `ref-${Date.now()}`,
      paymentId: paymentId || 'pay-mock',
      amountPaise: effectiveAmount,
      reason: effectiveReason,
      status: 'PROCESSED',
      processedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    mem.refunds.push(ref as any);
    mem.save();
    return { success: true, refund: ref };
  },

  // Get maintenance schedules
  async getMaintenance(hallId?: string): Promise<Maintenance[]> {
    const isDb = await checkDbConnection();
    if (isDb) {
      try {
        let sql = `
          SELECT 
            id, hall_id AS hallId, slot_id AS slotId,
            start_date AS startDate, end_date AS endDate,
            description, status, created_by AS createdBy,
            created_at AS createdAt
          FROM vf_maintenance
        `;
        const params: any[] = [];
        if (hallId) {
          sql += ' WHERE hall_id = ?';
          params.push(hallId);
        }
        sql += ' ORDER BY start_date DESC';

        const rows = await query<any>(sql, params);
        return rows.map((m) => ({
          ...m,
          startDate: formatDateString(m.startDate),
          endDate: formatDateString(m.endDate),
          createdAt: formatIsoString(m.createdAt) || '',
        }));
      } catch (err) {
        console.error('[MySQL] getMaintenance error:', err);
      }
    }

    if (!hallId) return mem.maintenance;
    return mem.maintenance.filter((m) => m.hallId === hallId);
  },

  // Create maintenance window
  async createMaintenance(
    formData: {
      hallId?: string;
      slotId?: string | null;
      startDate: string;
      endDate: string;
      description?: string;
      reason?: string;
    },
    adminId?: string,
    adminName?: string
  ): Promise<{ success: boolean; maintenance?: Maintenance; warnings?: string[]; error?: string }> {
    const hallId = formData.hallId || (await this.getHalls())[0]?.id;
    if (!hallId) return { success: false, error: 'No venue specified' };
    const description = formData.description || formData.reason || 'Scheduled Maintenance';
    const isDb = await checkDbConnection();

    if (isDb) {
      try {
        const maintId = `maint-${Date.now()}`;
        await execute(
          `INSERT INTO vf_maintenance (id, hall_id, slot_id, start_date, end_date, description, status, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'SCHEDULED', ?, NOW())`,
          [
            maintId,
            hallId,
            formData.slotId || null,
            formData.startDate,
            formData.endDate,
            description,
            adminName || 'District Reservation Officer',
          ]
        );

        await execute(
          `INSERT INTO vf_audit_logs (id, admin_id, admin_name, entity_type, entity_id, action, new_value)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [`log-${Date.now()}`, adminId || null, adminName || null, 'Maintenance', maintId, 'CREATE_MAINTENANCE', JSON.stringify(formData)]
        ).catch(() => {});

        return {
          success: true,
          maintenance: {
            id: maintId,
            hallId,
            slotId: formData.slotId || null,
            startDate: formData.startDate,
            endDate: formData.endDate,
            description,
            reason: description,
            status: 'SCHEDULED',
            createdBy: adminName || 'District Reservation Officer',
            createdAt: new Date().toISOString(),
          },
          warnings: [],
        };
      } catch (err: any) {
        console.error('[MySQL] createMaintenance error:', err);
      }
    }

    const newMaint: Maintenance = {
      id: `maint-${Date.now()}`,
      hallId,
      slotId: formData.slotId,
      startDate: formData.startDate,
      endDate: formData.endDate,
      description,
      reason: description,
      status: 'SCHEDULED',
      createdBy: adminName || 'District Reservation Officer',
      createdAt: new Date().toISOString(),
    };

    mem.maintenance.push(newMaint);
    mem.save();
    return { success: true, maintenance: newMaint, warnings: [] };
  },

  // Auto release holds
  async autoReleaseExpiredHolds(): Promise<number> {
    const isDb = await checkDbConnection();
    if (isDb) {
      try {
        const res = await execute(
          `UPDATE vf_bookings
           SET status = 'EXPIRED', active_slot_key = NULL, updated_at = NOW()
           WHERE status = 'APPROVED_AWAITING_PAYMENT' AND hold_expires_at <= NOW()`
        );
        return res.affectedRows;
      } catch (err) {
        console.error('[MySQL] autoReleaseExpiredHolds error:', err);
      }
    }

    const now = new Date().toISOString();
    let released = 0;

    mem.bookings.forEach((b) => {
      if (
        b.status === 'APPROVED_AWAITING_PAYMENT' &&
        b.holdExpiresAt &&
        b.holdExpiresAt <= now
      ) {
        b.status = 'EXPIRED';
        b.activeSlotKey = undefined;
        b.updatedAt = now;
        released++;
      }
    });

    if (released > 0) mem.save();
    return released;
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    const isDb = await checkDbConnection();
    if (isDb) {
      try {
        const rows = await query<any>(
          `SELECT 
            id, admin_id AS adminId, admin_name AS adminName,
            entity_type AS entityType, entity_id AS entityId,
            action, old_value AS oldValue, new_value AS newValue,
            created_at AS createdAt
          FROM vf_audit_logs
          ORDER BY created_at DESC
          LIMIT 100`
        );
        return rows.map((l) => ({
          ...l,
          oldValue: parseJsonSafe(l.oldValue),
          newValue: parseJsonSafe(l.newValue),
          createdAt: formatIsoString(l.createdAt) || '',
        }));
      } catch (err) {
        console.error('[MySQL] getAuditLogs error:', err);
      }
    }
    return mem.auditLogs;
  },

  // Settings
  async getSettings(): Promise<Setting[]> {
    const isDb = await checkDbConnection();
    if (isDb) {
      try {
        const rows = await query<{ key: string; value: string }>(
          `SELECT \`key\`, value FROM vf_settings`
        );
        if (rows.length > 0) {
          return rows.map((r, idx) => ({
            id: `s-${idx}`,
            key: r.key,
            value: r.value,
          }));
        }
      } catch (err) {
        console.error('[MySQL] getSettings error:', err);
      }
    }
    return Array.from(mem.settings.entries()).map(([key, value], idx) => ({
      id: `s-${idx}`,
      key,
      value,
    }));
  },

  // Update setting
  async updateSetting(key: string, value: string, adminId: string, adminName: string) {
    const isDb = await checkDbConnection();
    if (isDb) {
      try {
        await execute(
          `INSERT INTO vf_settings (\`key\`, value, updated_at) VALUES (?, ?, NOW())
           ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()`,
          [key, value]
        );
      } catch (err) {
        console.error('[MySQL] updateSetting error:', err);
      }
    }
    mem.settings.set(key, value);
    mem.save();
  },

  // Admin Auth lookup
  async findAdminByEmail(email: string): Promise<(Admin & { passwordHash: string }) | null> {
    const isDb = await checkDbConnection();
    if (isDb) {
      try {
        const rows = await query<any>(
          `SELECT id, name, email, role, password_hash AS passwordHash,
                  last_login_at AS lastLoginAt, created_at AS createdAt
           FROM vf_admins
           WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))
           LIMIT 1`,
          [email]
        );
        if (rows.length > 0) {
          const a = rows[0];
          return {
            id: a.id,
            name: a.name,
            email: a.email,
            role: a.role,
            passwordHash: a.passwordHash,
            lastLoginAt: formatIsoString(a.lastLoginAt),
            createdAt: formatIsoString(a.createdAt) || undefined,
          };
        }
      } catch (err) {
        console.error('[MySQL] findAdminByEmail error:', err);
      }
    }
    const admin = mem.admins.find((a) => a.email.toLowerCase() === email.toLowerCase().trim());
    return admin || null;
  },
};
