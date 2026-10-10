. (Join-Path $PSScriptRoot 'common.ps1')
$maintenanceDb = if ($env:PGMAINTENANCEDB) { $env:PGMAINTENANCEDB } else { 'postgres' }
$targetDb = $env:PGDATABASE
if ($targetDb -notmatch '^[A-Za-z_][A-Za-z0-9_]*$') { throw "Invalid database name '$targetDb'. Use letters, numbers, and underscores." }
$exists = Invoke-PsqlText $maintenanceDb "SELECT 1 FROM pg_database WHERE datname = '$targetDb';"
if (-not $exists) {
    Invoke-PsqlText $maintenanceDb "CREATE DATABASE `"$targetDb`" ENCODING 'UTF8' TEMPLATE template0;" | Out-Null
    Write-Host "Created database $env:PGDATABASE"
} else { Write-Host "Database $env:PGDATABASE already exists; preserving it." }
Invoke-Migrations
