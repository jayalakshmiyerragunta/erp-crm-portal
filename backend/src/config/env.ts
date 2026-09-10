import 'dotenv/config';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const config = {
  port: parseInt(process.env.PORT ?? '5000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  databaseUrl: requireEnv('DATABASE_URL'),
};
