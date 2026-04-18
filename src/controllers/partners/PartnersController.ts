import { Body, Controller, Delete, Get, Path, Post, Put, Query, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';
import { env } from '../../config/env';
import { sendSmtpMail } from '../../utils/smtpClient';
import { findExistingUserByUsernameOrEmail, hashPassword } from '../../services/authService';
import { credentialsEmailText } from '../../utils/emailTemplates';

type PartnerRow = {
  partner_id: number;
  partner_code: string | null;
  partner_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  country_id?: number | null;
  country_name?: string | null;
  state_id?: number | null;
  state_name?: string | null;
  city_id?: number | null;
  city_name?: string | null;
  alt_partner_name?: string | null;
  alt_phone?: string | null;
  organisation_name?: string | null;
  address2?: string | null;
  pin?: string | null;
  landline?: string | null;
  user_id: number | null;
  username?: string | null;
  status: 0 | 1;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
};

function randomPassword(len = 10): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#%*';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

@Route('partners')
@Tags('Partners')
export class PartnersController extends Controller {
  @Get()
  @Security('jwt')
  public async list(@Query() include_inactive?: boolean): Promise<PartnerRow[]> {
    return callProc<RowDataPacket & PartnerRow>(
      `CALL sp_partners('LIST', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :include_inactive)`,
      { include_inactive: include_inactive === true }
    );
  }

  @Get('{partnerId}')
  @Security('jwt')
  public async get(@Path() partnerId: number): Promise<PartnerRow> {
    const rows = await callProc<RowDataPacket & PartnerRow>(
      `CALL sp_partners('GET', :partner_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { partner_id: partnerId }
    );
    const partner = rows[0];
    if (!partner) throw httpError(404, 'Partner not found');
    return partner;
  }

  @Post()
  @Security('jwt')
  public async create(
    @Body()
    body: {
      partner_code?: string | null;
      partner_name: string;
      contact_name?: string | null;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
      country_id?: number | null;
      state_id?: number | null;
      city_id?: number | null;
      alt_partner_name?: string | null;
      alt_phone?: string | null;
      organisation_name?: string | null;
      address2?: string | null;
      pin?: string | null;
      landline?: string | null;
      status?: boolean | null;
    }
  ): Promise<{ partner_id: number; user_id: number | null; username: string; emailed: boolean; user_created: boolean; existing_user_used: boolean; auth_error?: string | null }> {
    const partner_code = String(body.partner_code ?? '').trim();
    const partner_name = String(body.partner_name ?? '').trim();
    if (!partner_name) throw httpError(400, 'partner_name is required');
    const email = String(body.email ?? '').trim();
    if (email) {
      if (await findExistingUserByUsernameOrEmail('', email)) throw httpError(409, 'Email already registered');
    }

    const rows = await callProc<RowDataPacket & { partner_id: number }>(
      `CALL sp_partners('CREATE', NULL, :partner_code, :partner_name, :contact_name, :phone, :email, :address, :country_id, :state_id, :city_id, :alt_partner_name, :alt_phone, :organisation_name, :address2, :pin, :landline, NULL, :status, NULL)`,
      {
        partner_code: partner_code || null,
        partner_name,
        contact_name: body.contact_name ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        address: body.address ?? null,
        country_id: typeof body.country_id === 'number' ? body.country_id : null,
        state_id: typeof body.state_id === 'number' ? body.state_id : null,
        city_id: typeof body.city_id === 'number' ? body.city_id : null,
        alt_partner_name: body.alt_partner_name ?? null,
        alt_phone: body.alt_phone ?? null,
        organisation_name: body.organisation_name ?? null,
        address2: body.address2 ?? null,
        pin: body.pin ?? null,
        landline: body.landline ?? null,
        status: typeof body.status === 'boolean' ? body.status : true
      }
    );
    const partner_id = rows[0]?.partner_id;
    if (!partner_id) throw httpError(500, 'Failed to create partner');

    const partnerRows = await callProc<RowDataPacket & PartnerRow>(
      `CALL sp_partners('GET', :partner_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { partner_id }
    );
    const partner = partnerRows[0];
    if (!partner) throw httpError(500, 'Partner created but not found');

    const username = partner.partner_code ?? `partner${partner_id}`;

    let roleRows = await callProc<RowDataPacket & { role_id: number }>(
      `CALL sp_roles_get_by_code(:role_code)`,
      { role_code: 'SOURCING' }
    );
    let role_id = roleRows[0]?.role_id;
    if (!role_id) {
      const r = await callProc<RowDataPacket & { role_id: number }>(
        `CALL sp_roles_create(:role_name, :role_code, :description, :status)`,
        { role_name: 'Sourcing Partner', role_code: 'SOURCING', description: 'Partner portal role', status: true }
      );
      role_id = r[0]?.role_id;
    }
    const plainPassword = randomPassword(10);
    const password_hash = await hashPassword(plainPassword);

    let user_id: number | null = null;
    let user_created = false;
    const existing_user_used = false;
    let auth_error: string | null = null;
    if (role_id) {
      try {
        const userRows = await callProc<RowDataPacket & { user_id: number }>(
          `CALL sp_users_create(:role_id, :first_name, :last_name, :username, :email, :phone, :password_hash, :status)`,
          {
            role_id,
            first_name: null,
            last_name: null,
            username,
            email: partner.email ?? null,
            phone: partner.phone ?? null,
            password_hash,
            status: true
          }
        );
        user_id = userRows[0]?.user_id ?? null;
        user_created = Boolean(user_id);
      } catch (e: any) {
        if (e?.code === 'ER_DUP_ENTRY') {
          auth_error = 'User already exists for this username/email';
        } else {
          auth_error = String(e?.message ?? 'Failed to create user');
        }
      }
    } else {
      auth_error = 'Partner role is not configured';
    }

    let emailed = false;
    if (user_created && partner.email && env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      try {
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
            to: partner.email,
            subject: 'SIS Global Connect — Partner Login',
            text: credentialsEmailText({
              name: partner.partner_name,
              username,
              temporaryPassword: plainPassword,
              portalLabel: 'Partner Portal',
            }),
          }
        );
        emailed = true;
      } catch {
        emailed = false;
      }
    }

    return { partner_id, user_id, username, emailed, user_created, existing_user_used, auth_error };
  }

  @Put('{partnerId}')
  @Security('jwt')
  public async update(
    @Path() partnerId: number,
    @Body()
    body: {
      partner_code?: string | null;
      partner_name?: string | null;
      contact_name?: string | null;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
      country_id?: number | null;
      state_id?: number | null;
      city_id?: number | null;
      alt_partner_name?: string | null;
      alt_phone?: string | null;
      organisation_name?: string | null;
      address2?: string | null;
      pin?: string | null;
      landline?: string | null;
      status?: boolean | null;
    }
  ): Promise<{ updated: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_partners('UPDATE', :partner_id, :partner_code, :partner_name, :contact_name, :phone, :email, :address, :country_id, :state_id, :city_id, :alt_partner_name, :alt_phone, :organisation_name, :address2, :pin, :landline, NULL, :status, NULL)`,
      {
        partner_id: partnerId,
        partner_code: String(body.partner_code ?? '').trim() || null,
        partner_name: body.partner_name ?? null,
        contact_name: body.contact_name ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        address: body.address ?? null,
        country_id: typeof body.country_id === 'number' ? body.country_id : null,
        state_id: typeof body.state_id === 'number' ? body.state_id : null,
        city_id: typeof body.city_id === 'number' ? body.city_id : null,
        alt_partner_name: body.alt_partner_name ?? null,
        alt_phone: body.alt_phone ?? null,
        organisation_name: body.organisation_name ?? null,
        address2: body.address2 ?? null,
        pin: body.pin ?? null,
        landline: body.landline ?? null,
        status: typeof body.status === 'boolean' ? body.status : null
      }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Partner not found');
    return { updated: true };
  }

  @Delete('{partnerId}')
  @Security('jwt')
  public async disable(@Path() partnerId: number): Promise<{ disabled: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_partners('DELETE', :partner_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { partner_id: partnerId }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Partner not found');
    return { disabled: true };
  }
}
