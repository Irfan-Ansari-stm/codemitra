-- Add contest and hackathon support.
DO $$ BEGIN
    CREATE TYPE contest_status AS ENUM ('upcoming', 'active', 'ended', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE contests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES tenants(id) ON DELETE RESTRICT,
    created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title varchar(255) NOT NULL,
    description text,
    slug varchar(300) NOT NULL UNIQUE,
    status contest_status NOT NULL DEFAULT 'upcoming',
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    is_public boolean NOT NULL DEFAULT false,
    max_participants integer,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT contests_dates_valid CHECK (ends_at > starts_at)
);
CREATE TABLE contest_problems (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id uuid NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    problem_id uuid NOT NULL REFERENCES problems(id) ON DELETE RESTRICT,
    points integer NOT NULL DEFAULT 100,
    order_index integer NOT NULL DEFAULT 0,
    CONSTRAINT contest_problems_unique UNIQUE (contest_id, problem_id)
);
CREATE TABLE contest_registrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id uuid NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    registered_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT contest_registrations_unique UNIQUE (contest_id, user_id)
);
CREATE INDEX idx_contests_status ON contests(status, starts_at);
CREATE INDEX idx_contests_tenant ON contests(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_contest_reg_contest ON contest_registrations(contest_id);
CREATE INDEX idx_contest_reg_user ON contest_registrations(user_id);
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY contests_visibility ON contests
    USING (current_user_role_name() = 'super_admin' OR is_public = true OR tenant_id = current_tenant_id());
CREATE TRIGGER contests_updated_at BEFORE UPDATE ON contests
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
