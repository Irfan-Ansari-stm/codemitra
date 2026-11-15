import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { pool } from '../db';

export async function migrateSupport() {
  console.log('--- Migrating Support Ticket Help Desk Schema ---');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Ensure support_tickets has all necessary enterprise fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_number VARCHAR(50) NOT NULL UNIQUE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
        subject VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'General Query',
        priority VARCHAR(50) NOT NULL DEFAULT 'medium',
        status VARCHAR(50) NOT NULL DEFAULT 'open',
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        department VARCHAR(100) DEFAULT 'Customer Support',
        first_response_at TIMESTAMPTZ,
        resolved_at TIMESTAMPTZ,
        closed_at TIMESTAMPTZ,
        last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      -- Add missing columns if support_tickets already existed with fewer columns
      ALTER TABLE support_tickets 
        ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'Customer Support',
        ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

      CREATE INDEX IF NOT EXISTS idx_st_user_id ON support_tickets(user_id);
      CREATE INDEX IF NOT EXISTS idx_st_tenant_id ON support_tickets(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_st_assigned_to ON support_tickets(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_st_status ON support_tickets(status);
      CREATE INDEX IF NOT EXISTS idx_st_priority ON support_tickets(priority);
      CREATE INDEX IF NOT EXISTS idx_st_category ON support_tickets(category);
      CREATE INDEX IF NOT EXISTS idx_st_created_at ON support_tickets(created_at);
      CREATE INDEX IF NOT EXISTS idx_st_ticket_number ON support_tickets(ticket_number);
    `);

    // 2. Ensure support_ticket_replies / messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_ticket_replies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        is_internal BOOLEAN NOT NULL DEFAULT FALSE,
        message_type VARCHAR(50) NOT NULL DEFAULT 'USER_REPLY',
        attachments JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE support_ticket_replies
        ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'USER_REPLY',
        ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

      CREATE INDEX IF NOT EXISTS idx_str_ticket_id ON support_ticket_replies(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_str_user_id ON support_ticket_replies(user_id);
      CREATE INDEX IF NOT EXISTS idx_str_created_at ON support_ticket_replies(created_at);
    `);

    // 3. Create support_attachments
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_attachments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        message_id UUID REFERENCES support_ticket_replies(id) ON DELETE SET NULL,
        uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
        file_name VARCHAR(255) NOT NULL,
        storage_key TEXT,
        mime_type VARCHAR(100),
        file_size INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_sa_ticket_id ON support_attachments(ticket_id);
    `);

    // 4. Create support_assignment_history
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_assignment_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        previous_assignee UUID REFERENCES users(id) ON DELETE SET NULL,
        note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_sah_ticket_id ON support_assignment_history(ticket_id);
    `);

    // 5. Create support_ticket_activity
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_ticket_activity (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        old_value TEXT,
        new_value TEXT,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_sta_ticket_id ON support_ticket_activity(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_sta_created_at ON support_ticket_activity(created_at);
    `);

    await client.query('COMMIT');
    console.log('Support Ticket Help Desk tables migrated successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Support migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateSupport()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      pool.end();
      process.exit(1);
    });
}
