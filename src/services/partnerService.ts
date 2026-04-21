import type { RowDataPacket } from 'mysql2/promise';
import { callProc, callProcSets } from '../db/proc';

export type PartnerRow = {
  partner_id: number;
  partner_code: string | null;
  partner_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  user_id: number | null;
  username?: string | null;
  status: 0 | 1;
  created_at: string;
};

export async function getPartnerByUserId(user_id: number): Promise<PartnerRow | null> {
  const rows = await callProc<RowDataPacket & PartnerRow>(
    `CALL sp_partners('GET_BY_USER', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :user_id, NULL, NULL)`,
    { user_id }
  );
  return rows[0] ?? null;
}

export async function getRoleCodeForUserId(user_id: number): Promise<string> {
  const sets = await callProcSets(`CALL sp_auth_me(:user_id)`, { user_id });
  const userRow = sets?.[0]?.[0] as { role_code?: string | null } | undefined;
  return String(userRow?.role_code ?? '');
}
