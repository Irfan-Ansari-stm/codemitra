. (Join-Path $PSScriptRoot 'common.ps1')
$db = $env:PGDATABASE
$expected = @('tenants','users','refresh_tokens','courses','modules','chapters','problems','test_cases','submissions','assignments','assignment_problems','assignment_submissions','quizzes','quiz_questions','quiz_attempts','user_progress','blog_categories','blog_posts','announcements','notifications','audit_logs','rate_limit_log','user_stats','schema_migrations','course_enrollments','contests','contest_problems','contest_registrations','plagiarism_reports','certificates')
$actual = (Invoke-PsqlText $db "SELECT tablename FROM pg_tables WHERE schemaname='public';") -split "`n"
$missing = @($expected | Where-Object { $_ -notin $actual })
if ($missing.Count) { throw "Missing required tables: $($missing -join ', ')" }
$types = (Invoke-PsqlText $db "SELECT typname FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND typname IN ('contest_status','plagiarism_status');") -split "`n"
$missingTypes = @(@('contest_status','plagiarism_status') | Where-Object { $_ -notin $types })
if ($missingTypes.Count) { throw "Missing required enum types: $($missingTypes -join ', ')" }
$migrationRows = Invoke-PsqlText $db 'SELECT version || E''\t'' || checksum FROM public.schema_migrations ORDER BY version;'
if (-not $migrationRows) { throw 'Migration history is empty.' }
foreach ($row in ($migrationRows -split "`n")) {
    $parts = $row -split "`t"; $path = Join-Path $MigrationsPath $parts[0]
    if (-not (Test-Path -LiteralPath $path)) { throw "Applied migration file missing: $($parts[0])" }
    $hash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($hash -ne $parts[1]) { throw "Migration checksum mismatch: $($parts[0])" }
}
Write-Host "Schema verified in '$db': $($expected.Count) required tables; migration history checksums match."
