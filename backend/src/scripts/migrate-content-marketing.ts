import { pool } from '../db';

export async function migrateContentMarketing() {
  // Alter enum outside transaction block
  try {
    await pool.query("ALTER TYPE blog_status ADD VALUE IF NOT EXISTS 'scheduled'");
  } catch (err: any) {
    // Ignore if already added or not supported in current pg version
    console.log('[Migration] Note on blog_status alter:', err.message);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('[Migration] Starting Content & Marketing migration...');

    // 1. platform_configurations
    await client.query(`
      CREATE TABLE IF NOT EXISTS platform_configurations (
        id VARCHAR(100) PRIMARY KEY,
        config_key VARCHAR(100) NOT NULL UNIQUE,
        config_value JSONB NOT NULL DEFAULT '{}'::jsonb,
        category VARCHAR(100) NOT NULL DEFAULT 'general',
        description TEXT,
        is_sensitive BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_platform_configurations_category ON platform_configurations(category);
    `);
    console.log('[Migration] platform_configurations table ensured.');

    // 2. content_pages
    await client.query(`
      CREATE TABLE IF NOT EXISTS content_pages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug VARCHAR(255) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        page_type VARCHAR(50) NOT NULL DEFAULT 'page',
        category VARCHAR(100),
        featured_image TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        is_featured BOOLEAN NOT NULL DEFAULT false,
        seo_title VARCHAR(150),
        seo_description VARCHAR(255),
        keywords TEXT[] DEFAULT '{}',
        author_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        published_at TIMESTAMPTZ,
        scheduled_at TIMESTAMPTZ,
        view_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_content_pages_slug ON content_pages(slug);
      CREATE INDEX IF NOT EXISTS idx_content_pages_status ON content_pages(status);
      CREATE INDEX IF NOT EXISTS idx_content_pages_page_type ON content_pages(page_type);
    `);
    console.log('[Migration] content_pages table ensured.');

    // 3. content_page_revisions
    await client.query(`
      CREATE TABLE IF NOT EXISTS content_page_revisions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        page_id UUID NOT NULL REFERENCES content_pages(id) ON DELETE CASCADE,
        version INTEGER NOT NULL DEFAULT 1,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        change_summary TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_content_page_revisions_page_id ON content_page_revisions(page_id);
    `);

    // 4. content_banners
    await client.query(`
      CREATE TABLE IF NOT EXISTS content_banners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        description TEXT,
        content TEXT,
        desktop_image TEXT,
        mobile_image TEXT,
        image_url TEXT,
        link_url TEXT,
        cta_text VARCHAR(100),
        cta_url TEXT,
        target_audience VARCHAR(100) NOT NULL DEFAULT 'all',
        position VARCHAR(50) NOT NULL DEFAULT 'top',
        priority INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        start_date TIMESTAMPTZ,
        end_date TIMESTAMPTZ,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_content_banners_active ON content_banners(is_active);
      CREATE INDEX IF NOT EXISTS idx_content_banners_priority ON content_banners(priority DESC);
    `);

    // Ensure compatibility alias for 'banners'
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'banners') THEN
          CREATE VIEW banners AS SELECT * FROM content_banners;
        END IF;
      END $$;
    `);
    console.log('[Migration] content_banners table and banners view ensured.');

    // 5. content_faqs
    await client.query(`
      CREATE TABLE IF NOT EXISTS content_faqs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'General',
        display_order INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        status VARCHAR(50) NOT NULL DEFAULT 'published',
        visibility VARCHAR(50) NOT NULL DEFAULT 'public',
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_content_faqs_category ON content_faqs(category);
      CREATE INDEX IF NOT EXISTS idx_content_faqs_active ON content_faqs(is_active);
    `);

    // Ensure compatibility alias for 'faqs'
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'faqs') THEN
          CREATE VIEW faqs AS SELECT * FROM content_faqs;
        END IF;
      END $$;
    `);
    console.log('[Migration] content_faqs table and faqs view ensured.');

    // 6. media_assets
    await client.query(`
      CREATE TABLE IF NOT EXISTS media_assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        mime_type VARCHAR(100),
        file_size_bytes BIGINT,
        alt_text TEXT,
        uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 7. seo_settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS seo_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_title VARCHAR(255) NOT NULL DEFAULT 'CodeVerse',
        site_description TEXT,
        default_keywords TEXT[] DEFAULT '{}',
        canonical_base_url TEXT DEFAULT 'https://codeverse.dev',
        default_og_image TEXT,
        og_title VARCHAR(255),
        og_description TEXT,
        twitter_handle VARCHAR(100),
        twitter_card_type VARCHAR(50) DEFAULT 'summary_large_image',
        default_language VARCHAR(20) DEFAULT 'en',
        indexing_preference VARCHAR(50) DEFAULT 'all',
        robots_txt TEXT DEFAULT 'User-agent: *\nAllow: /',
        sitemap_enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 8. seo_metadata
    await client.query(`
      CREATE TABLE IF NOT EXISTS seo_metadata (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(100) NOT NULL,
        meta_title VARCHAR(150),
        meta_description VARCHAR(255),
        canonical_url TEXT,
        og_title VARCHAR(150),
        og_description VARCHAR(255),
        og_image_url TEXT,
        structured_data JSONB DEFAULT '{}'::jsonb,
        noindex BOOLEAN DEFAULT false,
        nofollow BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_seo_metadata_entity UNIQUE (entity_type, entity_id)
      );
    `);

    // 9. seo_redirects
    await client.query(`
      CREATE TABLE IF NOT EXISTS seo_redirects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_path VARCHAR(500) NOT NULL UNIQUE,
        target_path VARCHAR(500) NOT NULL,
        status_code INTEGER NOT NULL DEFAULT 301,
        is_active BOOLEAN NOT NULL DEFAULT true,
        hit_count INTEGER NOT NULL DEFAULT 0,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_seo_redirects_source ON seo_redirects(source_path);
    `);
    console.log('[Migration] SEO tables ensured.');

    // 10. help_categories
    await client.query(`
      CREATE TABLE IF NOT EXISTS help_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(150) NOT NULL,
        slug VARCHAR(150) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(100) DEFAULT 'BookOpen',
        display_order INTEGER NOT NULL DEFAULT 0,
        parent_id UUID REFERENCES help_categories(id) ON DELETE SET NULL,
        is_visible BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 11. help_articles
    await client.query(`
      CREATE TABLE IF NOT EXISTS help_articles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id UUID REFERENCES help_categories(id) ON DELETE SET NULL,
        category VARCHAR(150),
        subcategory VARCHAR(150),
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        short_description TEXT,
        content TEXT NOT NULL,
        featured_image TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'published',
        is_published BOOLEAN NOT NULL DEFAULT true,
        is_featured BOOLEAN NOT NULL DEFAULT false,
        seo_title VARCHAR(150),
        seo_description VARCHAR(255),
        keywords TEXT[] DEFAULT '{}',
        helpful_count INTEGER NOT NULL DEFAULT 0,
        not_helpful_count INTEGER NOT NULL DEFAULT 0,
        view_count INTEGER NOT NULL DEFAULT 0,
        published_at TIMESTAMPTZ,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_help_articles_slug ON help_articles(slug);
      CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category_id);
    `);

    // 12. help_article_revisions
    await client.query(`
      CREATE TABLE IF NOT EXISTS help_article_revisions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        article_id UUID NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
        version INTEGER NOT NULL DEFAULT 1,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 13. help_article_feedback
    await client.query(`
      CREATE TABLE IF NOT EXISTS help_article_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        article_id UUID NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        is_helpful BOOLEAN NOT NULL,
        feedback_text TEXT,
        ip_address VARCHAR(50),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('[Migration] Help center tables ensured.');

    // 14. community_categories
    await client.query(`
      CREATE TABLE IF NOT EXISTS community_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(150) NOT NULL,
        slug VARCHAR(150) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(100) DEFAULT 'MessageSquare',
        display_order INTEGER NOT NULL DEFAULT 0,
        color VARCHAR(50) DEFAULT '#3B82F6',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 15. community_tags
    await client.query(`
      CREATE TABLE IF NOT EXISTS community_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        usage_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 16. community_threads
    await client.query(`
      CREATE TABLE IF NOT EXISTS community_threads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id UUID REFERENCES community_categories(id) ON DELETE SET NULL,
        title VARCHAR(300) NOT NULL,
        slug VARCHAR(350) NOT NULL UNIQUE,
        content TEXT NOT NULL,
        tags TEXT[] DEFAULT '{}',
        status VARCHAR(50) NOT NULL DEFAULT 'open',
        moderation_status VARCHAR(50) NOT NULL DEFAULT 'approved',
        is_pinned BOOLEAN NOT NULL DEFAULT false,
        is_locked BOOLEAN NOT NULL DEFAULT false,
        is_resolved BOOLEAN NOT NULL DEFAULT false,
        upvotes INTEGER NOT NULL DEFAULT 0,
        view_count INTEGER NOT NULL DEFAULT 0,
        reply_count INTEGER NOT NULL DEFAULT 0,
        last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_community_threads_category ON community_threads(category_id);
      CREATE INDEX IF NOT EXISTS idx_community_threads_moderation ON community_threads(moderation_status);
      CREATE INDEX IF NOT EXISTS idx_community_threads_pinned ON community_threads(is_pinned DESC);
    `);

    // 17. community_replies
    await client.query(`
      CREATE TABLE IF NOT EXISTS community_replies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        thread_id UUID NOT NULL REFERENCES community_threads(id) ON DELETE CASCADE,
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        parent_reply_id UUID REFERENCES community_replies(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_best_answer BOOLEAN NOT NULL DEFAULT false,
        is_pinned BOOLEAN NOT NULL DEFAULT false,
        is_hidden BOOLEAN NOT NULL DEFAULT false,
        upvotes INTEGER NOT NULL DEFAULT 0,
        moderation_status VARCHAR(50) NOT NULL DEFAULT 'approved',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_community_replies_thread ON community_replies(thread_id);
    `);

    // 18. community_reports
    await client.query(`
      CREATE TABLE IF NOT EXISTS community_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
        report_type VARCHAR(50) NOT NULL,
        target_thread_id UUID REFERENCES community_threads(id) ON DELETE CASCADE,
        target_reply_id UUID REFERENCES community_replies(id) ON DELETE CASCADE,
        target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        reason VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        moderator_id UUID REFERENCES users(id) ON DELETE SET NULL,
        moderation_action VARCHAR(50),
        resolution_note TEXT,
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_community_reports_status ON community_reports(status);
    `);

    // 19. community_moderation_logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS community_moderation_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50) NOT NULL,
        target_id VARCHAR(100) NOT NULL,
        details JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 20. community_user_warnings
    await client.query(`
      CREATE TABLE IF NOT EXISTS community_user_warnings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        reason TEXT NOT NULL,
        warning_level VARCHAR(50) NOT NULL DEFAULT 'warning',
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('[Migration] Community tables ensured.');

    // 21. Blog updates: tags, revisions, scheduled_at column on blog_posts
    await client.query(`
      CREATE TABLE IF NOT EXISTS blog_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS blog_article_revisions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
        version INTEGER NOT NULL DEFAULT 1,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
    `);
    console.log('[Migration] Blog enhancements ensured.');

    await client.query('COMMIT');
    console.log('[Migration] Content & Marketing migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Migration] Failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateContentMarketing()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
