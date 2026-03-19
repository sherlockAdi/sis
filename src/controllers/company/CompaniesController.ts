import { Body, Controller, Delete, Get, Path, Post, Put, Query, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';
import { env } from '../../config/env';
import { sendSmtpMail } from '../../utils/smtpClient';
import { hashPassword } from '../../services/authService';
import { credentialsEmailText } from '../../utils/emailTemplates';

type CompanyRow = {
  company_id: number;
  company_code: string | null;
  company_name: string;
  country_id: number | null;
  country_name: string | null;
  state_id: number | null;
  state_name: string | null;
  city_id: number | null;
  city_name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  contact_person: string | null;
  user_id: number | null;
  status: 0 | 1;
  created_at: string;
};

type CompanyContactRow = {
  contact_id: number;
  company_id: number;
  name: string | null;
  designation: string | null;
  phone: string | null;
  email: string | null;
};

type CompanyDocumentRow = {
  id: number;
  company_id: number;
  document_name: string | null;
  file_path: string | null;
  uploaded_at: string;
};

function randomPassword(len = 10): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#%*';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

@Route('companies')
@Tags('Company')
export class CompaniesController extends Controller {
  @Get()
  @Security('jwt')
  public async list(@Query() include_inactive?: boolean): Promise<CompanyRow[]> {
    return callProc<RowDataPacket & CompanyRow>(
      `CALL sp_com_companies('LIST', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :include_inactive)`,
      { include_inactive: include_inactive === true }
    );
  }

  @Get('{companyId}')
  @Security('jwt')
  public async get(@Path() companyId: number): Promise<CompanyRow> {
    const rows = await callProc<RowDataPacket & CompanyRow>(
      `CALL sp_com_companies('GET', :company_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { company_id: companyId }
    );
    const company = rows[0];
    if (!company) throw httpError(404, 'Company not found');
    return company;
  }

  @Post()
  @Security('jwt')
  public async create(
    @Body()
    body: {
      company_name: string;
      country_id?: number | null;
      state_id?: number | null;
      city_id?: number | null;
      address?: string | null;
      phone?: string | null;
      email?: string | null;
      contact_person?: string | null;
      status?: boolean | null;
    }
  ): Promise<{ company_id: number; user_id: number; username: string; emailed: boolean }> {
    const company_name = String(body.company_name ?? '').trim();
    if (!company_name) throw httpError(400, 'company_name is required');

    const rows = await callProc<RowDataPacket & { company_id: number }>(
      `CALL sp_com_companies('CREATE', NULL, :company_name, :country_id, :state_id, :city_id, :address, :phone, :email, :contact_person, NULL, :status, NULL)`,
      {
        company_name,
        country_id: typeof body.country_id === 'number' ? body.country_id : null,
        state_id: typeof body.state_id === 'number' ? body.state_id : null,
        city_id: typeof body.city_id === 'number' ? body.city_id : null,
        address: body.address ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        contact_person: body.contact_person ?? null,
        status: typeof body.status === 'boolean' ? body.status : true
      }
    );
    const company_id = rows[0]?.company_id;
    if (!company_id) throw httpError(500, 'Failed to create company');

    // Load company_code/email
    const companyRows = await callProc<RowDataPacket & CompanyRow>(
      `CALL sp_com_companies('GET', :company_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { company_id }
    );
    const company = companyRows[0];
    if (!company) throw httpError(500, 'Company created but not found');

    const username = company.company_code ?? `co${company_id}`;

    // Ensure role exists
    let roleRows = await callProc<RowDataPacket & { role_id: number }>(
      `CALL sp_roles_get_by_code(:role_code)`,
      { role_code: 'COMPANY' }
    );
    let role_id = roleRows[0]?.role_id;
    if (!role_id) {
      const r = await callProc<RowDataPacket & { role_id: number }>(
        `CALL sp_roles_create(:role_name, :role_code, :description, :status)`,
        { role_name: 'Company', role_code: 'COMPANY', description: 'Company portal role', status: true }
      );
      role_id = r[0]?.role_id;
    }
    if (!role_id) throw httpError(500, 'Failed to resolve company role');

    // Create AUTH user with default password
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
          email: company.email ?? null,
          phone: company.phone ?? null,
          password_hash,
          status: true
        }
      );
      user_id = userRows[0]?.user_id;
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY') throw httpError(409, 'User already exists for this username/email');
      throw e;
    }
    if (!user_id) throw httpError(500, 'Failed to create company user');

    // Link company -> user
    await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_com_companies('UPDATE', :company_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :user_id, NULL, NULL)`,
      { company_id, user_id }
    );

    // Email credentials (best-effort)
    let emailed = false;
    if (company.email && env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      try {
        await sendSmtpMail(
          {
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_SECURE,
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
            from: env.SMTP_FROM || env.SMTP_USER
          },
          {
            to: company.email,
            subject: 'SIS Global Connect — Company portal credentials',
            text: credentialsEmailText({
              name: company.contact_person ?? company.company_name,
              username,
              temporaryPassword: plainPassword,
              portalLabel: 'Company',
            }),
          }
        );
        emailed = true;
      } catch {
        emailed = false;
      }
    }

    return { company_id, user_id, username, emailed };
  }

  @Put('{companyId}')
  @Security('jwt')
  public async update(
    @Path() companyId: number,
    @Body()
    body: Partial<{
      company_name: string;
      country_id: number | null;
      state_id: number | null;
      city_id: number | null;
      address: string | null;
      phone: string | null;
      email: string | null;
      contact_person: string | null;
      status: boolean | null;
    }>
  ): Promise<{ updated: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_com_companies('UPDATE', :company_id, :company_name, :country_id, :state_id, :city_id, :address, :phone, :email, :contact_person, NULL, :status, NULL)`,
      {
        company_id: companyId,
        company_name: body.company_name ?? null,
        country_id: typeof body.country_id === 'number' ? body.country_id : null,
        state_id: typeof body.state_id === 'number' ? body.state_id : null,
        city_id: typeof body.city_id === 'number' ? body.city_id : null,
        address: body.address ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        contact_person: body.contact_person ?? null,
        status: typeof body.status === 'boolean' ? body.status : null
      }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Company not found');
    return { updated: true };
  }

  @Delete('{companyId}')
  @Security('jwt')
  public async disable(@Path() companyId: number): Promise<{ disabled: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_com_companies('DISABLE', :company_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { company_id: companyId }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Company not found');
    return { disabled: true };
  }

  // ============================
  // Contacts
  // ============================

  @Get('{companyId}/contacts')
  @Security('jwt')
  public async listContacts(@Path() companyId: number): Promise<CompanyContactRow[]> {
    return callProc<RowDataPacket & CompanyContactRow>(
      `CALL sp_com_company_contacts('LIST_BY_COMPANY', NULL, :company_id, NULL, NULL, NULL, NULL)`,
      { company_id: companyId }
    );
  }

  @Post('{companyId}/contacts')
  @Security('jwt')
  public async createContact(
    @Path() companyId: number,
    @Body()
    body: { name?: string | null; designation?: string | null; phone?: string | null; email?: string | null }
  ): Promise<{ contact_id: number }> {
    const rows = await callProc<RowDataPacket & { contact_id: number }>(
      `CALL sp_com_company_contacts('CREATE', NULL, :company_id, :name, :designation, :phone, :email)`,
      {
        company_id: companyId,
        name: body.name ?? null,
        designation: body.designation ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null
      }
    );
    const contact_id = rows[0]?.contact_id;
    if (!contact_id) throw httpError(500, 'Failed to create contact');
    return { contact_id };
  }

  @Put('{companyId}/contacts/{contactId}')
  @Security('jwt')
  public async updateContact(
    @Path() companyId: number,
    @Path() contactId: number,
    @Body()
    body: Partial<{ name: string | null; designation: string | null; phone: string | null; email: string | null }>
  ): Promise<{ updated: true }> {
    // companyId is kept in route for clarity; proc updates by contact_id
    void companyId;
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_com_company_contacts('UPDATE', :contact_id, NULL, :name, :designation, :phone, :email)`,
      {
        contact_id: contactId,
        name: body.name ?? null,
        designation: body.designation ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null
      }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Contact not found');
    return { updated: true };
  }

  @Delete('{companyId}/contacts/{contactId}')
  @Security('jwt')
  public async deleteContact(@Path() companyId: number, @Path() contactId: number): Promise<{ deleted: true }> {
    void companyId;
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_com_company_contacts('DELETE', :contact_id, NULL, NULL, NULL, NULL, NULL)`,
      { contact_id: contactId }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Contact not found');
    return { deleted: true };
  }

  // ============================
  // Documents
  // ============================

  @Get('{companyId}/documents')
  @Security('jwt')
  public async listDocuments(@Path() companyId: number): Promise<CompanyDocumentRow[]> {
    return callProc<RowDataPacket & CompanyDocumentRow>(
      `CALL sp_com_company_documents('LIST_BY_COMPANY', NULL, :company_id, NULL, NULL)`,
      { company_id: companyId }
    );
  }

  @Put('{companyId}/documents')
  @Security('jwt')
  public async upsertDocument(
    @Path() companyId: number,
    @Body()
    body: { id?: number | null; document_name: string; file_path: string }
  ): Promise<{ id: number }> {
    const document_name = String(body.document_name ?? '').trim();
    const file_path = String(body.file_path ?? '').trim();
    if (!document_name) throw httpError(400, 'document_name is required');
    if (!file_path) throw httpError(400, 'file_path is required');

    const rows = await callProc<RowDataPacket & { id: number }>(
      `CALL sp_com_company_documents('UPSERT', :id, :company_id, :document_name, :file_path)`,
      {
        id: typeof body.id === 'number' ? body.id : null,
        company_id: companyId,
        document_name,
        file_path
      }
    );
    const id = rows[0]?.id;
    if (!id) throw httpError(500, 'Failed to save document');
    return { id };
  }
}
