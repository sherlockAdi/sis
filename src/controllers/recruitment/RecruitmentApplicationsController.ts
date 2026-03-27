import { Body, Controller, Get, Path, Post, Put, Query, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';

type ApplicationRow = {
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

type ApplicationDocRow = {
  document_type_id: number;
  document_name: string;
  job_is_required: 0 | 1;
  candidate_document_id: number | null;
  file_path: string | null;
  uploaded_at: string | null;
};

type ApplicationInterviewRow = {
  interview_id: number;
  application_id: number;
  interview_mode_id: number | null;
  mode_name: string | null;
  interview_date: string | null;
  result: string | null;
  remarks: string | null;
};

@Route('recruitment/applications')
@Tags('Recruitment')
export class RecruitmentApplicationsController extends Controller {
  @Get()
  @Security('jwt')
  public async list(): Promise<ApplicationRow[]> {
    return callProc<RowDataPacket & ApplicationRow>(
      `CALL sp_rec_applications('LIST', NULL, NULL, NULL, NULL, NULL)`
    );
  }

  @Post()
  @Security('jwt')
  public async create(
    @Body() body: { candidate_id: number; job_id: number; application_date?: string | null; status?: string | null }
  ): Promise<{ application_id: number }> {
    const rows = await callProc<RowDataPacket & { application_id: number }>(
      `CALL sp_rec_applications('CREATE', NULL, :candidate_id, :job_id, :application_date, :status)`,
      {
        candidate_id: body.candidate_id,
        job_id: body.job_id,
        application_date: body.application_date ?? null,
        status: body.status ?? null
      }
    );
    const application_id = rows[0]?.application_id;
    if (!application_id) throw httpError(500, 'Failed to create application');
    return { application_id };
  }

  @Get('{applicationId}/documents')
  @Security('jwt')
  public async documents(@Path() applicationId: number): Promise<ApplicationDocRow[]> {
    return callProc<RowDataPacket & ApplicationDocRow>(
      `CALL sp_rec_application_documents(:application_id)`,
      { application_id: applicationId }
    );
  }

  @Get('{applicationId}/interviews')
  @Security('jwt')
  public async interviews(@Path() applicationId: number): Promise<ApplicationInterviewRow[]> {
    return callProc<RowDataPacket & ApplicationInterviewRow>(
      `CALL sp_rec_interviews('LIST_BY_APPLICATION', NULL, :application_id, NULL, NULL, NULL, NULL)`,
      { application_id: applicationId }
    );
  }

  @Post('{applicationId}/interviews')
  @Security('jwt')
  public async scheduleInterview(
    @Path() applicationId: number,
    @Body() body: { interview_mode_id: number; interview_date: string; remarks?: string | null }
  ): Promise<{ interview_id: number }> {
    const interview_mode_id = Number((body as any)?.interview_mode_id);
    const interview_date = String((body as any)?.interview_date ?? '').trim();
    if (!interview_mode_id) throw httpError(400, 'interview_mode_id is required');
    if (!interview_date) throw httpError(400, 'interview_date is required');

    // Ensure application exists
    const appRows = await callProc<RowDataPacket & { application_id: number }>(
      `CALL sp_rec_applications('GET', :application_id, NULL, NULL, NULL, NULL)`,
      { application_id: applicationId }
    );
    if (!appRows[0]?.application_id) throw httpError(404, 'Application not found');

    const rows = await callProc<RowDataPacket & { interview_id: number }>(
      `CALL sp_rec_interviews('CREATE', NULL, :application_id, :interview_mode_id, :interview_date, NULL, :remarks)`,
      {
        application_id: applicationId,
        interview_mode_id,
        interview_date,
        remarks: body.remarks ?? null
      }
    );
    const interview_id = rows[0]?.interview_id;
    if (!interview_id) throw httpError(500, 'Failed to schedule interview');
    return { interview_id };
  }

  @Put('{applicationId}/documents/{documentTypeId}')
  @Security('jwt')
  public async upsertDocument(
    @Path() applicationId: number,
    @Path() documentTypeId: number,
    @Body() body: { file_path: string },
    @Request() req: any
  ): Promise<{ updated: true }> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const file_path = String(body?.file_path ?? '').trim();
    if (!file_path) throw httpError(400, 'file_path is required');

    const appRows = await callProc<RowDataPacket & { candidate_id: number }>(
      `CALL sp_rec_applications('GET', :application_id, NULL, NULL, NULL, NULL)`,
      { application_id: applicationId }
    );
    const candidate_id = appRows[0]?.candidate_id;
    if (!candidate_id) throw httpError(404, 'Application not found');

    await callProc(
      `CALL sp_rec_candidate_documents('UPSERT', NULL, :candidate_id, :document_type_id, :file_path)`,
      {
        candidate_id,
        document_type_id: documentTypeId,
        file_path
      }
    );

    return { updated: true };
  }
}
