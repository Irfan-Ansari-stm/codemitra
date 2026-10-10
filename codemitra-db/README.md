# CodeMitra PostgreSQL workflow

This folder manages the PostgreSQL database `codemitra` with `psql` and `pg_dump`. The baseline is the existing schema, copied to `migrations/001_initial_schema.sql`. Additive SQL from the legacy `migrations.sql` was converted into migrations 002–005 and applied. The workflow never drops a database or runs destructive data statements.

## Requirements and connection

Install PostgreSQL command line tools and make `psql` and `pg_dump` available on `PATH`. Copy `connection.env.example` to `connection.env` and set `PGHOST`, `PGPORT`, `PGUSER`, and, if needed, `PGPASSWORD`. The config file is ignored by Git. Prefer the normal PostgreSQL password file (`%APPDATA%\postgresql\pgpass.conf` on Windows) or integrated authentication instead of storing a password here. The scripts do not display connection settings. `connection.env` is loaded by the PowerShell scripts; for direct `psql` commands, use standard PostgreSQL environment variables or pass `-h`, `-p`, and `-U` explicitly.

The backend uses `DATABASE_URL`; configure it in `codemitra-backend/.env` when running the API. Keep that file private. The frontend reads its API base from `codemitra-frontend/.env.local` (`NEXT_PUBLIC_API_URL`). Keep both files private; the database workflow does not configure application credentials.

## Initialize or update

From this directory in VS Code's PowerShell terminal:

```powershell
Copy-Item connection.env.example connection.env # once; then edit connection.env
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\init.ps1
```

Initialization checks `PGMAINTENANCEDB` (default `postgres`) and creates `codemitra` only if it is absent. It then applies numbered pending migrations. To apply pending migrations later:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\migrate.ps1
```

Each migration and its history row run in a single transaction. `schema_migrations` stores the filename, SHA-256 checksum, and application time. Applied migration files are immutable: a checksum mismatch stops the run with an error. Add future files as `migrations/002_short_description.sql`, `003_...sql`, and so on; never edit an applied file. Use additive `CREATE ... IF NOT EXISTS` / guarded `ALTER` statements where practical, and review any data backfill before applying it.

## Verify and health check

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify.ps1
psql -X -h localhost -p 5432 -U postgres -d codemitra -v ON_ERROR_STOP=1 -f .\health_check.sql
```

The verifier checks required application tables and validates each recorded checksum against the local migration file. You can override any standard `PG*` connection environment variable for one terminal session; `PGDATABASE` defaults to `codemitra`.

## Backups

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\backup.ps1
```

Backups are custom-format `.dump` files under `backups/`. They are ignored by Git. Restore only after choosing the target deliberately; this workflow never restores automatically and never overwrites a database.

## Development seed data

Apply repeatable sample records to the existing database with:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\seed.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-seed.ps1
```

Fixtures are in `seeds/dev_dummy_data.sql`. They use stable IDs and skip conflicts, preserving existing rows. Sample sign-in accounts are `admin@demo.codemitra.local`, `student@demo.codemitra.local`, and `learner@demo.codemitra.local`; each uses the development-only password `DemoPass123!`. Change these before exposing the app to anyone else. `schema_migrations` contains real migration records and is intentionally not given fake seed history.

## Directory layout

```text
codemitra-db/
  migrations/001_initial_schema.sql  # immutable initial schema baseline
  migrations/002_course_enrollments.sql
  migrations/003_contests.sql
  migrations/004_plagiarism_reports.sql
  migrations/005_certificates.sql
  scripts/common.ps1                 # private connection and migration helpers
  scripts/init.ps1                   # create-if-absent plus migrate
  scripts/migrate.ps1                # apply pending migrations
  scripts/verify.ps1                 # schema and checksum verification
  scripts/backup.ps1                 # pg_dump custom-format backup
  scripts/seed.ps1                   # apply repeatable development fixtures
  scripts/verify-seed.ps1            # confirm every table has rows
  seeds/dev_dummy_data.sql           # deterministic development fixtures
  connection.env.example             # local connection template
  health_check.sql                   # read-only database checks
  codeverse_schema.sql               # original project schema, preserved
  .gitignore                          # secrets and generated artifacts
```

## Application startup

The frontend and backend are separate projects in sibling directories. Dependencies are installed; the backend build succeeds. The frontend is running at `http://localhost:3000`, and the API is running at `http://localhost:5000`. The local backend `.env` uses the PostgreSQL administrator account for development; use a dedicated least-privilege application role before deploying. Set `NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1` in the frontend `.env.local` if you want to override its default.
