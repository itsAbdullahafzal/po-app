const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : false
});

// Helper: run a query, return all rows
async function query(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

// Helper: run a query, return first row or null
async function queryOne(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows[0] || null;
}

// Helper: run a mutation, return rowCount + lastInsertId (via RETURNING id)
async function execute(sql, params = []) {
  const result = await pool.query(sql, params);
  return {
    rowCount: result.rowCount,
    lastInsertId: result.rows[0]?.id || null
  };
}

async function initialize() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      email      TEXT UNIQUE NOT NULL,
      password_hash  TEXT NOT NULL,
      plain_password TEXT NOT NULL,
      location   TEXT,
      department TEXT,
      phone      TEXT,
      permission_level TEXT DEFAULT 'requester',
      status     TEXT DEFAULT 'pending',
      rejection_reason TEXT,
      notes      TEXT,
      last_login TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id               SERIAL PRIMARY KEY,
      po_number        TEXT UNIQUE NOT NULL,
      created_by       INTEGER NOT NULL REFERENCES users(id),
      supplier         TEXT NOT NULL,
      supplier_contact TEXT,
      supplier_email   TEXT,
      delivery_address TEXT,
      required_date    DATE,
      status           TEXT DEFAULT 'draft',
      items            JSONB NOT NULL DEFAULT '[]',
      subtotal         REAL DEFAULT 0,
      tax_rate         REAL DEFAULT 20,
      tax              REAL DEFAULT 0,
      total            REAL DEFAULT 0,
      currency         TEXT DEFAULT 'GBP',
      notes            TEXT,
      approved_by      INTEGER REFERENCES users(id),
      approved_at      TIMESTAMPTZ,
      rejected_by      INTEGER REFERENCES users(id),
      rejected_at      TIMESTAMPTZ,
      rejection_reason TEXT,
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      updated_at       TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS fulfillments (
      id             SERIAL PRIMARY KEY,
      po_id          INTEGER NOT NULL REFERENCES purchase_orders(id),
      received_by    INTEGER NOT NULL REFERENCES users(id),
      received_date  DATE NOT NULL,
      items_received JSONB NOT NULL DEFAULT '[]',
      delivery_note  TEXT,
      courier        TEXT,
      condition      TEXT DEFAULT 'good',
      notes          TEXT,
      status         TEXT DEFAULT 'partial',
      created_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Seed default manager
  const existing = await queryOne('SELECT id FROM users WHERE email = $1', ['admin@company.com']);
  if (!existing) {
    const hash = bcrypt.hashSync('Admin123!', 10);
    await execute(
      `INSERT INTO users (name, email, password_hash, plain_password, location, department, permission_level, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      ['System Administrator', 'admin@company.com', hash, 'Admin123!', 'Head Office', 'Management', 'manager', 'approved']
    );
    console.log('Default manager created: admin@company.com / Admin123!');
  }

  console.log('Database ready');
}

module.exports = { query, queryOne, execute, initialize, pool };
