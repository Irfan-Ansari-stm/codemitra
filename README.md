# CodeMitra

![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6) ![Next.js](https://img.shields.io/badge/Next.js-14-000000) ![Express](https://img.shields.io/badge/Express-4.x-000000) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-336791) ![Judge0](https://img.shields.io/badge/Judge0-Code%20Execution-5B8DEF)

CodeMitra is a multi-tenant coding education platform designed for universities, bootcamps, training providers, and modern learning teams. It combines a polished learner experience with role-based admin tooling, secure API services, PostgreSQL row-level security, and real code execution for practice, assignments, and assessments.

The project is organized as a monorepo with:

- `codemitra-frontend/` — Next.js 14 application for learners, institutions, and admins
- `codemitra-backend/` — Express.js + TypeScript API with JWT auth, RBAC, and submission processing
- `codemitra-db/` — PostgreSQL schema, migrations, seed scripts, and database workflow tooling

## Why CodeMitra?

Modern coding programs need more than a code editor. They need a complete learning system that helps teams:

- onboard learners into structured coding sessions
- assign problems, courses, quizzes, and labs
- monitor performance through analytics and leaderboards
- run secure code execution in a controlled environment
- manage multi-tenant institutions and role-based access at scale

CodeMitra brings those capabilities together in one platform.

## Core Features

### Learning and assessment
- Interactive coding challenges with live submission workflow
- Multiple programming languages and test-case based validation
- Course and chapter-based curriculum organization
- Assignments, quizzes, and milestone tracking
- Student progress dashboards and institution-level analytics

### Multi-tenant platform
- Super admin, institution admin, and learner roles
- Tenant-scoped data boundaries via PostgreSQL RLS
- Institution management and user administration
- Role-aware routing and access enforcement

### Secure execution and data handling
- JWT-based authentication and refresh flow
- Rate limiting and request validation
- Protected environment variables and secrets
- CI-friendly backend configuration and structured error handling
- Judge0 integration for code execution and result polling

### Modern developer experience
- TypeScript across frontend and backend
- Next.js app router for scalable UI development
- Drizzle ORM + PostgreSQL schema automation
- Clean route/service layer pattern for maintainability

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | Express.js, TypeScript, JWT, Zod, Helmet, CORS |
| Database | PostgreSQL, Drizzle ORM, Row-Level Security |
| Code execution | Judge0 |
| State/data | React Query, Zustand |
| Dev tooling | ESLint, Prettier, TypeScript, Drizzle Kit |

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                     codemitra-frontend                       │
│  Next.js app for learners, instructors, and admins          │
│  - auth flows                                               │
│  - dashboard & analytics                                    │
│  - problem pages and editor                                  │
│  - institutional and public pages                            │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / REST API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    codemitra-backend                         │
│  Express API                                                │
│  - auth + RBAC                                              │
│  - courses, problems, users, submissions                   │
│  - assignments, analytics, notifications                   │
│  - Judge0 orchestration                                     │
└──────────────────────────────┬──────────────────────────────┘
                               │ PostgreSQL
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        codemitra-db                           │
│  PostgreSQL schema + migrations + seed scripts              │
│  - RLS-ready multi-tenant model                             │
│  - migration integrity checks                               │
│  - backup/verify workflow                                    │
└─────────────────────────────────────────────────────────────┘
```

## Repository Structure

```text
app/
├── codemitra-frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── store/
│   ├── types/
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── codemitra-backend/
│   ├── src/
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── codemitra-db/
│   ├── migrations/
│   ├── scripts/
│   ├── seeds/
│   ├── README.md
│   └── drizzle_schema.ts
├── .gitignore
├── README.md
└── .vscode/
```

## Prerequisites

Before you start, make sure you have the following installed:

- Node.js 18 or newer
- npm
- PostgreSQL 14+ with a local database instance
- A running Judge0 service (for code execution)
- Optional: Docker, if you want to run supporting services locally

## Quick Start

### 1) Clone the repository

```bash
git clone https://github.com/Irfan-Ansari-stm/codemitra.git
cd codemitra
```

### 2) Set up the database

From the database folder:

```bash
cd codemitra-db
```

Create a local `connection.env` from the example and configure connection details, then initialize the database:

```powershell
Copy-Item connection.env.example connection.env
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\init.ps1
```

For more details, see the database workflow in `codemitra-db/README.md`.

### 3) Configure backend environment

```bash
cd ../codemitra-backend
cp .env.example .env
```

Update `.env` with your PostgreSQL connection and secret values:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/codemitra
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JUDGE0_URL=http://localhost:2358
PORT=5000
NODE_ENV=development
```

Install and start the API:

```bash
npm install
npm run dev
```

The backend runs at:

```text
http://localhost:5000
```

### 4) Configure frontend environment

```bash
cd ../codemitra-frontend
cp .env.example .env.local
```

Update your frontend config:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=CodeVerse
```

Install and run the UI:

```bash
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:3000
```

## Available Scripts

### Frontend (`codemitra-frontend/`)

```bash
npm run dev        # start the Next.js development server
npm run build      # create production build
npm run start      # run production build locally
npm run lint       # run ESLint
npm run type-check # run TypeScript checks
npm run format     # format project files
```

### Backend (`codemitra-backend/`)

```bash
npm run dev        # start Express in watch mode
npm run build      # compile TypeScript
npm run start      # start the compiled server
npm run db:push    # push Drizzle schema to PostgreSQL
npm run db:generate # generate schema migration files
npm run db:studio  # open Drizzle Studio
```

### Database (`codemitra-db/`)

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\init.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\migrate.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\backup.ps1
```

## Environment Variables

### Backend

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Yes | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh tokens |
| `JWT_ACCESS_EXPIRES` | No | Default: `15m` |
| `JWT_REFRESH_EXPIRES` | No | Default: `7d` |
| `BCRYPT_ROUNDS` | No | Default: `12` |
| `ALLOWED_ORIGINS` | No | Allowed frontend origins |
| `JUDGE0_URL` | Yes for execution | URL of Judge0 service |
| `PORT` | No | Default: `5000` |
| `NODE_ENV` | No | `development` or `production` |

### Frontend

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes | Backend base URL |
| `NEXT_PUBLIC_APP_URL` | No | Public app URL |
| `NEXT_PUBLIC_APP_NAME` | No | App display name |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | No | Toggle analytics UI |
| `NEXT_PUBLIC_ENABLE_BLOG` | No | Toggle blog UI |

## Application Highlights

### Student experience
- Discover problems and assignments
- Submit code directly from the browser
- View execution results and historical submissions
- Track learning progress and completion stats

### Instructor and admin experience
- Manage courses, modules, chapters, and assignments
- Monitor student performance and engagement
- Review leaderboard and institutional analytics
- Configure assignments and content for cohorts

### Platform governance
- Role-based access control
- Tenant-scoped data access
- Safe execution boundaries for code evaluation
- Centralized API validation and error handling

## Production Notes

This repository is structured with production-oriented conventions, but deployment configuration still needs to be tailored to your environment.

Before taking the project live, make sure you:

- rotate all JWT secrets and use secure values in production
- configure a dedicated PostgreSQL database user with least privilege
- run Judge0 in a secure and monitored environment
- set `NODE_ENV=production` and verify the build works cleanly
- configure HTTPS and trusted CORS origins
- keep `.env` and `.env.local` files out of version control
- add a proper `LICENSE` file if you plan to publish the repo publicly

## Security and Data Protection

The platform includes several safeguards that are important for serious production use:

- JWT auth with separate access and refresh secrets
- rate limiting on API routes
- Zod request validation
- RBAC middleware for protected routes
- row-level security patterns in PostgreSQL
- secure environment variable management

## Roadmap

Planned improvements may include:

- richer exam and proctoring workflows
- deeper code quality and plagiarism checks
- notifications and event-driven workflows
- improved audit logging and admin controls
- deployment templates for Docker and cloud providers

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run checks and verify the affected flows
5. Open a pull request with a clear summary

## Support

For questions, issues, or collaboration requests, open a GitHub issue or contact the project maintainer.

## License

This repository does not currently include a license file. If you plan to publish it publicly on GitHub, add a license before release.

## Project Status

This project is under active development and is structured for a production-quality engineering workflow, with separate frontend, backend, and database concerns designed for maintainability and scale.
