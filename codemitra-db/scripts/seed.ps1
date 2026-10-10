. (Join-Path $PSScriptRoot 'common.ps1')
$seedPath = Join-Path 'seeds' 'dev_dummy_data.sql'
Push-Location $WorkflowRoot
try {
    $ErrorActionPreference = 'Continue'
    $result = & $Psql -X -w -v ON_ERROR_STOP=1 -1 -d $env:PGDATABASE -f $seedPath 2>&1
    $psqlExitCode = $LASTEXITCODE
} finally {
    Pop-Location
    $ErrorActionPreference = 'Stop'
}
if ($psqlExitCode -ne 0) { throw "Seed failed; transaction rolled back: $($result -join "`n")" }
Write-Host "Development fixtures applied to '$env:PGDATABASE' (existing rows preserved)."
