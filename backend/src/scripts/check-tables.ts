import { pool } from '../db';

async function run() {
  const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log('Tables in DB:', res.rows.map(r => r.table_name));
  await pool.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
