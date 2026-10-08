import bcrypt from 'bcrypt';
import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { signAccessToken, signRefreshToken, hashToken } from '../utils/jwt';
import { writeAuditLog } from '../utils/audit';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

export const authService = {
  async login(
    email: string,
    password: string,
    ipAddress: string,
    userAgent: string
  ) {
    const result = await pool.query(
      `SELECT id, tenant_id, email, password_hash, name, role,
              is_active, is_email_verified, login_attempt_count, locked_until
       FROM users WHERE email = $1 AND is_deleted = FALSE LIMIT 1`,
      [email.toLowerCase()]
    );
    const user = result.rows[0];
    if (!user) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

    // Check account lock
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const retryAfter = Math.ceil(
        (new Date(user.locked_until).getTime() - Date.now()) / 60000
      );
      throw new AppError(
        423,
        'ACCOUNT_LOCKED',
        `Account locked. Retry after ${retryAfter} minutes`
      );
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      await pool.query(
        `UPDATE users SET login_attempt_count = login_attempt_count + 1,
          locked_until = CASE WHEN login_attempt_count + 1 >= 5
            THEN NOW() + INTERVAL '15 minutes' ELSE locked_until END,
          updated_at = NOW()
         WHERE id = $1`,
        [user.id]
      );
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    if (!user.is_active) throw new AppError(403, 'ACCOUNT_DISABLED', 'Account is disabled');

    // Reset failed attempts + last login
    await pool.query(
      `UPDATE users SET last_login_at = NOW(), login_attempt_count = 0,
       locked_until = NULL, updated_at = NOW() WHERE id = $1`,
      [user.id]
    );

    const accessToken = signAccessToken({
      sub: user.id,
      tenantId: user.tenant_id,
      role: user.role,
      email: user.email,
    });
    const refreshData = signRefreshToken();

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4::INET, $5)`,
      [user.id, refreshData.hash, refreshData.expiresAt, ipAddress, userAgent]
    );

    await writeAuditLog({
      userId: user.id,
      tenantId: user.tenant_id,
      action: 'user.login',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      accessToken,
      refreshToken: refreshData.raw,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
      },
    };
  },

  async refresh(rawRefreshToken: string, ipAddress: string) {
    const tokenHash = hashToken(rawRefreshToken);
    const result = await pool.query(
      `SELECT rt.id, rt.user_id, rt.expires_at, u.role, u.tenant_id, u.email, u.is_active
       FROM refresh_tokens rt JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1 AND rt.is_revoked = FALSE AND rt.expires_at > NOW()
         AND u.is_deleted = FALSE LIMIT 1`,
      [tokenHash]
    );
    const token = result.rows[0];
    if (!token) throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired refresh token');
    if (!token.is_active) throw new AppError(403, 'ACCOUNT_DISABLED', 'Account is disabled');

    // Rotate: revoke old, issue new
    await pool.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE id = $1', [token.id]);
    const newRefresh = signRefreshToken();
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address)
       VALUES ($1, $2, $3, $4::INET)`,
      [token.user_id, newRefresh.hash, newRefresh.expiresAt, ipAddress]
    );

    const accessToken = signAccessToken({
      sub: token.user_id,
      tenantId: token.tenant_id,
      role: token.role,
      email: token.email,
    });

    return { accessToken, refreshToken: newRefresh.raw };
  },

  async logout(rawRefreshToken: string): Promise<void> {
    const hash = hashToken(rawRefreshToken);
    await pool.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_hash = $1', [hash]);
  },

  async register(email: string, password: string, name: string) {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role, is_email_verified)
       VALUES ($1, $2, $3, 'general_student', FALSE)
       RETURNING id, email, name, role`,
      [email.toLowerCase(), passwordHash, name]
    );
    return result.rows[0];
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );
    const user = result.rows[0];
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) throw new AppError(400, 'INVALID_PASSWORD', 'Current password is incorrect');

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, userId]
    );
    // Revoke all sessions on password change
    await pool.query(
      'UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1',
      [userId]
    );
  },
};
