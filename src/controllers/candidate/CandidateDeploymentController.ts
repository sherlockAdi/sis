import { Body, Controller, Get, Put, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';
import { sendStatusNotification } from '../../services/notificationService';

type CandidateDeploymentRow = {
  deployment_id: number;
  application_id: number;
  candidate_id: number;
  candidate_name: string;
  phone: string | null;
  email: string | null;
  job_id: number;
  job_title: string;
  job_code: string | null;
  current_status: string | null;
  visa_type_id: number | null;
  visa_type_name: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
};

@Route('candidate/deployment')
@Tags('Candidate')
export class CandidateDeploymentController extends Controller {
  @Get()
  @Security('jwt')
  public async list(@Request() req: any): Promise<CandidateDeploymentRow[]> {
    const user = (req as any).user as { user_id?: number; username?: string } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const candRows = await callProc<RowDataPacket & { candidate_id: number }>(
      `CALL sp_rec_candidates('GET_BY_USER', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :user_id)`,
      { user_id: user.user_id }
    );
    const candidate_id = candRows[0]?.candidate_id;
    if (!candidate_id) throw httpError(404, 'Candidate profile not found');

    return callProc<RowDataPacket & CandidateDeploymentRow>(
      `CALL sp_dep_deployments('LIST_BY_CANDIDATE', NULL, :candidate_id, NULL, NULL, NULL, NULL)`,
      { candidate_id }
    );
  }

  @Put('visa-details')
  @Security('jwt')
  public async upsertVisaDetails(
    @Body()
    body: {
      deployment_id: number;
      offer_date?: string | null;
      offer_letter_file_path?: string | null;
      isaccepted?: boolean | null;
      offer_payment_received?: number | null;
      offer_remarks?: string | null;
      visa_type_id?: number | null;
      visa_number?: string | null;
      issue_date?: string | null;
      expiry_date?: string | null;
      passport_number?: string | null;
      passport_issue_date?: string | null;
      passport_expiry_date?: string | null;
      sponsor_id?: string | null;
      sponsor_contact?: string | null;
      passport_file_path?: string | null;
      visa_file_path?: string | null;
      visa_payment_received?: number | null;
      visa_remarks?: string | null;
      ticket_number?: string | null;
      booked_date?: string | null;
      travel_date?: string | null;
      ticket_file_path?: string | null;
      ticket_remarks?: string | null;
      remarks?: string | null;
    },
    @Request() req: any
  ): Promise<{ visa_detail_id: number }> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const deployment_id = Number((body as any)?.deployment_id);
    if (!deployment_id) throw httpError(400, 'deployment_id is required');

    const candRows = await callProc<RowDataPacket & { candidate_id: number }>(
      `CALL sp_rec_candidates('GET_BY_USER', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :user_id)`,
      { user_id: user.user_id }
    );
    const candidate_id = candRows[0]?.candidate_id;
    if (!candidate_id) throw httpError(404, 'Candidate profile not found');

    const depRows = await callProc<RowDataPacket & { deployment_id: number }>(
      `CALL sp_dep_deployments('LIST_BY_CANDIDATE', NULL, :candidate_id, NULL, NULL, NULL, NULL)`,
      { candidate_id }
    );
    const allowed = depRows.some((d) => d.deployment_id === deployment_id);
    if (!allowed) throw httpError(403, 'Access denied');

    const rows = await callProc<RowDataPacket & { visa_detail_id: number }>(
      `CALL sp_dep_visa_details('UPSERT', NULL, :deployment_id, :offer_date, :offer_letter_file_path, :isaccepted, :offer_payment_received, :offer_remarks, :visa_type_id, :visa_number, :issue_date, :expiry_date, :passport_number, :passport_issue_date, :passport_expiry_date, :sponsor_id, :sponsor_contact, :passport_file_path, :visa_file_path, :visa_payment_received, :visa_remarks, :ticket_number, :booked_date, :travel_date, :ticket_file_path, :ticket_remarks, :remarks, :user_id)`,
      {
        deployment_id,
        offer_date: body.offer_date ?? null,
        offer_letter_file_path: body.offer_letter_file_path ?? null,
        isaccepted: body.isaccepted == null ? null : body.isaccepted ? 1 : 0,
        offer_payment_received: body.offer_payment_received ?? null,
        offer_remarks: body.offer_remarks ?? null,
        visa_type_id: body.visa_type_id ?? null,
        visa_number: body.visa_number ?? null,
        issue_date: body.issue_date ?? null,
        expiry_date: body.expiry_date ?? null,
        passport_number: body.passport_number ?? null,
        passport_issue_date: body.passport_issue_date ?? null,
        passport_expiry_date: body.passport_expiry_date ?? null,
        sponsor_id: body.sponsor_id ?? null,
        sponsor_contact: body.sponsor_contact ?? null,
        passport_file_path: body.passport_file_path ?? null,
        visa_file_path: body.visa_file_path ?? null,
        visa_payment_received: body.visa_payment_received ?? null,
        visa_remarks: body.visa_remarks ?? null,
        ticket_number: body.ticket_number ?? null,
        booked_date: body.booked_date ?? null,
        travel_date: body.travel_date ?? null,
        ticket_file_path: body.ticket_file_path ?? null,
        ticket_remarks: body.ticket_remarks ?? null,
        remarks: body.remarks ?? null,
        user_id: user.user_id,
      }
    );

    const visa_detail_id = rows[0]?.visa_detail_id;
    if (!visa_detail_id) throw httpError(500, 'Failed to save visa details');

    // Auto-move to Visa Processing when visa details are saved
    const beforeRows = await callProc<RowDataPacket & CandidateDeploymentRow>(
      `CALL sp_dep_deployments('GET', :deployment_id, NULL, NULL, NULL, NULL, NULL)`,
      { deployment_id }
    );
    const before = beforeRows[0];
    await callProc(
      `CALL sp_dep_deployments('SET_STATUS', :deployment_id, NULL, :status, NULL, NULL, :user_id)`,
      { deployment_id, status: 'Visa Processing', user_id: user.user_id }
    );

    const afterRows = await callProc<RowDataPacket & CandidateDeploymentRow>(
      `CALL sp_dep_deployments('GET', :deployment_id, NULL, NULL, NULL, NULL, NULL)`,
      { deployment_id }
    );
    const after = afterRows[0];
    if (after && String(before?.current_status ?? '').trim() !== String(after.current_status ?? '').trim()) {
      await sendStatusNotification({
        recipient: {
          name: after.candidate_name,
          email: after.email,
          phone: after.phone,
          whatsapp: after.phone,
        },
        subject: `${after.job_title} - ${String(after.current_status ?? 'Updated')}`,
        headline: 'Deployment status updated',
        statusLabel: String(after.current_status ?? 'Updated'),
        greeting: `Hello ${after.candidate_name},`,
        summary: `Your deployment status has changed from "${String(before?.current_status ?? '—')}" to "${String(after.current_status ?? '—')}".`,
        rows: [
          { label: 'Deployment ID', value: String(after.deployment_id) },
          { label: 'Job', value: String(after.job_title) },
          { label: 'Candidate', value: String(after.candidate_name) },
          { label: 'Remarks', value: String(after.remarks ?? '—') },
        ],
        nextSteps: ['Review the latest visa and deployment details in the portal.'],
        referenceCandidateId: after.candidate_id,
      });
    }

    return { visa_detail_id };
  }
}
