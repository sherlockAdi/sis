import { Body, Controller, Get, Put, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';
import type { JwtPayload } from '../../security/jwt';
import {
  getCandidateProfileMissingFields,
  type CandidateProfileLike,
} from '../../utils/candidateProfileCompleteness';

type CandidateProfileRow = CandidateProfileLike & {
  candidate_id: number;
  candidate_code: string | null;
  status: string | null;
  user_id: number | null;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
};

type CandidateProfileUpdateBody = {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email?: string | null;
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

type CandidateProfileResponse = CandidateProfileRow & {
  profile_complete: boolean;
  missing_fields: string[];
};

function normalizeCandidate(row: CandidateProfileRow): CandidateProfileRow {
  return {
    ...row,
    is_verified: Boolean(row.is_verified),
  } as CandidateProfileRow;
}

function requireUser(req: any): JwtPayload {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user?.user_id) throw httpError(401, 'Unauthorized');
  if (!user?.username) throw httpError(401, 'Unauthorized');
  return user;
}

function toNull(value: string | null | undefined): string | null {
  const v = String(value ?? '').trim();
  return v ? v : null;
}

async function getCandidateForUser(user_id: number): Promise<CandidateProfileRow> {
  const rows = await callProc<RowDataPacket & CandidateProfileRow>(
    `CALL sp_rec_candidates('GET_BY_USER', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :user_id)`,
    { user_id }
  );
  const candidate = rows[0];
  if (!candidate) throw httpError(404, 'Candidate profile not found');
  return candidate;
}

async function upsertCandidateProfile(candidate_id: number, body: CandidateProfileUpdateBody): Promise<void> {
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

@Route('candidate/profile')
@Tags('Candidate')
export class CandidateProfileController extends Controller {
  @Get()
  @Security('jwt')
  public async me(@Request() req: any): Promise<CandidateProfileResponse> {
    const user = requireUser(req);
    const candidate = normalizeCandidate(await getCandidateForUser(user.user_id));
    const missing_fields = getCandidateProfileMissingFields(candidate);
    return {
      ...candidate,
      profile_complete: missing_fields.length === 0,
      missing_fields,
    };
  }

  @Put()
  @Security('jwt')
  public async update(
    @Request() req: any,
    @Body() body: CandidateProfileUpdateBody
  ): Promise<{ updated: true }> {
    const user = requireUser(req);
    const candidate = await getCandidateForUser(user.user_id);

    await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_rec_candidates('UPDATE', :candidate_id, :first_name, :last_name, :phone, :email, :passport_number, :country_id, :state_id, :city_id, NULL, NULL)`,
      {
        candidate_id: candidate.candidate_id,
        first_name: body.first_name ?? null,
        last_name: body.last_name ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        passport_number: body.passport_number ?? null,
        country_id: typeof body.country_id === 'number' ? body.country_id : null,
        state_id: typeof body.state_id === 'number' ? body.state_id : null,
        city_id: typeof body.city_id === 'number' ? body.city_id : null,
      }
    );

    await upsertCandidateProfile(candidate.candidate_id, body);
    return { updated: true };
  }
}
