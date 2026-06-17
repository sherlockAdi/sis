import { Body, Controller, Get, Path, Post, Put, Query, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { pool } from '../../db/pool';
import { httpError } from '../../utils/httpErrors';
import { sendStatusNotification } from '../../services/notificationService';

type DeploymentRow = {
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

type DeploymentHistoryRow = {
  id: number;
  deployment_id: number;
  status: string;
  remarks: string | null;
  changed_by: number | null;
  changed_at: string;
};

type VisaDetailRow = {
  offer_detail_id: number | null;
  visa_processing_id: number | null;
  ticket_booking_id: number | null;
  deployment_id: number;
  offer_date: string | null;
  offer_letter_file_path: string | null;
  isaccepted: number | null;
  offer_payment_received: number | null;
  offer_remarks: string | null;
  visa_type_id: number | null;
  visa_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  passport_number: string | null;
  passport_issue_date: string | null;
  passport_expiry_date: string | null;
  visa_interview_date: string | null;
  visa_interview_venue: string | null;
  sponsor_id: string | null;
  sponsor_contact: string | null;
  passport_file_path: string | null;
  support_document_file_path: string | null;
  visa_file_path: string | null;
  visa_payment_received: number | null;
  visa_remarks: string | null;
  checklist_complete: number | null;
  ticket_number: string | null;
  booked_date: string | null;
  travel_date: string | null;
  journey_from: string | null;
  journey_destination: string | null;
  ticket_file_path: string | null;
  ticket_remarks: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
};

type VisaChecklistMasterRow = {
  checklist_item_id: number;
  checklist_item_code: string;
  checklist_item_name: string;
  sort_order: number;
  is_required: number;
  status: number;
  created_at: string;
  updated_at: string;
};

type VisaChecklistStatusRow = {
  checklist_item_id: number;
  checklist_item_code: string;
  checklist_item_name: string;
  sort_order: number;
  is_required: number;
  is_checked: number;
  visa_checklist_status_id: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type CandidatePassportRow = RowDataPacket & {
  passport_number: string | null;
  passport_expiry_date: string | null;
};

function createEmptyVisaDetailRow(
  deploymentId: number,
  candidatePassport: Pick<CandidatePassportRow, 'passport_number' | 'passport_expiry_date'> | undefined
): VisaDetailRow {
  return {
    offer_detail_id: null,
    visa_processing_id: null,
    ticket_booking_id: null,
    deployment_id: deploymentId,
    offer_date: null,
    offer_letter_file_path: null,
    isaccepted: null,
    offer_payment_received: null,
    offer_remarks: null,
    visa_type_id: null,
    visa_number: null,
    issue_date: null,
    expiry_date: null,
    passport_number: candidatePassport?.passport_number ?? null,
    passport_issue_date: null,
    passport_expiry_date: candidatePassport?.passport_expiry_date ?? null,
    visa_interview_date: null,
    visa_interview_venue: null,
    sponsor_id: null,
    sponsor_contact: null,
    passport_file_path: null,
    support_document_file_path: null,
    visa_file_path: null,
    visa_payment_received: null,
    visa_remarks: null,
    checklist_complete: null,
    ticket_number: null,
    booked_date: null,
    travel_date: null,
    journey_from: null,
    journey_destination: null,
    ticket_file_path: null,
    ticket_remarks: null,
    remarks: null,
    created_at: '',
    updated_at: '',
  };
}

@Route('deployment')
@Tags('Deployment')
export class DeploymentController extends Controller {
  @Get()
  @Security('jwt')
  public async list(@Query() status?: string): Promise<DeploymentRow[]> {
    if (status) {
      return callProc<RowDataPacket & DeploymentRow>(
        `CALL sp_dep_deployments('LIST_BY_STATUS', NULL, NULL, :status, NULL, NULL, NULL)`,
        { status }
      );
    }
    return callProc<RowDataPacket & DeploymentRow>(
      `CALL sp_dep_deployments('LIST', NULL, NULL, NULL, NULL, NULL, NULL)`
    );
  }
  

  @Get('{deploymentId}')
  @Security('jwt')
  public async get(@Path() deploymentId: number): Promise<DeploymentRow | null> {
    const rows = await callProc<RowDataPacket & DeploymentRow>(
      `CALL sp_dep_deployments('GET', :deployment_id, NULL, NULL, NULL, NULL, NULL)`,
      { deployment_id: deploymentId }
    );
    return rows[0] ?? null;
  }

  @Get('by-application/{applicationId}')
  @Security('jwt')
  public async getByApplication(@Path() applicationId: number): Promise<{ deployment_id: number } | null> {
    const rows = await callProc<RowDataPacket & { deployment_id: number }>(
      `CALL sp_dep_deployments('GET_BY_APPLICATION', NULL, :application_id, NULL, NULL, NULL, NULL)`,
      { application_id: applicationId }
    );
    return rows[0] ?? null;
  }

  @Post()
  @Security('jwt')
  public async create(
    @Body() body: { application_id: number; status?: string | null; visa_type_id?: number | null; remarks?: string | null },
    @Request() req: any
  ): Promise<{ deployment_id: number }> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const application_id = Number((body as any)?.application_id);
    if (!application_id) throw httpError(400, 'application_id is required');

    const rows = await callProc<RowDataPacket & { deployment_id: number }>(
      `CALL sp_dep_deployments('CREATE', NULL, :application_id, :status, :visa_type_id, :remarks, :user_id)`,
      {
        application_id,
        status: body.status ?? null,
        visa_type_id: body.visa_type_id ?? null,
        remarks: body.remarks ?? null,
        user_id: user.user_id,
      }
    );

    const deployment_id = rows[0]?.deployment_id;
    if (!deployment_id) throw httpError(500, 'Failed to create deployment');

    const deploymentRows = await callProc<RowDataPacket & DeploymentRow>(
      `CALL sp_dep_deployments('GET', :deployment_id, NULL, NULL, NULL, NULL, NULL)`,
      { deployment_id }
    );
    const deployment = deploymentRows[0];
    if (deployment) {
      await sendStatusNotification({
        recipient: {
          name: deployment.candidate_name,
          email: deployment.email,
          phone: deployment.phone,
          whatsapp: deployment.phone,
        },
        subject: `${deployment.job_title} - Deployment created`,
        headline: 'Deployment created',
        statusLabel: String(deployment.current_status ?? body.status ?? 'Created'),
        greeting: `Hello ${deployment.candidate_name},`,
        summary: `A deployment record has been created for your application to ${deployment.job_title}.`,
        rows: [
          { label: 'Deployment ID', value: String(deployment.deployment_id) },
          { label: 'Job', value: String(deployment.job_title) },
          { label: 'Candidate', value: String(deployment.candidate_name) },
          { label: 'Current Status', value: String(deployment.current_status ?? body.status ?? 'Created') },
        ],
        nextSteps: ['Check the portal for the latest deployment progress and instructions.'],
        referenceCandidateId: deployment.candidate_id,
      });
    }
    return { deployment_id };
  }

  private async notifyDeploymentChange(deploymentId: number, beforeStatus: string | null | undefined, afterStatus: string | null | undefined, remarks: string | null | undefined): Promise<void> {
    const rows = await callProc<RowDataPacket & DeploymentRow>(
      `CALL sp_dep_deployments('GET', :deployment_id, NULL, NULL, NULL, NULL, NULL)`,
      { deployment_id: deploymentId }
    );
    const deployment = rows[0];
    if (!deployment) return;

    await sendStatusNotification({
      recipient: {
        name: deployment.candidate_name,
        email: deployment.email,
        phone: deployment.phone,
        whatsapp: deployment.phone,
      },
      subject: `${deployment.job_title} - ${String(afterStatus ?? 'Updated')}`,
      headline: 'Deployment status updated',
      statusLabel: String(afterStatus ?? 'Updated'),
      greeting: `Hello ${deployment.candidate_name},`,
      summary: `Your deployment status has changed from "${String(beforeStatus ?? '—')}" to "${String(afterStatus ?? '—')}".`,
      rows: [
        { label: 'Deployment ID', value: String(deployment.deployment_id) },
        { label: 'Job', value: String(deployment.job_title) },
        { label: 'Candidate', value: String(deployment.candidate_name) },
        { label: 'Remarks', value: String(remarks ?? deployment.remarks ?? '—') },
      ],
      nextSteps: [
        'Check the portal for any new instructions or document requests.',
        'Contact the operations team if you need clarification.',
      ],
      referenceCandidateId: deployment.candidate_id,
    });
  }

  @Put('{deploymentId}/status')
  @Security('jwt')
  public async updateStatus(
    @Path() deploymentId: number,
    @Body() body: { status: string; visa_type_id?: number | null; remarks?: string | null },
    @Request() req: any
  ): Promise<{ updated: true }> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const status = String((body as any)?.status ?? '').trim();
    if (!status) throw httpError(400, 'status is required');

    const beforeRows = await callProc<RowDataPacket & DeploymentRow>(
      `CALL sp_dep_deployments('GET', :deployment_id, NULL, NULL, NULL, NULL, NULL)`,
      { deployment_id: deploymentId }
    );
    const before = beforeRows[0];

    if (status === 'Visa Approved') {
      const checklistRows = await callProc<RowDataPacket & VisaChecklistStatusRow>(
        `CALL sp_dep_visa_checklist_status('LIST_BY_DEPLOYMENT', :deployment_id, NULL, NULL, NULL)`,
        { deployment_id: deploymentId }
      );
      const requiredRows = checklistRows.filter((row) => row.is_required === 1);
      const allComplete = requiredRows.length > 0 && requiredRows.every((row) => row.is_checked === 1);
      if (!allComplete) {
        throw httpError(400, 'Complete the visa acknowledgement checklist before approving visa');
      }
    }

    if (status === 'Ticket Confirmed') {
      const ticketRows = await callProc<RowDataPacket & VisaDetailRow>(
        `CALL sp_dep_visa_details('GET_BY_DEPLOYMENT', NULL, :deployment_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
        { deployment_id: deploymentId }
      );
      const ticket = ticketRows[0];
      const [journeyRows] = await pool.query<(RowDataPacket & {
        journey_from: string | null;
        journey_destination: string | null;
      })[]>(
        `SELECT journey_from, journey_destination
         FROM DEP_T05_ticket_bookings
         WHERE deployment_id = :deployment_id
         LIMIT 1`,
        { deployment_id: deploymentId }
      );
      const journey = journeyRows[0];
      const requiredTicketValues = [
        ticket?.ticket_number,
        ticket?.booked_date,
        ticket?.travel_date,
        ticket?.ticket_file_path,
        journey?.journey_from,
        journey?.journey_destination,
      ];
      if (requiredTicketValues.some((value) => !String(value ?? '').trim())) {
        throw httpError(400, 'PNR number, journey, booked date, travel date and ticket file are required');
      }
      if (String(ticket.booked_date).slice(0, 10) > String(ticket.travel_date).slice(0, 10)) {
        throw httpError(400, 'Travel date cannot be before booked date');
      }
    }

    await callProc(
      `CALL sp_dep_deployments('SET_STATUS', :deployment_id, NULL, :status, :visa_type_id, :remarks, :user_id)`,
      {
        deployment_id: deploymentId,
        status,
        visa_type_id: body.visa_type_id ?? null,
        remarks: body.remarks ?? null,
        user_id: user.user_id,
      }
    );

    const afterRows = await callProc<RowDataPacket & DeploymentRow>(
      `CALL sp_dep_deployments('GET', :deployment_id, NULL, NULL, NULL, NULL, NULL)`,
      { deployment_id: deploymentId }
    );
    const after = afterRows[0];
    if (after && String(before?.current_status ?? '').trim() !== String(after.current_status ?? '').trim()) {
      await this.notifyDeploymentChange(deploymentId, before?.current_status, after.current_status, body.remarks ?? null);
    }
    return { updated: true };
  }

  @Get('{deploymentId}/history')
  @Security('jwt')
  public async history(@Path() deploymentId: number): Promise<DeploymentHistoryRow[]> {
    return callProc<RowDataPacket & DeploymentHistoryRow>(
      `CALL sp_dep_deployment_history('LIST_BY_DEPLOYMENT', NULL, :deployment_id, NULL, NULL, NULL)`,
      { deployment_id: deploymentId }
    );
  }

  @Get('{deploymentId}/visa-details')
  @Security('jwt')
  public async visaDetails(@Path() deploymentId: number): Promise<VisaDetailRow | null> {
    const rows = await callProc<RowDataPacket & VisaDetailRow>(
      `CALL sp_dep_visa_details('GET_BY_DEPLOYMENT', NULL, :deployment_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { deployment_id: deploymentId }
    );
    const [extraRows] = await pool.query<(RowDataPacket & {
      support_document_file_path: string | null;
      visa_interview_date: string | null;
      visa_interview_venue: string | null;
      journey_from: string | null;
      journey_destination: string | null;
    })[]>(
      `SELECT
         v.support_document_file_path,
         v.visa_interview_date,
         v.visa_interview_venue,
         t.journey_from,
         t.journey_destination
       FROM (SELECT :deployment_id AS deployment_id) dep
       LEFT JOIN DEP_T04_visa_processing_details v ON v.deployment_id = dep.deployment_id
       LEFT JOIN DEP_T05_ticket_bookings t ON t.deployment_id = dep.deployment_id
       LIMIT 1`,
      { deployment_id: deploymentId }
    );
    const extra = extraRows[0];
    const [candidateRows] = await pool.query<CandidatePassportRow[]>(
      `SELECT c.passport_number, c.passport_expiry_date
       FROM DEP_T01_deployments d
       JOIN REC_T02_applications a ON a.application_id = d.application_id
       JOIN REC_T01_candidates c ON c.candidate_id = a.candidate_id
       WHERE d.deployment_id = :deployment_id
       LIMIT 1`,
      { deployment_id: deploymentId }
    );
    const candidatePassport = candidateRows[0];
    const details = rows[0];
    if (!details) {
      const empty = candidatePassport ? createEmptyVisaDetailRow(deploymentId, candidatePassport) : null;
      return empty ? { ...empty, ...extra } : null;
    }
    return {
      ...details,
      passport_number: details.passport_number ?? candidatePassport?.passport_number ?? null,
      passport_expiry_date: details.passport_expiry_date ?? candidatePassport?.passport_expiry_date ?? null,
      support_document_file_path: extra?.support_document_file_path ?? details.passport_file_path ?? null,
      visa_interview_date: extra?.visa_interview_date ?? null,
      visa_interview_venue: extra?.visa_interview_venue ?? null,
      journey_from: extra?.journey_from ?? null,
      journey_destination: extra?.journey_destination ?? null,
    };
  }

  @Get('visa-checklist/master')
  @Security('jwt')
  public async visaChecklistMaster(): Promise<VisaChecklistMasterRow[]> {
    return callProc<RowDataPacket & VisaChecklistMasterRow>(
      `CALL sp_dep_visa_checklist_master('LIST', NULL, NULL, NULL, NULL, NULL, NULL, NULL)`
    );
  }

  @Get('{deploymentId}/visa-checklist')
  @Security('jwt')
  public async visaChecklist(@Path() deploymentId: number): Promise<VisaChecklistStatusRow[]> {
    return callProc<RowDataPacket & VisaChecklistStatusRow>(
      `CALL sp_dep_visa_checklist_status('LIST_BY_DEPLOYMENT', :deployment_id, NULL, NULL, NULL)`,
      { deployment_id: deploymentId }
    );
  }

  @Put('{deploymentId}/visa-checklist')
  @Security('jwt')
  public async upsertVisaChecklist(
    @Path() deploymentId: number,
    @Body() body: { items?: Array<{ checklist_item_id: number; is_checked?: boolean }> },
    @Request() req: any
  ): Promise<{ updated: true }> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const items = Array.isArray(body?.items) ? body.items : [];
    for (const item of items) {
      const checklist_item_id = Number(item?.checklist_item_id);
      if (!checklist_item_id) continue;
      await callProc(
        `CALL sp_dep_visa_checklist_status('UPSERT', :deployment_id, :checklist_item_id, :is_checked, :user_id)`,
        {
          deployment_id: deploymentId,
          checklist_item_id,
          is_checked: item.is_checked ? 1 : 0,
          user_id: user.user_id,
        }
      );
    }

    return { updated: true };
  }

  @Put('{deploymentId}/visa-details')
  @Security('jwt')
  public async upsertVisaDetails(
    @Path() deploymentId: number,
    @Body()
    body: {
      visa_type_id?: number | null;
      visa_number?: string | null;
      issue_date?: string | null;
      expiry_date?: string | null;
      passport_number?: string | null;
      passport_issue_date?: string | null;
      passport_expiry_date?: string | null;
      visa_interview_date?: string | null;
      visa_interview_venue?: string | null;
      sponsor_id?: string | null;
      sponsor_contact?: string | null;
      offer_date?: string | null;
      passport_file_path?: string | null;
      support_document_file_path?: string | null;
      visa_file_path?: string | null;
      offer_letter_file_path?: string | null;
      offer_payment_received?: number | null;
      offer_remarks?: string | null;
      visa_payment_received?: number | null;
      visa_remarks?: string | null;
      ticket_number?: string | null;
      booked_date?: string | null;
      travel_date?: string | null;
      journey_from?: string | null;
      journey_destination?: string | null;
      ticket_file_path?: string | null;
      ticket_remarks?: string | null;
      remarks?: string | null;
    },
    @Request() req: any
  ): Promise<{ visa_detail_id: number }> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    if (body.visa_type_id != null) {
      const [visaTypeRows] = await pool.query<(RowDataPacket & { visa_type_name: string })[]>(
        `SELECT visa_type_name
         FROM REC_M02_visa_types
         WHERE visa_type_id = :visa_type_id AND status = TRUE
         LIMIT 1`,
        { visa_type_id: body.visa_type_id }
      );
      if (String(visaTypeRows[0]?.visa_type_name ?? '').trim().toLowerCase() !== 'work visa') {
        throw httpError(400, 'Only Work Visa is allowed');
      }
    }

    const supportDocumentFilePath = body.support_document_file_path ?? body.passport_file_path ?? null;
    const rows = await callProc<RowDataPacket & { visa_detail_id: number }>(
      `CALL sp_dep_visa_details('UPSERT', NULL, :deployment_id, :offer_date, :offer_letter_file_path, :isaccepted, :offer_payment_received, :offer_remarks, :visa_type_id, :visa_number, :issue_date, :expiry_date, :passport_number, :passport_issue_date, :passport_expiry_date, :visa_interview_date, :visa_interview_venue, :sponsor_id, :sponsor_contact, :passport_file_path, :support_document_file_path, :visa_file_path, :visa_payment_received, :visa_remarks, :ticket_number, :booked_date, :travel_date, :ticket_file_path, :ticket_remarks, :remarks, :user_id)`,
      {
        deployment_id: deploymentId,
        offer_date: body.offer_date ?? null,
        offer_letter_file_path: body.offer_letter_file_path ?? null,
        isaccepted: null,
        offer_payment_received: body.offer_payment_received ?? null,
        offer_remarks: body.offer_remarks ?? null,
        visa_type_id: body.visa_type_id ?? null,
        visa_number: body.visa_number ?? null,
        issue_date: body.issue_date ?? null,
        expiry_date: body.expiry_date ?? null,
        passport_number: body.passport_number ?? null,
        passport_issue_date: body.passport_issue_date ?? null,
        passport_expiry_date: body.passport_expiry_date ?? null,
        visa_interview_date: body.visa_interview_date ?? null,
        visa_interview_venue: body.visa_interview_venue ?? null,
        sponsor_id: body.sponsor_id ?? null,
        sponsor_contact: body.sponsor_contact ?? null,
        passport_file_path: body.passport_file_path ?? null,
        support_document_file_path: supportDocumentFilePath,
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

    if (body.support_document_file_path !== undefined || body.passport_file_path !== undefined || body.visa_interview_date !== undefined || body.visa_interview_venue !== undefined) {
      await pool.query(
        `UPDATE DEP_T04_visa_processing_details
         SET support_document_file_path = COALESCE(NULLIF(:support_document_file_path, ''), support_document_file_path),
             visa_interview_date = COALESCE(:visa_interview_date, visa_interview_date),
             visa_interview_venue = COALESCE(NULLIF(:visa_interview_venue, ''), visa_interview_venue)
         WHERE deployment_id = :deployment_id`,
        {
          deployment_id: deploymentId,
          support_document_file_path: supportDocumentFilePath,
          visa_interview_date: body.visa_interview_date ?? null,
          visa_interview_venue: body.visa_interview_venue ?? null,
        }
      );
    }

    if (body.journey_from !== undefined || body.journey_destination !== undefined) {
      await pool.query(
        `INSERT INTO DEP_T05_ticket_bookings (
           deployment_id, journey_from, journey_destination, created_by, updated_by
         ) VALUES (
           :deployment_id, :journey_from, :journey_destination, :user_id, :user_id
         )
         ON DUPLICATE KEY UPDATE
           journey_from = COALESCE(VALUES(journey_from), journey_from),
           journey_destination = COALESCE(VALUES(journey_destination), journey_destination),
           updated_by = VALUES(updated_by)`,
        {
          deployment_id: deploymentId,
          journey_from: body.journey_from ?? null,
          journey_destination: body.journey_destination ?? null,
          user_id: user.user_id,
        }
      );
    }

    const hasVisaProcessingData = [
      body.visa_type_id,
      body.visa_number,
      body.issue_date,
      body.expiry_date,
      body.visa_file_path,
      body.support_document_file_path,
      body.passport_file_path,
      body.visa_interview_date,
      body.visa_interview_venue,
    ].some((value) => value !== undefined && value !== null && String(value).trim() !== '');

    if (hasVisaProcessingData) {
      const beforeRows = await callProc<RowDataPacket & DeploymentRow>(
        `CALL sp_dep_deployments('GET', :deployment_id, NULL, NULL, NULL, NULL, NULL)`,
        { deployment_id: deploymentId }
      );
      const before = beforeRows[0];
      if (String(before?.current_status ?? '').trim().toLowerCase() === 'offered') {
        await callProc(
          `CALL sp_dep_deployments('SET_STATUS', :deployment_id, NULL, :status, NULL, NULL, :user_id)`,
          { deployment_id: deploymentId, status: 'Visa Processing', user_id: user.user_id }
        );

        const afterRows = await callProc<RowDataPacket & DeploymentRow>(
          `CALL sp_dep_deployments('GET', :deployment_id, NULL, NULL, NULL, NULL, NULL)`,
          { deployment_id: deploymentId }
        );
        const after = afterRows[0];
        if (after && String(before.current_status ?? '').trim() !== String(after.current_status ?? '').trim()) {
          await this.notifyDeploymentChange(deploymentId, before.current_status, after.current_status, body.remarks ?? null);
        }
      }
    }

    return { visa_detail_id };
  }

}
