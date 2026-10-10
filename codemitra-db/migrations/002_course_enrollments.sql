-- Add explicit student-to-course mappings.
CREATE TABLE course_enrollments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    enrolled_at timestamptz NOT NULL DEFAULT now(),
    enrolled_by uuid REFERENCES users(id) ON DELETE SET NULL,
    is_active boolean NOT NULL DEFAULT true,
    CONSTRAINT course_enrollments_unique UNIQUE (course_id, student_id)
);
CREATE INDEX idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX idx_enrollments_student ON course_enrollments(student_id, is_active);
CREATE INDEX idx_enrollments_tenant ON course_enrollments(tenant_id);
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY enrollment_tenant_isolation ON course_enrollments
    USING (current_user_role_name() = 'super_admin' OR tenant_id = current_tenant_id());
