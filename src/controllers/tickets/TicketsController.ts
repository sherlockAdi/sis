import { Body, Controller, Get, Path, Post, Put, Query, Request, Route, Security, Tags } from 'tsoa';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../../db/pool';
import { getPartnerByUserId } from '../../services/partnerService';
import { getSelfProfile } from '../../services/authService';
import { httpError } from '../../utils/httpErrors';

type TicketRoleGroup = 'ADMIN' | 'EMPLOYER' | 'EMPLOYEE' | 'CANDIDATE' | 'UNKNOWN';

type TicketTypeRow = {
  ticket_type_id: number;
  ticket_type_code: string;
  ticket_type_name: string;
  description: string | null;
  status: 0 | 1;
  can_view: 0 | 1;
  can_create: 0 | 1;
  can_assign: 0 | 1;
  can_resolve: 0 | 1;
  can_escalate: 0 | 1;
  can_close: 0 | 1;
};

type TicketStatusRow = {
  ticket_status_id: number;
  ticket_status_code: string;
  ticket_status_name: string;
  sort_order: number;
  status: 0 | 1;
};

type TicketListRow = {
  ticket_id: number;
  ticket_code: string;
  ticket_type_id: number;
  ticket_type_code: string;
  ticket_type_name: string;
  ticket_status_id: number;
  ticket_status_code: string;
  ticket_status_name: string;
  raised_by_user_id: number;
  raised_by_role_code: string;
  subject: string;
  description: string | null;
  related_job_id: number | null;
  related_job_title: string | null;
  related_deployment_id: number | null;
  related_candidate_id: number | null;
  related_candidate_name: string | null;
  related_employee_id: number | null;
  related_employee_name: string | null;
  priority: string | null;
  visibility_scope: string;
  assigned_to_user_id: number | null;
  assigned_to_username: string | null;
  assigned_to_role_code: string | null;
  resolved_by_user_id: number | null;
  resolved_at: string | null;
  closed_at: string | null;
  reopened_at: string | null;
  created_at: string;
  updated_at: string;
  comments_count: number;
  attachments_count: number;
};

type TicketCommentRow = {
  ticket_comment_id: number;
  ticket_id: number;
  user_id: number;
  username: string | null;
  role_code: string | null;
  comment: string;
  created_at: string;
  updated_at: string;
};

type TicketAttachmentRow = {
  ticket_attachment_id: number;
  ticket_id: number;
  file_path: string;
  file_name: string | null;
  uploaded_by_user_id: number;
  uploaded_by_username: string | null;
  created_at: string;
  updated_at: string;
};

type TicketMetaResponse = {
  role_code: string;
  role_group: TicketRoleGroup;
  types: TicketTypeRow[];
  statuses: TicketStatusRow[];
};

type TicketDetailRow = TicketListRow & {
  comments: TicketCommentRow[];
  attachments: TicketAttachmentRow[];
};

type CurrentUserContext = {
  user_id: number;
  role_code: string;
  role_group: TicketRoleGroup;
  candidate_id: number | null;
  employee_id: number | null;
  partner_id: number | null;
  partner_job_ids: number[];
};

type TicketCreateBody = {
  ticket_type_id: number;
  subject: string;
  description?: string | null;
  priority?: string | null;
  related_job_id?: number | null;
  related_deployment_id?: number | null;
  related_candidate_id?: number | null;
  related_employee_id?: number | null;
  attachment_file_path?: string | null;
  attachment_file_name?: string | null;
};

type TicketStatusUpdateBody = {
  ticket_status_code: string;
  remarks?: string | null;
};

type TicketCommentCreateBody = {
  comment: string;
};

type TicketAttachmentCreateBody = {
  file_path: string;
  file_name?: string | null;
};

function normalize(value: string | null | undefined): string {
  return String(value ?? '').trim().toUpperCase();
}

function resolveRoleGroup(roleCode: string): TicketRoleGroup {
  const code = normalize(roleCode);
  if (code === 'ADMIN' || code === 'ADMINISTRATOR' || code === 'SUPER_ADMIN') return 'ADMIN';
  if (code === 'EMPLOYER' || code === 'PARTNER' || code === 'SOURCING' || code === 'COMPANY') return 'EMPLOYER';
  if (code === 'EMPLOYEE') return 'EMPLOYEE';
  if (code === 'CANDIDATE') return 'CANDIDATE';
  return 'UNKNOWN';
}

function canRoleCreateTicketType(roleGroup: TicketRoleGroup, ticketTypeCode: string): boolean {
  const type = normalize(ticketTypeCode);
  if (roleGroup === 'ADMIN') return true;
  if (roleGroup === 'EMPLOYER') return true;
  if (roleGroup === 'EMPLOYEE') return ['SYSTEM_ISSUE', 'JOB_RELATED', 'FUNCTIONALITY_ISSUE', 'EMPLOYEE_ISSUE'].includes(type);
  if (roleGroup === 'CANDIDATE') return ['SYSTEM_ISSUE', 'JOB_RELATED', 'FUNCTIONALITY_ISSUE', 'CANDIDATE_ISSUE'].includes(type);
  return false;
}

async function resolveCurrentUserContext(user_id: number): Promise<CurrentUserContext> {
  const profile = await getSelfProfile(user_id);
  const role_code = normalize(profile.role_code);
  const role_group = resolveRoleGroup(role_code);

  const [candidateRows] = await pool.query<(RowDataPacket & { candidate_id: number })[]>(
    `SELECT candidate_id
     FROM REC_T01_candidates
     WHERE user_id = :user_id
       AND deleted_at IS NULL
     LIMIT 1`,
    { user_id }
  );
  const candidate_id = candidateRows[0]?.candidate_id ?? null;

  const [employeeRows] = await pool.query<(RowDataPacket & { employee_id: number })[]>(
    `SELECT e.employee_id
     FROM EMP_T01_employees e
     JOIN REC_T01_candidates c ON c.candidate_id = e.candidate_id
     WHERE c.user_id = :user_id
       AND e.deleted_at IS NULL
       AND c.deleted_at IS NULL
     ORDER BY e.employee_id DESC
     LIMIT 1`,
    { user_id }
  );
  const employee_id = employeeRows[0]?.employee_id ?? null;

  const partner = await getPartnerByUserId(user_id);
  const partner_id = partner?.partner_id ?? null;

  const [partnerJobs] = await pool.query<(RowDataPacket & { job_id: number })[]>(
    partner_id
      ? `SELECT job_id
         FROM JOB_T01_jobs
         WHERE partner_id = :partner_id`
      : `SELECT job_id FROM JOB_T01_jobs WHERE 1 = 0`,
    { partner_id }
  );

  return {
    user_id,
    role_code,
    role_group,
    candidate_id,
    employee_id,
    partner_id,
    partner_job_ids: partnerJobs.map((r) => Number(r.job_id)).filter((n) => Number.isFinite(n)),
  };
}

function ticketBaseSelect() {
  return `
    SELECT
      t.ticket_id,
      t.ticket_code,
      t.ticket_type_id,
      tt.ticket_type_code,
      tt.ticket_type_name,
      t.ticket_status_id,
      ts.ticket_status_code,
      ts.ticket_status_name,
      t.raised_by_user_id,
      t.raised_by_role_code,
      t.subject,
      t.description,
      t.related_job_id,
      j.job_title AS related_job_title,
      t.related_deployment_id,
      t.related_candidate_id,
      CONCAT_WS(' ', c.first_name, c.last_name) AS related_candidate_name,
      t.related_employee_id,
      e.employee_name AS related_employee_name,
      t.priority,
      t.visibility_scope,
      t.assigned_to_user_id,
      au.username AS assigned_to_username,
      t.assigned_to_role_code,
      t.resolved_by_user_id,
      t.resolved_at,
      t.closed_at,
      t.reopened_at,
      t.created_at,
      t.updated_at,
      (SELECT COUNT(*) FROM TCK_T02_ticket_comments tc WHERE tc.ticket_id = t.ticket_id) AS comments_count,
      (SELECT COUNT(*) FROM TCK_T03_ticket_attachments ta WHERE ta.ticket_id = t.ticket_id) AS attachments_count
    FROM TCK_T01_tickets t
    JOIN TCK_M01_ticket_types tt ON tt.ticket_type_id = t.ticket_type_id
    JOIN TCK_M02_ticket_statuses ts ON ts.ticket_status_id = t.ticket_status_id
    LEFT JOIN JOB_T01_jobs j ON j.job_id = t.related_job_id
    LEFT JOIN REC_T01_candidates c ON c.candidate_id = t.related_candidate_id
    LEFT JOIN EMP_T01_employees e ON e.employee_id = t.related_employee_id
    LEFT JOIN AUTH_U04_users au ON au.user_id = t.assigned_to_user_id
    WHERE t.deleted_at IS NULL
  `;
}

async function fetchTicketById(ticket_id: number): Promise<TicketListRow | null> {
  const [rows] = await pool.query<(RowDataPacket & TicketListRow)[]>(
    `${ticketBaseSelect()} AND t.ticket_id = :ticket_id LIMIT 1`,
    { ticket_id }
  );
  return rows[0] ?? null;
}

function canSeeTicket(ticket: TicketListRow, ctx: CurrentUserContext): boolean {
  if (ctx.role_group === 'ADMIN') return true;
  if (ticket.raised_by_user_id === ctx.user_id) return true;

  const status = normalize(ticket.ticket_type_code);

  if (ctx.role_group === 'EMPLOYER') {
    if (status === 'SYSTEM_ISSUE') return false;
    if (ticket.related_job_id && ctx.partner_job_ids.includes(Number(ticket.related_job_id))) return true;
    if (ticket.related_deployment_id && ctx.partner_job_ids.length > 0) return true;
    return false;
  }

  if (ctx.role_group === 'EMPLOYEE') {
    if (ticket.related_employee_id && Number(ticket.related_employee_id) === Number(ctx.employee_id ?? 0)) return true;
    if (ticket.visibility_scope.toUpperCase().includes('EMPLOYEE')) return true;
    return false;
  }

  if (ctx.role_group === 'CANDIDATE') {
    if (ticket.related_candidate_id && Number(ticket.related_candidate_id) === Number(ctx.candidate_id ?? 0)) return true;
    if (ticket.visibility_scope.toUpperCase().includes('CANDIDATE')) return true;
    return false;
  }

  return false;
}

async function ensureTicketTypeCreateAllowed(ticket_type_id: number, role_code: string): Promise<TicketTypeRow> {
  const [rows] = await pool.query<(RowDataPacket & TicketTypeRow)[]>(
    `
      SELECT
        t.ticket_type_id,
        t.ticket_type_code,
        t.ticket_type_name,
        t.description,
        t.status,
        COALESCE(r.can_view, 0) AS can_view,
        COALESCE(r.can_create, 0) AS can_create,
        COALESCE(r.can_assign, 0) AS can_assign,
        COALESCE(r.can_resolve, 0) AS can_resolve,
        COALESCE(r.can_escalate, 0) AS can_escalate,
        COALESCE(r.can_close, 0) AS can_close
      FROM TCK_M01_ticket_types t
      LEFT JOIN TCK_T04_ticket_access_rules r
        ON r.ticket_type_id = t.ticket_type_id
       AND r.role_code = :role_code
      WHERE t.ticket_type_id = :ticket_type_id
        AND t.status = 1
      LIMIT 1
    `,
    { ticket_type_id, role_code }
  );
  const row = rows[0];
  if (!row) throw httpError(404, 'Ticket type not found');
  const roleGroup = resolveRoleGroup(role_code);
  if (!row.can_create && !canRoleCreateTicketType(roleGroup, row.ticket_type_code)) {
    throw httpError(403, 'You are not allowed to create this ticket type');
  }
  return row;
}

async function getOpenStatusId(): Promise<number> {
  const [rows] = await pool.query<(RowDataPacket & { ticket_status_id: number })[]>(
    `SELECT ticket_status_id
     FROM TCK_M02_ticket_statuses
     WHERE ticket_status_code = 'OPEN' AND status = 1
     LIMIT 1`
  );
  const id = rows[0]?.ticket_status_id;
  if (!id) throw httpError(500, 'Open ticket status is not configured');
  return Number(id);
}

async function getStatusByCode(ticket_status_code: string): Promise<TicketStatusRow> {
  const [rows] = await pool.query<(RowDataPacket & TicketStatusRow)[]>(
    `SELECT ticket_status_id, ticket_status_code, ticket_status_name, sort_order, status
     FROM TCK_M02_ticket_statuses
     WHERE ticket_status_code = :ticket_status_code
       AND status = 1
     LIMIT 1`,
    { ticket_status_code }
  );
  const row = rows[0];
  if (!row) throw httpError(404, 'Ticket status not found');
  return row;
}

function defaultVisibilityScope(role_group: TicketRoleGroup, ticketTypeCode: string): string {
  const type = normalize(ticketTypeCode);
  if (type === 'SYSTEM_ISSUE') return 'ADMIN_ONLY';
  if (role_group === 'EMPLOYER') return 'JOB_OWNER_AND_ADMIN';
  if (role_group === 'EMPLOYEE') return 'EMPLOYEE_AND_ADMIN';
  if (role_group === 'CANDIDATE') return 'CANDIDATE_AND_ADMIN';
  return 'ADMIN_AND_OWNER';
}

function allowRelatedJob(ctx: CurrentUserContext, related_job_id?: number | null): boolean {
  if (!related_job_id) return true;
  if (ctx.role_group === 'ADMIN') return true;
  return ctx.partner_job_ids.includes(Number(related_job_id));
}

@Route('tickets')
@Tags('Tickets')
export class TicketsController extends Controller {
  @Get('meta')
  @Security('jwt')
  public async meta(@Request() req: any): Promise<TicketMetaResponse> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const ctx = await resolveCurrentUserContext(user.user_id);
    const [types] = await pool.query<(RowDataPacket & TicketTypeRow)[]>(
      `
      SELECT
        t.ticket_type_id,
        t.ticket_type_code,
        t.ticket_type_name,
        t.description,
        t.status,
        COALESCE(r.can_view, 0) AS can_view,
        COALESCE(r.can_create, 0) AS can_create,
        COALESCE(r.can_assign, 0) AS can_assign,
        COALESCE(r.can_resolve, 0) AS can_resolve,
        COALESCE(r.can_escalate, 0) AS can_escalate,
        COALESCE(r.can_close, 0) AS can_close
      FROM TCK_M01_ticket_types t
      LEFT JOIN TCK_T04_ticket_access_rules r
        ON r.ticket_type_id = t.ticket_type_id
       AND r.role_code = :role_code
      WHERE t.status = 1
      ORDER BY t.ticket_type_name ASC
      `,
      { role_code: ctx.role_code }
    );

    const hydratedTypes = types.map((t) => ({
      ...t,
      can_create: (Number(t.can_create) === 1 || canRoleCreateTicketType(ctx.role_group, t.ticket_type_code) ? 1 : 0) as 0 | 1,
    }));

    const [statuses] = await pool.query<(RowDataPacket & TicketStatusRow)[]>(
      `SELECT ticket_status_id, ticket_status_code, ticket_status_name, sort_order, status
       FROM TCK_M02_ticket_statuses
       WHERE status = 1
       ORDER BY sort_order ASC, ticket_status_name ASC`
    );

    return {
      role_code: ctx.role_code,
      role_group: ctx.role_group,
      types: hydratedTypes,
      statuses,
    };
  }

  @Get()
  @Security('jwt')
  public async list(@Request() req: any, @Query() ticket_status_code?: string): Promise<TicketListRow[]> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const ctx = await resolveCurrentUserContext(user.user_id);
    const [rows] = await pool.query<(RowDataPacket & TicketListRow)[]>(
      `${ticketBaseSelect()}
       ${ticket_status_code ? 'AND ts.ticket_status_code = :ticket_status_code' : ''}
       ORDER BY t.updated_at DESC, t.ticket_id DESC`,
      ticket_status_code ? { ticket_status_code } : undefined
    );

    return rows.filter((row) => canSeeTicket(row, ctx));
  }

  @Get('{ticketId}')
  @Security('jwt')
  public async get(@Path() ticketId: number, @Request() req: any): Promise<TicketDetailRow | null> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const ctx = await resolveCurrentUserContext(user.user_id);
    const ticket = await fetchTicketById(ticketId);
    if (!ticket) return null;
    if (!canSeeTicket(ticket, ctx)) throw httpError(403, 'Forbidden');

    const [comments] = await pool.query<(RowDataPacket & TicketCommentRow)[]>(
      `
        SELECT
          c.ticket_comment_id,
          c.ticket_id,
          c.user_id,
          u.username,
          r.role_code,
          c.comment,
          c.created_at,
          c.updated_at
        FROM TCK_T02_ticket_comments c
        LEFT JOIN AUTH_U04_users u ON u.user_id = c.user_id
        LEFT JOIN AUTH_U01_roles r ON r.role_id = u.role_id
        WHERE c.ticket_id = :ticket_id
        ORDER BY c.created_at ASC, c.ticket_comment_id ASC
      `,
      { ticket_id: ticketId }
    );

    const [attachments] = await pool.query<(RowDataPacket & TicketAttachmentRow)[]>(
      `
        SELECT
          a.ticket_attachment_id,
          a.ticket_id,
          a.file_path,
          a.file_name,
          a.uploaded_by_user_id,
          u.username AS uploaded_by_username,
          a.created_at,
          a.updated_at
        FROM TCK_T03_ticket_attachments a
        LEFT JOIN AUTH_U04_users u ON u.user_id = a.uploaded_by_user_id
        WHERE a.ticket_id = :ticket_id
        ORDER BY a.created_at ASC, a.ticket_attachment_id ASC
      `,
      { ticket_id: ticketId }
    );

    return {
      ...ticket,
      comments,
      attachments,
    };
  }

  @Post()
  @Security('jwt')
  public async create(@Request() req: any, @Body() body: TicketCreateBody): Promise<{ ticket_id: number; ticket_code: string }> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const ctx = await resolveCurrentUserContext(user.user_id);
    const type = await ensureTicketTypeCreateAllowed(Number(body.ticket_type_id), ctx.role_code);
    const statusId = await getOpenStatusId();

    const subject = String(body.subject ?? '').trim();
    if (!subject) throw httpError(400, 'subject is required');

    const relatedJobId = typeof body.related_job_id === 'number' ? body.related_job_id : null;
    if (!allowRelatedJob(ctx, relatedJobId)) throw httpError(403, 'You are not allowed to link this job');

    const relatedCandidateId =
      typeof body.related_candidate_id === 'number'
        ? body.related_candidate_id
        : ctx.role_group === 'CANDIDATE'
          ? ctx.candidate_id
          : null;
    if (ctx.role_group === 'CANDIDATE' && relatedCandidateId && Number(relatedCandidateId) !== Number(ctx.candidate_id ?? 0)) {
      throw httpError(403, 'You can only raise tickets for your own profile');
    }

    const relatedEmployeeId =
      typeof body.related_employee_id === 'number'
        ? body.related_employee_id
        : ctx.role_group === 'EMPLOYEE'
          ? ctx.employee_id
          : null;
    if (ctx.role_group === 'EMPLOYEE' && relatedEmployeeId && Number(relatedEmployeeId) !== Number(ctx.employee_id ?? 0)) {
      throw httpError(403, 'You can only raise tickets for your own employee record');
    }

    const relatedDeploymentId = typeof body.related_deployment_id === 'number' ? body.related_deployment_id : null;
    const visibilityScope = defaultVisibilityScope(ctx.role_group, type.ticket_type_code);

    const [result] = await pool.query<ResultSetHeader>(
      `
        INSERT INTO TCK_T01_tickets (
          ticket_code,
          ticket_type_id,
          ticket_status_id,
          raised_by_user_id,
          raised_by_role_code,
          subject,
          description,
          related_job_id,
          related_deployment_id,
          related_candidate_id,
          related_employee_id,
          priority,
          visibility_scope
        ) VALUES (
          '',
          :ticket_type_id,
          :ticket_status_id,
          :raised_by_user_id,
          :raised_by_role_code,
          :subject,
          :description,
          :related_job_id,
          :related_deployment_id,
          :related_candidate_id,
          :related_employee_id,
          :priority,
          :visibility_scope
        )
      `,
      {
        ticket_type_id: type.ticket_type_id,
        ticket_status_id: statusId,
        raised_by_user_id: ctx.user_id,
        raised_by_role_code: ctx.role_code,
        subject,
        description: String(body.description ?? '').trim() || null,
        related_job_id: relatedJobId,
        related_deployment_id: relatedDeploymentId,
        related_candidate_id: relatedCandidateId,
        related_employee_id: relatedEmployeeId,
        priority: String(body.priority ?? 'Normal').trim() || 'Normal',
        visibility_scope: visibilityScope,
      }
    );

    const ticketId = Number((result as any).insertId);
    if (!ticketId) throw httpError(500, 'Failed to create ticket');

    const ticketCode = `TCK-${String(ticketId).padStart(6, '0')}`;
    await pool.query(`UPDATE TCK_T01_tickets SET ticket_code = :ticket_code WHERE ticket_id = :ticket_id`, {
      ticket_code: ticketCode,
      ticket_id: ticketId,
    });

    if (body.attachment_file_path) {
      await pool.query(
        `
          INSERT INTO TCK_T03_ticket_attachments (ticket_id, file_path, file_name, uploaded_by_user_id)
          VALUES (:ticket_id, :file_path, :file_name, :uploaded_by_user_id)
        `,
        {
          ticket_id: ticketId,
          file_path: body.attachment_file_path,
          file_name: body.attachment_file_name ?? null,
          uploaded_by_user_id: ctx.user_id,
        }
      );
    }

    return { ticket_id: ticketId, ticket_code: ticketCode };
  }

  @Put('{ticketId}/status')
  @Security('jwt')
  public async updateStatus(
    @Path() ticketId: number,
    @Request() req: any,
    @Body() body: TicketStatusUpdateBody
  ): Promise<{ updated: true }> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const ctx = await resolveCurrentUserContext(user.user_id);
    const ticket = await fetchTicketById(ticketId);
    if (!ticket) throw httpError(404, 'Ticket not found');
    if (!(ctx.role_group === 'ADMIN' || ticket.raised_by_user_id === ctx.user_id || ticket.assigned_to_user_id === ctx.user_id)) {
      throw httpError(403, 'Forbidden');
    }

    const status = await getStatusByCode(String(body.ticket_status_code ?? '').trim().toUpperCase());
    const remarks = String(body.remarks ?? '').trim() || null;

    await pool.query(
      `
        UPDATE TCK_T01_tickets
        SET
          ticket_status_id = :ticket_status_id,
          resolved_by_user_id = CASE WHEN :status_code = 'RESOLVED' THEN :user_id ELSE resolved_by_user_id END,
          resolved_at = CASE WHEN :status_code = 'RESOLVED' THEN COALESCE(resolved_at, NOW()) ELSE resolved_at END,
          closed_at = CASE WHEN :status_code = 'CLOSED' THEN COALESCE(closed_at, NOW()) ELSE closed_at END,
          reopened_at = CASE WHEN :status_code = 'REOPENED' THEN NOW() ELSE reopened_at END,
          updated_at = NOW()
        WHERE ticket_id = :ticket_id
      `,
      {
        ticket_id: ticketId,
        ticket_status_id: status.ticket_status_id,
        status_code: status.ticket_status_code,
        user_id: ctx.user_id,
      }
    );

    if (remarks) {
      await pool.query(
        `INSERT INTO TCK_T02_ticket_comments (ticket_id, user_id, comment) VALUES (:ticket_id, :user_id, :comment)`,
        {
          ticket_id: ticketId,
          user_id: ctx.user_id,
          comment: `[Status ${status.ticket_status_name}] ${remarks}`,
        }
      );
    }

    return { updated: true };
  }

  @Get('{ticketId}/comments')
  @Security('jwt')
  public async comments(@Path() ticketId: number, @Request() req: any): Promise<TicketCommentRow[]> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const ctx = await resolveCurrentUserContext(user.user_id);
    const ticket = await fetchTicketById(ticketId);
    if (!ticket) throw httpError(404, 'Ticket not found');
    if (!canSeeTicket(ticket, ctx)) throw httpError(403, 'Forbidden');

    const [rows] = await pool.query<(RowDataPacket & TicketCommentRow)[]>(
      `
        SELECT
          c.ticket_comment_id,
          c.ticket_id,
          c.user_id,
          u.username,
          r.role_code,
          c.comment,
          c.created_at,
          c.updated_at
        FROM TCK_T02_ticket_comments c
        LEFT JOIN AUTH_U04_users u ON u.user_id = c.user_id
        LEFT JOIN AUTH_U01_roles r ON r.role_id = u.role_id
        WHERE c.ticket_id = :ticket_id
        ORDER BY c.created_at ASC, c.ticket_comment_id ASC
      `,
      { ticket_id: ticketId }
    );

    return rows;
  }

  @Post('{ticketId}/comments')
  @Security('jwt')
  public async addComment(
    @Path() ticketId: number,
    @Request() req: any,
    @Body() body: TicketCommentCreateBody
  ): Promise<{ ticket_comment_id: number }> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const ctx = await resolveCurrentUserContext(user.user_id);
    const ticket = await fetchTicketById(ticketId);
    if (!ticket) throw httpError(404, 'Ticket not found');
    if (!canSeeTicket(ticket, ctx)) throw httpError(403, 'Forbidden');

    const comment = String(body.comment ?? '').trim();
    if (!comment) throw httpError(400, 'comment is required');

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO TCK_T02_ticket_comments (ticket_id, user_id, comment) VALUES (:ticket_id, :user_id, :comment)`,
      { ticket_id: ticketId, user_id: ctx.user_id, comment }
    );

    return { ticket_comment_id: Number((result as any).insertId) };
  }

  @Post('{ticketId}/attachments')
  @Security('jwt')
  public async addAttachment(
    @Path() ticketId: number,
    @Request() req: any,
    @Body() body: TicketAttachmentCreateBody
  ): Promise<{ ticket_attachment_id: number }> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const ctx = await resolveCurrentUserContext(user.user_id);
    const ticket = await fetchTicketById(ticketId);
    if (!ticket) throw httpError(404, 'Ticket not found');
    if (!canSeeTicket(ticket, ctx)) throw httpError(403, 'Forbidden');

    const filePath = String(body.file_path ?? '').trim();
    if (!filePath) throw httpError(400, 'file_path is required');

    const [result] = await pool.query<ResultSetHeader>(
      `
        INSERT INTO TCK_T03_ticket_attachments (ticket_id, file_path, file_name, uploaded_by_user_id)
        VALUES (:ticket_id, :file_path, :file_name, :uploaded_by_user_id)
      `,
      {
        ticket_id: ticketId,
        file_path: filePath,
        file_name: body.file_name ?? null,
        uploaded_by_user_id: ctx.user_id,
      }
    );

    return { ticket_attachment_id: Number((result as any).insertId) };
  }
}
