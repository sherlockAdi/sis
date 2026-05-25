import { Controller, Get, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../../db/pool';
import { httpError } from '../../utils/httpErrors';
import { getPartnerByUserId } from '../../services/partnerService';

type PartnerTradeTestRow = {
  trade_test_id: number;
  application_id: number;
  candidate_id: number;
  candidate_name: string;
  phone: string | null;
  email: string | null;
  job_id: number;
  job_title: string;
  job_code: string | null;
  partner_id: number;
  partner_name: string | null;
  trade_test_required: 0 | 1 | boolean | null;
  application_status: string | null;
  review_status: string | null;
  deployment_id: number | null;
  trade_video_file_path: string | null;
  trade_video_file_name: string | null;
  trade_video_file_size: number | null;
  trade_video_uploaded_at: string | null;
  certificate_file_path: string | null;
  certificate_file_name: string | null;
  certificate_file_size: number | null;
  certificate_uploaded_at: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
};

@Route('partner/deployment-zone/trade-tests')
@Tags('Partner')
export class PartnerTradeTestsController extends Controller {
  @Get()
  @Security('jwt')
  public async list(@Request() req: any): Promise<PartnerTradeTestRow[]> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const partner = await getPartnerByUserId(user.user_id);
    if (!partner?.partner_id) throw httpError(403, 'Partner profile not found');

    const [rows] = await pool.query<(RowDataPacket & PartnerTradeTestRow)[]>(
      `SELECT
         COALESCE(tt.trade_test_id, 0) AS trade_test_id,
         a.application_id,
         a.candidate_id,
         CONCAT_WS(' ', c.first_name, c.last_name) AS candidate_name,
         c.phone,
         c.email,
         a.job_id,
         j.job_title,
         j.job_code,
         j.partner_id,
         p.partner_name,
         j.trade_test_required,
         a.status AS application_status,
         tt.review_status,
         dep.deployment_id,
         tt.trade_video_file_path,
         tt.trade_video_file_name,
         tt.trade_video_file_size,
         tt.trade_video_uploaded_at,
         tt.certificate_file_path,
         tt.certificate_file_name,
         tt.certificate_file_size,
         tt.certificate_uploaded_at,
         tt.remarks,
         tt.created_at,
         tt.updated_at
       FROM REC_T02_applications a
       JOIN REC_T01_candidates c ON c.candidate_id = a.candidate_id
       JOIN JOB_T01_jobs j ON j.job_id = a.job_id
       LEFT JOIN PART_T01_partners p ON p.partner_id = j.partner_id
       LEFT JOIN DEP_T01_deployments dep ON dep.application_id = a.application_id
       LEFT JOIN REC_T06_application_trade_tests tt ON tt.application_id = a.application_id
       WHERE j.partner_id = :partner_id
         AND (j.trade_test_required = 1 OR tt.trade_test_id IS NOT NULL)
       ORDER BY a.application_id DESC`,
      { partner_id: partner.partner_id }
    );

    return rows;
  }
}
