import { Body, Controller, Delete, Get, Path, Post, Put, Query, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';
import { env } from '../../config/env';
import { sendSmtpMail } from '../../utils/smtpClient';
import { hashPassword } from '../../services/authService';
import { credentialsEmailText } from '../../utils/emailTemplates';

type PartnerRow = {
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
      `CALL sp_partners('LIST', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :include_inactive)`,
      { include_inactive: include_inactive === true }
    );
  }

  @Get('{partnerId}')
  @Security('jwt')
  public async get(@Path() partnerId: number): Promise<PartnerRow> {
    const rows = await callProc<RowDataPacket & PartnerRow>(
      `CALL sp_partners('GET', :partner_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
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
      partner_name: string;
      contact_name?: string | null;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
      status?: boolean | null;
    }
  ): Promise<{ partner_id: number; user_id: number; username: string; emailed: boolean }> {
    const partner_name = String(body.partner_name ?? '').trim();
    if (!partner_name) throw httpError(400, 'partner_name is required');

    const rows = await callProc<RowDataPacket & { partner_id: number }>(
      `CALL sp_partners('CREATE', NULL, :partner_name, :contact_name, :phone, :email, :address, NULL, :status, NULL)`,
      {
        partner_name,
        contact_name: body.contact_name ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        address: body.address ?? null,
        status: typeof body.status === 'boolean' ? body.status : true
      }
    );
    const partner_id = rows[0]?.partner_id;
    if (!partner_id) throw httpError(500, 'Failed to create partner');

    const partnerRows = await callProc<RowDataPacket & PartnerRow>(
      `CALL sp_partners('GET', :partner_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
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
    if (!role_id) throw httpError(500, 'Failed to resolve partner role');

    const plainPassword = randomPassword(10);
    const password_hash = await hashPassword(plainPassword);

    let user_id: number | undefined;
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
      user_id = userRows[0]?.user_id;
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY') throw httpError(409, 'User already exists for this username/email');
      throw e;
    }
    if (!user_id) throw httpError(500, 'Failed to create partner user');

    await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_partners('SET_USER', :partner_id, NULL, NULL, NULL, NULL, NULL, :user_id, NULL, NULL)`,
      { partner_id, user_id }
    );

    let emailed = false;
    if (partner.email && env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
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

    return { partner_id, user_id, username, emailed };
  }

  @Put('{partnerId}')
  @Security('jwt')
  public async update(
    @Path() partnerId: number,
    @Body()
    body: {
      partner_name?: string | null;
      contact_name?: string | null;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
      status?: boolean | null;
    }
  ): Promise<{ updated: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_partners('UPDATE', :partner_id, :partner_name, :contact_name, :phone, :email, :address, NULL, :status, NULL)`,
      {
        partner_id: partnerId,
        partner_name: body.partner_name ?? null,
        contact_name: body.contact_name ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        address: body.address ?? null,
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
      `CALL sp_partners('UPDATE', :partner_id, NULL, NULL, NULL, NULL, NULL, NULL, :status, NULL)`,
      { partner_id: partnerId, status: false }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Partner not found');
    return { disabled: true };
  }
}
