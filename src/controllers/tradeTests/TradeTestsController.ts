import { Body, Controller, Get, Path, Post, Put, Request, Route, Security, Tags } from 'tsoa';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { pool } from '../../db/pool';
import { httpError } from '../../utils/httpErrors';
import type { JwtPayload } from '../../security/jwt';

type TradeTestRow = {
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

type TradeTestUpsertBody = {
  review_status?: string | null;
  trade_video_file_path?: string | null;
  trade_video_file_name?: string | null;
  trade_video_file_size?: number | null;
  certificate_file_path?: string | null;
  certificate_file_name?: string | null;
  certificate_file_size?: number | null;
  remarks?: string | null;
};

function requireUser(req: any): JwtPayload {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user?.user_id) throw httpError(401, 'Unauthorized');
  return user;
}

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? '').trim().toLowerCase();
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

async function getTradeTestRow(application_id: number): Promise<TradeTestRow | null> {
  const [rows] = await pool.query<(RowDataPacket & TradeTestRow)[]>(
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
     WHERE a.application_id = :application_id
     LIMIT 1`,
    { application_id }
  );

  return rows[0] ?? null;
}

async function listTradeTestsWhere(sqlWhere: string, params: Record<string, any>): Promise<TradeTestRow[]> {
  const [rows] = await pool.query<(RowDataPacket & TradeTestRow)[]>(
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
     ${sqlWhere}
     ORDER BY a.application_id DESC`,
    params
  );
  return rows;
}

@Route('trade-test/submissions')
@Tags('Trade Tests')
export class TradeTestsController extends Controller {
  @Get()
  @Security('jwt')
  public async list(): Promise<TradeTestRow[]> {
    return listTradeTestsWhere(
      `WHERE j.trade_test_required = 1 OR tt.trade_test_id IS NOT NULL`,
      {}
    );
  }

  @Get('{applicationId}')
  @Security('jwt')
  public async get(@Path() applicationId: number): Promise<TradeTestRow> {
    const row = await getTradeTestRow(applicationId);
    if (!row) throw httpError(404, 'Trade test record not found');
    return row;
  }

  @Put('{applicationId}')
  @Security('jwt')
  public async upsert(
    @Path() applicationId: number,
    @Body() body: TradeTestUpsertBody,
    @Request() req: any
  ): Promise<{ trade_test_id: number; deployment_id: number | null; deployment_created: boolean; application_status: string | null }> {
    const user = requireUser(req);

    const current = await getTradeTestRow(applicationId);
    if (!current) throw httpError(404, 'Application not found');

    const reviewStatus = toNull(body.review_status) ?? 'Pending';
    const tradeVideoFilePath = toNull(body.trade_video_file_path);
    const certificateFilePath = toNull(body.certificate_file_path);
    if (normalizeStatus(reviewStatus).includes('pass')) {
      const existingVideoFilePath = toNull(current.trade_video_file_path);
      const existingCertificateFilePath = toNull(current.certificate_file_path);
      if (!tradeVideoFilePath && !existingVideoFilePath) {
        throw httpError(400, 'Trade video is required before marking the trade test as Passed');
      }
      if (!certificateFilePath && !existingCertificateFilePath) {
        throw httpError(400, 'Certificate is required before marking the trade test as Passed');
      }
    }

    await pool.query<ResultSetHeader>(
      `INSERT INTO REC_T06_application_trade_tests (
         application_id,
         candidate_id,
         job_id,
         partner_id,
         trade_test_required,
         trade_video_file_path,
         trade_video_file_name,
         trade_video_file_size,
         trade_video_uploaded_at,
         certificate_file_path,
         certificate_file_name,
         certificate_file_size,
         certificate_uploaded_at,
         review_status,
         remarks,
         created_by,
         updated_by
       ) VALUES (
         :application_id,
         :candidate_id,
         :job_id,
         :partner_id,
         :trade_test_required,
         :trade_video_file_path,
         :trade_video_file_name,
         :trade_video_file_size,
         CASE WHEN :trade_video_file_path IS NULL THEN NULL ELSE CURRENT_TIMESTAMP END,
         :certificate_file_path,
         :certificate_file_name,
         :certificate_file_size,
         CASE WHEN :certificate_file_path IS NULL THEN NULL ELSE CURRENT_TIMESTAMP END,
         :review_status,
         :remarks,
         :user_id,
         :user_id
       )
       ON DUPLICATE KEY UPDATE
         candidate_id = VALUES(candidate_id),
         job_id = VALUES(job_id),
         partner_id = VALUES(partner_id),
         trade_test_required = VALUES(trade_test_required),
         trade_video_file_path = COALESCE(VALUES(trade_video_file_path), trade_video_file_path),
         trade_video_file_name = COALESCE(VALUES(trade_video_file_name), trade_video_file_name),
         trade_video_file_size = COALESCE(VALUES(trade_video_file_size), trade_video_file_size),
         trade_video_uploaded_at = CASE
           WHEN VALUES(trade_video_file_path) IS NOT NULL THEN CURRENT_TIMESTAMP
           ELSE trade_video_uploaded_at
         END,
         certificate_file_path = COALESCE(VALUES(certificate_file_path), certificate_file_path),
         certificate_file_name = COALESCE(VALUES(certificate_file_name), certificate_file_name),
         certificate_file_size = COALESCE(VALUES(certificate_file_size), certificate_file_size),
         certificate_uploaded_at = CASE
           WHEN VALUES(certificate_file_path) IS NOT NULL THEN CURRENT_TIMESTAMP
           ELSE certificate_uploaded_at
         END,
         review_status = COALESCE(NULLIF(VALUES(review_status), ''), review_status),
         remarks = COALESCE(VALUES(remarks), remarks),
         updated_by = VALUES(updated_by)`,
      {
        application_id: current.application_id,
        candidate_id: current.candidate_id,
        job_id: current.job_id,
        partner_id: current.partner_id,
        trade_test_required: Boolean(current.trade_test_required) ? 1 : 0,
        trade_video_file_path: tradeVideoFilePath,
        trade_video_file_name: toNull(body.trade_video_file_name),
        trade_video_file_size: toNullableNumber(body.trade_video_file_size),
        certificate_file_path: certificateFilePath,
        certificate_file_name: toNull(body.certificate_file_name),
        certificate_file_size: toNullableNumber(body.certificate_file_size),
        review_status: reviewStatus,
        remarks: toNull(body.remarks),
        user_id: user.user_id,
      }
    );

    const saved = await getTradeTestRow(applicationId);
    if (!saved) throw httpError(500, 'Failed to save trade test');

    let deploymentId = saved.deployment_id ?? null;
    let deploymentCreated = false;
    if (normalizeStatus(saved.review_status).includes('pass')) {
      const depRows = await callProc<RowDataPacket & { deployment_id: number }>(
        `CALL sp_dep_deployments('GET_BY_APPLICATION', NULL, :application_id, NULL, NULL, NULL, NULL)`,
        { application_id: applicationId }
      );
      deploymentId = depRows[0]?.deployment_id ?? null;
      if (!deploymentId) {
        const createdRows = await callProc<RowDataPacket & { deployment_id: number }>(
          `CALL sp_dep_deployments('CREATE', NULL, :application_id, 'Ready', NULL, :remarks, :user_id)`,
          {
            application_id: applicationId,
            remarks: saved.remarks ?? null,
            user_id: user.user_id,
          }
        );
        deploymentId = createdRows[0]?.deployment_id ?? null;
        deploymentCreated = Boolean(deploymentId);
      } else {
        await callProc(
          `CALL sp_dep_deployments('SET_STATUS', :deployment_id, NULL, 'Ready', NULL, :remarks, :user_id)`,
          {
            deployment_id: deploymentId,
            remarks: saved.remarks ?? null,
            user_id: user.user_id,
          }
        );
      }

      await callProc(
        `CALL sp_rec_applications('UPDATE', :application_id, NULL, NULL, NULL, 'Ready', NULL)`,
        { application_id: applicationId }
      );
    }

    return {
      trade_test_id: saved.trade_test_id,
      deployment_id: deploymentId,
      deployment_created: deploymentCreated,
      application_status: normalizeStatus(saved.review_status).includes('pass') ? 'Ready' : saved.application_status,
    };
  }
}
