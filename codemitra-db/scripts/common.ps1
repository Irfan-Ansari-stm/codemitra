$ErrorActionPreference = 'Stop'
$WorkflowRoot = Split-Path -Parent $PSScriptRoot
$MigrationsPath = Join-Path $WorkflowRoot 'migrations'
$TempPath = Join-Path $WorkflowRoot 'temp'
$ConfigPath = Join-Path $WorkflowRoot 'connection.env'
$Psql = (Get-Command psql -ErrorAction Stop).Source
$PgDump = (Get-Command pg_dump -ErrorAction Stop).Source

function Import-WorkflowConfig {
    if (Test-Path -LiteralPath $ConfigPath) {
        foreach ($line in Get-Content -LiteralPath $ConfigPath) {
            if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$' -and $line -notmatch '^\s*#') {
                $key = $Matches[1]; $value = $Matches[2].Trim('"').Trim("'")
                if (-not [Environment]::GetEnvironmentVariable($key) -and $value) {
                    [Environment]::SetEnvironmentVariable($key, $value, 'Process')
                }
            }
        }
    }
    if (-not $env:PGDATABASE) { $env:PGDATABASE = 'codemitra' }
}

function Invoke-PsqlText([string]$Database, [string]$Sql, [string[]]$Variables = @()) {
    $argsList = @('-X','-w','-v','ON_ERROR_STOP=1','-A','-t','-d',$Database)
    foreach ($item in $Variables) { $argsList += @('-v', $item) }
    $argsList += @('-c', $Sql)
    $priorErrorPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try { $result = & $Psql @argsList 2>&1; $psqlExitCode = $LASTEXITCODE }
    finally { $ErrorActionPreference = $priorErrorPreference }
    if ($psqlExitCode -ne 0) { throw "psql failed against database '$Database': $($result -join "`n")" }
    return ($result -join "`n").Trim()
}

function Invoke-Migrations {
    $db = $env:PGDATABASE
    Invoke-PsqlText $db 'SET client_min_messages=warning; CREATE TABLE IF NOT EXISTS public.schema_migrations (version text PRIMARY KEY, checksum char(64) NOT NULL, applied_at timestamptz NOT NULL DEFAULT now());' | Out-Null
    New-Item -ItemType Directory -Force -Path $TempPath | Out-Null
    $applied = Invoke-PsqlText $db 'SELECT version || E''\t'' || checksum FROM public.schema_migrations ORDER BY version;'
    $known = @{}
    if ($applied) { foreach ($row in ($applied -split "`n")) { $parts = $row -split "`t"; if ($parts.Count -eq 2) { $known[$parts[0]] = $parts[1] } } }
    $files = @(Get-ChildItem -LiteralPath $MigrationsPath -Filter '*.sql' -File | Sort-Object Name)
    if (-not $files.Count) { throw 'No numbered migration SQL files found.' }
    foreach ($file in $files) {
        if ($file.Name -notmatch '^\d{3,}_[a-z0-9_]+\.sql$') { throw "Invalid migration filename '$($file.Name)'. Use NNN_description.sql." }
        $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($known.ContainsKey($file.Name)) {
            if ($known[$file.Name] -ne $hash) { throw "CHECKSUM MISMATCH: applied migration '$($file.Name)' was modified. Restore the exact applied file; create a new migration for changes." }
            Write-Host "Verified applied: $($file.Name)"
            continue
        }
        $runnerFile = Join-Path 'temp' ('apply_' + $file.Name)
        $runnerFullPath = Join-Path $WorkflowRoot $runnerFile
        $runnerLines = @('SET client_min_messages=warning;', "\ir ../migrations/$($file.Name)", "INSERT INTO public.schema_migrations(version, checksum) VALUES ('$($file.Name)', '$hash');")
        [System.IO.File]::WriteAllLines($runnerFullPath, $runnerLines, [System.Text.UTF8Encoding]::new($false))
        try {
            Push-Location $WorkflowRoot
            try { $ErrorActionPreference='Continue'; $result = & $Psql -X -w -v ON_ERROR_STOP=1 -1 -d $db -f $runnerFile 2>&1; $psqlExitCode = $LASTEXITCODE }
            finally { Pop-Location }
            $ErrorActionPreference = 'Stop'
            if ($psqlExitCode -ne 0) { throw "Migration '$($file.Name)' failed; transaction rolled back: $($result -join "`n")" }
            Write-Host "Applied: $($file.Name)"
        } finally { Remove-Item -LiteralPath $runnerFullPath -Force -ErrorAction SilentlyContinue }
    }
}

Import-WorkflowConfig
