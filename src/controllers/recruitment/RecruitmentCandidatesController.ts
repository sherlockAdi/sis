import { Body, Controller, Get, Post, Put, Path, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { hashPassword } from '../../services/authService';
import { env } from '../../config/env';
import { httpError } from '../../utils/httpErrors';
import { sendSmtpMail } from '../../utils/smtpClient';
import { credentialsEmailText } from '../../utils/emailTemplates';

type CandidateRow = {
  candidate_id: number;
  candidate_code: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  passport_number: string | null;
  country_id: number | null;
  state_id: number | null;
  city_id: number | null;
  status: string | null;
  created_at: string;
};

function randomPassword(len = 10): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#%*';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

@Route('recruitment/candidates')
@Tags('Recruitment')
export class RecruitmentCandidatesController extends Controller {
  @Get()
  @Security('jwt')
  public async list(): Promise<CandidateRow[]> {
    return callProc<RowDataPacket & CandidateRow>(
      `CALL sp_rec_candidates('LIST', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`
    );
  }

  @Post()
  @Security('jwt')
  public async create(
    @Body()
    body: {
      first_name?: string | null;
      last_name?: string | null;
      phone?: string | null;
      email?: string | null;
      passport_number?: string | null;
      country_id?: number | null;
      state_id?: number | null;
      city_id?: number | null;
      status?: string | null;
    }
  ): Promise<{ candidate_id: number; user_id: number; username: string; emailed: boolean }> {
    const created = await callProc<RowDataPacket & { candidate_id: number }>(
      `CALL sp_rec_candidates('CREATE', NULL, :first_name, :last_name, :phone, :email, :passport_number, :country_id, :state_id, :city_id, :status, NULL)`,
      {
        first_name: body.first_name ?? null,
        last_name: body.last_name ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        passport_number: body.passport_number ?? null,
        country_id: typeof body.country_id === 'number' ? body.country_id : null,
        state_id: typeof body.state_id === 'number' ? body.state_id : null,
        city_id: typeof body.city_id === 'number' ? body.city_id : null,
        status: body.status ?? null
      }
    );

    const candidate_id = created[0]?.candidate_id;
    if (!candidate_id) throw httpError(500, 'Failed to create candidate');

    // Load candidate_code/email
    const candidateRows = await callProc<RowDataPacket & CandidateRow>(
      `CALL sp_rec_candidates('GET', :candidate_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { candidate_id }
    );
    const candidate = candidateRows[0];
    if (!candidate) throw httpError(500, 'Candidate created but not found');
    const username = candidate.candidate_code ?? `cand${candidate_id}`;

    // Ensure role exists
    let roleRows = await callProc<RowDataPacket & { role_id: number }>(
      `CALL sp_roles_get_by_code(:role_code)`,
      { role_code: 'CANDIDATE' }
    );
    let role_id = roleRows[0]?.role_id;
    if (!role_id) {
      const r = await callProc<RowDataPacket & { role_id: number }>(
        `CALL sp_roles_create(:role_name, :role_code, :description, :status)`,
        { role_name: 'Candidate', role_code: 'CANDIDATE', description: 'Candidate portal role', status: true }
      );
      role_id = r[0]?.role_id;
    }
    if (!role_id) throw httpError(500, 'Failed to resolve candidate role');

    // Create AUTH user with default password
    const plainPassword = randomPassword(10);
    const password_hash = await hashPassword(plainPassword);

    let user_id: number | undefined;
    try {
      const userRows = await callProc<RowDataPacket & { user_id: number }>(
        `CALL sp_users_create(:role_id, :first_name, :last_name, :username, :email, :phone, :password_hash, :status)`,
        {
          role_id,
          first_name: candidate.first_name ?? null,
          last_name: candidate.last_name ?? null,
          username,
          email: candidate.email ?? null,
          phone: candidate.phone ?? null,
          password_hash,
          status: true
        }
      );
      user_id = userRows[0]?.user_id;
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY') throw httpError(409, 'User already exists for this username/email');
      throw e;
    }
    if (!user_id) throw httpError(500, 'Failed to create user');

    // Link candidate -> user
    await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_rec_candidates('SET_USER', :candidate_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :user_id)`,
      { candidate_id, user_id }
    );

    // Email credentials (best-effort)
    let emailed = false;
    if (candidate.email && env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
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
            to: candidate.email,
            subject: 'SIS Global Connect — Candidate portal credentials',
            text: credentialsEmailText({
              name: `${candidate.first_name ?? ''} ${candidate.last_name ?? ''}`.trim(),
              username,
              temporaryPassword: plainPassword,
              portalLabel: 'Candidate',
            }),
          }
        );
        emailed = true;
      } catch {
        emailed = false;
      }
    }

    return { candidate_id, user_id, username, emailed };
  }

  @Put('{candidateId}')
  @Security('jwt')
  public async update(
    @Path() candidateId: number,
    @Body() body: Partial<Omit<CandidateRow, 'candidate_id' | 'candidate_code' | 'created_at'>>
  ): Promise<{ updated: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_rec_candidates('UPDATE', :candidate_id, :first_name, :last_name, :phone, :email, :passport_number, :country_id, :state_id, :city_id, :status, NULL)`,
      {
        candidate_id: candidateId,
        first_name: body.first_name ?? null,
        last_name: body.last_name ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        passport_number: body.passport_number ?? null,
        country_id: typeof body.country_id === 'number' ? body.country_id : null,
        state_id: typeof body.state_id === 'number' ? body.state_id : null,
        city_id: typeof body.city_id === 'number' ? body.city_id : null,
        status: body.status ?? null
      }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Candidate not found');
    return { updated: true };
  }
}
