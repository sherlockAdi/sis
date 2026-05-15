import { Body, Controller, Get, Post, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';
import { getPartnerByUserId } from '../../services/partnerService';
import { sendStatusNotification } from '../../services/notificationService';

type PartnerInterviewRow = {
  interview_id: number;
  application_id: number;
  candidate_id: number;
  candidate_name: string;
  job_id: number;
  job_title: string;
  mode_name: string | null;
  interview_date: string | null;
  result: string | null;
  remarks: string | null;
};

type PartnerApplicationRow = {
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

type CandidateContactRow = {
  candidate_id: number;
  candidate_code: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
};

type PartnerApplicationDetailRow = {
  application_id: number;
  job_id: number;
  candidate_id: number;
  candidate_name: string;
  phone: string | null;
  email: string | null;
  job_title: string;
  job_code: string | null;
  application_date: string | null;
  status: string | null;
};

type ScheduleInterviewBody = {
  application_id: number;
  interview_mode_id: number;
  interview_date: string;
  remarks?: string | null;
};

@Route('partner/interviews')
@Tags('Partner')
export class PartnerInterviewsListController extends Controller {
  @Get()
  @Security('jwt')
  public async list(@Request() req: any): Promise<PartnerInterviewRow[]> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const partner = await getPartnerByUserId(user.user_id);
    if (!partner?.partner_id) throw httpError(403, 'Partner profile not found');

    return callProc<RowDataPacket & PartnerInterviewRow>(
      `CALL sp_rec_partner_interviews(:partner_id)`,
      { partner_id: partner.partner_id }
    );
  }

  @Post()
  @Security('jwt')
  public async schedule(@Body() body: ScheduleInterviewBody, @Request() req: any): Promise<{ interview_id: number }> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const partner = await getPartnerByUserId(user.user_id);
    if (!partner?.partner_id) throw httpError(403, 'Partner profile not found');

    const application_id = Number((body as any)?.application_id);
    const interview_mode_id = Number((body as any)?.interview_mode_id);
    const interview_date = String((body as any)?.interview_date ?? '').trim();
    if (!application_id) throw httpError(400, 'application_id is required');
    if (!interview_mode_id) throw httpError(400, 'interview_mode_id is required');
    if (!interview_date) throw httpError(400, 'interview_date is required');

    const apps = await callProc<RowDataPacket & PartnerApplicationRow>(
      `CALL sp_rec_applications('LIST_BY_PARTNER', NULL, NULL, NULL, NULL, NULL, :partner_id)`,
      { partner_id: partner.partner_id }
    );
    if (!apps.some((a) => Number(a.application_id) === Number(application_id))) {
      throw httpError(403, 'Forbidden');
    }

    const rows = await callProc<RowDataPacket & { interview_id: number }>(
      `CALL sp_rec_interviews('CREATE', NULL, :application_id, :interview_mode_id, :interview_date, NULL, :remarks)`,
      {
        application_id,
        interview_mode_id,
        interview_date,
        remarks: body.remarks ?? null
      }
    );
    const interview_id = rows[0]?.interview_id;
    if (!interview_id) throw httpError(500, 'Failed to schedule interview');

    const interviewRows = await callProc<RowDataPacket & PartnerInterviewRow>(
      `CALL sp_rec_interviews('LIST_BY_APPLICATION', NULL, :application_id, NULL, NULL, NULL, NULL)`,
      { application_id }
    );
    const interview = interviewRows.find((row) => Number(row.interview_id) === Number(interview_id));

    await callProc(
      `CALL sp_rec_applications('UPDATE', :application_id, NULL, NULL, NULL, :status, NULL)`,
      { application_id, status: 'Interview' }
    );

    const appRows = await callProc<RowDataPacket & PartnerApplicationDetailRow>(
      `CALL sp_rec_applications('LIST_BY_PARTNER', NULL, NULL, NULL, NULL, NULL, :partner_id)`,
      { partner_id: partner.partner_id }
    );
    const app = appRows.find((row) => Number(row.application_id) === Number(application_id));
    const candidateRows = app?.candidate_id
      ? await callProc<RowDataPacket & CandidateContactRow>(
          `CALL sp_rec_candidates('GET', :candidate_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
          { candidate_id: app.candidate_id }
        )
      : [];
    const candidate = candidateRows[0];

    if (app && candidate) {
      const recipientName = String(app.candidate_name ?? `${candidate.first_name ?? ''} ${candidate.last_name ?? ''}`.trim()).trim() || 'Candidate';
      const recipientEmail = app.email ?? candidate.email ?? null;
      const recipientPhone = app.phone ?? candidate.phone ?? null;
      const interviewDate = interview?.interview_date ?? interview_date;
      const interviewMode = interview?.mode_name ?? 'Interview';
      const interviewRemarks = interview?.remarks ?? body.remarks ?? null;
      console.log('[partner/interview] notification source', JSON.stringify({
        application_id,
        candidate_id: app.candidate_id,
        candidate_name: app.candidate_name,
        job_title: app.job_title,
        email: recipientEmail,
        phone: recipientPhone,
        interview_date: interviewDate,
        interview_mode: interviewMode,
        interview_remarks: interviewRemarks,
      }));
      await sendStatusNotification({
        recipient: {
          name: recipientName,
          email: recipientEmail,
          phone: recipientPhone,
          whatsapp: recipientPhone,
        },
        subject: `${app.job_title} - Interview scheduled`,
        headline: 'Interview scheduled',
        statusLabel: 'Interview',
        greeting: `Hello ${recipientName},`,
        summary: `An interview has been scheduled for your application to ${app.job_title}.`,
        rows: [
          { label: 'Job', value: String(app.job_title) },
          { label: 'Candidate', value: recipientName },
          { label: 'Candidate Email', value: String(recipientEmail ?? '—') },
          { label: 'Candidate Phone', value: String(recipientPhone ?? '—') },
          { label: 'Interview Mode', value: String(interviewMode ?? '—') },
          { label: 'Interview Date', value: String(interviewDate ?? '—') },
          { label: 'Interview Remarks', value: String(interviewRemarks ?? '—') },
          { label: 'Current Status', value: String(app.status ?? 'Interview') },
        ],
        nextSteps: [
          'Check the portal for interview timing and instructions.',
          'Read the interview remarks carefully before attending.',
        ],
      });
    } else {
      console.log('[partner/interview] notification skipped', JSON.stringify({
        application_id,
        has_application: Boolean(app),
        has_candidate: Boolean(candidate),
      }));
    }

    return { interview_id };
  }
}
