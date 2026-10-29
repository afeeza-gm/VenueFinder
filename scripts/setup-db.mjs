import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

function parseDatabaseConfig() {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      const parsed = new URL(dbUrl);
      return {
        host: parsed.hostname || 'localhost',
        port: parsed.port ? parseInt(parsed.port, 10) : 3306,
        user: decodeURIComponent(parsed.username || 'root'),
        password: decodeURIComponent(parsed.password || ''),
        database: parsed.pathname.replace(/^\//, '') || 'venuefinder_db',
      };
    } catch {
      const match = dbUrl.match(/mysql:\/\/([^:]*)(?::([^@]*))?@([^:\/]+)(?::(\d+))?\/(.+)/);
      if (match) {
        return {
          user: match[1] || 'root',
          password: match[2] || '',
          host: match[3] || 'localhost',
          port: match[4] ? parseInt(match[4], 10) : 3306,
          database: match[5] || 'venuefinder_db',
        };
      }
    }
  }

  return {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'venuefinder_db',
  };
}

async function main() {
  console.log('--- VenueFinder MySQL Setup (Native mysql2) ---');

  const config = parseDatabaseConfig();
  console.log(`Target: ${config.user}@${config.host}:${config.port}/${config.database}`);

  try {
    // 1. Connect without DB to ensure database exists
    const rootConn = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
    });

    console.log(`1. Ensuring database "${config.database}" exists...`);
    await rootConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await rootConn.end();
    console.log('✓ Database confirmed.');

    // 2. Connect to database and create tables
    console.log('2. Creating tables & indexes...');
    const dbConn = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      dateStrings: true,
    });

    // Migrate any existing un-prefixed tables to vf_* prefix
    const oldTables = [
      'halls', 'facilities', 'time_slots', 'bookings',
      'payments', 'refunds', 'maintenance', 'admins',
      'audit_logs', 'settings', 'webhook_events'
    ];
    for (const t of oldTables) {
      try {
        const [oldTbl] = await dbConn.query(
          `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
          [config.database, t]
        );
        const [newTbl] = await dbConn.query(
          `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
          [config.database, `vf_${t}`]
        );
        if (oldTbl.length > 0 && newTbl.length === 0) {
          console.log(`Migrating existing table \`${t}\` to \`vf_${t}\`...`);
          await dbConn.query(`RENAME TABLE \`${t}\` TO \`vf_${t}\``);
        }
      } catch {
        // Ignore migration query errors
      }
    }

    const ddlStatements = [
      `CREATE TABLE IF NOT EXISTS vf_halls (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL DEFAULT 'Bengaluru',
        address TEXT NOT NULL,
        capacity INT NOT NULL,
        description TEXT NOT NULL,
        rules TEXT NOT NULL,
        contact_phone VARCHAR(50) NOT NULL,
        contact_email VARCHAR(100) NOT NULL,
        image_url TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS vf_facilities (
        id VARCHAR(191) PRIMARY KEY,
        hall_id VARCHAR(191) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        INDEX idx_vf_facilities_hall_id (hall_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS vf_time_slots (
        id VARCHAR(191) PRIMARY KEY,
        hall_id VARCHAR(191) NOT NULL,
        label VARCHAR(255) NOT NULL,
        start_time VARCHAR(20) NOT NULL,
        end_time VARCHAR(20) NOT NULL,
        base_price_paise INT NOT NULL,
        INDEX idx_vf_time_slots_hall_id (hall_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS vf_bookings (
        id VARCHAR(191) PRIMARY KEY,
        reference VARCHAR(100) UNIQUE NOT NULL,
        hall_id VARCHAR(191) NOT NULL,
        slot_id VARCHAR(191) NOT NULL,
        event_date DATE NOT NULL,
        applicant_name VARCHAR(255) NOT NULL,
        applicant_phone VARCHAR(50) NOT NULL,
        applicant_email VARCHAR(100) NOT NULL,
        organisation VARCHAR(255) NULL,
        event_type VARCHAR(100) NOT NULL,
        guest_count INT NOT NULL,
        notes TEXT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        rejection_reason TEXT NULL,
        hold_expires_at DATETIME NULL,
        total_amount_paise INT NOT NULL,
        advance_amount_paise INT NOT NULL,
        active_slot_key VARCHAR(191) UNIQUE NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_vf_bookings_phone (applicant_phone),
        INDEX idx_vf_bookings_event_date (event_date),
        INDEX idx_vf_bookings_hall_id (hall_id),
        INDEX idx_vf_bookings_slot_id (slot_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS vf_payments (
        id VARCHAR(191) PRIMARY KEY,
        booking_id VARCHAR(191) NOT NULL,
        razorpay_order_id VARCHAR(191) UNIQUE NULL,
        razorpay_payment_id VARCHAR(191) UNIQUE NULL,
        amount_paise INT NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
        method VARCHAR(50) NULL,
        paid_at DATETIME NULL,
        raw_event JSON NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_vf_payments_booking_id (booking_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS vf_refunds (
        id VARCHAR(191) PRIMARY KEY,
        payment_id VARCHAR(191) NOT NULL,
        razorpay_refund_id VARCHAR(191) UNIQUE NULL,
        amount_paise INT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PROCESSED',
        reason TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_vf_refunds_payment_id (payment_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS vf_maintenance (
        id VARCHAR(191) PRIMARY KEY,
        hall_id VARCHAR(191) NOT NULL,
        slot_id VARCHAR(191) NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
        created_by VARCHAR(255) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_vf_maintenance_hall_id (hall_id),
        INDEX idx_vf_maintenance_slot_id (slot_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS vf_admins (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(191) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
        last_login_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS vf_audit_logs (
        id VARCHAR(191) PRIMARY KEY,
        admin_id VARCHAR(191) NULL,
        admin_name VARCHAR(255) NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(191) NOT NULL,
        action VARCHAR(100) NOT NULL,
        old_value JSON NULL,
        new_value JSON NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_vf_audit_logs_admin_id (admin_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS vf_settings (
        \`key\` VARCHAR(191) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS vf_webhook_events (
        id VARCHAR(191) PRIMARY KEY,
        provider_event_id VARCHAR(191) UNIQUE NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        processed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
    ];

    for (const sql of ddlStatements) {
      await dbConn.query(sql);
    }
    console.log('✓ Tables & indexes verified.');

    // 3. Check records & ensure admin accounts
    console.log('3. Checking records...');
    const storagePath = path.join(process.cwd(), 'lib', 'db', 'storage.json');
    let seed = null;
    if (fs.existsSync(storagePath)) {
      seed = JSON.parse(fs.readFileSync(storagePath, 'utf-8'));
    }

    // Always ensure admins exist in vf_admins
    const [adminRows] = await dbConn.query('SELECT COUNT(*) AS count FROM vf_admins');
    const adminCount = adminRows[0]?.count || 0;
    if (adminCount === 0 && seed?.admins) {
      console.log('Seeding admin accounts into vf_admins...');
      for (const a of seed.admins) {
        await dbConn.execute(
          `INSERT IGNORE INTO vf_admins (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
          [a.id, a.name, a.email, a.passwordHash, a.role]
        );
      }
    }

    // Repair any placeholder or non-bcrypt password hashes in vf_admins
    if (seed?.admins) {
      for (const a of seed.admins) {
        if (a.passwordHash && a.passwordHash.startsWith('$2')) {
          await dbConn.execute(
            `UPDATE vf_admins SET password_hash = ? WHERE email = ? AND (password_hash NOT LIKE '$2%')`,
            [a.passwordHash, a.email]
          );
        }
      }
    }

    const [rows] = await dbConn.query('SELECT COUNT(*) AS count FROM vf_halls');
    const count = rows[0]?.count || 0;

    if (count > 0) {
      console.log(`Found ${count} venues in MySQL. Preserving existing data.`);
    } else {
      console.log('Database tables are empty. Seeding data from storage.json...');
      if (seed) {

        // Admins
        if (seed.admins) {
          for (const a of seed.admins) {
            await dbConn.execute(
              `INSERT IGNORE INTO vf_admins (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
              [a.id, a.name, a.email, a.passwordHash, a.role]
            );
          }
        }

        // Settings
        if (seed.settings) {
          for (const [k, v] of Object.entries(seed.settings)) {
            await dbConn.execute(
              `INSERT IGNORE INTO vf_settings (\`key\`, value) VALUES (?, ?)`,
              [k, String(v)]
            );
          }
        }

        // Halls
        if (seed.halls) {
          for (const h of seed.halls) {
            await dbConn.execute(
              `INSERT IGNORE INTO vf_halls (id, name, location, address, capacity, description, rules, contact_phone, contact_email, image_url)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [h.id, h.name, h.location, h.address, h.capacity, h.description, h.rules, h.contactPhone, h.contactEmail, h.imageUrl || null]
            );
          }
        }

        // TimeSlots
        if (seed.timeSlots) {
          for (const ts of seed.timeSlots) {
            await dbConn.execute(
              `INSERT IGNORE INTO vf_time_slots (id, hall_id, label, start_time, end_time, base_price_paise)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [ts.id, ts.hallId, ts.label, ts.startTime, ts.endTime, ts.basePricePaise]
            );
          }
        }

        // Facilities
        if (seed.facilities) {
          for (const f of seed.facilities) {
            await dbConn.execute(
              `INSERT IGNORE INTO vf_facilities (id, hall_id, name, description)
               VALUES (?, ?, ?, ?)`,
              [f.id, f.hallId, f.name, f.description || null]
            );
          }
        }

        // Bookings
        if (seed.bookings) {
          for (const b of seed.bookings) {
            await dbConn.execute(
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
        }

        // Maintenance
        if (seed.maintenance) {
          for (const m of seed.maintenance) {
            await dbConn.execute(
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
        }

        console.log('✓ Initial seed completed successfully.');
      }
    }

    await dbConn.end();
    console.log('--- Setup Finished Successfully ---');
  } catch (err) {
    console.error('Setup failed:', err);
    process.exit(1);
  }
}

main();
