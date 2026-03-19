import { Body, Controller, Get, Path, Post, Put, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';

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
};

function requireUserId(req: any): number {
  const user = (req as any).user as { user_id?: number } | undefined;
  if (!user?.user_id) throw httpError(401, 'Unauthorized');
  return user.user_id;
}

async function getCandidateIdForUser(user_id: number): Promise<number> {
  const rows = await callProc<RowDataPacket & CandidateRow>(
    `CALL sp_rec_candidates('GET_BY_USER', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :user_id)`,
    { user_id }
  );
  const candidate_id = rows[0]?.candidate_id;
  if (!candidate_id) throw httpError(404, 'Candidate profile not found');
  return candidate_id;
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

@Route('candidate/applications')
@Tags('Candidate')
export class CandidateApplicationsController extends Controller {
  @Get()
  @Security('jwt')
  public async list(@Request() req: any): Promise<CandidateApplicationRow[]> {
    const user_id = requireUserId(req);
    const candidate_id = await getCandidateIdForUser(user_id);
    return callProc<RowDataPacket & CandidateApplicationRow>(
      `CALL sp_rec_applications('LIST_BY_CANDIDATE', NULL, :candidate_id, NULL, NULL, NULL)`,
      { candidate_id }
    );
  }

  @Post('apply')
  @Security('jwt')
  public async apply(@Request() req: any, @Body() body: { job_id: number }): Promise<{ application_id: number }> {
    const user_id = requireUserId(req);
    const candidate_id = await getCandidateIdForUser(user_id);
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
    const user_id = requireUserId(req);
    const candidate_id = await getCandidateIdForUser(user_id);
    await assertOwnsApplication(applicationId, candidate_id);
    return callProc<RowDataPacket & CandidateApplicationDocRow>(
      `CALL sp_rec_application_documents(:application_id)`,
      { application_id: applicationId }
    );
  }

  @Put('{applicationId}/documents/{documentTypeId}')
  @Security('jwt')
  public async upsertDocument(
    @Request() req: any,
    @Path() applicationId: number,
    @Path() documentTypeId: number,
    @Body() body: { file_path: string }
  ): Promise<{ updated: true }> {
    const user_id = requireUserId(req);
    const candidate_id = await getCandidateIdForUser(user_id);
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
