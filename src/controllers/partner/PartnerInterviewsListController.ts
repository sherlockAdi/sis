import { Body, Controller, Get, Post, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';
import { getPartnerByUserId } from '../../services/partnerService';

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
  job_id: number;
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

    await callProc(
      `CALL sp_rec_applications('UPDATE', :application_id, NULL, NULL, NULL, :status, NULL)`,
      { application_id, status: 'Interview' }
    );

    return { interview_id };
  }
}
