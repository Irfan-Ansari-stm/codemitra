-- Repeatable development fixtures for codemitra. All fixture IDs are stable.
-- Existing rows are preserved; inserts skip conflicts. Do not use as production data.
SET client_min_messages = warning;

-- The baseline has a probabilistic cleanup trigger on refresh_tokens. Disable only
-- that trigger for this one deterministic fixture insert, then restore it.
ALTER TABLE refresh_tokens DISABLE TRIGGER refresh_tokens_cleanup;

INSERT INTO users (id, tenant_id, email, password_hash, name, role, is_email_verified, is_active, metadata)
VALUES
 ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', 'admin@demo.codemitra.local', '$2b$12$NulagPiZ.mZ62tzE8UJ0HezRd2mFfZdRHbE8Wbs4eZFAnlQ1aCCbW', 'Demo Institution Admin', 'institution_admin', true, true, '{"seed":"codemitra-dev"}'),
 ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000010', 'student@demo.codemitra.local', '$2b$12$NulagPiZ.mZ62tzE8UJ0HezRd2mFfZdRHbE8Wbs4eZFAnlQ1aCCbW', 'Demo Student', 'institution_student', true, true, '{"seed":"codemitra-dev","enrollment_number":"DEMO-001","batch":"2026","year":1,"department":"Computer Science"}'),
 ('00000000-0000-0000-0000-000000000022', NULL, 'learner@demo.codemitra.local', '$2b$12$NulagPiZ.mZ62tzE8UJ0HezRd2mFfZdRHbE8Wbs4eZFAnlQ1aCCbW', 'Demo Public Learner', 'general_student', true, true, '{"seed":"codemitra-dev"}')
ON CONFLICT DO NOTHING;

-- The baseline's documented super-admin row has an intentionally invalid placeholder
-- bcrypt hash. Give that development-only account a usable hash once; do not replace
-- a password that has already been customized.
UPDATE users
SET password_hash = '$2b$12$NulagPiZ.mZ62tzE8UJ0HezRd2mFfZdRHbE8Wbs4eZFAnlQ1aCCbW'
WHERE email = 'superadmin@codeverse.in'
  AND password_hash LIKE '%PLACEHOLDER%';

INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, ip_address, user_agent)
VALUES ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000022', repeat('a', 64), now() + interval '30 days', '127.0.0.1', 'CodeMitra development fixture')
ON CONFLICT DO NOTHING;
ALTER TABLE refresh_tokens ENABLE TRIGGER refresh_tokens_cleanup;

INSERT INTO courses (id, tenant_id, created_by, title, description, language_tags, status, sort_order)
VALUES ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', 'Introduction to Algorithms', 'A sample course covering basic problem solving and algorithmic thinking.', ARRAY['Python','Algorithms'], 'published', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO modules (id, course_id, tenant_id, title, description, order_index, status)
VALUES ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000010', 'Getting Started', 'Core programming concepts.', 1, 'published')
ON CONFLICT (id) DO NOTHING;

INSERT INTO chapters (id, module_id, tenant_id, title, content, order_index, status, estimated_minutes)
VALUES ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000010', 'Two Sum', '## Learning goals\nPractice arrays, hash maps, and complexity analysis.', 1, 'published', 20)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, tenant_id, chapter_id, created_by, title, slug, statement, input_format, output_format, constraints_text, sample_explanation, difficulty, scope, tags, time_limit_ms, memory_limit_mb)
VALUES ('00000000-0000-0000-0000-000000000103', NULL, '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Pair Sum', 'codemitra-demo-pair-sum', 'Given an integer array and a target, return the indices of two values whose sum equals the target.', 'First line: n and target. Second line: n integers.', 'Print two zero-based indices.', '2 <= n <= 10000; exactly one solution exists.', 'For [2, 7, 11, 15] and target 9, the answer is 0 1.', 'easy', 'public', ARRAY['arrays','hash-map','demo'], 2000, 256)
ON CONFLICT (id) DO NOTHING;

INSERT INTO test_cases (id, problem_id, input, expected_output, is_hidden, points, order_index, explanation)
VALUES
 ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000103', E'4 9\n2 7 11 15', '0 1', false, 1, 1, '2 + 7 = 9.'),
 ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000103', E'5 13\n6 3 8 5 7', '2 3', true, 2, 2, '8 + 5 = 13.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO submissions (id, user_id, problem_id, tenant_id, language_id, source_code, verdict, score, runtime_ms, memory_kb, test_case_results)
VALUES
 ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000103', NULL, 71, E'nums = [2, 7, 11, 15]\ntarget = 9\nseen = {}\nfor i, value in enumerate(nums):\n    if target - value in seen:\n        print(seen[target - value], i)\n        break\n    seen[value] = i', 'accepted', 100, 2, 4096, '[{"case_index":0,"passed":true},{"case_index":1,"passed":true}]'),
 ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000010', 71, 'print("demo attempt")', 'wrong_answer', 50, 3, 4096, '[{"case_index":0,"passed":true},{"case_index":1,"passed":false}]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO assignments (id, tenant_id, course_id, chapter_id, created_by, title, description, instructions, due_date, late_submission_allowed, total_marks, status)
VALUES ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000020', 'Array Practice', 'A sample assignment for API development.', 'Solve the Pair Sum problem and submit your solution.', now() + interval '14 days', true, 100, 'published')
ON CONFLICT (id) DO NOTHING;

INSERT INTO assignment_problems (id, assignment_id, problem_id, marks, order_index)
VALUES ('00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000103', 100, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO assignment_submissions (id, assignment_id, student_id, tenant_id, status, total_score, graded_by, graded_at, feedback, submitted_at)
VALUES ('00000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000010', 'graded', 100, '00000000-0000-0000-0000-000000000020', now(), 'Great work on the sample assignment.', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO quizzes (id, tenant_id, chapter_id, created_by, title, description, time_limit_minutes, passing_score, max_attempts, status)
VALUES ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000020', 'Algorithm Basics Quiz', 'A sample multiple-choice quiz.', 15, 60, 2, 'published')
ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_questions (id, quiz_id, question_text, explanation, options, correct_options, points, order_index)
VALUES ('00000000-0000-0000-0000-000000000112', '00000000-0000-0000-0000-000000000111', 'Which data structure supports average O(1) lookup by key?', 'Hash tables provide average constant-time key lookup.', '[{"id":"a","text":"Linked list"},{"id":"b","text":"Hash table"},{"id":"c","text":"Stack"}]', ARRAY['b'], 1, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_attempts (id, quiz_id, student_id, tenant_id, attempt_number, status, answers, score, total_points, passed, started_at, completed_at, time_taken_seconds)
VALUES ('00000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000010', 1, 'completed', '{"00000000-0000-0000-0000-000000000112":["b"]}', 100, 1, true, now() - interval '5 minutes', now(), 300)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_progress (id, user_id, chapter_id, tenant_id, is_completed, completion_percent, problems_solved, problems_total, last_accessed_at, completed_at)
VALUES ('00000000-0000-0000-0000-000000000114', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000010', false, 75, 1, 2, now(), NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO blog_posts (id, author_id, category_id, title, slug, excerpt, content, tags, status, is_featured, read_time_minutes, view_count, published_at)
SELECT '00000000-0000-0000-0000-000000000115', '00000000-0000-0000-0000-000000000001', id, 'Learning Algorithms by Building', 'codemitra-demo-learning-algorithms', 'A practical introduction to problem solving.', '# Learn by doing\n\nStart with a small problem, describe a simple solution, then improve it.', ARRAY['learning','algorithms','demo'], 'published', true, 3, 12, now()
FROM blog_categories WHERE slug = 'tutorials'
ON CONFLICT (id) DO NOTHING;

INSERT INTO announcements (id, tenant_id, created_by, title, content, is_pinned, expires_at)
VALUES ('00000000-0000-0000-0000-000000000116', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', 'Welcome to the demo course', 'Your sample course, assignment, and quiz are ready to explore.', true, now() + interval '60 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (id, user_id, type, title, message, action_url, metadata)
VALUES ('00000000-0000-0000-0000-000000000117', '00000000-0000-0000-0000-000000000021', 'course_published', 'A course is ready', 'Introduction to Algorithms is available.', '/courses/00000000-0000-0000-0000-000000000100', '{"seed":"codemitra-dev"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO audit_logs (user_id, tenant_id, action, resource_type, resource_id, new_data, ip_address, user_agent, request_id)
SELECT '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', 'seed.demo_data', 'course', '00000000-0000-0000-0000-000000000100', '{"seed":"codemitra-dev"}', '127.0.0.1', 'CodeMitra development fixture', '00000000-0000-0000-0000-000000000118'
WHERE NOT EXISTS (SELECT 1 FROM audit_logs WHERE request_id = '00000000-0000-0000-0000-000000000118');

INSERT INTO rate_limit_log (identifier, endpoint, request_count, window_start, window_end)
SELECT 'codemitra-demo-seed', '/api/v1/demo', 3, timestamp '2026-01-01 00:00:00+00', timestamp '2026-01-01 01:00:00+00'
WHERE NOT EXISTS (SELECT 1 FROM rate_limit_log WHERE identifier = 'codemitra-demo-seed' AND endpoint = '/api/v1/demo' AND window_start = timestamp '2026-01-01 00:00:00+00');

INSERT INTO user_stats (id, user_id, tenant_id, total_problems_solved, easy_solved, medium_solved, hard_solved, total_submissions, accepted_submissions, current_streak_days, max_streak_days, last_submission_date, total_score)
VALUES
 ('00000000-0000-0000-0000-000000000119', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', 2, 1, 1, 0, 5, 3, 2, 4, current_date, 35),
 ('00000000-0000-0000-0000-000000000120', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000010', 1, 1, 0, 0, 2, 1, 1, 1, current_date, 10)
ON CONFLICT DO NOTHING;

INSERT INTO course_enrollments (id, course_id, student_id, tenant_id, enrolled_by, is_active)
VALUES ('00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', true)
ON CONFLICT DO NOTHING;

INSERT INTO contests (id, tenant_id, created_by, title, description, slug, status, starts_at, ends_at, is_public, max_participants)
VALUES ('00000000-0000-0000-0000-000000000122', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', 'Demo Coding Sprint', 'A sample contest for testing contest APIs.', 'codemitra-demo-coding-sprint', 'active', now() - interval '1 hour', now() + interval '7 days', true, 100)
ON CONFLICT (id) DO NOTHING;

INSERT INTO contest_problems (id, contest_id, problem_id, points, order_index)
VALUES ('00000000-0000-0000-0000-000000000123', '00000000-0000-0000-0000-000000000122', '00000000-0000-0000-0000-000000000103', 100, 1)
ON CONFLICT DO NOTHING;

INSERT INTO contest_registrations (id, contest_id, user_id)
VALUES ('00000000-0000-0000-0000-000000000124', '00000000-0000-0000-0000-000000000122', '00000000-0000-0000-0000-000000000021')
ON CONFLICT DO NOTHING;

INSERT INTO plagiarism_reports (id, submission_id_a, submission_id_b, similarity_score, status, reviewed_by, reviewed_at, notes)
VALUES ('00000000-0000-0000-0000-000000000125', '00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000107', 12.50, 'clean', '00000000-0000-0000-0000-000000000020', now(), 'Development fixture only; low similarity example.')
ON CONFLICT DO NOTHING;

INSERT INTO certificates (id, user_id, tenant_id, course_id, title, issued_at, certificate_url, verify_hash, metadata)
VALUES ('00000000-0000-0000-0000-000000000126', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000100', 'Algorithm Basics - Demo Completion', now(), 'https://example.invalid/certificates/demo-001', 'codemitra-demo-certificate-000126', '{"seed":"codemitra-dev","sample":true}')
ON CONFLICT DO NOTHING;
