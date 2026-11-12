import 'dotenv/config';
import { app } from './app';
import { pool } from './db';
import { startSubmissionPoller } from './services/submission.service';
import { validateRuntimeConfig } from './config';

const PORT = process.env.PORT || 5000;

async function main() {
  validateRuntimeConfig();
  // Verify DB connection
  const client = await pool.connect();
  await client.query('SELECT 1');
  client.release();
  console.log('✅ PostgreSQL connected');

  // Start background Judge0 polling job
  startSubmissionPoller();
  console.log('✅ Submission poller started');

  app.listen(PORT, () => {
    console.log(`✅ CodeVerse API running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

main().catch((err) => {
  console.error('❌ Fatal startup error:', err);
  process.exit(1);
});
