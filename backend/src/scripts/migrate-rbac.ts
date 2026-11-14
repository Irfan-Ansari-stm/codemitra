import { pool } from '../db';

async function migrateRbac() {
  console.log('--- Starting RBAC Migration ---');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Create tables
    console.log('1. Creating RBAC tables...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        is_system BOOLEAN NOT NULL DEFAULT FALSE,
        isActive BOOLEAN NOT NULL DEFAULT TRUE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        module VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS role_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
      );

      CREATE TABLE IF NOT EXISTS user_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
      );
    `);

    // 2. Define permissions list
    console.log('2. Seeding permissions...');
    const permissionsList: Array<{ name: string; slug: string; module: string; action: string; description: string }> = [
      // Dashboard
      { name: 'View Dashboard', slug: 'dashboard.view', module: 'dashboard', action: 'view', description: 'Can view dashboard metrics and statistics' },
      { name: 'Export Dashboard Data', slug: 'dashboard.export', module: 'dashboard', action: 'export', description: 'Can export dashboard reports' },

      // Users
      { name: 'View Users', slug: 'users.view', module: 'users', action: 'view', description: 'Can view user list and profile details' },
      { name: 'Create Users', slug: 'users.create', module: 'users', action: 'create', description: 'Can create new users' },
      { name: 'Edit Users', slug: 'users.edit', module: 'users', action: 'edit', description: 'Can update user profiles and status' },
      { name: 'Delete Users', slug: 'users.delete', module: 'users', action: 'delete', description: 'Can delete user accounts' },
      { name: 'Suspend Users', slug: 'users.suspend', module: 'users', action: 'suspend', description: 'Can suspend and deactivate user accounts' },
      { name: 'Restore Users', slug: 'users.restore', module: 'users', action: 'restore', description: 'Can restore and reactivate user accounts' },
      { name: 'Assign User Roles', slug: 'users.assign', module: 'users', action: 'assign', description: 'Can assign roles and institutions to users' },
      { name: 'Export Users', slug: 'users.export', module: 'users', action: 'export', description: 'Can export user lists and reports' },

      // Roles
      { name: 'View Roles', slug: 'roles.view', module: 'roles', action: 'view', description: 'Can view platform roles' },
      { name: 'Create Roles', slug: 'roles.create', module: 'roles', action: 'create', description: 'Can create custom roles' },
      { name: 'Edit Roles', slug: 'roles.edit', module: 'roles', action: 'edit', description: 'Can update roles' },
      { name: 'Delete Roles', slug: 'roles.delete', module: 'roles', action: 'delete', description: 'Can delete custom roles' },
      { name: 'Assign Roles', slug: 'roles.assign', module: 'roles', action: 'assign', description: 'Can assign roles to users' },

      // Permissions
      { name: 'View Permissions', slug: 'permissions.view', module: 'permissions', action: 'view', description: 'Can view permissions matrix' },
      { name: 'Edit Permissions', slug: 'permissions.edit', module: 'permissions', action: 'edit', description: 'Can update permissions for roles' },
      { name: 'Assign Permissions', slug: 'permissions.assign', module: 'permissions', action: 'assign', description: 'Can assign permissions to roles' },

      // Institutions
      { name: 'View Institutions', slug: 'institutions.view', module: 'institutions', action: 'view', description: 'Can view institutions and tenants' },
      { name: 'Create Institutions', slug: 'institutions.create', module: 'institutions', action: 'create', description: 'Can register new institutions' },
      { name: 'Edit Institutions', slug: 'institutions.edit', module: 'institutions', action: 'edit', description: 'Can update institution details' },
      { name: 'Suspend Institutions', slug: 'institutions.suspend', module: 'institutions', action: 'suspend', description: 'Can suspend institution access' },
      { name: 'Restore Institutions', slug: 'institutions.restore', module: 'institutions', action: 'restore', description: 'Can reactivate suspended institutions' },
      { name: 'Approve Institutions', slug: 'institutions.approve', module: 'institutions', action: 'approve', description: 'Can approve institution onboarding applications' },
      { name: 'Reject Institutions', slug: 'institutions.reject', module: 'institutions', action: 'reject', description: 'Can reject institution onboarding applications' },
      { name: 'Manage Institutions', slug: 'institutions.manage', module: 'institutions', action: 'manage', description: 'Can fully manage institutions and configurations' },

      // Courses
      { name: 'View Courses', slug: 'courses.view', module: 'courses', action: 'view', description: 'Can view courses and learning content' },
      { name: 'Create Courses', slug: 'courses.create', module: 'courses', action: 'create', description: 'Can create new courses' },
      { name: 'Edit Courses', slug: 'courses.edit', module: 'courses', action: 'edit', description: 'Can modify courses, modules and chapters' },
      { name: 'Delete Courses', slug: 'courses.delete', module: 'courses', action: 'delete', description: 'Can delete courses' },
      { name: 'Publish Courses', slug: 'courses.publish', module: 'courses', action: 'publish', description: 'Can publish or archive courses' },

      // Problems
      { name: 'View Problems', slug: 'problems.view', module: 'problems', action: 'view', description: 'Can view problem bank' },
      { name: 'Create Problems', slug: 'problems.create', module: 'problems', action: 'create', description: 'Can create coding challenges' },
      { name: 'Edit Problems', slug: 'problems.edit', module: 'problems', action: 'edit', description: 'Can update coding challenges and test cases' },
      { name: 'Delete Problems', slug: 'problems.delete', module: 'problems', action: 'delete', description: 'Can delete coding challenges' },
      { name: 'Publish Problems', slug: 'problems.publish', module: 'problems', action: 'publish', description: 'Can publish coding challenges' },
      { name: 'Solve Problems', slug: 'problems.solve', module: 'problems', action: 'solve', description: 'Can run code and submit solutions' },

      // Assignments
      { name: 'View Assignments', slug: 'assignments.view', module: 'assignments', action: 'view', description: 'Can view assignments' },
      { name: 'Create Assignments', slug: 'assignments.create', module: 'assignments', action: 'create', description: 'Can create assignments' },
      { name: 'Edit Assignments', slug: 'assignments.edit', module: 'assignments', action: 'edit', description: 'Can modify assignments' },
      { name: 'Delete Assignments', slug: 'assignments.delete', module: 'assignments', action: 'delete', description: 'Can delete assignments' },
      { name: 'Submit Assignments', slug: 'assignments.submit', module: 'assignments', action: 'submit', description: 'Can submit assignments' },
      { name: 'Grade Assignments', slug: 'assignments.grade', module: 'assignments', action: 'grade', description: 'Can grade student assignments' },

      // Quizzes
      { name: 'View Quizzes', slug: 'quizzes.view', module: 'quizzes', action: 'view', description: 'Can view quizzes' },
      { name: 'Create Quizzes', slug: 'quizzes.create', module: 'quizzes', action: 'create', description: 'Can create quizzes' },
      { name: 'Edit Quizzes', slug: 'quizzes.edit', module: 'quizzes', action: 'edit', description: 'Can update quizzes' },
      { name: 'Delete Quizzes', slug: 'quizzes.delete', module: 'quizzes', action: 'delete', description: 'Can delete quizzes' },
      { name: 'Attempt Quizzes', slug: 'quizzes.attempt', module: 'quizzes', action: 'attempt', description: 'Can take quizzes' },
      { name: 'Grade Quizzes', slug: 'quizzes.grade', module: 'quizzes', action: 'grade', description: 'Can grade quiz attempts' },

      // Content & Blog
      { name: 'View Content', slug: 'content.view', module: 'content', action: 'view', description: 'Can view blog and marketing content' },
      { name: 'Create Content', slug: 'content.create', module: 'content', action: 'create', description: 'Can create blog articles and pages' },
      { name: 'Edit Content', slug: 'content.edit', module: 'content', action: 'edit', description: 'Can edit blog articles and pages' },
      { name: 'Delete Content', slug: 'content.delete', module: 'content', action: 'delete', description: 'Can delete blog articles and pages' },
      { name: 'Publish Content', slug: 'content.publish', module: 'content', action: 'publish', description: 'Can publish blog articles' },

      // Analytics
      { name: 'View Analytics', slug: 'analytics.view', module: 'analytics', action: 'view', description: 'Can view performance and usage analytics' },
      { name: 'Export Analytics', slug: 'analytics.export', module: 'analytics', action: 'export', description: 'Can export analytics reports' },

      // Notifications & Announcements
      { name: 'View Notifications', slug: 'notifications.view', module: 'notifications', action: 'view', description: 'Can view notifications' },
      { name: 'Create Notifications', slug: 'notifications.create', module: 'notifications', action: 'create', description: 'Can send platform notifications' },
      { name: 'Delete Notifications', slug: 'notifications.delete', module: 'notifications', action: 'delete', description: 'Can delete notifications' },

      // Support
      { name: 'View Support', slug: 'support.view', module: 'support', action: 'view', description: 'Can view support tickets' },
      { name: 'Create Support', slug: 'support.create', module: 'support', action: 'create', description: 'Can open support tickets' },
      { name: 'Edit Support', slug: 'support.edit', module: 'support', action: 'edit', description: 'Can respond to support tickets' },
      { name: 'Manage Support', slug: 'support.manage', module: 'support', action: 'manage', description: 'Can assign and resolve support tickets' },

      // Audit
      { name: 'View Audit Logs', slug: 'audit.view', module: 'audit', action: 'view', description: 'Can view audit history and login logs' },
      { name: 'Export Audit Logs', slug: 'audit.export', module: 'audit', action: 'export', description: 'Can export audit logs' },

      // Settings
      { name: 'View Settings', slug: 'settings.view', module: 'settings', action: 'view', description: 'Can view system and tenant settings' },
      { name: 'Edit Settings', slug: 'settings.edit', module: 'settings', action: 'edit', description: 'Can update system and tenant settings' },
    ];

    for (const p of permissionsList) {
      await client.query(`
        INSERT INTO permissions (name, slug, module, action, description)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          module = EXCLUDED.module,
          action = EXCLUDED.action,
          description = EXCLUDED.description,
          updated_at = NOW();
      `, [p.name, p.slug, p.module, p.action, p.description]);
    }

    // 3. Seed System Roles
    console.log('3. Seeding system roles...');
    const rolesList = [
      {
        name: 'Super Admin',
        slug: 'super_admin',
        description: 'Complete unrestricted control over the entire platform, tenants, users, roles, and configurations.',
        isSystem: true,
      },
      {
        name: 'Institution Admin',
        slug: 'institution_admin',
        description: 'Administrative access scoped to the institution tenant, managing students, faculty, and content.',
        isSystem: true,
      },
      {
        name: 'Institution Student',
        slug: 'institution_student',
        description: 'Enrolled student within an institution with access to courses, assignments, and coding problems.',
        isSystem: true,
      },
      {
        name: 'General Student',
        slug: 'general_student',
        description: 'Independent learner with access to public coding challenges and open courses.',
        isSystem: true,
      },
      {
        name: 'Instructor',
        slug: 'instructor',
        description: 'Course educator who designs modules, creates coding challenges, and grades assignments.',
        isSystem: false,
      },
      {
        name: 'Content Manager',
        slug: 'content_manager',
        description: 'Manages platform blogs, learning curricula, documentation, and SEO.',
        isSystem: false,
      },
      {
        name: 'Support Manager',
        slug: 'support_manager',
        description: 'Handles support requests, incident escalations, and user complaints.',
        isSystem: false,
      },
    ];

    for (const r of rolesList) {
      await client.query(`
        INSERT INTO roles (name, slug, description, is_system, is_active)
        VALUES ($1, $2, $3, $4, TRUE)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          is_system = EXCLUDED.is_system,
          updated_at = NOW();
      `, [r.name, r.slug, r.description, r.isSystem]);
    }

    // 4. Map Permissions to Roles
    console.log('4. Mapping role permissions...');
    const allPermsRes = await client.query('SELECT id, slug, module FROM permissions');
    const permMap = new Map<string, string>();
    allPermsRes.rows.forEach(p => permMap.set(p.slug, p.id));

    const roleRes = await client.query('SELECT id, slug FROM roles');
    const roleMap = new Map<string, string>();
    roleRes.rows.forEach(r => roleMap.set(r.slug, r.id));

    // Helper to assign perms
    const assignRolePerms = async (roleSlug: string, permSlugs: string[]) => {
      const roleId = roleMap.get(roleSlug);
      if (!roleId) return;
      for (const pSlug of permSlugs) {
        const permId = permMap.get(pSlug);
        if (permId) {
          await client.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES ($1, $2)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
          `, [roleId, permId]);
        }
      }
    };

    // Super Admin: gets all
    await assignRolePerms('super_admin', Array.from(permMap.keys()));

    // Institution Admin:
    await assignRolePerms('institution_admin', [
      'dashboard.view', 'dashboard.export',
      'users.view', 'users.create', 'users.edit', 'users.suspend', 'users.restore', 'users.assign', 'users.export',
      'courses.view', 'courses.create', 'courses.edit', 'courses.delete', 'courses.publish',
      'problems.view', 'problems.create', 'problems.edit', 'problems.delete', 'problems.publish', 'problems.solve',
      'assignments.view', 'assignments.create', 'assignments.edit', 'assignments.delete', 'assignments.grade',
      'quizzes.view', 'quizzes.create', 'quizzes.edit', 'quizzes.delete', 'quizzes.grade',
      'analytics.view', 'analytics.export',
      'notifications.view', 'notifications.create',
      'support.view', 'support.create',
      'settings.view', 'settings.edit',
    ]);

    // Institution Student:
    await assignRolePerms('institution_student', [
      'dashboard.view',
      'courses.view',
      'problems.view', 'problems.solve',
      'assignments.view', 'assignments.submit',
      'quizzes.view', 'quizzes.attempt',
      'analytics.view',
      'notifications.view',
      'support.view', 'support.create',
    ]);

    // General Student:
    await assignRolePerms('general_student', [
      'dashboard.view',
      'courses.view',
      'problems.view', 'problems.solve',
      'analytics.view',
      'notifications.view',
      'support.view', 'support.create',
    ]);

    // Instructor:
    await assignRolePerms('instructor', [
      'dashboard.view',
      'courses.view', 'courses.create', 'courses.edit',
      'problems.view', 'problems.create', 'problems.edit', 'problems.solve',
      'assignments.view', 'assignments.create', 'assignments.edit', 'assignments.grade',
      'quizzes.view', 'quizzes.create', 'quizzes.edit', 'quizzes.grade',
      'analytics.view',
      'notifications.view',
      'support.view', 'support.create',
    ]);

    // Content Manager:
    await assignRolePerms('content_manager', [
      'dashboard.view',
      'content.view', 'content.create', 'content.edit', 'content.delete', 'content.publish',
      'courses.view', 'courses.create', 'courses.edit',
      'problems.view', 'problems.create', 'problems.edit',
      'analytics.view',
      'notifications.view',
    ]);

    // Support Manager:
    await assignRolePerms('support_manager', [
      'dashboard.view',
      'support.view', 'support.create', 'support.edit', 'support.manage',
      'users.view',
      'notifications.view', 'notifications.create',
      'audit.view',
    ]);

    // 5. Sync existing users into user_roles
    console.log('5. Syncing existing users into user_roles...');
    const usersRes = await client.query('SELECT id, role FROM users');
    let syncedUsers = 0;
    for (const u of usersRes.rows) {
      const roleId = roleMap.get(u.role);
      if (roleId) {
        await client.query(`
          INSERT INTO user_roles (user_id, role_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, role_id) DO NOTHING;
        `, [u.id, roleId]);
        syncedUsers++;
      }
    }
    console.log(`Synced ${syncedUsers} existing users into user_roles.`);

    await client.query('COMMIT');
    console.log('--- RBAC Migration Completed Successfully! ---');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateRbac();
