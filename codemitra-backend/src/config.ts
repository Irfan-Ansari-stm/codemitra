function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function validateRuntimeConfig(): void {
  const databaseUrl = required('DATABASE_URL');
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL');
  }
  if (!['postgres:', 'postgresql:'].includes(parsedUrl.protocol)) {
    throw new Error('DATABASE_URL must use the postgres or postgresql protocol');
  }

  const accessSecret = required('JWT_ACCESS_SECRET');
  const refreshSecret = required('JWT_REFRESH_SECRET');
  for (const [name, value] of [
    ['JWT_ACCESS_SECRET', accessSecret],
    ['JWT_REFRESH_SECRET', refreshSecret],
  ]) {
    if (value.length < 32 || /replace|example|your[_ -]?password/i.test(value)) {
      throw new Error(`${name} must be a unique, randomly generated secret of at least 32 characters`);
    }
  }
  if (accessSecret === refreshSecret) {
    throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different');
  }

  const poolMax = Number(process.env.DB_POOL_MAX || 20);
  if (!Number.isInteger(poolMax) || poolMax < 1 || poolMax > 100) {
    throw new Error('DB_POOL_MAX must be an integer between 1 and 100');
  }

  if (process.env.NODE_ENV === 'production') {
    const origins = (process.env.ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean);
    if (origins.length === 0 || origins.some((origin) => {
      try { return new URL(origin).protocol !== 'https:'; } catch { return true; }
    })) {
      throw new Error('Production ALLOWED_ORIGINS must contain valid trusted HTTPS origins');
    }
    if (parsedUrl.searchParams.get('sslmode') === 'disable') {
      throw new Error('Production DATABASE_URL must not disable TLS');
    }
  }
}
