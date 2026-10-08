import { pool } from './index';
import { PoolClient } from 'pg';

export interface TenantContext {
  userId: string;
  tenantId: string | null;
  role: string;
}

/**
 * Acquires a pooled client, sets PostgreSQL session variables for RLS,
 * runs the callback inside a transaction, then releases the client.
 * LOCAL set_config means values are scoped to the transaction only.
 */
export async function withTenantContext<T>(
  ctx: TenantContext,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `SELECT
         set_config('app.current_user_id',   $1, TRUE),
         set_config('app.current_tenant_id', $2, TRUE),
         set_config('app.current_user_role', $3, TRUE)`,
      [ctx.userId, ctx.tenantId ?? '', ctx.role]
    );
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
