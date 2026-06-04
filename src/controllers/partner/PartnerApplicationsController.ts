import { Controller, Get, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { pool } from '../../db/pool';
import { httpError } from '../../utils/httpErrors';
import { getPartnerByUserId } from '../../services/partnerService';

type PartnerApplicationRow = {
  application_id: number;
  candidate_id: number;
  candidate_name: string;
  phone: string | null;
  email: string | null;
  country_id?: number | null;
  country_name?: string | null;
  state_id?: number | null;
  state_name?: string | null;
  city_id?: number | null;
  city_name?: string | null;
  job_id: number;
  job_title: string;
  job_code: string | null;
  trade_test_required?: 0 | 1 | boolean | null;
  application_date: string | null;
  status: string | null;
};

@Route('partner/applications')
@Tags('Partner')
export class PartnerApplicationsController extends Controller {
  @Get()
  @Security('jwt')
  public async list(@Request() req: any): Promise<PartnerApplicationRow[]> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const partner = await getPartnerByUserId(user.user_id);
    if (!partner?.partner_id) throw httpError(403, 'Partner profile not found');

    const procRows = await callProc<RowDataPacket & PartnerApplicationRow>(
      `CALL sp_rec_applications('LIST_BY_PARTNER', NULL, NULL, NULL, NULL, NULL, :partner_id)`,
      { partner_id: partner.partner_id }
    );
    const rows = await enrichApplicationCandidateLocations(procRows);

    const candidateIds = Array.from(new Set(rows.map((row) => Number(row.candidate_id)).filter(Number.isFinite)));
    if (!candidateIds.length) return rows;

    const placeholders = candidateIds.map((_, index) => `:candidate_id_${index}`).join(', ');
    const params = candidateIds.reduce<Record<string, number>>(
      (acc, candidateId, index) => {
        acc[`candidate_id_${index}`] = candidateId;
        return acc;
      },
      { partner_id: partner.partner_id }
    );
    const [employeeRows] = await pool.query<(RowDataPacket & { candidate_id: number })[]>(
      `SELECT candidate_id
       FROM EMP_T01_employees
       WHERE partner_id = :partner_id
         AND deleted_at IS NULL
         AND candidate_id IN (${placeholders})`,
      params
    );
    const employeeCandidateIds = new Set(employeeRows.map((row) => Number(row.candidate_id)));

    return rows.map((row) =>
      employeeCandidateIds.has(Number(row.candidate_id))
        ? row
        : {
            ...row,
            phone: null,
            email: null,
          }
    );
  }
}

async function enrichApplicationCandidateLocations<T extends PartnerApplicationRow>(rows: T[]): Promise<T[]> {
  const candidateIds = Array.from(new Set(rows.map((row) => Number(row.candidate_id)).filter(Number.isFinite)));
  if (!candidateIds.length) return rows;

  const placeholders = candidateIds.map((_, index) => `:candidate_id_${index}`).join(', ');
  const params = candidateIds.reduce<Record<string, number>>((acc, candidateId, index) => {
    acc[`candidate_id_${index}`] = candidateId;
    return acc;
  }, {});
  const [locationRows] = await pool.query<(RowDataPacket & {
    candidate_id: number;
    country_id: number | null;
    country_name: string | null;
    state_id: number | null;
    state_name: string | null;
    city_id: number | null;
    city_name: string | null;
  })[]>(
    `SELECT c.candidate_id, c.country_id, co.country_name, c.state_id, st.state_name, c.city_id, ci.city_name
     FROM REC_T01_candidates c
     LEFT JOIN LOC_M01_countries co ON co.country_id = c.country_id
     LEFT JOIN LOC_M02_states st ON st.state_id = c.state_id
     LEFT JOIN LOC_M03_cities ci ON ci.city_id = c.city_id
     WHERE c.candidate_id IN (${placeholders})`,
    params
  );
  const byCandidateId = new Map(locationRows.map((row) => [Number(row.candidate_id), row]));
  return rows.map((row) => {
    const location = byCandidateId.get(Number(row.candidate_id));
    return location
      ? {
          ...row,
          country_id: row.country_id ?? location.country_id,
          country_name: row.country_name ?? location.country_name,
          state_id: row.state_id ?? location.state_id,
          state_name: row.state_name ?? location.state_name,
          city_id: row.city_id ?? location.city_id,
          city_name: row.city_name ?? location.city_name,
        }
      : row;
  });
}
