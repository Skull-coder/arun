require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 50
});
pool.query('SELECT 1').then(res => console.log('Pool Connected!', res.rows)).catch(err => console.error('Pool Error:', err));
