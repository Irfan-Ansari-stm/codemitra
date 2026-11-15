import { pool } from '../db';

async function checkCounts() {
  const [c, p, b, f, l, hc] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM courses WHERE status = 'published'"),
    pool.query("SELECT COUNT(*)::int AS count FROM problems"),
    pool.query("SELECT COUNT(*)::int AS count FROM blog_posts WHERE status = 'published'"),
    pool.query("SELECT COUNT(*)::int AS count FROM faqs WHERE is_active = TRUE"),
    pool.query("SELECT COUNT(*)::int AS count FROM execution_languages WHERE is_active = TRUE"),
    pool.query("SELECT COUNT(*)::int AS count FROM help_articles WHERE status = 'published'")
  ]);
  console.log('Published Courses:', c.rows[0].count);
  console.log('Problems:', p.rows[0].count);
  console.log('Published Blog Posts:', b.rows[0].count);
  console.log('Active FAQs:', f.rows[0].count);
  console.log('Active Languages:', l.rows[0].count);
  console.log('Help Articles:', hc.rows[0].count);
  await pool.end();
}

checkCounts().catch(console.error);
