. (Join-Path $PSScriptRoot 'common.ps1')
$backupPath = Join-Path $WorkflowRoot 'backups'
New-Item -ItemType Directory -Force -Path $backupPath | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$file = Join-Path $backupPath "$($env:PGDATABASE)_$stamp.dump"
$argsList = @('-w','-Fc','-d',$env:PGDATABASE,'-f',$file)
$result = & $PgDump @argsList 2>&1
if ($LASTEXITCODE -ne 0) { Remove-Item -LiteralPath $file -Force -ErrorAction SilentlyContinue; throw "pg_dump failed: $($result -join "`n")" }
Write-Host "Backup created: $file"
