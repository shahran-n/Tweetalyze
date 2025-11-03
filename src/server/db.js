const postgres = require('postgres');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('WARNING: DATABASE_URL not configured in environment variables');
}

const sql = connectionString ? postgres(connectionString) : null;

module.exports = sql;

