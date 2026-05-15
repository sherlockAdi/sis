import { Body, Controller, Get, Path, Post, Put, Query, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';
import { sendStatusNotification } from '../../services/notificationService';

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

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? '').trim().toLowerCase();
}

function applicationStatusMeta(status: string | null | undefined): {
  headline: string;
  subjectSuffix: string;
  summary: string;
  nextSteps: string[];
} {
  const s = normalizeStatus(status);
  if (s.includes('interview')) {
    return {
      headline: 'Interview scheduled',
      subjectSuffix: 'Interview scheduled',
      summary: 'An interview has been scheduled for your application.',
      nextSteps: ['Review the interview details in the portal.', 'Be ready with your documents and availability.'],
    };
  }
  if (s.includes('shortlist')) {
    return {
      headline: 'Application shortlisted',
      subjectSuffix: 'Shortlisted',
      summary: 'Your profile has been shortlisted for the next step in the hiring process.',
      nextSteps: ['Keep your phone and email active for the next update.'],
    };
  }
  if (s.includes('select') || s.includes('offer')) {
    return {
      headline: 'Application selected',
      subjectSuffix: 'Selected',
      summary: 'Your application has moved forward in the hiring process.',
      nextSteps: ['Check the portal for offer or next-step instructions.'],
    };
  }
  if (s.includes('deploy') || s === 'ready') {
    return {
      headline: 'Deployment update',
      subjectSuffix: 'Deployment update',
      summary: 'Your application has reached the deployment stage.',
      nextSteps: ['Review deployment details and follow the portal instructions.'],
    };
  }
  if (s.includes('reject')) {
    return {
      headline: 'Application closed',
      subjectSuffix: 'Closed',
      summary: 'Your application status has been updated.',
      nextSteps: ['Review the remarks in the portal, if any, for the closure reason.'],
    };
  }
  if (s.includes('appl')) {
    return {
      headline: 'Job applied',
      subjectSuffix: 'Application submitted',
      summary: 'Your application has been submitted successfully.',
      nextSteps: ['Track the application status in your candidate portal.'],
    };
  }
  return {
    headline: 'Application status updated',
    subjectSuffix: 'Status updated',
    summary: 'Your application status has changed.',
    nextSteps: ['Log in to the portal for the latest update or instructions.'],
  };
}

@Route('recruitment/applications')
@Tags('Recruitment')
export class RecruitmentApplicationsController extends Controller {
  @Get()
  @Security('jwt')
  public async list(): Promise<ApplicationRow[]> {
    return callProc<RowDataPacket & ApplicationRow>(
      `CALL sp_rec_applications('LIST', NULL, NULL, NULL, NULL, NULL, NULL)`
    );
  }

  @Post()
  @Security('jwt')
  public async create(
    @Body() body: { candidate_id: number; job_id: number; application_date?: string | null; status?: string | null }
  ): Promise<{ application_id: number }> {
    const rows = await callProc<RowDataPacket & { application_id: number }>(
      `CALL sp_rec_applications('CREATE', NULL, :candidate_id, :job_id, :application_date, :status, NULL)`,
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

  private async notifyApplicationChange(applicationId: number, headline: string, summary: string, statusLabel: string, nextSteps: string[] = []): Promise<void> {
    const rows = await callProc<RowDataPacket & ApplicationRow>(
      `CALL sp_rec_applications('GET', :application_id, NULL, NULL, NULL, NULL, NULL)`,
      { application_id: applicationId }
    );
    const app = rows[0];
    if (!app) return;

    await sendStatusNotification({
      recipient: {
        name: app.candidate_name,
        email: app.email,
        phone: app.phone,
        whatsapp: app.phone,
      },
      subject: `${app.job_title} - ${statusLabel}`,
      headline,
      statusLabel,
      greeting: `Hello ${app.candidate_name},`,
      summary,
      rows: [
        { label: 'Application ID', value: String(app.application_id) },
        { label: 'Job', value: String(app.job_title) },
        { label: 'Candidate', value: String(app.candidate_name) },
        { label: 'Current Status', value: String(app.status ?? '—') },
      ],
      nextSteps,
    });
  }

  private async notifyApplicationStatus(applicationId: number, previousStatus: string | null | undefined, currentStatus: string | null | undefined): Promise<void> {
    const rows = await callProc<RowDataPacket & ApplicationRow>(
      `CALL sp_rec_applications('GET', :application_id, NULL, NULL, NULL, NULL, NULL)`,
      { application_id: applicationId }
    );
    const app = rows[0];
    if (!app) return;

    const meta = applicationStatusMeta(currentStatus);
    await sendStatusNotification({
      recipient: {
        name: app.candidate_name,
        email: app.email,
        phone: app.phone,
        whatsapp: app.phone,
      },
      subject: `${app.job_title} - ${meta.subjectSuffix}`,
      headline: meta.headline,
      statusLabel: String(currentStatus ?? 'Updated'),
      greeting: `Hello ${app.candidate_name},`,
      summary: previousStatus && normalizeStatus(previousStatus) !== normalizeStatus(currentStatus)
        ? `Your application for ${app.job_title} has moved from "${String(previousStatus)}" to "${String(currentStatus)}". ${meta.summary}`
        : `${meta.summary}`,
      rows: [
        { label: 'Application ID', value: String(app.application_id) },
        { label: 'Job', value: String(app.job_title) },
        { label: 'Candidate', value: String(app.candidate_name) },
        { label: 'Previous Status', value: String(previousStatus ?? '—') },
        { label: 'Current Status', value: String(currentStatus ?? '—') },
      ],
      nextSteps: meta.nextSteps,
    });
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
      `CALL sp_rec_applications('GET', :application_id, NULL, NULL, NULL, NULL, NULL)`,
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

    await callProc(
      `CALL sp_rec_applications('UPDATE', :application_id, NULL, NULL, NULL, :status, NULL)`,
      { application_id: applicationId, status: 'Interview' }
    );

    await this.notifyApplicationStatus(applicationId, 'Applied', 'Interview');

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
      `CALL sp_rec_applications('GET', :application_id, NULL, NULL, NULL, NULL, NULL)`,
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

  @Put('{applicationId}/status')
  @Security('jwt')
  public async updateStatus(
    @Path() applicationId: number,
    @Body() body: { status: string }
  ): Promise<{ updated: true }> {
    const status = String((body as any)?.status ?? '').trim();
    if (!status) throw httpError(400, 'status is required');

    const beforeRows = await callProc<RowDataPacket & ApplicationRow>(
      `CALL sp_rec_applications('GET', :application_id, NULL, NULL, NULL, NULL, NULL)`,
      { application_id: applicationId }
    );
    const before = beforeRows[0];

    await callProc(
      `CALL sp_rec_applications('UPDATE', :application_id, NULL, NULL, NULL, :status, NULL)`,
      { application_id: applicationId, status }
    );

    const afterRows = await callProc<RowDataPacket & ApplicationRow>(
      `CALL sp_rec_applications('GET', :application_id, NULL, NULL, NULL, NULL, NULL)`,
      { application_id: applicationId }
    );
    const after = afterRows[0];
    if (after && String(before?.status ?? '').trim() !== String(after.status ?? '').trim()) {
      await this.notifyApplicationStatus(applicationId, before?.status, after.status);
    }
    return { updated: true };
  }
}
