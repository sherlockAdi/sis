import { Body, Controller, Post, Route, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { findExistingUserByUsernameOrEmail, hashPassword } from '../../services/authService';
import { sendCredentialNotification } from '../../services/notificationService';
import { httpError } from '../../utils/httpErrors';

type PublicEmployerSignupResponse = {
  partner_id: number;
  partner_code: string | null;
  user_id: number | null;
  username: string;
  emailed: boolean;
  user_created: boolean;
  existing_user_used: boolean;
  auth_error?: string | null;
};

type PublicAssociatePartnerSignupResponse = {
  associate_partner_id: number;
  associate_partner_code: string | null;
  user_id: number | null;
  username: string;
  emailed: boolean;
  user_created: boolean;
  existing_user_used: boolean;
  auth_error?: string | null;
};

type PartnerRow = {
  partner_id: number;
  partner_code: string | null;
  partner_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
};

type AssociatePartnerRow = {
  associate_partner_id: number;
  associate_partner_code: string | null;
  associate_partner_name: string;
  primary_contact: string | null;
  email: string | null;
};

function toNull(value: string | null | undefined): string | null {
  const v = String(value ?? '').trim();
  return v ? v : null;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim());
}

function randomPassword(len = 10): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#%*';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

async function resolveRoleId(role_code: string, role_name: string, description: string): Promise<number> {
  const roleRows = await callProc<RowDataPacket & { role_id: number }>(
    `CALL sp_roles_get_by_code(:role_code)`,
    { role_code }
  );

  let role_id = roleRows[0]?.role_id;
  if (!role_id) {
    const created = await callProc<RowDataPacket & { role_id: number }>(
      `CALL sp_roles_create(:role_name, :role_code, :description, :status)`,
      {
        role_name,
        role_code,
        description,
        status: true,
      }
    );
    role_id = created[0]?.role_id;
  }

  if (!role_id) throw httpError(500, `Failed to resolve ${role_code} role`);
  return role_id;
}

const EMPLOYER_REGISTRATION_CC = ['mrsrivastava@neuralinfo.org'];
const ASSOCIATE_REGISTRATION_CC = ['mrsrivastava@neuralinfo.org'];

@Route('public')
@Tags('Public')
export class PublicPartnerRegistrationController extends Controller {
  @Post('employer-signup')
  public async employerSignup(
    @Body()
    body: {
      partner_code?: string | null;
      partner_name: string;
      contact_name?: string | null;
      phone?: string | null;
      email: string;
      address?: string | null;
      country_id?: number | null;
      state_id?: number | null;
      city_id?: number | null;
      alt_partner_name?: string | null;
      alt_phone?: string | null;
      alt_email?: string | null;
      organisation_name?: string | null;
      address2?: string | null;
      pin?: string | null;
      landline?: string | null;
      cr_licence_number?: string | null;
      website?: string | null;
      other_info?: string | null;
      status?: boolean | null;
    }
  ): Promise<PublicEmployerSignupResponse> {
    const partner_name = String(body.partner_name ?? '').trim();
    if (!partner_name) throw httpError(400, 'partner_name is required');

    const email = String(body.email ?? '').trim();
    if (!email) throw httpError(400, 'email is required');
    if (!isValidEmail(email)) throw httpError(400, 'email must be a valid email address');
    if (await findExistingUserByUsernameOrEmail('', email)) throw httpError(409, 'Email already registered');

    const rows = await callProc<RowDataPacket & { partner_id: number }>(
      `CALL sp_partners('CREATE', NULL, :partner_code, :partner_name, :contact_name, :phone, :email, :address, :country_id, :state_id, :city_id, :alt_partner_name, :alt_phone, :organisation_name, :address2, :pin, :landline, :cr_licence_number, :website, :other_info, NULL, :status, NULL)`,
      {
        partner_code: String(body.partner_code ?? '').trim() || null,
        partner_name,
        contact_name: body.contact_name ?? null,
        phone: body.phone ?? null,
        email,
        address: body.address ?? null,
        country_id: typeof body.country_id === 'number' ? body.country_id : null,
        state_id: typeof body.state_id === 'number' ? body.state_id : null,
        city_id: typeof body.city_id === 'number' ? body.city_id : null,
        alt_partner_name: body.alt_partner_name ?? null,
        alt_phone: body.alt_phone ?? null,
        alt_email: body.alt_email ?? null,
        organisation_name: body.organisation_name ?? null,
        address2: body.address2 ?? null,
        pin: body.pin ?? null,
        landline: body.landline ?? null,
        cr_licence_number: body.cr_licence_number ?? null,
        website: body.website ?? null,
        other_info: body.other_info ?? null,
        status: typeof body.status === 'boolean' ? body.status : true,
      }
    );

    const partner_id = rows[0]?.partner_id;
    if (!partner_id) throw httpError(500, 'Failed to create partner');

    const partnerRows = await callProc<RowDataPacket & PartnerRow>(
      `CALL sp_partners('GET', :partner_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { partner_id }
    );
    const partner = partnerRows[0];
    if (!partner) throw httpError(500, 'Partner created but not found');

    const username = partner.partner_code ?? `partner${partner_id}`;
    const role_id = await resolveRoleId('SOURCING', 'Sourcing Partner', 'Partner portal role');
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
          email: partner.email ?? email,
          phone: partner.phone ?? null,
          password_hash,
          status: true,
        }
      );
      user_id = userRows[0]?.user_id ?? null;
      user_created = Boolean(user_id);

      if (user_id) {
        await callProc(
          `CALL sp_partners('SET_USER', :partner_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :user_id, NULL, NULL)`,
          {
            partner_id,
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
    if (user_created && partner.email) {
      try {
        await sendCredentialNotification({
          recipient: {
            name: partner.partner_name,
            email: partner.email,
          },
          username,
          temporaryPassword: plainPassword,
          portalLabel: 'Employer Portal',
          cc: EMPLOYER_REGISTRATION_CC,
        });
        emailed = true;
      } catch {
        emailed = false;
      }
    }

    return { partner_id, partner_code: partner.partner_code ?? null, user_id, username, emailed, user_created, existing_user_used, auth_error };
  }

  @Post('associate-partner-signup')
  public async associatePartnerSignup(
    @Body()
    body: {
      associate_partner_code?: string | null;
      associate_partner_name: string;
      alt_associate_partner_name?: string | null;
      alt_email?: string | null;
      primary_contact?: string | null;
      alternate_contact?: string | null;
      email: string;
      organisation_name?: string | null;
      other_info?: string | null;
      address1?: string | null;
      address2?: string | null;
      pin?: string | null;
      landline?: string | null;
      country_id?: number | null;
      state_id?: number | null;
      city_id?: number | null;
      status?: boolean | null;
    }
  ): Promise<PublicAssociatePartnerSignupResponse> {
    const associate_partner_name = String(body.associate_partner_name ?? '').trim();
    if (!associate_partner_name) throw httpError(400, 'associate_partner_name is required');

    const email = String(body.email ?? '').trim();
    if (!email) throw httpError(400, 'email is required');
    if (!isValidEmail(email)) throw httpError(400, 'email must be a valid email address');
    if (await findExistingUserByUsernameOrEmail('', email)) throw httpError(409, 'Email already registered');

    const rows = await callProc<RowDataPacket & { associate_partner_id: number }>(
      `CALL sp_associate_partners('CREATE', NULL, :associate_partner_code, :associate_partner_name, :alt_associate_partner_name, :primary_contact, :alternate_contact, :email, :organisation_name, :address1, :address2, :pin, :landline, :country_id, :state_id, :city_id, NULL, :status, NULL, NULL, NULL, NULL)`,
      {
        associate_partner_code: String(body.associate_partner_code ?? '').trim() || null,
        associate_partner_name,
        alt_associate_partner_name: body.alt_associate_partner_name ?? null,
        alt_email: body.alt_email ?? null,
        primary_contact: body.primary_contact ?? null,
        alternate_contact: body.alternate_contact ?? null,
        email,
        organisation_name: body.organisation_name ?? null,
        other_info: body.other_info ?? null,
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
    const role_id = await resolveRoleId('ASSOCIATE', 'Associate Partner', 'Associate Partner portal role');
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
          email: associatePartner.email ?? email,
          phone: associatePartner.primary_contact ?? null,
          password_hash,
          status: true,
        }
      );
      user_id = userRows[0]?.user_id ?? null;
      user_created = Boolean(user_id);

      if (user_id) {
        await callProc(
          `CALL sp_associate_partners('SET_USER', :associate_partner_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :user_id, NULL, NULL, NULL, NULL, NULL)`,
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
    if (user_created && associatePartner.email) {
      try {
        await sendCredentialNotification({
          recipient: {
            name: associatePartner.associate_partner_name,
            email: associatePartner.email,
          },
          username,
          temporaryPassword: plainPassword,
          portalLabel: 'Associate Partner Portal',
          cc: ASSOCIATE_REGISTRATION_CC,
        });
        emailed = true;
      } catch {
        emailed = false;
      }
    }

    return { associate_partner_id, associate_partner_code: associatePartner.associate_partner_code ?? null, user_id, username, emailed, user_created, existing_user_used, auth_error };
  }
}
