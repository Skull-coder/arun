const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/eduquiz" });
pool.query('SELECT 1').then(res => console.log('Connected!', res.rows)).catch(err => console.error('DB Error:', err));
