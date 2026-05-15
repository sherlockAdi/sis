import { Body, Controller, Post, Route, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { findExistingUserByUsernameOrEmail, hashPassword } from '../../services/authService';
import { httpError } from '../../utils/httpErrors';
import { sendCredentialNotification } from '../../services/notificationService';

type CandidateRow = {
  candidate_id: number;
  candidate_code: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
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
  passport_expiry_date?: string | null;
  aadhar_number?: string | null;
  pan_number?: string | null;
  voter_id_number?: string | null;
  languages_known?: string | null;
};

function toNull(value: string | null | undefined): string | null {
  const v = String(value ?? '').trim();
  return v ? v : null;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim());
}

function isValidPhone(value: string): boolean {
  return /^\d{10}$/.test(String(value ?? '').trim());
}

async function upsertCandidateProfile(candidate_id: number, body: CandidateProfileBody): Promise<void> {
  await callProc<RowDataPacket & { affected_rows: number }>(
    `CALL sp_rec_candidate_profiles('UPSERT', :candidate_id, :father_name, :address1, :address2, :pincode, :dob, :gender, :skills, :education, :experience, :industry_type, NULL, :passport_expiry_date, NULL, :aadhar_number, NULL, :pan_number, NULL, :voter_id_number, NULL, NULL, :languages_known)`,
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
      passport_expiry_date: body.passport_expiry_date ?? null,
      aadhar_number: toNull(body.aadhar_number),
      pan_number: toNull(body.pan_number),
      voter_id_number: toNull(body.voter_id_number),
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

function randomPassword(len = 10): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#%*';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

const REGISTRATION_CC = ['mrsrivastava@neuralinfo.org'];

@Route('public')
@Tags('Public')
export class PublicCandidateSignupController extends Controller {
  @Post('candidate-signup')
  public async signup(
    @Body()
    body: {
      first_name?: string | null;
      last_name?: string | null;
      phone?: string | null;
      email: string;
      passport_number?: string | null;
      country_id?: number | null;
      state_id?: number | null;
      city_id?: number | null;
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
      passport_expiry_date?: string | null;
      aadhar_number?: string | null;
      pan_number?: string | null;
      voter_id_number?: string | null;
      languages_known?: string | null;
    }
  ): Promise<{ candidate_id: number; username: string; emailed: boolean; user_id: number | null; user_created: boolean; existing_user_used: boolean; auth_error?: string | null }> {
    const email = String(body.email ?? '').trim();
    if (!email) throw httpError(400, 'email is required');
    if (!isValidEmail(email)) throw httpError(400, 'email must be a valid email address');
    const phone = String(body.phone ?? '').trim();
    if (phone && !isValidPhone(phone)) throw httpError(400, 'phone must be a valid 10-digit mobile number');
    if (await findExistingUserByUsernameOrEmail('', email)) throw httpError(409, 'Email already registered');

    const created = await callProc<RowDataPacket & { candidate_id: number }>(
      `CALL sp_rec_candidates('CREATE', NULL, :first_name, :last_name, :phone, :email, :passport_number, :country_id, :state_id, :city_id, 'New', NULL)`,
      {
        first_name: body.first_name ?? null,
        last_name: body.last_name ?? null,
        phone: phone || null,
        email,
        passport_number: body.passport_number ?? null,
        country_id: typeof body.country_id === 'number' ? body.country_id : null,
        state_id: typeof body.state_id === 'number' ? body.state_id : null,
        city_id: typeof body.city_id === 'number' ? body.city_id : null
      }
    );

    const candidate_id = created[0]?.candidate_id;
    if (!candidate_id) throw httpError(500, 'Failed to create candidate');

    await upsertCandidateProfile(candidate_id, body);

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

    let emailed = false;
    if (user_created && candidate.email) {
      try {
        await sendCredentialNotification({
          recipient: {
            name: `${candidate.first_name ?? ''} ${candidate.last_name ?? ''}`.trim(),
            email: candidate.email,
          },
          username,
          temporaryPassword: plainPassword,
          portalLabel: 'Candidate',
          cc: REGISTRATION_CC,
        });
        emailed = true;
      } catch {
        emailed = false;
      }
    }

    return { candidate_id, username, emailed, user_id, user_created, existing_user_used, auth_error };
  }
}
