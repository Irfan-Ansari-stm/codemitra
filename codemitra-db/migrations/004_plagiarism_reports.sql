-- Track possible plagiarism between submissions.
DO $$ BEGIN
    CREATE TYPE plagiarism_status AS ENUM ('pending', 'clean', 'suspicious', 'flagged');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE plagiarism_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id_a uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    submission_id_b uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    similarity_score numeric(5,2) NOT NULL CONSTRAINT plagiarism_score_range CHECK (similarity_score BETWEEN 0 AND 100),
    status plagiarism_status NOT NULL DEFAULT 'pending',
    reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT plagiarism_pairs_unique UNIQUE (submission_id_a, submission_id_b),
    CONSTRAINT plagiarism_different_submissions CHECK (submission_id_a <> submission_id_b)
);
CREATE INDEX idx_plagiarism_submission_a ON plagiarism_reports(submission_id_a);
CREATE INDEX idx_plagiarism_status ON plagiarism_reports(status, similarity_score DESC);
