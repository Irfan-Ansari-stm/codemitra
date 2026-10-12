-- Per-user bookmarks for coding problems.
CREATE TABLE IF NOT EXISTS problem_bookmarks (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id uuid NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, problem_id)
);
