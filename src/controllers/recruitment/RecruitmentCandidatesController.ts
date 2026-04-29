import { Body, Controller, Delete, Get, Post, Put, Path, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { findExistingUserByUsernameOrEmail, hashPassword } from '../../services/authService';
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
  country_name?: string | null;
  state_id: number | null;
  state_name?: string | null;
  city_id: number | null;
  city_name?: string | null;
  father_name?: string | null;
  address1?: string | null;
  address2?: string | null;
  pincode?: string | null;
  dob?: string | null;
  gender?: string | null;
  skills?: string | null;
  education?: string | null;
  experience?: string | null;
  industry_type?: string | null;
  resume_file_path?: string | null;
  passport_expiry_date?: string | null;
  passport_file_path?: string | null;
  aadhar_number?: string | null;
  aadhar_file_path?: string | null;
  pan_number?: string | null;
  pan_file_path?: string | null;
  voter_id_number?: string | null;
  voter_id_file_path?: string | null;
  profile_photo_file_path?: string | null;
  languages_known?: string | null;
  status: string | null;
  is_verified: boolean | 0 | 1 | null;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
};

function normalizeCandidateRow(row: CandidateRow): CandidateRow {
  return {
    ...row,
    is_verified: Boolean(row.is_verified),
  };
}

type CandidateProfileBody = {
  father_name?: string | null;
  address1?: string | null;
  address2?: string | null;
  pincode?: string | null;
  dob?: string | null;
  gender?: string | null;
  skills?: string | null;
  education?: string | null;
  experience?: string | null;
  industry_type?: string | null;
  resume_file_path?: string | null;
  passport_expiry_date?: string | null;
  passport_file_path?: string | null;
  aadhar_number?: string | null;
  aadhar_file_path?: string | null;
  pan_number?: string | null;
  pan_file_path?: string | null;
  voter_id_number?: string | null;
  voter_id_file_path?: string | null;
  profile_photo_file_path?: string | null;
  languages_known?: string | null;
  is_verified?: boolean | 0 | 1 | null;
};

function toNull(value: string | null | undefined): string | null {
  const v = String(value ?? '').trim();
  return v ? v : null;
}

async function upsertCandidateProfile(candidate_id: number, body: CandidateProfileBody): Promise<void> {
  await callProc<RowDataPacket & { affected_rows: number }>(
    `CALL sp_rec_candidate_profiles('UPSERT', :candidate_id, :father_name, :address1, :address2, :pincode, :dob, :gender, :skills, :education, :experience, :industry_type, :resume_file_path, :passport_expiry_date, :passport_file_path, :aadhar_number, :aadhar_file_path, :pan_number, :pan_file_path, :voter_id_number, :voter_id_file_path, :profile_photo_file_path, :languages_known)`,
    {
      candidate_id,
      father_name: toNull(body.father_name),
      address1: toNull(body.address1),
      address2: toNull(body.address2),
      pincode: toNull(body.pincode),
      dob: body.dob ?? null,
      gender: toNull(body.gender),
      skills: toNull(body.skills),
      education: toNull(body.education),
      experience: toNull(body.experience),
      industry_type: toNull(body.industry_type),
      resume_file_path: toNull(body.resume_file_path),
      passport_expiry_date: body.passport_expiry_date ?? null,
      passport_file_path: toNull(body.passport_file_path),
      aadhar_number: toNull(body.aadhar_number),
      aadhar_file_path: toNull(body.aadhar_file_path),
      pan_number: toNull(body.pan_number),
      pan_file_path: toNull(body.pan_file_path),
      voter_id_number: toNull(body.voter_id_number),
      voter_id_file_path: toNull(body.voter_id_file_path),
      profile_photo_file_path: toNull(body.profile_photo_file_path),
      languages_known: toNull(body.languages_known),
    }
  );
}

async function linkCandidateUser(candidate_id: number, user_id: number): Promise<void> {
  const rows = await callProc<RowDataPacket & { affected_rows: number }>(
    `CALL sp_rec_candidates('SET_USER', :candidate_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :user_id)`,
    { candidate_id, user_id }
  );
  if ((rows[0]?.affected_rows ?? 0) === 0) {
    throw httpError(500, 'Failed to link candidate to user');
  }
}

async function setCandidateVerified(candidate_id: number, is_verified: boolean): Promise<void> {
  await callProc<RowDataPacket & { affected_rows: number }>(
    `CALL sp_rec_candidate_verification(:candidate_id, :is_verified)`,
    { candidate_id, is_verified }
  );
}

function randomPassword(len = 10): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#%*';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

const REGISTRATION_CC = ['mrsrivastava@neuralinfo.org'];

@Route('recruitment/candidates')
@Tags('Recruitment')
export class RecruitmentCandidatesController extends Controller {
  @Get()
  @Security('jwt')
  public async list(): Promise<CandidateRow[]> {
    const rows = await callProc<RowDataPacket & CandidateRow>(
      `CALL sp_rec_candidates('LIST', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`
    );
    return rows.map((row) => normalizeCandidateRow(row));
  }

  @Get('{candidateId}')
  @Security('jwt')
  public async get(@Path() candidateId: number): Promise<CandidateRow> {
    const rows = await callProc<RowDataPacket & CandidateRow>(
      `CALL sp_rec_candidates('GET', :candidate_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { candidate_id: candidateId }
    );
    const candidate = rows[0] ? normalizeCandidateRow(rows[0]) : undefined;
    if (!candidate) throw httpError(404, 'Candidate not found');
    return candidate;
  }

  @Post()
  @Security('jwt')
  public async create(
    @Body()
    body: CandidateProfileBody & {
      first_name?: string | null;
      last_name?: string | null;
      phone?: string | null;
      email?: string | null;
      passport_number?: string | null;
      country_id?: number | null;
      state_id?: number | null;
      city_id?: number | null;
      status?: string | null;
      user_id?: number | null;
      is_verified?: boolean | null;
    }
  ): Promise<{ candidate_id: number; user_id: number | null; username: string; emailed: boolean; user_created: boolean; existing_user_used: boolean; auth_error?: string | null }> {
    const existingUser = body.email ? await findExistingUserByUsernameOrEmail('', body.email) : null;
    if (existingUser) throw httpError(409, 'Email already registered');

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

    await upsertCandidateProfile(candidate_id, body);
    if (typeof body.is_verified === 'boolean') {
      await setCandidateVerified(candidate_id, body.is_verified);
    }

    // Load candidate_code/email
    const candidateRows = await callProc<RowDataPacket & CandidateRow>(
      `CALL sp_rec_candidates('GET', :candidate_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { candidate_id }
    );
    const candidate = candidateRows[0] ? normalizeCandidateRow(candidateRows[0]) : undefined;
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
    let user_id: number | null = body.user_id ?? null;
    let user_created = false;
    const existing_user_used = Boolean(body.user_id);
    let auth_error: string | null = null;
    let plainPassword: string | null = null;
    if (user_id) {
      await linkCandidateUser(candidate_id, user_id);
    } else {
      // Create AUTH user with default password
      plainPassword = randomPassword(10);
      const password_hash = await hashPassword(plainPassword);

      if (role_id) {
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
          user_id = userRows[0]?.user_id ?? null;
          user_created = Boolean(user_id);
          if (user_id) {
            await linkCandidateUser(candidate_id, user_id);
          }
        } catch (e: any) {
          if (e?.code === 'ER_DUP_ENTRY') {
            auth_error = 'User already exists for this username/email';
          } else {
            auth_error = String(e?.message ?? 'Failed to create user');
          }
        }
      } else {
        auth_error = 'Candidate role is not configured';
      }
    }

    // Email credentials (best-effort)
    let emailed = false;
    if (user_created && candidate.email && env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
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
            cc: REGISTRATION_CC,
            subject: 'SIS Global Connect — Candidate portal credentials',
            text: credentialsEmailText({
              name: `${candidate.first_name ?? ''} ${candidate.last_name ?? ''}`.trim(),
              username,
              temporaryPassword: plainPassword ?? '',
              portalLabel: 'Candidate',
            }),
          }
        );
        emailed = true;
      } catch {
        emailed = false;
      }
    }

    return { candidate_id, user_id, username, emailed, user_created, existing_user_used, auth_error };
  }

  @Put('{candidateId}')
  @Security('jwt')
  public async update(
    @Path() candidateId: number,
    @Body() body: Partial<Omit<CandidateRow, 'candidate_id' | 'candidate_code' | 'created_at' | 'updated_at' | 'deleted_at' | 'country_name' | 'state_name' | 'city_name'>>
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
    await upsertCandidateProfile(candidateId, body);
    if (typeof body.is_verified === 'boolean') {
      await setCandidateVerified(candidateId, body.is_verified);
    }
    return { updated: true };
  }

  @Delete('{candidateId}')
  @Security('jwt')
  public async disable(@Path() candidateId: number): Promise<{ disabled: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_rec_candidates('DELETE', :candidate_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { candidate_id: candidateId }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Candidate not found');
    return { disabled: true };
  }
}
