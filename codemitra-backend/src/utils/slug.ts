/**
 * Converts any string into a URL-safe slug.
 * Example: "Hello World!" → "hello-world"
 */
export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Appends a short random suffix to ensure slug uniqueness.
 * Example: "hello-world" → "hello-world-x4f2"
 */
export function toUniqueSlug(input: string): string {
  const base = toSlug(input);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}
