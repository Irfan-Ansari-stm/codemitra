import 'dotenv/config';
import { seedCodingQuestions } from '../db/seed-coding-questions';
import { pool } from '../db';

async function main() {
  console.log('--- CodeMitra Coding Problem Seeder ---');
  try {
    const res = await seedCodingQuestions();
    console.log(`Successfully seeded ${res.totalQuestions} coding questions!`);
    console.log(`Created: ${res.createdCount}, Updated: ${res.updatedCount}`);
  } catch (err: any) {
    console.error('Error seeding questions:', err.message);
  } finally {
    await pool.end();
  }
}

main();
