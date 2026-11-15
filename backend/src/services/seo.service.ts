import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { writeAuditLog } from '../utils/audit';
import { configurationService } from './configuration.service';

export const comprehensiveSeoService = {
  // ── Global Settings ─────────────────────────────────────────────
  async getGlobalSettings() {
    // 1. Try platform_configurations first
    const confRes = await pool.query(
      `SELECT config_value FROM platform_configurations WHERE config_key = 'seo.global'`
    );
    if (confRes.rows[0]?.config_value) {
      return confRes.rows[0].config_value;
    }

    // 2. Fallback to seo_settings
    const settingsRes = await pool.query(
      `SELECT * FROM seo_settings ORDER BY updated_at DESC LIMIT 1`
    );
    if (settingsRes.rows[0]) {
      const s = settingsRes.rows[0];
      return {
        siteTitle: s.site_title,
        siteDescription: s.site_description,
        defaultKeywords: s.default_keywords || [],
        canonicalBaseUrl: s.canonical_base_url,
        defaultOgImage: s.default_og_image,
        ogTitle: s.og_title,
        ogDescription: s.og_description,
        twitterHandle: s.twitter_handle,
        twitterCardType: s.twitter_card_type,
        defaultLanguage: s.default_language,
        indexingPreference: s.indexing_preference,
        robotsTxt: s.robots_txt,
        sitemapEnabled: s.sitemap_enabled,
      };
    }

    // Default configuration
    return {
      siteTitle: 'CodeVerse — Coding Education Platform',
      siteDescription: 'Learn programming, build projects, practice coding, and prepare for your software engineering career with CodeVerse.',
      defaultKeywords: ['coding education', 'programming', 'software development', 'online coding courses', 'DSA', 'web development'],
      canonicalBaseUrl: 'https://codeverse.dev',
      defaultOgImage: 'https://codeverse.dev/og-default.png',
      ogTitle: 'CodeVerse — Premier Coding Education Platform',
      ogDescription: 'Master programming through interactive sandboxes and verified assessments.',
      twitterHandle: '@codeverse_dev',
      twitterCardType: 'summary_large_image',
      defaultLanguage: 'en',
      indexingPreference: 'all',
      robotsTxt: 'User-agent: *\nAllow: /\nDisallow: /super-admin/\nDisallow: /api/\nSitemap: https://codeverse.dev/sitemap.xml',
      sitemapEnabled: true,
    };
  },

  async updateGlobalSettings(
    settings: Record<string, any>,
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    // Upsert into platform_configurations
    await pool.query(
      `INSERT INTO platform_configurations (id, config_key, config_value, category, description, updated_at)
       VALUES ('seo.global', 'seo.global', $1, 'seo', 'Platform global SEO configuration and metadata', NOW())
       ON CONFLICT (config_key) DO UPDATE SET
         config_value = EXCLUDED.config_value,
         updated_at = NOW()`,
      [JSON.stringify(settings)]
    );

    // Also sync to seo_settings table
    await pool.query(
      `INSERT INTO seo_settings
         (site_title, site_description, default_keywords, canonical_base_url, default_og_image,
          og_title, og_description, twitter_handle, twitter_card_type, default_language,
          indexing_preference, robots_txt, sitemap_enabled, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
      [
        settings.siteTitle || 'CodeVerse',
        settings.siteDescription || '',
        settings.defaultKeywords || [],
        settings.canonicalBaseUrl || 'https://codeverse.dev',
        settings.defaultOgImage || null,
        settings.ogTitle || null,
        settings.ogDescription || null,
        settings.twitterHandle || null,
        settings.twitterCardType || 'summary_large_image',
        settings.defaultLanguage || 'en',
        settings.indexingPreference || 'all',
        settings.robotsTxt || 'User-agent: *\nAllow: /',
        settings.sitemapEnabled !== undefined ? settings.sitemapEnabled : true,
      ]
    );

    await writeAuditLog({
      userId,
      action: 'seo.update_global_settings',
      resourceType: 'seo_settings',
      newData: settings,
      ipAddress,
      requestId,
    });

    return settings;
  },

  // ── Page & Entity Metadata ──────────────────────────────────────
  async getEntityMetadata(entityType: string, entityId: string) {
    const result = await pool.query(
      'SELECT * FROM seo_metadata WHERE entity_type = $1 AND entity_id = $2',
      [entityType, entityId]
    );
    return result.rows[0] || null;
  },

  async setEntityMetadata(
    entityType: string,
    entityId: string,
    data: any,
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const result = await pool.query(
      `INSERT INTO seo_metadata
         (entity_type, entity_id, meta_title, meta_description, canonical_url,
          og_title, og_description, og_image_url, structured_data, noindex, nofollow, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
       ON CONFLICT (entity_type, entity_id) DO UPDATE SET
         meta_title = EXCLUDED.meta_title,
         meta_description = EXCLUDED.meta_description,
         canonical_url = EXCLUDED.canonical_url,
         og_title = EXCLUDED.og_title,
         og_description = EXCLUDED.og_description,
         og_image_url = EXCLUDED.og_image_url,
         structured_data = EXCLUDED.structured_data,
         noindex = EXCLUDED.noindex,
         nofollow = EXCLUDED.nofollow,
         updated_at = NOW()
       RETURNING *`,
      [
        entityType,
        entityId,
        data.metaTitle || null,
        data.metaDescription || null,
        data.canonicalUrl || null,
        data.ogTitle || null,
        data.ogDescription || null,
        data.ogImageUrl || null,
        data.structuredData ? JSON.stringify(data.structuredData) : '{}',
        data.noindex || false,
        data.nofollow || false,
      ]
    );

    await writeAuditLog({
      userId,
      action: 'seo.set_entity_metadata',
      resourceType: 'seo_metadata',
      newData: data,
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  // ── Redirects Management ────────────────────────────────────────
  async getRedirects(page = 1, limit = 20, search?: string) {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`(LOWER(source_path) LIKE $${params.length} OR LOWER(target_path) LIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT * FROM seo_redirects ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const count = await pool.query(`SELECT COUNT(*) FROM seo_redirects ${where}`, params);

    return {
      data: result.rows,
      total: parseInt(count.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(count.rows[0].count) / limit),
    };
  },

  async createRedirect(
    data: { sourcePath: string; targetPath: string; statusCode?: number },
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const src = (data.sourcePath || '').trim();
    const tgt = (data.targetPath || '').trim();
    const code = Number(data.statusCode) || 301;

    if (!src || !tgt) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Source path and target path are required');
    }

    // Loop prevention check 1: source cannot equal target
    if (src === tgt) {
      throw new AppError(400, 'LOOP_DETECTED', 'Source path cannot be identical to target path (infinite redirect loop)');
    }

    // Loop prevention check 2: reverse redirect cannot already exist
    const reverseRes = await pool.query(
      'SELECT id, source_path, target_path FROM seo_redirects WHERE source_path = $1 AND target_path = $2',
      [tgt, src]
    );
    if (reverseRes.rows[0]) {
      throw new AppError(400, 'LOOP_DETECTED', `A reverse redirect already exists: ${tgt} -> ${src}. This would create an infinite redirect loop.`);
    }

    const result = await pool.query(
      `INSERT INTO seo_redirects (source_path, target_path, status_code, is_active, created_by, updated_at)
       VALUES ($1, $2, $3, true, $4, NOW())
       ON CONFLICT (source_path) DO UPDATE SET
         target_path = EXCLUDED.target_path,
         status_code = EXCLUDED.status_code,
         is_active = true,
         updated_at = NOW()
       RETURNING *`,
      [src, tgt, code, userId]
    );

    await writeAuditLog({
      userId,
      action: 'seo.create_redirect',
      resourceType: 'seo_redirect',
      resourceId: result.rows[0].id,
      newData: { sourcePath: src, targetPath: tgt, statusCode: code },
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async deleteRedirect(id: string, userId: string) {
    const result = await pool.query('DELETE FROM seo_redirects WHERE id = $1 RETURNING *', [id]);
    if (!result.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Redirect not found');
    }
    await writeAuditLog({
      userId,
      action: 'seo.delete_redirect',
      resourceType: 'seo_redirect',
      resourceId: id,
      oldData: { sourcePath: result.rows[0].source_path },
    });
    return { message: 'Redirect deleted successfully' };
  },

  // ── Sitemap Generation ──────────────────────────────────────────
  async generateSitemap(baseUrl = 'https://codeverse.dev') {
    const [pages, posts, help] = await Promise.all([
      pool.query(`SELECT slug, updated_at FROM content_pages WHERE status = 'published'`),
      pool.query(`SELECT slug, updated_at FROM blog_posts WHERE status = 'published'`),
      pool.query(`SELECT slug, updated_at FROM help_articles WHERE is_published = true`),
    ]);

    const urls: Array<{ url: string; lastmod: string; changefreq: string; priority: number }> = [
      { url: `${baseUrl}/`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: 1.0 },
      { url: `${baseUrl}/courses`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: 0.9 },
      { url: `${baseUrl}/problems`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: 0.9 },
      { url: `${baseUrl}/blog`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: 0.8 },
      { url: `${baseUrl}/help-center`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: 0.7 },
    ];

    pages.rows.forEach(p => {
      urls.push({
        url: `${baseUrl}/page/${p.slug}`,
        lastmod: new Date(p.updated_at || Date.now()).toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.7,
      });
    });

    posts.rows.forEach(post => {
      urls.push({
        url: `${baseUrl}/blog/${post.slug}`,
        lastmod: new Date(post.updated_at || Date.now()).toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.8,
      });
    });

    help.rows.forEach(h => {
      urls.push({
        url: `${baseUrl}/help-center/${h.slug}`,
        lastmod: new Date(h.updated_at || Date.now()).toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: 0.6,
      });
    });

    // Build standard XML format
    const xmlEntries = urls
      .map(
        u => `  <url>
    <loc>${u.url}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority.toFixed(1)}</priority>
  </url>`
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;

    return { urls, totalUrls: urls.length, xml };
  },

  // ── SEO Audit & Diagnostics ─────────────────────────────────────
  async runAudit() {
    const [pages, posts, help, redirects] = await Promise.all([
      pool.query(`
        SELECT id, slug, title, seo_title, seo_description, status
        FROM content_pages
      `),
      pool.query(`
        SELECT id, slug, title, seo_title, seo_description, status
        FROM blog_posts
      `),
      pool.query(`
        SELECT id, slug, title, seo_title, seo_description, is_published
        FROM help_articles
      `),
      pool.query(`SELECT COUNT(*)::int AS count FROM seo_redirects WHERE is_active = true`),
    ]);

    const issues: Array<{ type: 'missing_title' | 'missing_desc' | 'duplicate_title'; entity: string; title: string; slug: string }> = [];
    const titlesSeen = new Set<string>();

    pages.rows.forEach(p => {
      if (!p.seo_title || !p.seo_title.trim()) {
        issues.push({ type: 'missing_title', entity: 'Content Page', title: p.title, slug: p.slug });
      }
      if (!p.seo_description || !p.seo_description.trim()) {
        issues.push({ type: 'missing_desc', entity: 'Content Page', title: p.title, slug: p.slug });
      }
      const tLower = (p.seo_title || p.title || '').toLowerCase();
      if (titlesSeen.has(tLower)) {
        issues.push({ type: 'duplicate_title', entity: 'Content Page', title: p.title, slug: p.slug });
      }
      titlesSeen.add(tLower);
    });

    posts.rows.forEach(p => {
      if (!p.seo_title || !p.seo_title.trim()) {
        issues.push({ type: 'missing_title', entity: 'Blog Article', title: p.title, slug: p.slug });
      }
      if (!p.seo_description || !p.seo_description.trim()) {
        issues.push({ type: 'missing_desc', entity: 'Blog Article', title: p.title, slug: p.slug });
      }
    });

    help.rows.forEach(h => {
      if (!h.seo_title || !h.seo_title.trim()) {
        issues.push({ type: 'missing_title', entity: 'Help Article', title: h.title, slug: h.slug });
      }
      if (!h.seo_description || !h.seo_description.trim()) {
        issues.push({ type: 'missing_desc', entity: 'Help Article', title: h.title, slug: h.slug });
      }
    });

    const totalAudited = pages.rows.length + posts.rows.length + help.rows.length;
    const missingMetadata = issues.filter(i => i.type === 'missing_title' || i.type === 'missing_desc').length;
    const duplicateMetadata = issues.filter(i => i.type === 'duplicate_title').length;

    // Calculate SEO health score as percentage of checks passed
    const totalChecks = totalAudited * 2;
    const passedChecks = Math.max(0, totalChecks - (missingMetadata + duplicateMetadata));
    const healthScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

    return {
      healthScore,
      totalAudited,
      configuredPages: pages.rows.length,
      blogArticles: posts.rows.length,
      helpArticles: help.rows.length,
      activeRedirects: redirects.rows[0]?.count || 0,
      missingMetadata,
      duplicateMetadata,
      issues: issues.slice(0, 15),
    };
  },
};
