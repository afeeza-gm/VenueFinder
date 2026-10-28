import mysql from 'mysql2/promise';

interface ParsedDbConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
}

export function parseDatabaseConfig(): ParsedDbConfig {
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
      // Fallback regex in case of URL parse quirks with empty passwords
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

const globalForMysql = global as unknown as { mysqlPool?: mysql.Pool };

export function getPool(): mysql.Pool {
  if (!globalForMysql.mysqlPool) {
    const config = parseDatabaseConfig();
    globalForMysql.mysqlPool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true,
    });
  }
  return globalForMysql.mysqlPool;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const pool = getPool();
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

export async function execute(sql: string, params: any[] = []): Promise<mysql.ResultSetHeader> {
  const pool = getPool();
  const [result] = await pool.execute(sql, params);
  return result as mysql.ResultSetHeader;
}

export async function initSchema(): Promise<void> {
  const config = parseDatabaseConfig();

  // 1. Ensure database exists
  try {
    const rootConn = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
    });
    await rootConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await rootConn.end();
  } catch (err: any) {
    console.warn('[MySQL] Could not ensure database exists via root connection:', err.message);
  }

  const pool = getPool();

  const ddlStatements = [
    `CREATE TABLE IF NOT EXISTS halls (
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

    `CREATE TABLE IF NOT EXISTS facilities (
      id VARCHAR(191) PRIMARY KEY,
      hall_id VARCHAR(191) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT NULL,
      INDEX idx_facilities_hall_id (hall_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS time_slots (
      id VARCHAR(191) PRIMARY KEY,
      hall_id VARCHAR(191) NOT NULL,
      label VARCHAR(255) NOT NULL,
      start_time VARCHAR(20) NOT NULL,
      end_time VARCHAR(20) NOT NULL,
      base_price_paise INT NOT NULL,
      INDEX idx_time_slots_hall_id (hall_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS bookings (
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
      INDEX idx_bookings_phone (applicant_phone),
      INDEX idx_bookings_event_date (event_date),
      INDEX idx_bookings_hall_id (hall_id),
      INDEX idx_bookings_slot_id (slot_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS payments (
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
      INDEX idx_payments_booking_id (booking_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS refunds (
      id VARCHAR(191) PRIMARY KEY,
      payment_id VARCHAR(191) NOT NULL,
      razorpay_refund_id VARCHAR(191) UNIQUE NULL,
      amount_paise INT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'PROCESSED',
      reason TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_refunds_payment_id (payment_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS maintenance (
      id VARCHAR(191) PRIMARY KEY,
      hall_id VARCHAR(191) NOT NULL,
      slot_id VARCHAR(191) NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      description TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
      created_by VARCHAR(255) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_maintenance_hall_id (hall_id),
      INDEX idx_maintenance_slot_id (slot_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS admins (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(191) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
      last_login_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(191) PRIMARY KEY,
      admin_id VARCHAR(191) NULL,
      admin_name VARCHAR(255) NULL,
      entity_type VARCHAR(100) NOT NULL,
      entity_id VARCHAR(191) NOT NULL,
      action VARCHAR(100) NOT NULL,
      old_value JSON NULL,
      new_value JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_audit_logs_admin_id (admin_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS settings (
      \`key\` VARCHAR(191) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS webhook_events (
      id VARCHAR(191) PRIMARY KEY,
      provider_event_id VARCHAR(191) UNIQUE NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      processed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
  ];

  for (const statement of ddlStatements) {
    await pool.query(statement);
  }
}
