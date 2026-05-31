import { Body, Controller, Get, Path, Post, Put, Query, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../../db/pool';
import { httpError } from '../../utils/httpErrors';

type LeadType = 'EMPLOYER' | 'ASSOCIATE' | 'UNDECIDED';
type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'CLOSED';

type LeadBody = {
  lead_type?: LeadType | null;
  organisation_name?: string | null;
  contact_name: string;
  phone?: string | null;
  email?: string | null;
  country_id?: number | null;
  state_id?: number | null;
  city_id?: number | null;
  address?: string | null;
  source?: string | null;
  status?: LeadStatus | null;
  notes?: string | null;
};

type LeadUpdateBody = Partial<LeadBody> & {
  converted_to_type?: 'EMPLOYER' | 'ASSOCIATE' | null;
  converted_partner_id?: number | null;
  converted_associate_partner_id?: number | null;
};

type LeadRow = {
  lead_id: number;
  lead_code: string | null;
  lead_type: LeadType;
  organisation_name: string | null;
  contact_name: string;
  phone: string | null;
  email: string | null;
  country_id: number | null;
  country_name?: string | null;
  state_id: number | null;
  state_name?: string | null;
  city_id: number | null;
  city_name?: string | null;
  address: string | null;
  source: string | null;
  status: LeadStatus;
  notes: string | null;
  converted_to_type: 'EMPLOYER' | 'ASSOCIATE' | null;
  converted_partner_id: number | null;
  converted_associate_partner_id: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

function clean(value: string | null | undefined): string | null {
  const out = String(value ?? '').trim();
  return out || null;
}

function normalizeLeadType(value: LeadType | null | undefined): LeadType {
  const type = String(value ?? 'UNDECIDED').trim().toUpperCase();
  if (type === 'EMPLOYER' || type === 'ASSOCIATE' || type === 'UNDECIDED') return type;
  return 'UNDECIDED';
}

function normalizeStatus(value: LeadStatus | null | undefined): LeadStatus {
  const status = String(value ?? 'NEW').trim().toUpperCase();
  if (status === 'NEW' || status === 'CONTACTED' || status === 'QUALIFIED' || status === 'CONVERTED' || status === 'CLOSED') return status;
  return 'NEW';
}

function validateLead(body: LeadBody): void {
  const contactName = clean(body.contact_name);
  const phone = clean(body.phone);
  const email = clean(body.email);
  if (!contactName) throw httpError(400, 'contact_name is required');
  if (!phone && !email) throw httpError(400, 'phone or email is required');
}

async function getLeadById(leadId: number): Promise<LeadRow | null> {
  const [rows] = await pool.query<(RowDataPacket & LeadRow)[]>(
    `SELECT l.*, c.country_name, s.state_name, ci.city_name
     FROM LDS_T01_partner_leads l
     LEFT JOIN LOC_M01_countries c ON c.country_id = l.country_id
     LEFT JOIN LOC_M02_states s ON s.state_id = l.state_id
     LEFT JOIN LOC_M03_cities ci ON ci.city_id = l.city_id
     WHERE l.lead_id = :lead_id AND l.deleted_at IS NULL
     LIMIT 1`,
    { lead_id: leadId }
  );
  return rows[0] ?? null;
}

async function createLead(body: LeadBody, defaultSource: string): Promise<LeadRow> {
  validateLead(body);
  const [result] = await pool.query<any>(
    `INSERT INTO LDS_T01_partner_leads (
       lead_type, organisation_name, contact_name, phone, email,
       country_id, state_id, city_id, address, source, status, notes
     ) VALUES (
       :lead_type, :organisation_name, :contact_name, :phone, :email,
       :country_id, :state_id, :city_id, :address, :source, :status, :notes
     )`,
    {
      lead_type: normalizeLeadType(body.lead_type),
      organisation_name: clean(body.organisation_name),
      contact_name: clean(body.contact_name),
      phone: clean(body.phone),
      email: clean(body.email),
      country_id: typeof body.country_id === 'number' ? body.country_id : null,
      state_id: typeof body.state_id === 'number' ? body.state_id : null,
      city_id: typeof body.city_id === 'number' ? body.city_id : null,
      address: clean(body.address),
      source: clean(body.source) ?? defaultSource,
      status: normalizeStatus(body.status),
      notes: clean(body.notes),
    }
  );
  const leadId = Number(result.insertId);
  await pool.query(
    `UPDATE LDS_T01_partner_leads
     SET lead_code = CONCAT('LEAD', LPAD(lead_id, 6, '0'))
     WHERE lead_id = :lead_id`,
    { lead_id: leadId }
  );
  const lead = await getLeadById(leadId);
  if (!lead) throw httpError(500, 'Lead created but not found');
  return lead;
}

@Route('leads')
@Tags('Leads')
export class LeadsController extends Controller {
  @Get()
  @Security('jwt')
  public async list(@Query() include_closed?: boolean, @Query() lead_type?: LeadType, @Query() status?: LeadStatus): Promise<LeadRow[]> {
    const where: string[] = ['l.deleted_at IS NULL'];
    const params: Record<string, any> = {};
    if (include_closed !== true) where.push(`l.status <> 'CLOSED'`);
    if (lead_type) {
      where.push('l.lead_type = :lead_type');
      params.lead_type = normalizeLeadType(lead_type);
    }
    if (status) {
      where.push('l.status = :status');
      params.status = normalizeStatus(status);
    }

    const [rows] = await pool.query<(RowDataPacket & LeadRow)[]>(
      `SELECT l.*, c.country_name, s.state_name, ci.city_name
       FROM LDS_T01_partner_leads l
       LEFT JOIN LOC_M01_countries c ON c.country_id = l.country_id
       LEFT JOIN LOC_M02_states s ON s.state_id = l.state_id
       LEFT JOIN LOC_M03_cities ci ON ci.city_id = l.city_id
       WHERE ${where.join(' AND ')}
       ORDER BY l.lead_id DESC`,
      params
    );
    return rows;
  }

  @Get('{leadId}')
  @Security('jwt')
  public async get(@Path() leadId: number): Promise<LeadRow> {
    const lead = await getLeadById(leadId);
    if (!lead) throw httpError(404, 'Lead not found');
    return lead;
  }

  @Post()
  @Security('jwt')
  public async create(@Body() body: LeadBody): Promise<LeadRow> {
    return createLead(body, 'Admin');
  }

  @Put('{leadId}')
  @Security('jwt')
  public async update(@Path() leadId: number, @Body() body: LeadUpdateBody): Promise<{ updated: true }> {
    const existing = await getLeadById(leadId);
    if (!existing) throw httpError(404, 'Lead not found');
    if (body.contact_name !== undefined || body.phone !== undefined || body.email !== undefined) {
      validateLead({
        contact_name: body.contact_name ?? existing.contact_name,
        phone: body.phone ?? existing.phone,
        email: body.email ?? existing.email,
      });
    }

    await pool.query(
      `UPDATE LDS_T01_partner_leads
       SET lead_type = :lead_type,
           organisation_name = :organisation_name,
           contact_name = :contact_name,
           phone = :phone,
           email = :email,
           country_id = :country_id,
           state_id = :state_id,
           city_id = :city_id,
           address = :address,
           source = :source,
           status = :status,
           notes = :notes,
           converted_to_type = :converted_to_type,
           converted_partner_id = :converted_partner_id,
           converted_associate_partner_id = :converted_associate_partner_id
       WHERE lead_id = :lead_id AND deleted_at IS NULL`,
      {
        lead_id: leadId,
        lead_type: normalizeLeadType(body.lead_type ?? existing.lead_type),
        organisation_name: body.organisation_name !== undefined ? clean(body.organisation_name) : existing.organisation_name,
        contact_name: body.contact_name !== undefined ? clean(body.contact_name) : existing.contact_name,
        phone: body.phone !== undefined ? clean(body.phone) : existing.phone,
        email: body.email !== undefined ? clean(body.email) : existing.email,
        country_id: body.country_id !== undefined ? body.country_id : existing.country_id,
        state_id: body.state_id !== undefined ? body.state_id : existing.state_id,
        city_id: body.city_id !== undefined ? body.city_id : existing.city_id,
        address: body.address !== undefined ? clean(body.address) : existing.address,
        source: body.source !== undefined ? clean(body.source) : existing.source,
        status: normalizeStatus(body.status ?? existing.status),
        notes: body.notes !== undefined ? clean(body.notes) : existing.notes,
        converted_to_type: body.converted_to_type !== undefined ? body.converted_to_type : existing.converted_to_type,
        converted_partner_id: body.converted_partner_id !== undefined ? body.converted_partner_id : existing.converted_partner_id,
        converted_associate_partner_id:
          body.converted_associate_partner_id !== undefined ? body.converted_associate_partner_id : existing.converted_associate_partner_id,
      }
    );
    return { updated: true };
  }

  @Put('{leadId}/close')
  @Security('jwt')
  public async close(@Path() leadId: number): Promise<{ updated: true }> {
    const existing = await getLeadById(leadId);
    if (!existing) throw httpError(404, 'Lead not found');
    await pool.query(`UPDATE LDS_T01_partner_leads SET status = 'CLOSED' WHERE lead_id = :lead_id`, { lead_id: leadId });
    return { updated: true };
  }
}

@Route('public/leads')
@Tags('Public Leads')
export class PublicLeadsController extends Controller {
  @Post()
  public async create(@Body() body: LeadBody): Promise<{ lead_id: number; lead_code: string | null }> {
    const lead = await createLead({ ...body, status: 'NEW' }, clean(body.source) ?? 'Public Lead Form');
    return { lead_id: lead.lead_id, lead_code: lead.lead_code };
  }
}
