import { comprehensiveSeoService } from '../services/seo.service';
import { pool } from '../db';

async function run() {
  const a = await comprehensiveSeoService.runAudit();
  console.log('Audit result:', a);
  await pool.end();
}
run();
