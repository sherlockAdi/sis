import bcrypt from 'bcrypt';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { env } from '../config/env';
import { callProc, callProcSets } from '../db/proc';
import { pool } from '../db/pool';
import { signToken } from '../security/jwt';
import { httpError } from '../utils/httpErrors';
import { sendSmtpMail } from '../utils/smtpClient';
import { otpEmailText } from '../utils/emailTemplates';

type UserRow = RowDataPacket & {
  user_id: number;
  role_id: number;
  username: string;
  password_hash: string | null;
  status: 0 | 1;
};

type UserForOtpRow = RowDataPacket & {
  user_id: number;
  role_id: number;
  username: string;
  email: string | null;
  status: 0 | 1;
};

export async function loginWithPassword(username: string, password: string): Promise<{ token: string }> {
  const rows = await callProc<UserRow>(`CALL sp_auth_get_user_for_login(:username)`, { username });

  const user = rows[0];
  if (!user) throw Object.assign(new Error('Invalid username or password'), { status: 401 });
  if (!user.status) throw Object.assign(new Error('User is disabled'), { status: 403 });
  if (!user.password_hash) throw Object.assign(new Error('User has no password set'), { status: 401 });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw Object.assign(new Error('Invalid username or password'), { status: 401 });

  await callProc(`CALL sp_auth_update_last_login(:user_id)`, { user_id: user.user_id });

  return {
    token: signToken({ user_id: user.user_id, role_id: user.role_id, username: user.username })
  };
}

function generateOtpCode(len = 6): string {
  let out = '';
  for (let i = 0; i < len; i++) out += String(Math.floor(Math.random() * 10));
  return out;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function toMysqlDateTime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

export async function requestLoginOtp(username: string): Promise<{ sent: true; to: string }> {
  const uname = String(username ?? '').trim();
  if (!uname) throw httpError(400, 'username is required');

  const [userRows] = await pool.query<UserForOtpRow[]>(
    `SELECT user_id, role_id, username, email, status
     FROM AUTH_U04_users
     WHERE username = :username
     LIMIT 1`,
    { username: uname },
  );

  const user = userRows[0];
  if (!user) throw httpError(404, 'User not found');
  if (!user.status) throw httpError(403, 'User is disabled');
  if (!user.email) throw httpError(400, 'No email is configured for this user');

  const otpType = 'login_email';

  const [lastRows] = await pool.query<RowDataPacket[]>(
    `SELECT created_at
     FROM AUTH_U05_user_otps
     WHERE user_id = :user_id AND otp_type = :otp_type
     ORDER BY otp_id DESC
     LIMIT 1`,
    { user_id: user.user_id, otp_type: otpType },
  );

  const lastCreatedAt = lastRows[0]?.created_at ? new Date(String(lastRows[0].created_at)) : null;
  if (lastCreatedAt && Date.now() - lastCreatedAt.getTime() < 30_000) {
    throw httpError(429, 'Please wait before requesting another OTP');
  }

  const otpCode = generateOtpCode(6);
  const expiresMinutes = 10;
  const expiresAt = toMysqlDateTime(addMinutes(new Date(), expiresMinutes));

  await pool.query<ResultSetHeader>(
    `INSERT INTO AUTH_U05_user_otps (user_id, contact, otp_code, otp_type, expires_at, is_verified)
     VALUES (:user_id, :contact, :otp_code, :otp_type, :expires_at, FALSE)`,
    {
      user_id: user.user_id,
      contact: user.email,
      otp_code: otpCode,
      otp_type: otpType,
      expires_at: expiresAt,
    },
  );

  await sendSmtpMail(
    {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
      from: env.SMTP_FROM,
    },
    {
      to: user.email,
      subject: 'SIS Global Connect — Login OTP',
      text: otpEmailText({ name: user.username, otpCode, expiresMinutes }),
    },
  );

  return { sent: true, to: user.email };
}

export async function loginWithOtp(username: string, otp: string): Promise<{ token: string }> {
  const uname = String(username ?? '').trim();
  const code = String(otp ?? '').trim();
  if (!uname) throw httpError(400, 'username is required');
  if (!code) throw httpError(400, 'otp is required');

  const [userRows] = await pool.query<UserForOtpRow[]>(
    `SELECT user_id, role_id, username, email, status
     FROM AUTH_U04_users
     WHERE username = :username
     LIMIT 1`,
    { username: uname },
  );
  const user = userRows[0];
  if (!user) throw httpError(404, 'User not found');
  if (!user.status) throw httpError(403, 'User is disabled');

  const otpType = 'login_email';

  const [otpRows] = await pool.query<RowDataPacket[]>(
    `SELECT otp_id
     FROM AUTH_U05_user_otps
     WHERE user_id = :user_id
       AND otp_type = :otp_type
       AND otp_code = :otp_code
       AND is_verified = FALSE
       AND expires_at > NOW()
     ORDER BY otp_id DESC
     LIMIT 1`,
    { user_id: user.user_id, otp_type: otpType, otp_code: code },
  );

  const otpId = otpRows[0]?.otp_id as number | undefined;
  if (!otpId) throw httpError(401, 'Invalid or expired OTP');

  await pool.query<ResultSetHeader>(
    `UPDATE AUTH_U05_user_otps SET is_verified = TRUE WHERE otp_id = :otp_id`,
    { otp_id: otpId },
  );

  await callProc(`CALL sp_auth_update_last_login(:user_id)`, { user_id: user.user_id });

  return {
    token: signToken({ user_id: user.user_id, role_id: user.role_id, username: user.username })
  };
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function bootstrapFirstAdmin(username: string, password: string): Promise<{ token: string }> {
  if (!env.ALLOW_BOOTSTRAP) throw httpError(403, 'Bootstrap disabled (set ALLOW_BOOTSTRAP=true)');

  const userCountRows = await callProc<RowDataPacket & { c: number }>(`CALL sp_bootstrap_user_count()`);
  if ((userCountRows[0]?.c ?? 0) > 0) throw httpError(409, 'Users already exist; bootstrap not allowed');

  const roleRows = await callProc<RowDataPacket & { role_id: number }>(`CALL sp_bootstrap_get_admin_role()`);

  let role_id = roleRows[0]?.role_id;
  if (!role_id) {
    const inserted = await callProc<RowDataPacket & { role_id: number }>(`CALL sp_bootstrap_create_admin_role()`);
    role_id = inserted[0]?.role_id;
    if (!role_id) throw httpError(500, 'Failed to create admin role');
  }

  const password_hash = await hashPassword(password);
  const userInserted = await callProc<RowDataPacket & { user_id: number }>(
    `CALL sp_bootstrap_create_admin_user(:role_id, :username, :password_hash)`,
    { role_id, username, password_hash }
  );
  const user_id = userInserted[0]?.user_id;
  if (!user_id) throw httpError(500, 'Failed to create admin user');

  return { token: signToken({ user_id, role_id, username }) };
}

export type SelfProfile = {
  user_id: number;
  role_id: number;
  first_name: string | null;
  last_name: string | null;
  username: string;
  email: string | null;
  phone: string | null;
  status: 0 | 1;
  last_login: string | null;
  created_at: string;
  role_name: string;
  role_code: string | null;
  role_description: string | null;
  role_status: 0 | 1;
};

export type SelfMenu = {
  menu_id: number;
  menu_name: string;
  menu_code: string | null;
  parent_menu_id: number | null;
  menu_path: string | null;
  icon: string | null;
  menu_order: number;
  status: 0 | 1;
  can_view: 0 | 1;
  can_add: 0 | 1;
  can_edit: 0 | 1;
  can_delete: 0 | 1;
};

export async function getSelfProfile(user_id: number): Promise<SelfProfile & { menus: SelfMenu[] }> {
  const sets = await callProcSets(`CALL sp_auth_me(:user_id)`, { user_id });
  const profile = (sets[0]?.[0] as (RowDataPacket & SelfProfile) | undefined) ?? undefined;
  if (!profile) throw httpError(404, 'User not found');

  const menus = ((sets[1] ?? []) as (RowDataPacket & SelfMenu)[]) ?? [];
  return { ...profile, menus };
}
