import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';

export interface NewsletterSubscriberRow {
  id: string;
  email: string;
  name: string | null;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

export interface SubscribeInput {
  email: string;
  name?: string;
}

export async function findSubscriber(
  email: string
): Promise<NewsletterSubscriberRow | null> {
  const result = await pool.query(
    'SELECT id, email, name, subscribed_at, unsubscribed_at FROM newsletter_subscribers WHERE email = $1 LIMIT 1',
    [email.toLowerCase().trim()]
  );
  return (result.rows[0] as NewsletterSubscriberRow) ?? null;
}

export async function subscribe(
  input: SubscribeInput
): Promise<NewsletterSubscriberRow> {
  const email = input.email.toLowerCase().trim();
  const existing = await findSubscriber(email);

  if (existing) {
    if (existing.unsubscribed_at) {
      // Re-subscribe a previously unsubscribed address.
      const result = await pool.query(
        `UPDATE newsletter_subscribers
         SET unsubscribed_at = NULL, name = COALESCE($1, name), metadata = metadata || '{"resubscribed": true}'::jsonb
         WHERE id = $2
         RETURNING id, email, name, subscribed_at, unsubscribed_at`,
        [input.name ?? null, existing.id]
      );
      return result.rows[0];
    }
    throw new AppError(409, 'ALREADY_SUBSCRIBED', 'This email is already subscribed');
  }

  const result = await pool.query(
    `INSERT INTO newsletter_subscribers (email, name)
     VALUES ($1, $2)
     RETURNING id, email, name, subscribed_at, unsubscribed_at`,
    [email, input.name?.trim() ?? null]
  );
  return result.rows[0];
}

export async function unsubscribe(
  email: string
): Promise<NewsletterSubscriberRow | null> {
  const result = await pool.query(
    `UPDATE newsletter_subscribers
     SET unsubscribed_at = NOW()
     WHERE email = $1 AND unsubscribed_at IS NULL
     RETURNING id, email, name, subscribed_at, unsubscribed_at`,
    [email.toLowerCase().trim()]
  );
  return (result.rows[0] as NewsletterSubscriberRow) ?? null;
}
