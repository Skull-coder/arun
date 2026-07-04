require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { pgTable, varchar } = require('drizzle-orm/pg-core');

const usersTable = pgTable('users', { id: varchar('id') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/eduquiz" });
const db = drizzle(pool);

db.select().from(usersTable).then(res => {
  console.log('Drizzle Select:', res);
  process.exit(0);
}).catch(err => {
  console.error('Drizzle Error:', err);
  process.exit(1);
});
