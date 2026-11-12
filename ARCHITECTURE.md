# CodeVerse — Complete Multi-Role Education Platform Architecture

> Production-ready education platform with four user types: Super Admin, Institute Admin, Institute Student, and General User.

---

## 1. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript | SSR/SSG, routing, UI |
| State | Zustand + TanStack Query | Client state + server cache |
| Styling | Tailwind CSS, shadcn/ui patterns | Responsive design system |
| Backend | Node.js + Express 4, TypeScript | REST API |
| Database | PostgreSQL 15+ | Primary datastore |
| ORM | Drizzle ORM + raw SQL | Type-safe queries |
| Auth | JWT (access) + httpOnly refresh cookies | Session management |
| Hashing | bcrypt (12 rounds) | Password security |
| Validation | Zod | Schema validation |
| Testing | Vitest + React Testing Library | Unit/integration |
| Code Exec | Judge0 API | Sandboxed code execution |

---

## 2. Sitemap (All Four User Types)

### Public Website (visitors + general users)
```
/                          Home
/about                     About platform
/courses                   Public course catalog
/courses/[id]              Course detail + preview
/problems                  Public problem catalog
/problems/[id]             Problem detail
/institutions              Institute directory
/blog                      Blog listing
/blog/[slug]               Blog post
/faq                       FAQ page
/contact                   Contact page
/terms                     Terms of service
/privacy                   Privacy policy
/register                  Self-registration
/login                     Login
/forgot-password           Password recovery
/verify-email              Email verification
```

### Super Admin Portal
```
/super-admin/dashboard                 Platform overview
/super-admin/users                     All platform users (institution admins + students)
/super-admin/general-users             Independently registered users
/super-admin/institutions              Institute management
/super-admin/institutions/[id]         Institute detail
/super-admin/institutions/applications Pending institute applications
/super-admin/courses                   Platform-wide courses
/super-admin/courses/[id]              Course detail
/super-admin/problems                  Problem management
/super-admin/content                   Content pages, blogs, FAQs, banners
/super-admin/seo                       SEO configuration
/super-admin/configuration             Platform configuration
/super-admin/logs                      Audit & application logs
/super-admin/support                   Support tickets
/super-admin/analytics                 Global analytics
/super-admin/notifications             Notification management
/super-admin/approvals                 Workflow approvals
/super-admin/certificates              Certificate management
/super-admin/files                     File & document management
/super-admin/integrations              Integration & API management
/super-admin/security                  Security & compliance
/super-admin/backup                    Backup & recovery
/super-admin/monitoring                System monitoring
/super-admin/releases                  Feature & release management
/super-admin/help-center               Help center & knowledge base
```

### Institute Admin Portal
```
/institution/dashboard                 Institute overview
/institution/profile                   Institute profile
/institution/students                  Student management
/institution/students/admissions       Admission applications
/institution/courses                   Institute courses
/institution/courses/[id]              Course detail
/institution/instructors               Instructor & staff management
/institution/content                   Institute announcements & resources
/institution/academic                  Academic management
/institution/academic/years            Academic years
/institution/academic/semesters        Semesters
/institution/academic/batches          Batches & classes
/institution/academic/attendance       Attendance
/institution/academic/grades           Grades & assessment results
/institution/academic/timetable        Timetable
/institution/reports                   Institute reports
/institution/settings                  Institute settings
/institution/assignments               Assignments
/institution/quizzes                   Quizzes
/institution/problems                  Institute problems
/institution/notifications             Notifications
/institution/analytics                 Institute analytics
```

### Institute Student Portal
```
/student/dashboard                     Student dashboard
/student/profile                       Profile & settings
/student/institute                     Institute information
/student/courses                       Enrolled courses
/student/courses/[id]                  Course learning
/student/problems                      Problem practice
/student/problems/[id]                 Problem solve
/student/assignments                   Assignments & submissions
/student/quizzes                       Quizzes & examinations
/student/records                       Academic records
/student/records/attendance            Attendance
/student/records/grades                Grades
/student/records/certificates          Certificates
/student/communication                 Announcements & tickets
/student/support                       Support tickets
```

### General User Dashboard
```
/dashboard                             Personal dashboard
/dashboard/courses                     Public courses
/dashboard/problems                    Problem practice
/dashboard/problems/[id]/solve         Solve problem
/dashboard/learning                    Saved courses & bookmarks
/dashboard/institutions                Institute directory & applications
/dashboard/support                     Support tickets
/dashboard/settings                    Account settings
```

---

## 3. Module & Submenu Hierarchy

### Super Admin Modules
1. **Dashboard** — platform metrics, activity, health
2. **User Management** — list, create, edit, suspend, roles, sessions, login history
3. **Institute Management** — register, approve/reject, suspend, assign admins, limits
4. **Course Management** — CRUD, publish/unpublish, categories, modules, instructors
5. **Problem Management** — CRUD, test cases, solutions, difficulty, visibility
6. **Institute Student Management** — view, verify, progress, complaints
7. **General User Management** — verify, status, abuse reports, institute applications
8. **Content Management** — pages, blogs, FAQs, banners, media, drafts
9. **SEO Management** — meta, sitemap, robots, redirects, structured data
10. **Configuration Management** — branding, auth policies, feature flags, retention
11. **Log & Audit Management** — app/system/error/auth/admin logs, retention
12. **Analytics** — registrations, growth, enrollment, revenue
13. **Workflow & Approvals** — pending approvals, institute applications
14. **Notification Management** — templates, delivery logs
15. **Support Tickets** — triage, assign, resolve
16. **Academic Operations** — platform-wide academic structures
17. **Certificate Management** — templates, issuance rules
18. **File & Document Management** — uploads, storage, retention
19. **Integration & API** — API keys, webhooks, Judge0
20. **Security & Compliance** — policies, audit, data export/deletion
21. **Backup & Recovery** — backups, restore, retention
22. **System Monitoring** — health, performance, jobs
23. **Search Management** — indexing, search config
24. **Feedback & Reviews** — ratings, feedback moderation
25. **Billing & Subscriptions** — plans, transactions (if monetization)
26. **Help Center** — documentation, knowledge base
27. **Feature & Release** — feature flags, release notes

### Institute Admin Modules
1. **Dashboard** — institute metrics, pending tasks
2. **Institute Profile** — info, branding, documents, verification
3. **Student Management** — register, admit, assign courses, suspend
4. **Course Management** — CRUD, modules, lessons, enroll, publish
5. **Instructor & Staff** — invite, roles, course assignments
6. **Institute Content** — announcements, resources, FAQs
7. **Academic Management** — years, semesters, batches, timetable, attendance, grades
8. **Institute Reports** — registrations, enrollment, completion, assessment
9. **Institute Settings** — preferences, limits, audit history

### Institute Student Modules
1. **Dashboard** — welcome, courses, progress, deadlines
2. **Profile** — info, password, notifications, privacy
3. **Institute Info** — details, branches, instructors, calendar
4. **Learning** — courses, modules, lessons, resources, assignments, quizzes
5. **Problem Practice** — browse, filter, submit, track
6. **Academic Records** — attendance, grades, enrollment, certificates
7. **Communication** — announcements, notifications, tickets

### General User Modules
1. **Registration & Auth** — self-register, verify, login, recovery, MFA
2. **Course Discovery** — browse, search, preview, enroll, progress
3. **Problem Practice** — browse, submit, history, stats
4. **Personal Learning** — saved courses, bookmarks, history, achievements
5. **Institute Membership** — browse, apply, track, accept invitation

---

## 4. Role-Permission Matrix

| Permission | Super Admin | Institute Admin | Institute Student | General User |
|-----------|:-----------:|:---------------:|:-----------------:|:------------:|
| users.view | ✓ (all) | ✓ (institute) | ✗ | ✗ |
| users.create | ✓ | ✓ (institute) | ✗ | ✗ |
| users.update | ✓ | ✓ (institute) | ✓ (self) | ✓ (self) |
| users.suspend | ✓ | ✓ (institute) | ✗ | ✗ |
| users.delete | ✓ | ✗ | ✗ | ✗ |
| institutes.view | ✓ (all) | ✓ (own) | ✓ (own) | ✓ (directory) |
| institutes.create | ✓ | ✗ | ✗ | ✗ |
| institutes.approve | ✓ | ✗ | ✗ | ✗ |
| institutes.update | ✓ | ✓ (own, limited) | ✗ | ✗ |
| students.view | ✓ | ✓ (institute) | ✗ | ✗ |
| students.admit | ✓ | ✓ (institute) | ✗ | ✗ |
| students.enroll | ✓ | ✓ (institute) | ✗ | ✗ |
| courses.view | ✓ (all) | ✓ (institute) | ✓ (enrolled) | ✓ (public) |
| courses.create | ✓ | ✓ (institute) | ✗ | ✗ |
| courses.publish | ✓ | ✓ (if permitted) | ✗ | ✗ |
| problems.view | ✓ (all) | ✓ (institute) | ✓ (authorized) | ✓ (public) |
| problems.create | ✓ | ✓ (institute) | ✗ | ✗ |
| content.publish | ✓ | ✓ (institute, limited) | ✗ | ✗ |
| configuration.manage | ✓ | ✗ | ✗ | ✗ |
| logs.view | ✓ | ✓ (institute, limited) | ✗ | ✗ |
| reports.export | ✓ | ✓ (institute) | ✓ (self) | ✓ (self) |
| certificates.view | ✓ | ✓ (institute) | ✓ (own) | ✓ (own) |
| certificates.issue | ✓ | ✓ (institute) | ✗ | ✗ |
| tickets.view | ✓ (all) | ✓ (institute) | ✓ (own) | ✓ (own) |
| tickets.manage | ✓ | ✓ (institute) | ✗ | ✗ |
| analytics.view | ✓ (global) | ✓ (institute) | ✗ | ✗ |
| audit.view | ✓ | ✓ (institute) | ✗ | ✗ |

**Deny-by-default**: any permission not explicitly granted is denied.

---

## 5. Database Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────────┐
│  users      │       │ platform_roles   │       │  permissions    │
│─────────────│       │──────────────────│       │─────────────────│
│ id (PK)     │──┐    │ id (PK)          │       │ id (PK)         │
│ email       │  └───>│ user_id (FK)     │       │ name            │
│ password    │       │ role_id (FK)     │       │ description     │
│ name        │       └──────────────────┘       └─────────────────┘
│ role        │              │                          │
│ tenant_id   │              │                          │
│ is_active   │              │                          │
└─────────────┘              │                          │
        │                    │                          │
        │              ┌──────────────────┐            │
        │              │ role_permissions │            │
        │              │──────────────────│            │
        │              │ role_id (FK)     │────────────┘
        │              │ permission_id(FK)│
        │              └──────────────────┘
        │
        │       ┌─────────────────────┐
        └──────>│ institute_memberships│
                │─────────────────────│
                │ user_id (FK)        │
                │ institute_id (FK)   │
                │ institute_role_id(FK)│
                │ status              │
                └─────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
┌───────────────┐               ┌──────────────────┐
│  institutes   │               │ institute_roles  │
│───────────────│               │──────────────────│
│ id (PK)       │               │ id (PK)          │
│ name          │               │ name             │
│ slug          │               │ institute_id(FK) │
│ status        │               │ permissions      │
│ plan          │               └──────────────────┘
│ is_active     │
└───────────────┘
        │
        ├──> institute_branches
        ├──> institute_departments
        ├──> institute_documents
        ├──> admissions ──────────> (approval workflow)
        ├──> academic_years
        ├──> semesters
        ├──> batches
        ├──> classes
        ├──> attendance
        └──> certificates

┌───────────────┐       ┌──────────────────┐
│  courses      │       │ course_enrollments│
│───────────────│       │──────────────────│
│ id (PK)       │──┐    │ user_id (FK)     │
│ tenant_id     │  └───>│ course_id (FK)   │
│ title         │       │ status           │
│ status        │       │ progress         │
└───────────────┘       └──────────────────┘
        │
        ├──> course_modules
        │        └──> course_lessons
        ├──> course_resources
        ├──> course_instructors
        ├──> assignments ──> assignment_submissions
        └──> assessments ──> assessment_questions

┌───────────────┐       ┌──────────────────┐
│  problems     │       │ problem_submissions│
│───────────────│       │──────────────────│
│ id (PK)       │──┐    │ user_id (FK)     │
│ tenant_id     │  └───>│ problem_id (FK)  │
│ title         │       │ verdict          │
│ difficulty    │       │ score            │
│ scope         │       └──────────────────┘
└───────────────┘
        ├──> problem_categories
        ├──> problem_topics
        ├──> problem_test_cases
        └──> problem_solutions

┌───────────────┐       ┌──────────────────┐
│ content_pages │       │  blog_posts      │
│ media_assets  │       │  seo_metadata    │
│ redirects     │       │  notifications   │
│ support_tickets│      │  audit_logs      │
│ certificates  │       │  activity_events │
│ subscriptions │       │  payment_transactions│
└───────────────┘       └──────────────────┘
```

---

## 6. User Registration & Membership Workflows

### General User Registration
1. `POST /api/v1/auth/register` — creates user with `role='general_student'`
2. Email verification token generated & sent
3. `GET /api/v1/auth/verify-email?token=...` — verifies account
4. User accesses `/dashboard` (General User dashboard)
5. User can browse public resources, apply to institutes

### Institute Registration
1. `POST /api/v1/institute-applications` — creates application record
2. Applicant uploads documents
3. Super Admin reviews: `POST /api/v1/super-admin/institute-applications/:id/approve`
4. On approval: institute created with `status='active'`, applicant invited as Institute Admin
5. Institute Admin accepts invitation, completes setup

### Student Admission
1. General User applies: `POST /api/v1/institutions/:id/admissions`
2. Application recorded with documents
3. Institute Admin reviews: `POST /api/v1/institutions/:id/admissions/:id/approve`
4. On approval: `institute_memberships` row created with `institute_role='student'`, `status='active'`
5. User's `tenant_id` set to institute, `role='institution_student'`
6. **No duplicate account created** — existing user account retained

### Institute Admin Invitation
1. Super Admin approves institute application
2. Super Admin invites admin: `POST /api/v1/super-admin/institutions/:id/invite-admin`
3. Invitation token sent via email
4. Recipient accepts: `POST /api/v1/institute-invitations/:token/accept`
5. Platform assigns `institution_admin` role scoped to institute

### Course Enrollment
1. User discovers course
2. Backend checks visibility, enrollment rules, prerequisites
3. `POST /api/v1/courses/:id/enroll` — creates enrollment record
4. User gains access per enrollment status
5. Progress & assessment results tracked

---

## 7. API Endpoint Specification

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Self-registration (general user) |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout |
| PATCH | `/api/v1/auth/change-password` | Change password |
| GET | `/api/v1/auth/me` | Current user profile |
| GET | `/api/v1/auth/verify-email` | Verify email |
| POST | `/api/v1/auth/forgot-password` | Request password reset |
| POST | `/api/v1/auth/reset-password` | Reset password with token |

### Users (Super Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List users (scoped) |
| GET | `/api/v1/users/:id` | Get user |
| POST | `/api/v1/users` | Create user |
| PATCH | `/api/v1/users/:id` | Update user |
| DELETE | `/api/v1/users/:id` | Soft-delete user |
| POST | `/api/v1/users/:id/suspend` | Suspend user |
| POST | `/api/v1/users/:id/activate` | Activate user |
| POST | `/api/v1/users/:id/reset-password` | Reset password |
| GET | `/api/v1/users/:id/sessions` | Login history |
| DELETE | `/api/v1/users/:id/sessions` | Revoke sessions |

### Institutes (Super Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tenants` | List institutes |
| POST | `/api/v1/tenants` | Create institute |
| GET | `/api/v1/tenants/:id` | Institute detail |
| PATCH | `/api/v1/tenants/:id` | Update institute |
| DELETE | `/api/v1/tenants/:id` | Soft-delete |
| POST | `/api/v1/tenants/:id/suspend` | Suspend institute |
| POST | `/api/v1/tenants/:id/reactivate` | Reactivate |
| POST | `/api/v1/tenants/:id/invite-admin` | Invite institute admin |

### Institute Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/institute-applications` | Submit application |
| GET | `/api/v1/super-admin/institute-applications` | List pending (Super Admin) |
| POST | `/api/v1/super-admin/institute-applications/:id/approve` | Approve |
| POST | `/api/v1/super-admin/institute-applications/:id/reject` | Reject |

### Admissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/institutions/:id/admissions` | Apply to institute |
| GET | `/api/v1/institutions/:id/admissions` | List (Institute Admin) |
| POST | `/api/v1/institutions/:id/admissions/:id/approve` | Approve admission |
| POST | `/api/v1/institutions/:id/admissions/:id/reject` | Reject admission |
| GET | `/api/v1/my/admissions` | My applications (user) |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/courses` | List (public + enrolled) |
| GET | `/api/v1/courses/manage` | Manage list (admin) |
| POST | `/api/v1/courses` | Create course |
| GET | `/api/v1/courses/:id` | Course detail |
| PATCH | `/api/v1/courses/:id` | Update course |
| DELETE | `/api/v1/courses/:id` | Delete course |
| POST | `/api/v1/courses/:id/enroll` | Enroll |
| GET | `/api/v1/courses/:id/progress` | Progress |
| POST | `/api/v1/courses/:id/progress` | Update progress |

### Problems
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/problems` | List (scoped by visibility) |
| POST | `/api/v1/problems` | Create problem |
| GET | `/api/v1/problems/:id` | Problem detail |
| PATCH | `/api/v1/problems/:id` | Update problem |
| DELETE | `/api/v1/problems/:id` | Delete problem |
| GET | `/api/v1/problems/:id/test-cases` | Test cases |
| POST | `/api/v1/problems/:id/test-cases` | Add test case |

### Submissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/submissions` | Submit solution |
| POST | `/api/v1/submissions/run` | Run code (Judge0) |
| GET | `/api/v1/submissions/:id` | Submission detail |
| GET | `/api/v1/submissions/problem/:id` | History for problem |

### Content (Super Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/content/pages` | List pages |
| POST | `/api/v1/content/pages` | Create page |
| PATCH | `/api/v1/content/pages/:id` | Update page |
| DELETE | `/api/v1/content/pages/:id` | Delete page |
| GET | `/api/v1/content/banners` | List banners |
| POST | `/api/v1/content/banners` | Create banner |

### SEO (Super Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/seo/settings` | Global SEO settings |
| PUT | `/api/v1/seo/settings` | Update global SEO |
| GET | `/api/v1/seo/redirects` | List redirects |
| POST | `/api/v1/seo/redirects` | Create redirect |
| GET | `/api/v1/seo/sitemap` | Generate sitemap |

### Configuration (Super Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/configuration` | Get all config |
| PUT | `/api/v1/configuration` | Update config |
| GET | `/api/v1/configuration/history` | Config change history |

### Logs & Audit (Super Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/logs/audit` | Audit logs |
| GET | `/api/v1/logs/application` | Application logs |
| GET | `/api/v1/logs/errors` | Error logs |
| GET | `/api/v1/logs/auth` | Auth logs |

### Support Tickets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tickets` | List tickets (scoped) |
| POST | `/api/v1/tickets` | Create ticket |
| GET | `/api/v1/tickets/:id` | Ticket detail |
| PATCH | `/api/v1/tickets/:id` | Update ticket |
| POST | `/api/v1/tickets/:id/reply` | Reply to ticket |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/notifications` | List notifications |
| PATCH | `/api/v1/notifications/mark-read` | Mark read |
| DELETE | `/api/v1/notifications/:id` | Delete notification |

### Academic (Institute Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/academic/years` | Academic years |
| POST | `/api/v1/academic/years` | Create year |
| GET | `/api/v1/academic/semesters` | Semesters |
| POST | `/api/v1/academic/semesters` | Create semester |
| GET | `/api/v1/academic/batches` | Batches |
| POST | `/api/v1/academic/batches` | Create batch |
| GET | `/api/v1/academic/attendance` | Attendance records |
| POST | `/api/v1/academic/attendance` | Record attendance |
| GET | `/api/v1/academic/grades` | Grades |
| POST | `/api/v1/academic/grades` | Record grade |

### Certificates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/certificates` | List certificates (scoped) |
| POST | `/api/v1/certificates` | Issue certificate |
| GET | `/api/v1/certificates/:id` | Certificate detail |
| GET | `/api/v1/certificates/:id/download` | Download PDF |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/analytics/overview` | Overview (scoped) |
| GET | `/api/v1/analytics/platform/overview` | Platform overview (Super Admin) |
| GET | `/api/v1/analytics/heatmap` | Activity heatmap |
| GET | `/api/v1/analytics/leaderboard` | Leaderboard |

---

## 8. Implementation Roadmap

### Phase 1: Architecture & Foundation ✅ (mostly complete)
- [x] Technology stack defined
- [x] Database schema (Drizzle)
- [x] Authentication (JWT + refresh)
- [x] Roles & permissions (RBAC)
- [x] Institute memberships (tenant_id)
- [x] Design system & layout

### Phase 2: Core Administration
- [ ] Super Admin portal (dashboard, users, institutions, courses, problems)
- [ ] User management (suspend, sessions, reset)
- [ ] Institute management (approve, suspend, invite admin)
- [ ] Institute registration & approval workflow
- [ ] Audit trails & configuration

### Phase 3: Institute Operations
- [ ] Institute Admin portal
- [ ] Student admission & membership workflow
- [ ] Instructor & staff management
- [ ] Academic structures (years, semesters, batches, attendance, grades)

### Phase 4: Learning Platform
- [ ] Course management (modules, lessons, resources)
- [ ] Problem management (test cases, solutions)
- [ ] Student learning dashboards
- [ ] Assessments, submissions, certificates

### Phase 5: General User Experience
- [ ] Public website (catalog, blog, FAQ, contact)
- [ ] Self-registration & verification
- [ ] Course & problem discovery
- [ ] Public learning features
- [ ] Institute application workflow

### Phase 6: Supporting Modules
- [ ] Content management (pages, banners, media)
- [ ] SEO management (meta, sitemap, redirects)
- [ ] Notifications (templates, delivery)
- [ ] Support tickets
- [ ] Reporting & integrations

### Phase 7: Security & Production Readiness
- [ ] Role boundary tests
- [ ] Institute data isolation tests
- [ ] Account transition tests
- [ ] Failure recovery tests
- [ ] Backup & restore
- [ ] Security checks
- [ ] Deployment documentation

---

## 9. Feature-to-Test Traceability Matrix

| Feature | Unit Test | Integration Test | E2E Test | Acceptance Criteria |
|---------|:---------:|:----------------:|:--------:|---------------------|
| General user registration | ✓ | ✓ | ✓ | User created with general_student role |
| Email verification | ✓ | ✓ | ✓ | Token validates, account verified |
| Login/logout | ✓ | ✓ | ✓ | JWT issued, refresh rotated |
| Password reset | ✓ | ✓ | ✓ | Token expires, password changed |
| Super admin user management | ✓ | ✓ | ✓ | CRUD, suspend, sessions |
| Institute registration | ✓ | ✓ | ✓ | Application pending → approved |
| Institute approval (Super Admin) | ✓ | ✓ | ✓ | Institute active, admin invited |
| Institute admin scoped access | ✓ | ✓ | ✓ | Only own institute data |
| Student admission workflow | ✓ | ✓ | ✓ | Membership created, no duplicate account |
| Course enrollment | ✓ | ✓ | ✓ | Enrollment recorded, access granted |
| Problem submission | ✓ | ✓ | ✓ | Verdict recorded, stats updated |
| Assignment submission | ✓ | ✓ | ✓ | Status tracked, graded |
| Quiz attempt | ✓ | ✓ | ✓ | Score calculated, passed flag |
| Certificate issuance | ✓ | ✓ | ✓ | Certificate generated, downloadable |
| Content management | ✓ | ✓ | ✓ | Pages CRUD, publish/unpublish |
| SEO configuration | ✓ | ✓ | ✓ | Meta updated, sitemap generated |
| Notification delivery | ✓ | ✓ | ✓ | Notification created, marked read |
| Support ticket workflow | ✓ | ✓ | ✓ | Ticket created, replied, resolved |
| Audit logging | ✓ | ✓ | ✓ | Events recorded with actor/target |
| Role boundary enforcement | ✓ | ✓ | ✓ | Unauthorized access denied |
| Institute data isolation | ✓ | ✓ | ✓ | Cross-institute access blocked |
| Suspended account policy | ✓ | ✓ | ✓ | Access denied when suspended |
| Reports & exports | ✓ | ✓ | ✓ | Scoped to authorized data |

---

## 10. Security Architecture

### Authentication
- bcrypt password hashing (12 rounds)
- JWT access tokens (15min expiry) + httpOnly refresh cookies (7 days)
- Refresh token rotation on each use
- Account lockout after 5 failed attempts (15 min)
- Email verification required for registration

### Authorization
- Deny-by-default RBAC
- Institute-scoped query filtering (tenant_id)
- PostgreSQL RLS-ready session variables
- Super Admin privileges never granted via self-registration

### Data Protection
- No passwords/secrets in logs
- Soft-delete for audit retention
- Parameterized queries (SQL injection prevention)
- CORS whitelist, Helmet headers, rate limiting
- Zod validation on all inputs

### Audit
- All sensitive operations logged (actor, action, target, timestamp, institute, outcome, requestId)
- Immutable audit log table
- Configurable retention

---

## 11. Deployment & Operations

### Environment Variables
```
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
BCRYPT_ROUNDS=12
NODE_ENV=production
ALLOWED_ORIGINS=https://app.codeverse.io
JUDGE0_URL=https://judge0.com/api
```

### Migrations
- Drizzle migrations in `codemitra-db/migrations/`
- Seed data in `codemitra-db/seeds/`
- Bootstrap Super Admin via `npm run bootstrap-admin` (secure, not hardcoded)

### Backup & Recovery
- Daily pg_dump automated backups
- Point-in-time recovery via WAL archiving
- Restore procedure documented in `codemitra-db/README.md`

---

*Document version: 1.0 — Last updated: 2026-10-13*
