import { Body, Controller, Delete, Get, Path, Post, Put, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../../db/pool';
import { callProc } from '../../db/proc';
import { findExistingUserByUsernameOrEmail, hashPassword } from '../../services/authService';
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
  partner_id: number | null;
  shift_timing: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  passport_number?: string | null;
  user_id?: number | null;
  login_username?: string | null;
  login_email?: string | null;
};

type EmployeeDetailRow = EmployeeRow & {
  dob?: string | null;
  gender?: string | null;
  skills?: string | null;
  education?: string | null;
  experience?: string | null;
  industry_type?: string | null;
  resume_file_path?: string | null;
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

function logEmployeeApi(step: string, details: Record<string, unknown> = {}) {
  console.log(`[EmployeesController] ${step}`, JSON.stringify(details));
}

@Route('employees')
@Tags('Employees')
export class EmployeesController extends Controller {
  @Get('me')
  @Security('jwt')
  public async me(@Request() req: any): Promise<EmployeeDetailRow | null> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');
    logEmployeeApi('me:start', { user_id: user.user_id });

    const rows = await callProc<RowDataPacket & EmployeeDetailRow>(
      `CALL sp_emp_employees('GET', (SELECT e.employee_id FROM EMP_T01_employees e JOIN REC_T01_candidates c ON c.candidate_id = e.candidate_id WHERE c.user_id = :user_id LIMIT 1), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { user_id: user.user_id }
    );
    const employee = rows[0];
    if (!employee) {
      logEmployeeApi('me:missing', { user_id: user.user_id });
      return null;
    }
    logEmployeeApi('me:employee-found', { employee_id: employee.employee_id, candidate_id: employee.candidate_id });

    const candidateRows = await callProc<RowDataPacket & { candidate_id: number; candidate_code: string | null; email: string | null; user_id: number | null }>(
      `SELECT c.candidate_id, c.candidate_code, c.email, c.user_id
       FROM EMP_T01_employees e
       JOIN REC_T01_candidates c ON c.candidate_id = e.candidate_id
       WHERE e.employee_id = :employee_id
       LIMIT 1`,
      { employee_id: employee.employee_id }
    );
    const candidate = candidateRows[0];
    logEmployeeApi('me:candidate', {
      employee_id: employee.employee_id,
      candidate_id: candidate?.candidate_id ?? null,
      candidate_code: candidate?.candidate_code ?? null,
      candidate_user_id: candidate?.user_id ?? null,
      candidate_email: candidate?.email ?? null,
    });

    let loginUserId = candidate?.user_id ?? null;
    if (!loginUserId && (candidate?.candidate_code || candidate?.email)) {
      const existing = await findExistingUserByUsernameOrEmail(candidate.candidate_code ?? '', candidate.email);
      loginUserId = existing?.user_id ?? null;
    }
    logEmployeeApi('me:login-user', { employee_id: employee.employee_id, login_user_id: loginUserId });

    const loginRows = loginUserId
      ? await callProc<RowDataPacket & { user_id: number | null; login_username: string | null; login_email: string | null }>(
          `SELECT u.user_id, u.username AS login_username, u.email AS login_email
           FROM AUTH_U04_users u
           WHERE u.user_id = :user_id
           LIMIT 1`,
          { user_id: loginUserId }
        )
      : [];

    return {
      ...employee,
      user_id: loginUserId,
      login_username: loginRows[0]?.login_username ?? null,
      login_email: loginRows[0]?.login_email ?? candidate?.email ?? null,
    };
  }

  @Get()
  @Security('jwt')
  public async list(): Promise<EmployeeRow[]> {
    logEmployeeApi('list:start');
    const rows = await callProc<RowDataPacket & EmployeeRow>(
      `CALL sp_emp_employees('LIST', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`
    );
    logEmployeeApi('list:done', { count: rows.length });
    return rows;
  }

  @Get('{employeeId}')
  @Security('jwt')
  public async get(@Path() employeeId: number): Promise<EmployeeDetailRow | null> {
    logEmployeeApi('get:start', { employee_id: employeeId });
    const rows = await callProc<RowDataPacket & EmployeeDetailRow>(
      `CALL sp_emp_employees('GET', :employee_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { employee_id: employeeId }
    );
    const employee = rows[0];
    if (!employee) {
      logEmployeeApi('get:missing', { employee_id: employeeId });
      return null;
    }
    logEmployeeApi('get:employee-found', { employee_id: employee.employee_id, candidate_id: employee.candidate_id });

    const candidateRows = await callProc<RowDataPacket & { candidate_id: number; candidate_code: string | null; email: string | null; user_id: number | null }>(
      `SELECT c.candidate_id, c.candidate_code, c.email, c.user_id
       FROM EMP_T01_employees e
       JOIN REC_T01_candidates c ON c.candidate_id = e.candidate_id
       WHERE e.employee_id = :employee_id
       LIMIT 1`,
      { employee_id: employeeId }
    );
    const candidate = candidateRows[0];
    logEmployeeApi('get:candidate', {
      employee_id: employee.employee_id,
      candidate_id: candidate?.candidate_id ?? null,
      candidate_code: candidate?.candidate_code ?? null,
      candidate_user_id: candidate?.user_id ?? null,
      candidate_email: candidate?.email ?? null,
    });

    let loginUserId = candidate?.user_id ?? null;
    if (!loginUserId && (candidate?.candidate_code || candidate?.email)) {
      const existing = await findExistingUserByUsernameOrEmail(candidate.candidate_code ?? '', candidate.email);
      loginUserId = existing?.user_id ?? null;
    }
    logEmployeeApi('get:login-user', { employee_id: employee.employee_id, login_user_id: loginUserId });

    const loginRows = loginUserId
      ? await callProc<RowDataPacket & { user_id: number | null; login_username: string | null; login_email: string | null }>(
          `SELECT u.user_id, u.username AS login_username, u.email AS login_email
           FROM AUTH_U04_users u
           WHERE u.user_id = :user_id
           LIMIT 1`,
          { user_id: loginUserId }
        )
      : [];

    return {
      ...employee,
      user_id: loginUserId,
      login_username: loginRows[0]?.login_username ?? null,
      login_email: loginRows[0]?.login_email ?? candidate?.email ?? null,
    };
  }

  @Put('{employeeId}/credentials')
  @Security('jwt')
  public async updateCredentials(
    @Path() employeeId: number,
    @Body()
    body: {
      username?: string | null;
      email?: string | null;
      password?: string | null;
    },
  ): Promise<{ updated: true }> {
    const employeeRows = await callProc<RowDataPacket & { employee_id: number; candidate_id: number; user_id: number | null }>(
      `SELECT e.employee_id, e.candidate_id, c.user_id
       FROM EMP_T01_employees e
       JOIN REC_T01_candidates c ON c.candidate_id = e.candidate_id
       WHERE e.employee_id = :employee_id
       LIMIT 1`,
      { employee_id: employeeId }
    );
    const employee = employeeRows[0];
    if (!employee) throw httpError(404, 'Employee not found');
    logEmployeeApi('credentials:start', { employee_id: employeeId, candidate_id: employee.candidate_id });

    const candidateRows = await callProc<RowDataPacket & { candidate_id: number; candidate_code: string | null; email: string | null; user_id: number | null }>(
      `SELECT candidate_id, candidate_code, email, user_id
       FROM REC_T01_candidates
       WHERE candidate_id = :candidate_id
       LIMIT 1`,
      { candidate_id: employee.candidate_id }
    );
    const candidate = candidateRows[0];
    if (!candidate) throw httpError(404, 'Candidate not found');
    logEmployeeApi('credentials:candidate', {
      employee_id: employeeId,
      candidate_id: candidate.candidate_id,
      candidate_code: candidate.candidate_code,
      candidate_user_id: candidate.user_id,
      candidate_email: candidate.email,
    });

    let linkedUserId = employee.user_id ?? candidate.user_id ?? null;
    if (!linkedUserId && (candidate.candidate_code || candidate.email)) {
      const existing = await findExistingUserByUsernameOrEmail(candidate.candidate_code ?? '', candidate.email);
      linkedUserId = existing?.user_id ?? null;
    }
    if (!linkedUserId) throw httpError(404, 'Linked login user not found');
    logEmployeeApi('credentials:linked-user', { employee_id: employeeId, linked_user_id: linkedUserId });

    const [roleRows] = await pool.query(`SELECT role_id FROM AUTH_U01_roles WHERE role_code = 'EMPLOYEE' LIMIT 1`) as any;
    let employeeRoleId = roleRows?.[0]?.role_id ?? null;
    if (!employeeRoleId) {
      const [created] = await pool.query(
        `INSERT INTO AUTH_U01_roles (role_name, role_code, description, status)
         VALUES ('Employee', 'EMPLOYEE', 'Employee portal role', TRUE)`
      ) as any;
      employeeRoleId = created?.insertId ?? null;
      if (!employeeRoleId) {
        const [fallbackRole] = await pool.query(`SELECT role_id FROM AUTH_U01_roles WHERE role_code = 'EMPLOYEE' LIMIT 1`) as any;
        employeeRoleId = fallbackRole?.[0]?.role_id ?? null;
      }
    }
    if (!employeeRoleId) throw httpError(500, 'Failed to resolve employee role');
    logEmployeeApi('credentials:role', { employee_id: employeeId, employee_role_id: employeeRoleId });

    const password_hash = body.password ? await hashPassword(String(body.password)) : null;
    try {
      const rows = await callProc<RowDataPacket & { affected_rows: number }>(
        `CALL sp_users_update(:userId, NULL, NULL, NULL, :username, :email, NULL, :password_hash, NULL)`,
        {
          userId: linkedUserId,
          username: body.username ?? null,
          email: body.email ?? null,
          password_hash,
        }
      );
      if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'User not found');

      await pool.query(
        `UPDATE AUTH_U04_users SET role_id = :role_id WHERE user_id = :user_id`,
        { role_id: employeeRoleId, user_id: linkedUserId }
      );
      logEmployeeApi('credentials:auth-updated', { employee_id: employeeId, linked_user_id: linkedUserId, employee_role_id: employeeRoleId });

      if (!candidate.user_id || candidate.user_id !== linkedUserId) {
        await pool.query(
          `UPDATE REC_T01_candidates SET user_id = :user_id, updated_at = CURRENT_TIMESTAMP WHERE candidate_id = :candidate_id`,
          { user_id: linkedUserId, candidate_id: employee.candidate_id }
        );
        logEmployeeApi('credentials:candidate-linked', { employee_id: employeeId, candidate_id: employee.candidate_id, user_id: linkedUserId });
      }

      logEmployeeApi('credentials:done', { employee_id: employeeId, linked_user_id: linkedUserId });
      return { updated: true };
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY') throw httpError(409, 'username/email already exists');
      throw e;
    }
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
    logEmployeeApi('from-deployment:start', { user_id: user.user_id, deployment_id: (body as any)?.deployment_id });

    const deployment_id = Number((body as any)?.deployment_id);
    if (!deployment_id) throw httpError(400, 'deployment_id is required');

    const deploymentRows = await callProc<RowDataPacket & { deployment_id: number; current_status: string | null }>(
      `CALL sp_dep_deployments('GET', :deployment_id, NULL, NULL, NULL, NULL, NULL)`,
      { deployment_id }
    );
    const deployment = deploymentRows[0];
    if (!deployment) throw httpError(404, 'Deployment not found');
    logEmployeeApi('from-deployment:deployment', { deployment_id, current_status: deployment.current_status });

    const status = normalizeStatus(deployment.current_status);
    if (status !== 'deployed') {
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
    if (!employee_id) {
      logEmployeeApi('from-deployment:missing-employee-id', { deployment_id, user_id: user.user_id });
      throw httpError(500, 'Failed to create employee');
    }
    logEmployeeApi('from-deployment:done', { deployment_id, employee_id, user_id: user.user_id });
    return { employee_id };
  }

  @Delete('{employeeId}')
  @Security('jwt')
  public async disable(@Path() employeeId: number): Promise<{ disabled: true }> {
    logEmployeeApi('disable:start', { employee_id: employeeId });
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_emp_employees('DISABLE', :employee_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      { employee_id: employeeId }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Employee not found');
    logEmployeeApi('disable:done', { employee_id: employeeId });
    return { disabled: true };
  }
}
