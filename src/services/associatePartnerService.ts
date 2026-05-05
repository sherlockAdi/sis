import type { RowDataPacket } from 'mysql2/promise';
import { callProc, callProcSets } from '../db/proc';
import { getSelfProfile } from './authService';

export type AssociatePartnerRow = {
  associate_partner_id: number;
  associate_partner_code: string | null;
  associate_partner_name: string;
  primary_contact: string | null;
  alternate_contact: string | null;
  email: string | null;
  organisation_name: string | null;
  address1: string | null;
  address2: string | null;
  pin: string | null;
  landline: string | null;
  country_id: number | null;
  state_id: number | null;
  city_id: number | null;
  user_id: number | null;
  username?: string | null;
  status: 0 | 1;
  created_at: string;
};

export async function getAssociatePartnerByUserId(user_id: number): Promise<AssociatePartnerRow | null> {
  const rows = await callProc<RowDataPacket & AssociatePartnerRow>(
    `CALL sp_associate_partners('GET_BY_USER', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :user_id, NULL, NULL, NULL, NULL, NULL)`,
    { user_id }
  );
  return rows[0] ?? null;
}

function buildAssociatePartnerBootstrap(profile: {
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  username: string;
  email: string | null;
  phone: string | null;
}) {
  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
  return {
    associate_partner_name: displayName || profile.username,
    primary_contact: profile.phone || profile.username,
    email: profile.email ?? null,
    user_id: profile.user_id,
  };
}

export async function getOrCreateAssociatePartnerByUserId(user_id: number): Promise<AssociatePartnerRow | null> {
  const existing = await getAssociatePartnerByUserId(user_id);
  if (existing) return existing;

  const profile = await getSelfProfile(user_id);
  const bootstrap = buildAssociatePartnerBootstrap(profile);

  await callProc(
    `CALL sp_associate_partners('CREATE', NULL, NULL, :associate_partner_name, NULL, :primary_contact, NULL, :email, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :user_id, TRUE, NULL, NULL, NULL, NULL)`,
    bootstrap
  );

  return getAssociatePartnerByUserId(user_id);
}

export async function getRoleCodeForUserId(user_id: number): Promise<string> {
  const sets = await callProcSets(`CALL sp_auth_me(:user_id)`, { user_id });
  const userRow = sets?.[0]?.[0] as { role_code?: string | null } | undefined;
  return String(userRow?.role_code ?? '');
}
