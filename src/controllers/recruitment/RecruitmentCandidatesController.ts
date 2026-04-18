import { Body, Controller, Delete, Get, Post, Put, Path, Route, Security, Tags } from 'tsoa';
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
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
};

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

  @Get('{candidateId}')
  @Security('jwt')
  public async get(@Path() candidateId: number): Promise<CandidateRow> {
    const rows = await callProc<RowDataPacket & CandidateRow>(
      `CALL sp_rec_candidates('GET', :candidate_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { candidate_id: candidateId }
    );
    const candidate = rows[0];
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
    }
  ): Promise<{ candidate_id: number; user_id: number | null; username: string; emailed: boolean; user_created: boolean; auth_error?: string | null }> {
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
    // Create AUTH user with default password
    const plainPassword = randomPassword(10);
    const password_hash = await hashPassword(plainPassword);

    let user_id: number | null = null;
    let user_created = false;
    let auth_error: string | null = null;
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

    // Link candidate -> user only when auth user creation succeeds.
    if (user_created && user_id) {
      await callProc<RowDataPacket & { affected_rows: number }>(
        `CALL sp_rec_candidates('SET_USER', :candidate_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :user_id)`,
        { candidate_id, user_id }
      );
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

    return { candidate_id, user_id, username, emailed, user_created, auth_error };
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
