import { Body, Controller, Delete, Get, Path, Post, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';

type EmployeeRow = {
  employee_id: number;
  employee_code: string;
  employee_name: string;
  employee_contact_number: string | null;
  address1: string | null;
  address2: string | null;
  pin_code: string | null;
  industry: string | null;
  work_location: string | null;
  employment_status: string | null;
  date_of_joining: string | null;
  date_of_confirmation: string | null;
  candidate_id: number;
  deployment_id: number | null;
  shift_timing: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  passport_number?: string | null;
};

type EmployeeDetailRow = EmployeeRow & {
  dob?: string | null;
  gender?: string | null;
  skills?: string | null;
  education?: string | null;
  experience?: string | null;
  industry_type?: string | null;
  passport_expiry_date?: string | null;
  passport_file_path?: string | null;
  aadhar_number?: string | null;
  aadhar_file_path?: string | null;
  pan_number?: string | null;
  pan_file_path?: string | null;
  voter_id_number?: string | null;
  voter_id_file_path?: string | null;
  profile_photo_file_path?: string | null;
  languages_known?: string | null;
  candidate_address1?: string | null;
  candidate_address2?: string | null;
  candidate_pincode?: string | null;
};

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? '').trim().toLowerCase();
}

@Route('employees')
@Tags('Employees')
export class EmployeesController extends Controller {
  @Get()
  @Security('jwt')
  public async list(): Promise<EmployeeRow[]> {
    return callProc<RowDataPacket & EmployeeRow>(
      `CALL sp_emp_employees('LIST', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`
    );
  }

  @Get('{employeeId}')
  @Security('jwt')
  public async get(@Path() employeeId: number): Promise<EmployeeDetailRow | null> {
    const rows = await callProc<RowDataPacket & EmployeeDetailRow>(
      `CALL sp_emp_employees('GET', :employee_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { employee_id: employeeId }
    );
    return rows[0] ?? null;
  }

  @Post('from-deployment')
  @Security('jwt')
  public async createFromDeployment(
    @Body()
    body: {
      deployment_id: number;
      employment_status?: string | null;
      date_of_joining?: string | null;
      date_of_confirmation?: string | null;
      shift_timing?: string | null;
    },
    @Request() req: any
  ): Promise<{ employee_id: number }> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const deployment_id = Number((body as any)?.deployment_id);
    if (!deployment_id) throw httpError(400, 'deployment_id is required');

    const deploymentRows = await callProc<RowDataPacket & { deployment_id: number; current_status: string | null }>(
      `CALL sp_dep_deployments('GET', :deployment_id, NULL, NULL, NULL, NULL, NULL)`,
      { deployment_id }
    );
    const deployment = deploymentRows[0];
    if (!deployment) throw httpError(404, 'Deployment not found');

    const status = normalizeStatus(deployment.current_status);
    if (!['ticket confirmed', 'deployed', 'employee'].includes(status)) {
      throw httpError(400, 'Deployment is not ready for employee conversion');
    }

    const rows = await callProc<RowDataPacket & { employee_id: number }>(
      `CALL sp_emp_employees('CREATE_FROM_DEPLOYMENT', NULL, :deployment_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :employment_status, :date_of_joining, :date_of_confirmation, NULL, :shift_timing, :user_id)`,
      {
        deployment_id,
        employment_status: String(body.employment_status ?? '').trim() || null,
        date_of_joining: body.date_of_joining ?? null,
        date_of_confirmation: body.date_of_confirmation ?? null,
        shift_timing: String(body.shift_timing ?? '').trim() || null,
        user_id: user.user_id,
      }
    );

    const employee_id = rows[0]?.employee_id;
    if (!employee_id) throw httpError(500, 'Failed to create employee');
    return { employee_id };
  }

  @Delete('{employeeId}')
  @Security('jwt')
  public async disable(@Path() employeeId: number): Promise<{ disabled: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_emp_employees('DISABLE', :employee_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { employee_id: employeeId }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Employee not found');
    return { disabled: true };
  }
}
