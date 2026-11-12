import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';

// ── Types ─────────────────────────────────────────────────────────────

export interface BlogPostRow {
  id: string;
  author_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  read_time_minutes: number | null;
  view_count: number;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_avatar_url: string | null;
  author_bio: string | null;
  category_name: string | null;
  category_slug: string | null;
  bookmarked?: boolean;
}

export interface BlogCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  post_count: string;
}

export interface BlogTagRow {
  tag: string;
  count: string;
}

export interface BlogListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  tag?: string;
  sort?: BlogSort;
  featured?: boolean;
}

export type BlogSort = 'newest' | 'oldest' | 'updated' | 'popular' | 'title';

export interface BlogListResult {
  posts: BlogPostRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdjacentPost {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
}

export interface CreateBlogPostInput {
  authorId: string;
  categoryId?: string | null;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  coverImageUrl?: string | null;
  tags?: string[];
  isFeatured?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  status?: 'draft' | 'published' | 'archived';
  readTimeMinutes?: number | null;
}

// ── Query building ────────────────────────────────────────────────────

const POST_COLUMNS = `bp.id, bp.author_id, bp.category_id, bp.title, bp.slug, bp.excerpt,
  bp.content, bp.cover_image_url, bp.tags, bp.status, bp.is_featured,
  bp.read_time_minutes, bp.view_count, bp.published_at, bp.seo_title,
  bp.seo_description, bp.created_at, bp.updated_at,
  u.name AS author_name, u.avatar_url AS author_avatar_url, u.bio AS author_bio,
  bc.name AS category_name, bc.slug AS category_slug`;

const POST_FROM = `FROM blog_posts bp
  JOIN users u ON u.id = bp.author_id
  LEFT JOIN blog_categories bc ON bc.id = bp.category_id`;

const SORT_CLAUSES: Record<BlogSort, string> = {
  newest: 'bp.published_at DESC NULLS LAST, bp.created_at DESC',
  oldest: 'bp.published_at ASC NULLS LAST, bp.created_at ASC',
  updated: 'bp.updated_at DESC, bp.created_at DESC',
  popular: 'bp.view_count DESC, bp.published_at DESC NULLS LAST',
  title: 'bp.title ASC',
};

interface ListConditions {
  clauses: string[];
  values: any[];
}

function buildListConditions(
  params: BlogListParams,
  isAdmin: boolean,
  userId?: string
): ListConditions {
  const clauses: string[] = [];
  const values: any[] = [];

  // Public visitors only ever see published posts. Admins can see every
  // post so they can manage drafts through the API.
  if (!isAdmin) clauses.push("bp.status = 'published'");

  if (params.search) {
    values.push(`%${params.search}%`);
    const needle = `$${values.length}`;
    clauses.push(
      `(bp.title ILIKE ${needle} OR bp.excerpt ILIKE ${needle} OR bp.content ILIKE ${needle} OR u.name ILIKE ${needle} OR bp.tags::text ILIKE ${needle})`
    );
  }

  if (params.category) {
    values.push(params.category);
    clauses.push(`bc.slug = $${values.length}`);
  }

  if (params.tag) {
    values.push(params.tag);
    clauses.push(`bp.tags @> ARRAY[$${values.length}]`);
  }

  if (params.featured) {
    clauses.push('bp.is_featured = TRUE');
  }

  return { clauses, values };
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function buildBookmarkSelect(userId?: string): string {
  // userId originates from a verified JWT payload; validate the shape
  // before interpolating it into the SELECT clause.
  if (!userId || !UUID_PATTERN.test(userId)) return 'FALSE AS bookmarked';
  return `(EXISTS (SELECT 1 FROM blog_bookmarks bb WHERE bb.user_id = '${userId}' AND bb.post_id = bp.id)) AS bookmarked`;
}

// ── Reads ─────────────────────────────────────────────────────────────

export async function listPosts(
  params: BlogListParams,
  isAdmin: boolean,
  userId?: string
): Promise<BlogListResult> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 12));
  const offset = (page - 1) * limit;
  const sort = SORT_CLAUSES[params.sort ?? 'newest'] ?? SORT_CLAUSES.newest;

  const { clauses, values } = buildListConditions(params, isAdmin, userId);
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const bookmarkSelect = buildBookmarkSelect(userId);

  const [rows, count] = await Promise.all([
    pool.query(
      `SELECT ${POST_COLUMNS}, ${bookmarkSelect} ${POST_FROM} ${where} ORDER BY ${sort} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    ),
    pool.query(`SELECT COUNT(*) FROM blog_posts bp JOIN users u ON u.id = bp.author_id LEFT JOIN blog_categories bc ON bc.id = bp.category_id ${where}`, values),
  ]);

  const total = Number(count.rows[0].count);

  return {
    posts: rows.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getPostBySlug(
  slug: string,
  isAdmin: boolean,
  userId?: string
): Promise<BlogPostRow | null> {
  const result = await pool.query(
    `SELECT ${POST_COLUMNS}, ${buildBookmarkSelect(userId)} ${POST_FROM} WHERE bp.slug = $1 LIMIT 1`,
    [slug]
  );
  const post = result.rows[0] as BlogPostRow | undefined;
  if (!post) return null;
  // Never leak draft/archived content to public visitors.
  if (!isAdmin && post.status !== 'published') return null;
  return post;
}

export async function getPostById(
  id: string,
  isAdmin: boolean,
  userId?: string
): Promise<BlogPostRow | null> {
  const result = await pool.query(
    `SELECT ${POST_COLUMNS}, ${buildBookmarkSelect(userId)} ${POST_FROM} WHERE bp.id = $1 LIMIT 1`,
    [id]
  );
  const post = result.rows[0] as BlogPostRow | undefined;
  if (!post) return null;
  if (!isAdmin && post.status !== 'published') return null;
  return post;
}

export async function getFeaturedPost(isAdmin: boolean): Promise<BlogPostRow | null> {
  const result = await pool.query(
    `SELECT ${POST_COLUMNS} ${POST_FROM} WHERE bp.is_featured = TRUE ${isAdmin ? '' : "AND bp.status = 'published'"} ORDER BY bp.published_at DESC NULLS LAST, bp.created_at DESC LIMIT 1`
  );
  return (result.rows[0] as BlogPostRow) ?? null;
}

export async function getRelatedPosts(
  slug: string,
  limit = 3
): Promise<BlogPostRow[]> {
  const result = await pool.query(
    `
    WITH current_post AS (
      SELECT category_id, tags FROM blog_posts WHERE slug = $1 AND status = 'published'
    )
    SELECT ${POST_COLUMNS} ${POST_FROM}
    CROSS JOIN current_post cp
    WHERE bp.status = 'published'
      AND bp.slug != $1
      AND (bp.category_id = cp.category_id OR bp.tags && cp.tags)
    ORDER BY
      (bp.category_id = cp.category_id)::int DESC,
      cardinality(ARRAY(SELECT unnest(bp.tags) INTERSECT SELECT unnest(cp.tags))) DESC,
      bp.published_at DESC NULLS LAST
    LIMIT $2
    `,
    [slug, limit]
  );
  return result.rows;
}

export async function getAdjacentPosts(
  slug: string
): Promise<{ previous: AdjacentPost | null; next: AdjacentPost | null }> {
  // Resolve the current article's publication timestamp first.
  const current = await pool.query(
    `SELECT COALESCE(published_at, created_at) AS published_at
     FROM blog_posts WHERE slug = $1 AND status = 'published'`,
    [slug]
  );
  if (!current.rows[0]) return { previous: null, next: null };
  const publishedAt = current.rows[0].published_at;

  const [previous, next] = await Promise.all([
    pool.query(
      `SELECT id, title, slug, cover_image_url
       FROM blog_posts
       WHERE status = 'published'
         AND COALESCE(published_at, created_at) < $1
       ORDER BY COALESCE(published_at, created_at) DESC
       LIMIT 1`,
      [publishedAt]
    ),
    pool.query(
      `SELECT id, title, slug, cover_image_url
       FROM blog_posts
       WHERE status = 'published'
         AND COALESCE(published_at, created_at) > $1
       ORDER BY COALESCE(published_at, created_at) ASC
       LIMIT 1`,
      [publishedAt]
    ),
  ]);

  return {
    previous: (previous.rows[0] as AdjacentPost) ?? null,
    next: (next.rows[0] as AdjacentPost) ?? null,
  };
}

export async function getCategories(): Promise<BlogCategoryRow[]> {
  const result = await pool.query(
    `
    SELECT bc.id, bc.name, bc.slug, bc.description,
      (SELECT COUNT(*) FROM blog_posts bp
        WHERE bp.category_id = bc.id AND bp.status = 'published') AS post_count
    FROM blog_categories bc
    ORDER BY bc.name ASC
    `
  );
  return result.rows;
}

export async function getTags(): Promise<BlogTagRow[]> {
  const result = await pool.query(
    `
    SELECT t.tag, COUNT(*)::text AS count
    FROM blog_posts bp, unnest(bp.tags) AS t(tag)
    WHERE bp.status = 'published'
    GROUP BY t.tag
    ORDER BY count DESC, t.tag ASC
    `
  );
  return result.rows;
}

export async function getBookmarkedPosts(
  userId: string,
  page = 1,
  limit = 12
): Promise<BlogListResult> {
  const offset = (page - 1) * limit;
  const [rows, count] = await Promise.all([
    pool.query(
      `SELECT ${POST_COLUMNS}, TRUE AS bookmarked ${POST_FROM}
       JOIN blog_bookmarks bb ON bb.post_id = bp.id
       WHERE bb.user_id = $1 AND bp.status = 'published'
       ORDER BY bb.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*) FROM blog_bookmarks bb
       JOIN blog_posts bp ON bp.id = bb.post_id
       WHERE bb.user_id = $1 AND bp.status = 'published'`,
      [userId]
    ),
  ]);
  const total = Number(count.rows[0].count);
  return {
    posts: rows.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function isPostBookmarked(
  userId: string,
  postId: string
): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM blog_bookmarks WHERE user_id = $1 AND post_id = $2 LIMIT 1',
    [userId, postId]
  );
  return (result.rowCount ?? 0) > 0;
}

// ── Writes ────────────────────────────────────────────────────────────

export async function incrementViewCount(slug: string): Promise<void> {
  await pool.query(
    'UPDATE blog_posts SET view_count = view_count + 1 WHERE slug = $1',
    [slug]
  );
}

export async function createPost(input: CreateBlogPostInput): Promise<BlogPostRow> {
  const result = await pool.query(
    `
    INSERT INTO blog_posts
      (author_id, category_id, title, slug, excerpt, content, cover_image_url,
       tags, is_featured, seo_title, seo_description, status, read_time_minutes, published_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
      CASE WHEN $12 = 'published' THEN NOW() ELSE NULL END)
    RETURNING *
    `,
    [
      input.authorId,
      input.categoryId ?? null,
      input.title,
      input.slug,
      input.excerpt ?? null,
      input.content,
      input.coverImageUrl ?? null,
      input.tags ?? [],
      input.isFeatured ?? false,
      input.seoTitle ?? null,
      input.seoDescription ?? null,
      input.status ?? 'draft',
      input.readTimeMinutes ?? null,
    ]
  );
  return result.rows[0];
}

export async function updatePost(
  id: string,
  fields: Record<string, unknown>
): Promise<BlogPostRow | null> {
  const allowed = [
    'title', 'excerpt', 'content', 'cover_image_url', 'tags', 'status',
    'is_featured', 'read_time_minutes', 'seo_title', 'seo_description', 'category_id',
  ];
  const keys = Object.keys(fields).filter((key) => allowed.includes(key));
  if (!keys.length) throw new AppError(400, 'NO_FIELDS', 'No valid fields to update');

  const sets: string[] = [];
  const values: any[] = [];
  keys.forEach((key, index) => {
    let value = fields[key];
    if (key === 'tags' && Array.isArray(value)) value = `{${value.join(',')}}`;
    values.push(value);
    sets.push(`${key} = $${index + 2}`);
  });
  if (fields.status === 'published') {
    sets.push('published_at = COALESCE(published_at, NOW())');
  }

  const result = await pool.query(
    `UPDATE blog_posts SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return (result.rows[0] as BlogPostRow) ?? null;
}

export async function archivePost(id: string): Promise<boolean> {
  const result = await pool.query(
    "UPDATE blog_posts SET status = 'archived', updated_at = NOW() WHERE id = $1 RETURNING id",
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function addBookmark(userId: string, postId: string): Promise<void> {
  await pool.query(
    `INSERT INTO blog_bookmarks (user_id, post_id) VALUES ($1, $2)
     ON CONFLICT (user_id, post_id) DO NOTHING`,
    [userId, postId]
  );
}

export async function removeBookmark(userId: string, postId: string): Promise<void> {
  await pool.query(
    'DELETE FROM blog_bookmarks WHERE user_id = $1 AND post_id = $2',
    [userId, postId]
  );
}
