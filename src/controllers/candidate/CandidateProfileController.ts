import { Body, Controller, Get, Put, Request, Route, Security, Tags } from 'tsoa';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../../db/pool';
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

type CandidateTradeLinkInput = {
  id?: string | null;
  title?: string | null;
  url?: string | null;
};

type CandidateTradeTestRow = {
  candidate_id: number;
  trade_video_file_path: string | null;
  trade_video_file_name: string | null;
  trade_video_file_size: number | null;
  trade_video_uploaded_at: string | null;
  trade_video_source: string | null;
  trade_video_external_file_id: string | null;
  trade_video_external_file_url: string | null;
  trade_video_links_json: string | null;
  created_at: string;
  updated_at: string;
};

type CandidateTradeTestResponse = {
  candidate_id: number;
  trade_video_file_path: string | null;
  trade_video_file_name: string | null;
  trade_video_file_size: number | null;
  trade_video_uploaded_at: string | null;
  trade_video_source: string;
  trade_video_external_file_id: string | null;
  trade_video_external_file_url: string | null;
  trade_video_links: Array<{ id: string; title: string; url: string }>;
  created_at: string;
  updated_at: string;
};

type CandidateTradeTestUpdateBody = {
  trade_video_file_path?: string | null;
  trade_video_file_name?: string | null;
  trade_video_file_size?: number | null;
  trade_video_uploaded_at?: string | null;
  trade_video_source?: string | null;
  trade_video_external_file_id?: string | null;
  trade_video_external_file_url?: string | null;
  trade_video_links?: CandidateTradeLinkInput[];
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

function toNullableNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toMysqlDatetime(value: string | null | undefined): string | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;

  const pad = (n: number) => String(n).padStart(2, '0');
  return [
    date.getUTCFullYear(),
    '-',
    pad(date.getUTCMonth() + 1),
    '-',
    pad(date.getUTCDate()),
    ' ',
    pad(date.getUTCHours()),
    ':',
    pad(date.getUTCMinutes()),
    ':',
    pad(date.getUTCSeconds()),
  ].join('');
}

function normalizeTradeLinks(value: unknown): Array<{ id: string; title: string; url: string }> {
  const raw = Array.isArray(value) ? value : [];
  return raw
    .map((item, index) => {
      if (typeof item === 'string') {
        const url = String(item ?? '').trim();
        return url ? { id: `link_${index}`, title: '', url } : null;
      }

      if (!item || typeof item !== 'object') return null;
      const row = item as CandidateTradeLinkInput;
      const url = toNull(row.url);
      if (!url) return null;
      return {
        id: toNull(row.id) || `link_${index}`,
        title: toNull(row.title) || '',
        url,
      };
    })
    .filter((item): item is { id: string; title: string; url: string } => Boolean(item));
}

async function getTradeTestForCandidate(candidate_id: number): Promise<CandidateTradeTestResponse> {
  const [rows] = await pool.query<(RowDataPacket & CandidateTradeTestRow)[]>(
    `SELECT candidate_id, trade_video_file_path, trade_video_file_name, trade_video_file_size, trade_video_uploaded_at, trade_video_source, trade_video_external_file_id, trade_video_external_file_url, trade_video_links_json, created_at, updated_at
     FROM REC_T04_candidate_trade_tests
     WHERE candidate_id = :candidate_id
     LIMIT 1`,
    { candidate_id }
  );

  const row = rows[0];
  if (!row) {
    return {
      candidate_id,
      trade_video_file_path: null,
      trade_video_file_name: null,
      trade_video_file_size: null,
      trade_video_uploaded_at: null,
      trade_video_source: 'storage',
      trade_video_external_file_id: null,
      trade_video_external_file_url: null,
      trade_video_links: [],
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
    };
  }

  let trade_video_links: Array<{ id: string; title: string; url: string }> = [];
  if (row.trade_video_links_json) {
    try {
      trade_video_links = normalizeTradeLinks(JSON.parse(row.trade_video_links_json));
    } catch {
      trade_video_links = [];
    }
  }

  return {
    candidate_id: row.candidate_id,
    trade_video_file_path: row.trade_video_file_path,
    trade_video_file_name: row.trade_video_file_name,
    trade_video_file_size: row.trade_video_file_size === null ? null : Number(row.trade_video_file_size),
    trade_video_uploaded_at: row.trade_video_uploaded_at,
    trade_video_source: row.trade_video_source ?? 'storage',
    trade_video_external_file_id: row.trade_video_external_file_id ?? null,
    trade_video_external_file_url: row.trade_video_external_file_url ?? null,
    trade_video_links,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function upsertTradeTestForCandidate(candidate_id: number, body: CandidateTradeTestUpdateBody): Promise<void> {
  const links = normalizeTradeLinks(body.trade_video_links ?? []);
  await pool.query<ResultSetHeader>(
    `INSERT INTO REC_T04_candidate_trade_tests
      (candidate_id, trade_video_file_path, trade_video_file_name, trade_video_file_size, trade_video_uploaded_at, trade_video_source, trade_video_external_file_id, trade_video_external_file_url, trade_video_links_json)
     VALUES
      (:candidate_id, :trade_video_file_path, :trade_video_file_name, :trade_video_file_size, :trade_video_uploaded_at, :trade_video_source, :trade_video_external_file_id, :trade_video_external_file_url, :trade_video_links_json)
     ON DUPLICATE KEY UPDATE
      trade_video_file_path = VALUES(trade_video_file_path),
      trade_video_file_name = VALUES(trade_video_file_name),
      trade_video_file_size = VALUES(trade_video_file_size),
      trade_video_uploaded_at = VALUES(trade_video_uploaded_at),
      trade_video_source = VALUES(trade_video_source),
      trade_video_external_file_id = VALUES(trade_video_external_file_id),
      trade_video_external_file_url = VALUES(trade_video_external_file_url),
      trade_video_links_json = VALUES(trade_video_links_json)`,
    {
      candidate_id,
      trade_video_file_path: toNull(body.trade_video_file_path),
      trade_video_file_name: toNull(body.trade_video_file_name),
      trade_video_file_size: toNullableNumber(body.trade_video_file_size),
      trade_video_uploaded_at: toMysqlDatetime(body.trade_video_uploaded_at),
      trade_video_source: toNull(body.trade_video_source) || 'storage',
      trade_video_external_file_id: toNull(body.trade_video_external_file_id),
      trade_video_external_file_url: toNull(body.trade_video_external_file_url),
      trade_video_links_json: JSON.stringify(links),
    }
  );
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

  @Get('trade-test')
  @Security('jwt')
  public async tradeTest(@Request() req: any): Promise<CandidateTradeTestResponse> {
    const user = requireUser(req);
    const candidate = await getCandidateForUser(user.user_id);
    return getTradeTestForCandidate(candidate.candidate_id);
  }

  @Put('trade-test')
  @Security('jwt')
  public async updateTradeTest(
    @Request() req: any,
    @Body() body: CandidateTradeTestUpdateBody
  ): Promise<{ updated: true }> {
    const user = requireUser(req);
    const candidate = await getCandidateForUser(user.user_id);
    await upsertTradeTestForCandidate(candidate.candidate_id, body);
    return { updated: true };
  }
}
