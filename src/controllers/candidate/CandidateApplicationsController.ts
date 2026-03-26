import { Body, Controller, Get, Path, Post, Put, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';
import type { JwtPayload } from '../../security/jwt';

type CandidateRow = {
  candidate_id: number;
  user_id: number | null;
};

type CandidateApplicationRow = {
  application_id: number;
  candidate_id: number;
  candidate_name: string;
  phone: string | null;
  email: string | null;
  job_id: number;
  job_title: string;
  job_code: string | null;
  application_date: string | null;
  status: string | null;
};

type CandidateApplicationDocRow = {
  document_type_id: number;
  document_name: string;
  job_is_required: 0 | 1;
  candidate_document_id: number | null;
  file_path: string | null;
  uploaded_at: string | null;
  is_reused: 0 | 1;
  reused_from_application_id: number | null;
  reused_from_uploaded_at: string | null;
};

type CandidateDocumentLatestRow = {
  file_path: string | null;
  uploaded_at: string | null;
};

type CandidateDocReuseRow = {
  application_id: number;
  uploaded_at: string | null;
};

function requireUser(req: any): JwtPayload {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user?.user_id) throw httpError(401, 'Unauthorized');
  if (!user?.username) throw httpError(401, 'Unauthorized');
  return user;
}

async function getCandidateIdForUser(user_id: number, username: string): Promise<number> {
  const rows = await callProc<RowDataPacket & CandidateRow>(
    `CALL sp_rec_candidates('GET_BY_USER', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :user_id)`,
    { user_id }
  );
  const candidate_id = rows[0]?.candidate_id;
  if (candidate_id) return candidate_id;

  // Keep message actionable while still using only the stored procedure lookup.
  throw httpError(
    404,
    `Candidate profile not found. Link this user to a candidate (user_id=${user_id}, username=${username}) via sp_rec_candidates('SET_USER', ...).`
  );
}

async function assertOwnsApplication(application_id: number, candidate_id: number): Promise<void> {
  const appRows = await callProc<RowDataPacket & { candidate_id: number }>(
    `CALL sp_rec_applications('GET', :application_id, NULL, NULL, NULL, NULL)`,
    { application_id }
  );
  const appCandidateId = appRows[0]?.candidate_id;
  if (!appCandidateId) throw httpError(404, 'Application not found');
  if (appCandidateId !== candidate_id) throw httpError(403, 'Forbidden');
}

async function prefillApplicationDocsFromCandidateHistory(application_id: number, candidate_id: number): Promise<void> {
  const docs = await callProc<RowDataPacket & CandidateApplicationDocRow>(
    `CALL sp_rec_application_documents(:application_id)`,
    { application_id }
  );

  for (const d of docs) {
    const existing = String(d.file_path ?? '').trim();
    if (existing) continue;

    const latest = await callProc<RowDataPacket & CandidateDocumentLatestRow>(
      `SELECT file_path, uploaded_at
       FROM REC_T05_candidate_documents
       WHERE candidate_id = :candidate_id
         AND document_type_id = :document_type_id
         AND file_path IS NOT NULL
         AND file_path <> ''
       ORDER BY uploaded_at DESC
       LIMIT 1`,
      { candidate_id, document_type_id: d.document_type_id }
    );
    const file_path = String(latest[0]?.file_path ?? '').trim();
    if (!file_path) continue;

    await callProc(
      `CALL sp_rec_candidate_documents('UPSERT', NULL, :application_id, :candidate_id, :document_type_id, :file_path)`,
      {
        application_id,
        candidate_id,
        document_type_id: d.document_type_id,
        file_path
      }
    );
  }
}

@Route('candidate/applications')
@Tags('Candidate')
export class CandidateApplicationsController extends Controller {
  @Get()
  @Security('jwt')
  public async list(@Request() req: any): Promise<CandidateApplicationRow[]> {
    const user = requireUser(req);
    const candidate_id = await getCandidateIdForUser(user.user_id, user.username);
    return callProc<RowDataPacket & CandidateApplicationRow>(
      `CALL sp_rec_applications('LIST_BY_CANDIDATE', NULL, :candidate_id, NULL, NULL, NULL)`,
      { candidate_id }
    );
  }

  @Get('{applicationId}')
  @Security('jwt')
  public async get(@Request() req: any, @Path() applicationId: number): Promise<CandidateApplicationRow> {
    const user = requireUser(req);
    const candidate_id = await getCandidateIdForUser(user.user_id, user.username);
    await assertOwnsApplication(applicationId, candidate_id);

    const rows = await callProc<RowDataPacket & CandidateApplicationRow>(
      `CALL sp_rec_applications('LIST_BY_CANDIDATE', NULL, :candidate_id, NULL, NULL, NULL)`,
      { candidate_id }
    );
    const row = rows.find((r) => Number(r.application_id) === Number(applicationId));
    if (!row) throw httpError(404, 'Application not found');
    return row;
  }

  @Post('start')
  @Security('jwt')
  public async start(@Request() req: any, @Body() body: { job_id: number }): Promise<{ application_id: number }> {
    const user = requireUser(req);
    const candidate_id = await getCandidateIdForUser(user.user_id, user.username);
    const job_id = Number((body as any)?.job_id);
    if (!job_id) throw httpError(400, 'job_id is required');

    const rows = await callProc<RowDataPacket & { application_id: number }>(
      `CALL sp_rec_applications('CREATE', NULL, :candidate_id, :job_id, NULL, :status)`,
      { candidate_id, job_id, status: 'Draft' }
    );
    const application_id = rows[0]?.application_id;
    if (!application_id) throw httpError(500, 'Failed to create application');

    // If candidate already uploaded the same document types for any previous application,
    // reuse those file paths for this new application so the user doesn't need to re-upload.
    await prefillApplicationDocsFromCandidateHistory(application_id, candidate_id);

    return { application_id };
  }

  @Post('{applicationId}/submit')
  @Security('jwt')
  public async submit(
    @Request() req: any,
    @Path() applicationId: number,
    @Body() body: { consent: true }
  ): Promise<{ submitted: true }> {
    const user = requireUser(req);
    const candidate_id = await getCandidateIdForUser(user.user_id, user.username);
    await assertOwnsApplication(applicationId, candidate_id);

    const consent = Boolean((body as any)?.consent);
    if (!consent) throw httpError(400, 'Consent is required');

    // Ensure any previously uploaded candidate documents are reused before validating.
    await prefillApplicationDocsFromCandidateHistory(applicationId, candidate_id);

    const docs = await callProc<RowDataPacket & CandidateApplicationDocRow>(
      `CALL sp_rec_application_documents(:application_id)`,
      { application_id: applicationId }
    );
    const missing = docs.filter((d) => Number(d.job_is_required) === 1 && !String(d.file_path ?? '').trim());
    if (missing.length) throw httpError(400, 'Upload all required documents before applying');

    await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_rec_applications('UPDATE', :application_id, NULL, NULL, NULL, :status)`,
      { application_id: applicationId, status: 'Applied' }
    );

    return { submitted: true };
  }

  @Post('apply')
  @Security('jwt')
  public async apply(@Request() req: any, @Body() body: { job_id: number }): Promise<{ application_id: number }> {
    const user = requireUser(req);
    const candidate_id = await getCandidateIdForUser(user.user_id, user.username);
    const job_id = Number((body as any)?.job_id);
    if (!job_id) throw httpError(400, 'job_id is required');

    const rows = await callProc<RowDataPacket & { application_id: number }>(
      `CALL sp_rec_applications('CREATE', NULL, :candidate_id, :job_id, NULL, NULL)`,
      { candidate_id, job_id }
    );
    const application_id = rows[0]?.application_id;
    if (!application_id) throw httpError(500, 'Failed to create application');
    return { application_id };
  }

  @Get('{applicationId}/documents')
  @Security('jwt')
  public async documents(@Request() req: any, @Path() applicationId: number): Promise<CandidateApplicationDocRow[]> {
    const user = requireUser(req);
    const candidate_id = await getCandidateIdForUser(user.user_id, user.username);
    await assertOwnsApplication(applicationId, candidate_id);
    await prefillApplicationDocsFromCandidateHistory(applicationId, candidate_id);

    const docs = await callProc<RowDataPacket & Omit<CandidateApplicationDocRow, 'is_reused' | 'reused_from_application_id' | 'reused_from_uploaded_at'>>(
      `CALL sp_rec_application_documents(:application_id)`,
      { application_id: applicationId }
    );

    const out: CandidateApplicationDocRow[] = [];
    for (const d of docs) {
      const file_path = String(d.file_path ?? '').trim();
      if (!file_path) {
        out.push({
          ...(d as any),
          is_reused: 0,
          reused_from_application_id: null,
          reused_from_uploaded_at: null
        });
        continue;
      }

      const prev = await callProc<RowDataPacket & CandidateDocReuseRow>(
        `SELECT application_id, uploaded_at
         FROM REC_T05_candidate_documents
         WHERE candidate_id = :candidate_id
           AND document_type_id = :document_type_id
           AND file_path = :file_path
           AND application_id <> :application_id
         ORDER BY uploaded_at DESC
         LIMIT 1`,
        {
          candidate_id,
          document_type_id: d.document_type_id,
          file_path,
          application_id: applicationId
        }
      );
      const is_reused = prev[0]?.application_id ? 1 : 0;
      out.push({
        ...(d as any),
        is_reused,
        reused_from_application_id: prev[0]?.application_id ?? null,
        reused_from_uploaded_at: prev[0]?.uploaded_at ?? null
      });
    }

    return out;
  }

  @Put('{applicationId}/documents/{documentTypeId}')
  @Security('jwt')
  public async upsertDocument(
    @Request() req: any,
    @Path() applicationId: number,
    @Path() documentTypeId: number,
    @Body() body: { file_path: string }
  ): Promise<{ updated: true }> {
    const user = requireUser(req);
    const candidate_id = await getCandidateIdForUser(user.user_id, user.username);
    await assertOwnsApplication(applicationId, candidate_id);

    const file_path = String(body?.file_path ?? '').trim();
    if (!file_path) throw httpError(400, 'file_path is required');

    await callProc(
      `CALL sp_rec_candidate_documents('UPSERT', NULL, :application_id, :candidate_id, :document_type_id, :file_path)`,
      {
        application_id: applicationId,
        candidate_id,
        document_type_id: documentTypeId,
        file_path
      }
    );

    return { updated: true };
  }
}
