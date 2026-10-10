-- Add certificate issuance and public verification records.
CREATE TABLE certificates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    tenant_id uuid REFERENCES tenants(id) ON DELETE RESTRICT,
    course_id uuid REFERENCES courses(id) ON DELETE RESTRICT,
    title varchar(255) NOT NULL,
    issued_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz,
    certificate_url text,
    verify_hash text NOT NULL UNIQUE,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_certificates_user ON certificates(user_id);
