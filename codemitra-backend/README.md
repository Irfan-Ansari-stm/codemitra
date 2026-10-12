# CodeVerse Backend API

Express.js + TypeScript + Drizzle ORM + PostgreSQL + Judge0

## Quick Start

```bash
# 1. Copy and fill in your env file
cp .env.example .env

# 2. Install packages
npm install

# 3. Start dev server
npm run dev
```

API is live at `http://localhost:5000`
Health check: `GET http://localhost:5000/health`

Code execution endpoints (`POST /api/v1/submissions` and `/run`) require a reachable Judge0 service at `JUDGE0_URL` (default `http://localhost:2358`). If Judge0 is unavailable, the API returns `503 JUDGE0_UNAVAILABLE`; a submitted row is marked `internal_error` instead of being left pending.

---

## Project Structure

```
src/
├── index.ts                  ← Entry point (starts server + Judge0 poller)
├── app.ts                    ← Express app factory (middleware, routes)
├── db/
│   ├── index.ts              ← pg Pool + Drizzle client
│   ├── schema.ts             ← Drizzle ORM schema (mirrors your SQL tables)
│   └── context.ts            ← withTenantContext() helper for RLS
├── middleware/
│   ├── auth.ts               ← JWT verify → req.user
│   ├── rbac.ts               ← requireRole() / isSuperAdmin / isInstitutionAdmin
│   ├── rateLimit.ts          ← global / auth / submission rate limiters
│   ├── validate.ts           ← Zod schema validation
│   └── errorHandler.ts       ← Global error handler + AppError class
├── services/
│   ├── auth.service.ts       ← Login, register, refresh, change-password
│   ├── tenant.service.ts     ← Institution CRUD
│   ├── user.service.ts       ← User management
│   ├── course.service.ts     ← Courses, Modules, Chapters
│   ├── problem.service.ts    ← Problems + test cases
│   ├── submission.service.ts ← Code submit + Judge0 polling
│   ├── assignment.service.ts ← Assignment management
│   ├── quiz.service.ts       ← Quiz + grading
│   ├── analytics.service.ts  ← Dashboard, leaderboard, heatmap
│   └── notification.service.ts
├── routes/
│   ├── auth.routes.ts        ← /api/v1/auth/*
│   ├── tenant.routes.ts      ← /api/v1/tenants/*
│   ├── user.routes.ts        ← /api/v1/users/*
│   ├── course.routes.ts      ← /api/v1/courses/*
│   ├── problem.routes.ts     ← /api/v1/problems/*
│   ├── submission.routes.ts  ← /api/v1/submissions/*
│   ├── assignment.routes.ts  ← /api/v1/assignments/*
│   ├── quiz.routes.ts        ← /api/v1/quizzes/*
│   ├── analytics.routes.ts   ← /api/v1/analytics/*
│   └── blog.routes.ts        ← /api/v1/blog/*
├── validators/
│   └── index.ts              ← All Zod schemas
├── utils/
│   ├── jwt.ts                ← signAccessToken, signRefreshToken, hashToken
│   ├── audit.ts              ← writeAuditLog()
│   └── slug.ts               ← toSlug(), toUniqueSlug()
└── types/
    └── express.d.ts          ← req.user, req.requestId augmentation
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | 256-bit random hex (`openssl rand -hex 32`) |
| `JWT_REFRESH_SECRET` | Different 256-bit random hex |
| `JWT_ACCESS_EXPIRES` | Default `15m` |
| `JWT_REFRESH_EXPIRES` | Default `7d` |
| `BCRYPT_ROUNDS` | Default `12` |
| `JUDGE0_URL` | Your Judge0 instance URL |
| `JUDGE0_API_KEY` | Only needed for hosted judge0.com |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `PORT` | Default `5000` |

---

## API Endpoints Summary

### Auth — `/api/v1/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/login` | Login, returns access + refresh token |
| POST | `/register` | Self-register as general_student |
| POST | `/refresh` | Rotate refresh token |
| POST | `/logout` | Revoke refresh token |
| PATCH | `/change-password` | Change own password |
| GET | `/me` | Get own profile |

### Tenants — `/api/v1/tenants` (super_admin only)
| Method | Path | Description |
|---|---|---|
| GET | `/` | List all institutions |
| GET | `/:id` | Get institution |
| POST | `/` | Create institution |
| PATCH | `/:id` | Update institution |
| DELETE | `/:id` | Soft-delete institution |

### Users — `/api/v1/users`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List tenant users (admin) |
| GET | `/profile` | Own profile + stats |
| GET | `/:id` | Get user (admin) |
| POST | `/` | Create institution user (admin) |
| PATCH | `/:id` | Update user |
| DELETE | `/:id` | Soft-delete user (admin) |

### Courses — `/api/v1/courses`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List tenant courses; tenantless general students see published courses |
| GET | `/:id` | Get tenant course or published course for a general student |
| POST | `/` | Create course (admin) |
| PATCH | `/:id` | Update course (admin) |
| GET | `/:courseId/modules` | List modules |
| POST | `/:courseId/modules` | Add module (admin) |
| GET | `/modules/:moduleId/chapters` | List chapters |
| POST | `/modules/:moduleId/chapters` | Add chapter (admin) |
| GET | `/chapters/:id` | Get chapter with content |

### Problems — `/api/v1/problems`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List problems (public + tenant) |
| GET | `/:id` | Get problem with sample cases |
| POST | `/` | Create problem (admin) |
| GET | `/:id/test-cases` | All test cases (admin) |
| POST | `/:id/test-cases` | Add test case (admin) |

### Submissions — `/api/v1/submissions`
| Method | Path | Description |
|---|---|---|
| POST | `/` | Submit code → Judge0 (async) |
| POST | `/run` | Run code on sample cases (sync) |
| GET | `/:id` | Poll submission result |
| GET | `/problem/:problemId` | Submission history for a problem |
| GET | `/` | All submissions in tenant (admin) |

### Assignments — `/api/v1/assignments`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List assignments |
| GET | `/:id` | Get assignment with problems |
| POST | `/` | Create assignment (admin) |
| POST | `/:id/problems` | Add problem to assignment (admin) |
| GET | `/:id/my-submission` | Own submission record |
| POST | `/:id/submit` | Submit assignment |

### Quizzes — `/api/v1/quizzes`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List quizzes |
| GET | `/:id` | Get quiz with questions |
| POST | `/` | Create quiz (admin) |
| POST | `/:id/questions` | Add question (admin) |
| POST | `/:id/start` | Start attempt |
| POST | `/attempts/:attemptId/submit` | Submit answers |

### Analytics — `/api/v1/analytics`
| Method | Path | Description |
|---|---|---|
| GET | `/overview` | Institution stats (admin) |
| GET | `/heatmap` | Submission heatmap (admin) |
| GET | `/leaderboard` | Top students |
| GET | `/report` | Full institution report (admin) |
| GET | `/students/:id/progress` | Student chapter progress (admin) |

### Blog — `/api/v1/blog`
| Method | Path | Description |
|---|---|---|
| GET | `/categories` | List blog categories |
| GET | `/posts` | List posts |
| GET | `/posts/:slug` | Get post by slug |
| POST | `/posts` | Create post (super_admin) |
| PATCH | `/posts/:id/publish` | Publish post (super_admin) |

---

## How RLS Works

Every request that hits a tenant-scoped table goes through `withTenantContext()`:

```typescript
await withTenantContext(
  { userId: req.user.id, tenantId: req.user.tenantId, role: req.user.role },
  async (client) => {
    // All queries here automatically filtered by PostgreSQL RLS
  }
);
```

The middleware sets these PostgreSQL session variables per transaction:
- `app.current_user_id`
- `app.current_tenant_id`
- `app.current_user_role`

Your existing RLS policies in the database enforce isolation automatically.

---

## Judge0 Flow

1. `POST /submissions` → insert `pending` row → batch-submit to Judge0 → store token
2. Background poller (every 2s) → finds `pending` submissions → polls Judge0 → updates verdict
3. `GET /submissions/:id` → client polls this until `verdict !== 'pending'`
4. DB triggers auto-update `problems.total_submissions`, `user_stats`, etc.

---

## Scripts

```bash
npm run dev        # Start with hot reload (tsx watch)
npm run build      # Compile TypeScript → dist/
npm run start      # Run compiled output (production)
npm run db:push    # Push Drizzle schema to DB (dev only)
npm run db:studio  # Open Drizzle Studio GUI
```
