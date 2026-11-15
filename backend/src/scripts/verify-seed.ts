import { pool } from '../db';

async function run() {
  const [pages, banners, faqs, seo, help, comm, blog, reports] = await Promise.all([
    pool.query('SELECT count(*)::int as count FROM content_pages'),
    pool.query('SELECT count(*)::int as count FROM content_banners'),
    pool.query('SELECT count(*)::int as count FROM content_faqs'),
    pool.query('SELECT count(*)::int as count FROM seo_redirects'),
    pool.query('SELECT count(*)::int as count FROM help_articles'),
    pool.query('SELECT count(*)::int as count FROM community_threads'),
    pool.query('SELECT count(*)::int as count FROM blog_posts'),
    pool.query('SELECT count(*)::int as count FROM community_reports'),
  ]);
  console.log('--- SEEDED RECORDS IN DB ---');
  console.log('Content Pages:', pages.rows[0].count);
  console.log('Banners:', banners.rows[0].count);
  console.log('FAQs:', faqs.rows[0].count);
  console.log('SEO Redirects:', seo.rows[0].count);
  console.log('Help Articles:', help.rows[0].count);
  console.log('Community Threads:', comm.rows[0].count);
  console.log('Community Reports:', reports.rows[0].count);
  console.log('Blog Posts:', blog.rows[0].count);
  await pool.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
