import { createPool } from 'mysql2/promise';
import { env } from '../config/env';

export const pool = createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  charset: 'utf8mb4',
  connectionLimit: 10,
  namedPlaceholders: true
});

pool.on('connection', (conn) => {
  void conn.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
});
