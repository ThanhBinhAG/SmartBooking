require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'postgres',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'smart_booking',
  user:     process.env.DB_USER     || 'booking_user',
  password: process.env.DB_PASSWORD || 'booking_pass_2024',
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 1000,
});

pool.on('error', (err) => {
  console.error('Pool error:', err.message);
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Không thể kết nối Database:', err.message);
  } else {
    console.log('✅ Kết nối Database thành công! Host:', process.env.DB_HOST);
    release();
  }
});

const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

module.exports = { query, pool };
