import 'dotenv/config';
import test, { describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { contentPageService, bannerService, faqService } from './content.service';
import { comprehensiveSeoService } from './seo.service';
import { helpCenterService } from './help-center.service';
import { communityService } from './community.service';
import { blogAdminService } from './blog-admin.service';
import { pool } from '../db';

describe('Content & Marketing Master Service Suite', () => {
  let superAdminId: string;

  test('0. Setup: retrieve test Super Admin user', async () => {
    const res = await pool.query(`SELECT id FROM users WHERE role = 'super_admin' LIMIT 1`);
    superAdminId = res.rows[0]?.id || '00000000-0000-0000-0000-000000000001';
    assert.ok(superAdminId, 'Super Admin ID should exist');
  });

  // ── MODULE A: CONTENT MANAGEMENT HUB ─────────────────────────────
  test('1. Content Hub: overview statistics returns calculated database metrics', async () => {
    const stats = await contentPageService.getStats();
    assert.ok(typeof stats.totalPages === 'number');
    assert.ok(stats.totalPages >= 8, `Expected at least 8 pages, got ${stats.totalPages}`);
    assert.ok(stats.publishedPages >= 5, `Expected at least 5 published pages, got ${stats.publishedPages}`);
    assert.ok(stats.totalBanners >= 5, `Expected at least 5 banners, got ${stats.totalBanners}`);
    assert.ok(stats.totalFaqs >= 12, `Expected at least 12 FAQs, got ${stats.totalFaqs}`);
  });

  test('2. Content Hub: pages listing, search, status filtering, and revision tracking', async () => {
    // List with status filter
    const pubList = await contentPageService.list('published', undefined, undefined, 1, 10);
    assert.ok(pubList.data.length >= 5);
    pubList.data.forEach(p => assert.equal(p.status, 'published'));

    // Search
    const searchRes = await contentPageService.list(undefined, undefined, 'about', 1, 10);
    assert.ok(searchRes.data.length > 0);
    assert.ok(searchRes.data.some(p => p.slug === 'about-codeverse'));

    // Create a new test page
    const testSlug = `test-page-${Date.now()}`;
    const newPage = await contentPageService.create(
      {
        slug: testSlug,
        title: 'Automated Test Page',
        content: '<p>Initial content for test.</p>',
        excerpt: 'Test page excerpt',
        status: 'draft',
      },
      superAdminId
    );
    assert.equal(newPage.slug, testSlug);
    assert.equal(newPage.status, 'draft');

    // Verify initial revision
    const revs1 = await contentPageService.getRevisions(newPage.id);
    assert.equal(revs1.length, 1);
    assert.equal(revs1[0].version, 1);

    // Update page
    const updatedPage = await contentPageService.update(
      newPage.id,
      {
        title: 'Updated Test Page Title',
        content: '<p>Second revision content.</p>',
        status: 'published',
      },
      superAdminId
    );
    assert.equal(updatedPage.title, 'Updated Test Page Title');
    assert.equal(updatedPage.status, 'published');

    // Verify second revision
    const revs2 = await contentPageService.getRevisions(newPage.id);
    assert.equal(revs2.length, 2);

    // Clean up test page
    const delRes = await contentPageService.delete(newPage.id, superAdminId);
    assert.ok(delRes.message.includes('deleted'));
  });

  test('3. Content Hub: promotional banner management and public active filter', async () => {
    const allBanners = await bannerService.listAll(1, 20);
    assert.ok(allBanners.data.length >= 5);

    const activePublic = await bannerService.list();
    assert.ok(activePublic.length >= 4);
    activePublic.forEach(b => assert.equal(b.is_active, true));

    // Create a temporary banner
    const tempBanner = await bannerService.create(
      {
        title: 'Special Hackathon 2026',
        subtitle: 'Compete for 1 Lakh Cash Prize',
        ctaText: 'Register Now',
        ctaUrl: '/hackathon',
        priority: 15,
        isActive: true,
      },
      superAdminId
    );
    assert.equal(tempBanner.priority, 15);

    // Clean up
    await bannerService.delete(tempBanner.id, superAdminId);
  });

  test('4. Content Hub: FAQ operations and category grouping', async () => {
    const allFaqs = await faqService.listAll();
    assert.ok(allFaqs.length >= 12);

    const filtered = await faqService.listAll('Account & Registration');
    assert.ok(filtered.length >= 2);
    filtered.forEach(f => assert.equal(f.category, 'Account & Registration'));

    const publicFaqs = await faqService.list();
    assert.ok(publicFaqs.length >= 12);
  });

  // ── MODULE B: SEO & METADATA ─────────────────────────────────────
  test('5. SEO: global settings retrieval, update, and platform_configurations persistence', async () => {
    const settings = await comprehensiveSeoService.getGlobalSettings();
    assert.ok(settings.siteTitle.includes('CodeVerse'));
    assert.ok(settings.canonicalBaseUrl.includes('codeverse.dev'));

    // Update settings
    await comprehensiveSeoService.updateGlobalSettings(
      {
        ...settings,
        siteDescription: 'Updated meta description verification test.',
      },
      superAdminId
    );

    const reloaded = await comprehensiveSeoService.getGlobalSettings();
    assert.equal(reloaded.siteDescription, 'Updated meta description verification test.');
  });

  test('6. SEO: redirect manager, duplicate handling, and loop prevention', async () => {
    const redirectsList = await comprehensiveSeoService.getRedirects(1, 20);
    assert.ok(redirectsList.data.length >= 5);

    // Test loop prevention: source === target must throw LOOP_DETECTED
    await assert.rejects(
      async () => {
        await comprehensiveSeoService.createRedirect(
          { sourcePath: '/loop-test', targetPath: '/loop-test' },
          superAdminId
        );
      },
      (err: any) => err.code === 'LOOP_DETECTED'
    );

    // Create a valid temporary redirect
    const tempRedirect = await comprehensiveSeoService.createRedirect(
      { sourcePath: `/temp-from-${Date.now()}`, targetPath: '/temp-to', statusCode: 301 },
      superAdminId
    );
    assert.equal(tempRedirect.status_code, 301);

    // Clean up
    await comprehensiveSeoService.deleteRedirect(tempRedirect.id, superAdminId);
  });

  test('7. SEO: XML sitemap generation and SEO audit health diagnostics', async () => {
    const sitemap = await comprehensiveSeoService.generateSitemap();
    assert.ok(sitemap.totalUrls >= 20);
    assert.ok(sitemap.xml.includes('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(sitemap.xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
    assert.ok(sitemap.xml.includes('https://codeverse.dev/page/about-codeverse'));

    const audit = await comprehensiveSeoService.runAudit();
    assert.ok(typeof audit.healthScore === 'number');
    assert.ok(audit.healthScore >= 50);
    assert.ok(audit.configuredPages >= 8);
    assert.ok(audit.blogArticles >= 12);
    assert.ok(audit.helpArticles >= 15);
  });

  // ── MODULE C: HELP CENTER KNOWLEDGE BASE ─────────────────────────
  test('8. Help Center: statistics, category hierarchy, and article lifecycle', async () => {
    const stats = await helpCenterService.getStats();
    assert.ok(stats.totalArticles >= 15);
    assert.ok(stats.publishedArticles >= 11);
    assert.ok(stats.totalCategories >= 5);

    const categories = await helpCenterService.listCategories();
    assert.ok(categories.length >= 5);
    assert.ok(categories.some(c => c.slug === 'getting-started'));

    // Public article by slug
    const article = await helpCenterService.getBySlug('how-to-create-a-codeverse-account');
    assert.equal(article.slug, 'how-to-create-a-codeverse-account');
    assert.ok(article.view_count > 0);

    // Feedback
    const fbRes = await helpCenterService.submitFeedback(article.id, true, 'Very clear explanation!', superAdminId);
    assert.ok(fbRes.success);
  });

  // ── MODULE D: COMMUNITY FORUMS & DISCUSSIONS ─────────────────────
  test('9. Community: analytics metrics, thread filtering, and reply creation', async () => {
    const stats = await communityService.getCommunityStats();
    assert.ok(stats.totalThreads >= 20);
    assert.ok(stats.totalReplies >= 50);
    assert.ok(typeof stats.pendingModeration === 'number');
    assert.ok(stats.popularCategories.length > 0);

    // Filter threads by tag
    const dsaThreads = await communityService.listThreads({ tag: 'dsa' });
    assert.ok(dsaThreads.data.length >= 2);

    // Create temporary reply
    const firstThread = dsaThreads.data[0];
    const reply = await communityService.createReply(firstThread.id, 'Insightful algorithmic breakdown!', superAdminId);
    assert.equal(reply.thread_id, firstThread.id);

    // Clean up reply
    await communityService.deleteReply(reply.id, superAdminId);
  });

  test('10. Community: moderation queue reports listing and action resolution', async () => {
    // Create a temporary report to test resolution cleanly without mutating seeded counts
    const tempReportRes = await pool.query(
      `INSERT INTO community_reports (reporter_id, report_type, reason, description, status, created_at)
       VALUES ($1, 'thread', 'spam', 'Automated test report', 'pending', NOW())
       RETURNING id`,
      [superAdminId]
    );
    const tempReportId = tempReportRes.rows[0].id;

    const reports = await communityService.listReports({ status: 'pending' });
    assert.ok(reports.data.length >= 1);

    const resolved = await communityService.resolveReport(tempReportId, 'dismiss', 'Dismissed after review.', superAdminId);
    assert.equal(resolved.status, 'resolved');
    assert.equal(resolved.moderation_action, 'dismiss');

    // Clean up test report
    await pool.query('DELETE FROM community_reports WHERE id = $1', [tempReportId]);
  });

  // ── MODULE E: BLOG & ARTICLES ────────────────────────────────────
  test('11. Blog: editorial dashboard stats, articles listing, and scheduled status', async () => {
    const stats = await blogAdminService.getStats();
    assert.ok(stats.totalArticles >= 12);
    assert.ok(stats.publishedArticles >= 7);
    assert.ok(stats.scheduledArticles >= 2);
    assert.ok(stats.totalCategories >= 6);

    const list = await blogAdminService.listArticles({ status: 'scheduled' });
    assert.ok(list.data.length >= 2);
    list.data.forEach(a => assert.equal(a.status, 'scheduled'));
  });

  after(async () => {
    await pool.end();
  });
});
