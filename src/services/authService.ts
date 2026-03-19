import bcrypt from 'bcrypt';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { env } from '../config/env';
import { callProc, callProcSets } from '../db/proc';
import { signToken } from '../security/jwt';
import { httpError } from '../utils/httpErrors';

type UserRow = RowDataPacket & {
  user_id: number;
  role_id: number;
  username: string;
  password_hash: string | null;
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
