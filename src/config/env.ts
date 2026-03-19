import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 3000),

  DB_HOST: required('DB_HOST'),
  DB_PORT: Number(process.env.DB_PORT ?? 3306),
  DB_USER: required('DB_USER'),
  DB_PASSWORD: process.env.DB_PASSWORD ?? '',
  DB_NAME: required('DB_NAME'),

  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '1d',
  ALLOW_BOOTSTRAP: (process.env.ALLOW_BOOTSTRAP ?? 'false').toLowerCase() === 'true',

  // MinIO / S3 (optional; required only for document upload features)
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT ?? '',
  MINIO_PORT: Number(process.env.MINIO_PORT ?? 9000),
  MINIO_USE_SSL: (process.env.MINIO_USE_SSL ?? 'false').toLowerCase() === 'true',
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY ?? '',
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY ?? '',
  MINIO_BUCKET: process.env.MINIO_BUCKET ?? 'sis',

  // SMTP (optional; used to email auto-created credentials)
  SMTP_HOST: process.env.SMTP_HOST ?? '',
  SMTP_PORT: Number(process.env.SMTP_PORT ?? 465),
  SMTP_SECURE: (process.env.SMTP_SECURE ?? 'true').toLowerCase() === 'true',
  SMTP_USER: process.env.SMTP_USER ?? '',
  SMTP_PASS: process.env.SMTP_PASS ?? '',
  SMTP_FROM: process.env.SMTP_FROM ?? ''
};
