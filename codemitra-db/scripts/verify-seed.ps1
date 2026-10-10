. (Join-Path $PSScriptRoot 'common.ps1')
$sql = @'
SELECT 'tenants' || E'\t' || count(*) FROM tenants
UNION ALL SELECT 'users' || E'\t' || count(*) FROM users
UNION ALL SELECT 'refresh_tokens' || E'\t' || count(*) FROM refresh_tokens
UNION ALL SELECT 'courses' || E'\t' || count(*) FROM courses
UNION ALL SELECT 'modules' || E'\t' || count(*) FROM modules
UNION ALL SELECT 'chapters' || E'\t' || count(*) FROM chapters
UNION ALL SELECT 'problems' || E'\t' || count(*) FROM problems
UNION ALL SELECT 'test_cases' || E'\t' || count(*) FROM test_cases
UNION ALL SELECT 'submissions' || E'\t' || count(*) FROM submissions
UNION ALL SELECT 'assignments' || E'\t' || count(*) FROM assignments
UNION ALL SELECT 'assignment_problems' || E'\t' || count(*) FROM assignment_problems
UNION ALL SELECT 'assignment_submissions' || E'\t' || count(*) FROM assignment_submissions
UNION ALL SELECT 'quizzes' || E'\t' || count(*) FROM quizzes
UNION ALL SELECT 'quiz_questions' || E'\t' || count(*) FROM quiz_questions
UNION ALL SELECT 'quiz_attempts' || E'\t' || count(*) FROM quiz_attempts
UNION ALL SELECT 'user_progress' || E'\t' || count(*) FROM user_progress
UNION ALL SELECT 'blog_categories' || E'\t' || count(*) FROM blog_categories
UNION ALL SELECT 'blog_posts' || E'\t' || count(*) FROM blog_posts
UNION ALL SELECT 'announcements' || E'\t' || count(*) FROM announcements
UNION ALL SELECT 'notifications' || E'\t' || count(*) FROM notifications
UNION ALL SELECT 'audit_logs' || E'\t' || count(*) FROM audit_logs
UNION ALL SELECT 'rate_limit_log' || E'\t' || count(*) FROM rate_limit_log
UNION ALL SELECT 'user_stats' || E'\t' || count(*) FROM user_stats
UNION ALL SELECT 'schema_migrations' || E'\t' || count(*) FROM schema_migrations
UNION ALL SELECT 'course_enrollments' || E'\t' || count(*) FROM course_enrollments
UNION ALL SELECT 'contests' || E'\t' || count(*) FROM contests
UNION ALL SELECT 'contest_problems' || E'\t' || count(*) FROM contest_problems
UNION ALL SELECT 'contest_registrations' || E'\t' || count(*) FROM contest_registrations
UNION ALL SELECT 'plagiarism_reports' || E'\t' || count(*) FROM plagiarism_reports
UNION ALL SELECT 'certificates' || E'\t' || count(*) FROM certificates
ORDER BY 1;
'@
$result = Invoke-PsqlText $env:PGDATABASE $sql
$failed = @()
foreach ($line in ($result -split "`n")) {
    $parts = $line -split "`t"
    if ($parts.Count -ne 2 -or [int]$parts[1] -lt 1) { $failed += $line }
}
if ($failed.Count) { throw "Empty/unverified tables: $($failed -join ', ')" }
Write-Host "All $((($result -split "`n")).Count) database tables contain at least one row, including migration history."
Write-Host $result
