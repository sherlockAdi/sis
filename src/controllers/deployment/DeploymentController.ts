import { Body, Controller, Get, Path, Post, Put, Query, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';

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
  offer_payment_received: number | null;
  offer_remarks: string | null;
  visa_type_id: number | null;
  visa_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  passport_number: string | null;
  passport_issue_date: string | null;
  passport_expiry_date: string | null;
  sponsor_id: string | null;
  sponsor_contact: string | null;
  passport_file_path: string | null;
  visa_file_path: string | null;
  visa_payment_received: number | null;
  visa_remarks: string | null;
  ticket_number: string | null;
  booked_date: string | null;
  travel_date: string | null;
  ticket_file_path: string | null;
  ticket_remarks: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
};

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
    return { deployment_id };
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
      `CALL sp_dep_visa_details('GET_BY_DEPLOYMENT', NULL, :deployment_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { deployment_id: deploymentId }
    );
    return rows[0] ?? null;
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
      sponsor_id?: string | null;
      sponsor_contact?: string | null;
      offer_date?: string | null;
      passport_file_path?: string | null;
      visa_file_path?: string | null;
      offer_letter_file_path?: string | null;
      offer_payment_received?: number | null;
      offer_remarks?: string | null;
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

    const rows = await callProc<RowDataPacket & { visa_detail_id: number }>(
      `CALL sp_dep_visa_details('UPSERT', NULL, :deployment_id, :offer_date, :offer_letter_file_path, :offer_payment_received, :offer_remarks, :visa_type_id, :visa_number, :issue_date, :expiry_date, :passport_number, :passport_issue_date, :passport_expiry_date, :sponsor_id, :sponsor_contact, :passport_file_path, :visa_file_path, :visa_payment_received, :visa_remarks, :ticket_number, :booked_date, :travel_date, :ticket_file_path, :ticket_remarks, :remarks, :user_id)`,
      {
        deployment_id: deploymentId,
        offer_date: body.offer_date ?? null,
        offer_letter_file_path: body.offer_letter_file_path ?? null,
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
    await callProc(
      `CALL sp_dep_deployments('SET_STATUS', :deployment_id, NULL, :status, NULL, NULL, :user_id)`,
      { deployment_id: deploymentId, status: 'Visa Processing', user_id: user.user_id }
    );

    return { visa_detail_id };
  }

}
