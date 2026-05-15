import { Body, Controller, Delete, Get, Path, Post, Put, Query, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { env } from '../../config/env';
import { findExistingUserByUsernameOrEmail, hashPassword } from '../../services/authService';
import { httpError } from '../../utils/httpErrors';
import { sendSmtpMail } from '../../utils/smtpClient';
import { credentialsEmailHtml, credentialsEmailText } from '../../utils/emailTemplates';

type AssociatePartnerRow = {
  associate_partner_id: number;
  associate_partner_code: string | null;
  associate_partner_name: string;
  alt_associate_partner_name: string | null;
  primary_contact: string | null;
  alternate_contact: string | null;
  email: string | null;
  organisation_name: string | null;
  address1: string | null;
  address2: string | null;
  pin: string | null;
  landline: string | null;
  country_id: number | null;
  country_name?: string | null;
  state_id: number | null;
  state_name?: string | null;
  city_id: number | null;
  city_name?: string | null;
  user_id: number | null;
  username?: string | null;
  status: 0 | 1;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
};

function randomPassword(len = 10): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#%*';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

async function resolveAssociateRoleId(): Promise<number> {
  const roleRows = await callProc<RowDataPacket & { role_id: number }>(
    `CALL sp_roles_get_by_code(:role_code)`,
    { role_code: 'ASSOCIATE' }
  );

  let role_id = roleRows[0]?.role_id;
  if (!role_id) {
    const created = await callProc<RowDataPacket & { role_id: number }>(
      `CALL sp_roles_create(:role_name, :role_code, :description, :status)`,
      {
        role_name: 'Associate Partner',
        role_code: 'ASSOCIATE',
        description: 'Associate Partner portal role',
        status: true,
      }
    );
    role_id = created[0]?.role_id;
  }

  if (!role_id) throw httpError(500, 'Failed to resolve associate partner role');
  return role_id;
}

const REGISTRATION_CC = ['mrsrivastava@neuralinfo.org'];

@Route('associate-partners')
@Tags('Associate Partners')
export class AssociatePartnersController extends Controller {
  @Get()
  @Security('jwt')
  public async list(@Query() include_inactive?: boolean): Promise<AssociatePartnerRow[]> {
    return callProc<RowDataPacket & AssociatePartnerRow>(
      `CALL sp_associate_partners('LIST', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :include_inactive)`,
      { include_inactive: include_inactive === true }
    );
  }

  @Get('{associatePartnerId}')
  @Security('jwt')
  public async get(@Path() associatePartnerId: number): Promise<AssociatePartnerRow> {
    const rows = await callProc<RowDataPacket & AssociatePartnerRow>(
      `CALL sp_associate_partners('GET', :associate_partner_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { associate_partner_id: associatePartnerId }
    );
    const row = rows[0];
    if (!row) throw httpError(404, 'Associate partner not found');
    return row;
  }

  @Post()
  @Security('jwt')
  public async create(
    @Body()
    body: {
      associate_partner_code?: string | null;
      associate_partner_name: string;
      alt_associate_partner_name?: string | null;
      primary_contact?: string | null;
      alternate_contact?: string | null;
      email?: string | null;
      organisation_name?: string | null;
      address1?: string | null;
      address2?: string | null;
      pin?: string | null;
      landline?: string | null;
      country_id?: number | null;
      state_id?: number | null;
      city_id?: number | null;
      status?: boolean | null;
    }
  ): Promise<{
    associate_partner_id: number;
    user_id: number | null;
    username: string;
    emailed: boolean;
    user_created: boolean;
    existing_user_used: boolean;
    auth_error?: string | null;
  }> {
    const associate_partner_code = String(body.associate_partner_code ?? '').trim();
    const associate_partner_name = String(body.associate_partner_name ?? '').trim();
    if (!associate_partner_name) throw httpError(400, 'associate_partner_name is required');

    const email = String(body.email ?? '').trim();
    if (email && (await findExistingUserByUsernameOrEmail('', email))) {
      throw httpError(409, 'Email already registered');
    }

    const rows = await callProc<RowDataPacket & { associate_partner_id: number }>(
      `CALL sp_associate_partners('CREATE', NULL, :associate_partner_code, :associate_partner_name, :alt_associate_partner_name, :primary_contact, :alternate_contact, :email, :organisation_name, :address1, :address2, :pin, :landline, :country_id, :state_id, :city_id, NULL, :status, NULL, NULL, NULL, NULL)`,
      {
        associate_partner_code: associate_partner_code || null,
        associate_partner_name,
        alt_associate_partner_name: body.alt_associate_partner_name ?? null,
        primary_contact: body.primary_contact ?? null,
        alternate_contact: body.alternate_contact ?? null,
        email: body.email ?? null,
        organisation_name: body.organisation_name ?? null,
        address1: body.address1 ?? null,
        address2: body.address2 ?? null,
        pin: body.pin ?? null,
        landline: body.landline ?? null,
        country_id: typeof body.country_id === 'number' ? body.country_id : null,
        state_id: typeof body.state_id === 'number' ? body.state_id : null,
        city_id: typeof body.city_id === 'number' ? body.city_id : null,
        status: typeof body.status === 'boolean' ? body.status : true,
      }
    );

    const associate_partner_id = rows[0]?.associate_partner_id;
    if (!associate_partner_id) throw httpError(500, 'Failed to create associate partner');

    const partnerRows = await callProc<RowDataPacket & AssociatePartnerRow>(
      `CALL sp_associate_partners('GET', :associate_partner_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { associate_partner_id }
    );
    const associatePartner = partnerRows[0];
    if (!associatePartner) throw httpError(500, 'Associate partner created but not found');

    const username = associatePartner.associate_partner_code ?? `associate${associate_partner_id}`;
    const role_id = await resolveAssociateRoleId();
    const plainPassword = randomPassword(10);
    const password_hash = await hashPassword(plainPassword);

    let user_id: number | null = null;
    let user_created = false;
    const existing_user_used = false;
    let auth_error: string | null = null;

    try {
      const userRows = await callProc<RowDataPacket & { user_id: number }>(
        `CALL sp_users_create(:role_id, :first_name, :last_name, :username, :email, :phone, :password_hash, :status)`,
        {
          role_id,
          first_name: null,
          last_name: null,
          username,
          email: associatePartner.email ?? null,
          phone: associatePartner.primary_contact ?? null,
          password_hash,
          status: true,
        }
      );
      user_id = userRows[0]?.user_id ?? null;
      user_created = Boolean(user_id);

      if (user_id) {
        await callProc(
          `CALL sp_associate_partners('SET_USER', :associate_partner_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :user_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
          {
            associate_partner_id,
            user_id,
          }
        );
      }
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY') {
        auth_error = 'User already exists for this username/email';
      } else {
        auth_error = String(e?.message ?? 'Failed to create user');
      }
    }

    let emailed = false;
    if (user_created && associatePartner.email && env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
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
            to: associatePartner.email,
            cc: REGISTRATION_CC,
            subject: 'SIS Global Connect — Associate Partner Login',
            text: credentialsEmailText({
              name: associatePartner.associate_partner_name,
              username,
              temporaryPassword: plainPassword,
              portalLabel: 'Associate Partner Portal',
            }),
            html: credentialsEmailHtml({
              name: associatePartner.associate_partner_name,
              username,
              temporaryPassword: plainPassword,
              portalLabel: 'Associate Partner Portal',
            }),
          }
        );
        emailed = true;
      } catch {
        emailed = false;
      }
    }

    return { associate_partner_id, user_id, username, emailed, user_created, existing_user_used, auth_error };
  }

  @Put('{associatePartnerId}')
  @Security('jwt')
  public async update(
    @Path() associatePartnerId: number,
    @Body()
    body: {
      associate_partner_code?: string | null;
      associate_partner_name?: string | null;
      alt_associate_partner_name?: string | null;
      primary_contact?: string | null;
      alternate_contact?: string | null;
      email?: string | null;
      organisation_name?: string | null;
      address1?: string | null;
      address2?: string | null;
      pin?: string | null;
      landline?: string | null;
      country_id?: number | null;
      state_id?: number | null;
      city_id?: number | null;
      status?: boolean | null;
    }
  ): Promise<{ updated: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_associate_partners('UPDATE', :associate_partner_id, :associate_partner_code, :associate_partner_name, :alt_associate_partner_name, :primary_contact, :alternate_contact, :email, :organisation_name, :address1, :address2, :pin, :landline, :country_id, :state_id, :city_id, NULL, :status, NULL, NULL, NULL, NULL)`,
      {
        associate_partner_id: associatePartnerId,
        associate_partner_code: String(body.associate_partner_code ?? '').trim() || null,
        associate_partner_name: body.associate_partner_name ?? null,
        alt_associate_partner_name: body.alt_associate_partner_name ?? null,
        primary_contact: body.primary_contact ?? null,
        alternate_contact: body.alternate_contact ?? null,
        email: body.email ?? null,
        organisation_name: body.organisation_name ?? null,
        address1: body.address1 ?? null,
        address2: body.address2 ?? null,
        pin: body.pin ?? null,
        landline: body.landline ?? null,
        country_id: typeof body.country_id === 'number' ? body.country_id : null,
        state_id: typeof body.state_id === 'number' ? body.state_id : null,
        city_id: typeof body.city_id === 'number' ? body.city_id : null,
        status: typeof body.status === 'boolean' ? body.status : null,
      }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Associate partner not found');
    return { updated: true };
  }

  @Delete('{associatePartnerId}')
  @Security('jwt')
  public async disable(@Path() associatePartnerId: number): Promise<{ disabled: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_associate_partners('DELETE', :associate_partner_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { associate_partner_id: associatePartnerId }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Associate partner not found');
    return { disabled: true };
  }
}
