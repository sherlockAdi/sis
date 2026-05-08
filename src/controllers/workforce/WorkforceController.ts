import { Body, Controller, Delete, Get, Path, Post, Put, Query, Request, Route, Security, Tags } from 'tsoa';
import { pool } from '../../db/pool';
import { httpError } from '../../utils/httpErrors';

const INDIA_TZ = 'Asia/Kolkata';

type CurrentEmployeeRow = {
  employee_id: number;
  employee_code: string | null;
  employee_name: string;
  partner_id: number | null;
  partner_name: string | null;
  work_location: string | null;
  shift_timing: string | null;
};

type LeavePolicyRow = {
  leave_policy_id: number;
  partner_id: number;
  leave_code: string;
  leave_name: string;
  annual_limit_days: number;
  is_paid: 0 | 1 | boolean;
  allow_half_day: 0 | 1 | boolean;
  carry_forward_days: number;
  max_consecutive_days: number;
  min_notice_days: number;
  requires_approval: 0 | 1 | boolean;
  status: 0 | 1 | boolean;
  created_at: string;
  updated_at: string;
};

type HolidayRow = {
  holiday_id: number;
  partner_id: number;
  holiday_name: string;
  holiday_type: 'FIXED' | 'YEARLY_VARIABLE' | 'ONCE';
  holiday_date: string | null;
  holiday_month: number | null;
  holiday_day: number | null;
  holiday_year: number | null;
  is_paid: 0 | 1 | boolean;
  status: 0 | 1 | boolean;
  created_at: string;
  updated_at: string;
};

type WeeklyOffRow = {
  weekly_off_rule_id: number;
  partner_id: number;
  country_id: number | null;
  rule_name: string;
  off_days_json: string;
  effective_from: string | null;
  effective_to: string | null;
  status: 0 | 1 | boolean;
  created_at: string;
  updated_at: string;
};

type OfficeLocationRow = {
  office_location_id: number;
  partner_id: number;
  location_name: string;
  country_id: number | null;
  state_id: number | null;
  city_id: number | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_meters: number;
  status: 0 | 1 | boolean;
  created_at: string;
  updated_at: string;
};

type LeaveBalanceRow = {
  leave_balance_id: number;
  employee_id: number;
  partner_id: number;
  leave_policy_id: number;
  leave_year: number;
  opening_balance: number;
  credited_days: number;
  used_days: number;
  balance_days: number;
  status: 0 | 1 | boolean;
  created_at: string;
  updated_at: string;
  leave_name?: string;
  leave_code?: string;
  is_paid?: 0 | 1 | boolean;
};

type LeaveRequestRow = {
  leave_request_id: number;
  employee_id: number;
  partner_id: number;
  leave_policy_id: number;
  leave_year: number;
  leave_from: string;
  leave_to: string;
  leave_mode: 'FULL' | 'FIRST_HALF' | 'SECOND_HALF';
  days_requested: number;
  reason: string | null;
  document_path: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approval_remarks: string | null;
  approved_by: number | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  employee_name?: string;
  employee_code?: string;
  leave_name?: string;
  is_paid?: 0 | 1 | boolean;
};

type AttendanceRow = {
  attendance_id: number;
  employee_id: number;
  partner_id: number;
  attendance_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  check_in_distance_meters: number | null;
  check_out_distance_meters: number | null;
  check_in_face_capture: string | null;
  check_out_face_capture: string | null;
  day_type: 'WORK_DAY' | 'HOLIDAY' | 'WEEKLY_OFF' | 'LEAVE' | 'EXCEPTION';
  status: 'OPEN' | 'CLOSED' | 'EXCEPTION';
  remarks: string | null;
  created_at: string;
  updated_at: string;
  employee_name?: string;
  employee_code?: string;
};

type MonthlyAttendanceSummaryRow = {
  employee_id: number;
  employee_code: string | null;
  employee_name: string;
  partner_id: number | null;
  present_days: number;
  leave_days: number;
  holiday_days: number;
  weekly_off_days: number;
  exception_days: number;
  total_punch_days: number;
  check_in_count: number;
  check_out_count: number;
  absent_days: number;
};

type LeavePolicyInput = Partial<{
  partner_id: number;
  leave_code: string;
  leave_name: string;
  annual_limit_days: number;
  is_paid: boolean;
  allow_half_day: boolean;
  carry_forward_days: number;
  max_consecutive_days: number;
  min_notice_days: number;
  requires_approval: boolean;
  status: boolean;
}>;

type HolidayInput = Partial<{
  partner_id: number;
  holiday_name: string;
  holiday_type: 'FIXED' | 'YEARLY_VARIABLE' | 'ONCE';
  holiday_date: string | null;
  holiday_month: number | null;
  holiday_day: number | null;
  holiday_year: number | null;
  is_paid: boolean;
  status: boolean;
}>;

type WeeklyOffInput = Partial<{
  partner_id: number;
  country_id: number | null;
  rule_name: string;
  off_days: string[];
  effective_from: string | null;
  effective_to: string | null;
  status: boolean;
}>;

type OfficeLocationInput = Partial<{
  partner_id: number;
  location_name: string;
  country_id: number | null;
  state_id: number | null;
  city_id: number | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_meters: number;
  status: boolean;
}>;

type LeaveRequestInput = Partial<{
  employee_id: number;
  partner_id: number;
  leave_policy_id: number;
  leave_from: string;
  leave_to: string;
  leave_mode: 'FULL' | 'FIRST_HALF' | 'SECOND_HALF';
  reason: string;
  document_path: string | null;
}>;

type AttendancePunchInput = Partial<{
  attendance_date: string;
  latitude: number;
  longitude: number;
  face_capture: string;
  remarks: string;
}>;

type ApproveInput = Partial<{
  approval_remarks: string;
}>;

type MonthlyReportQuery = {
  partner_id?: number;
  year?: number;
  month?: number;
};

function todayIndia(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: INDIA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function monthRange(year: number, month: number): { date_from: string; date_to: string } {
  const mm = String(month).padStart(2, '0');
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const nextMm = String(next.month).padStart(2, '0');
  return {
    date_from: `${year}-${mm}-01`,
    date_to: `${next.year}-${nextMm}-01`,
  };
}

function weekdayName(dateLike: string): string {
  const d = new Date(`${dateLike}T12:00:00Z`);
  return new Intl.DateTimeFormat('en-US', { timeZone: INDIA_TZ, weekday: 'long' }).format(d).toUpperCase();
}

function asDate(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed.slice(0, 10) : null;
}

function isTruthy(v: unknown): boolean {
  return v === true || v === 1 || v === '1';
}

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function queryRows<T>(sql: string, params?: Record<string, unknown>): Promise<T[]> {
  const [result] = await pool.query(sql, params as any);
  return Array.isArray(result) ? (result as T[]) : [];
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function resolveEmployee(userId: number): Promise<CurrentEmployeeRow | null> {
  const rows = await queryRows<CurrentEmployeeRow>(
    `SELECT e.employee_id, e.employee_code, e.employee_name, e.partner_id, p.partner_name, e.work_location, e.shift_timing
     FROM EMP_T01_employees e
     JOIN REC_T01_candidates c ON c.candidate_id = e.candidate_id
     LEFT JOIN PART_T01_partners p ON p.partner_id = e.partner_id
     WHERE c.user_id = :user_id
     ORDER BY e.employee_id DESC
     LIMIT 1`,
    { user_id: userId }
  );
  return rows[0] ?? null;
}

async function ensureLeaveBalances(employeeId: number, partnerId: number, leaveYear: number): Promise<void> {
  const policies = await queryRows<Pick<LeavePolicyRow, 'leave_policy_id' | 'annual_limit_days' | 'is_paid'>>(
    `SELECT leave_policy_id, annual_limit_days, is_paid
     FROM EMP_T02_leave_policies
     WHERE partner_id = :partner_id AND status = TRUE`,
    { partner_id: partnerId }
  );

  for (const row of policies) {
    await pool.query(
      `INSERT INTO EMP_T06_leave_balances (
         employee_id, partner_id, leave_policy_id, leave_year,
         opening_balance, credited_days, used_days, balance_days, status
       ) VALUES (
         :employee_id, :partner_id, :leave_policy_id, :leave_year,
         :opening_balance, :credited_days, 0, :balance_days, TRUE
       )
       ON DUPLICATE KEY UPDATE
         opening_balance = VALUES(opening_balance),
         credited_days = VALUES(credited_days),
         balance_days = GREATEST(balance_days, VALUES(balance_days)),
         updated_at = CURRENT_TIMESTAMP`,
      {
        employee_id: employeeId,
        partner_id: partnerId,
        leave_policy_id: row.leave_policy_id,
        leave_year: leaveYear,
        opening_balance: Number(row.annual_limit_days ?? 0),
        credited_days: Number(row.annual_limit_days ?? 0),
        balance_days: Number(row.annual_limit_days ?? 0),
      }
    );
  }
}

async function getPartnerDayState(partnerId: number, dateStr: string): Promise<{ day_type: 'WORK_DAY' | 'HOLIDAY' | 'WEEKLY_OFF'; remarks: string | null }> {
  const holidayRows = await queryRows<{ holiday_name: string }>(
    `SELECT holiday_name
     FROM EMP_T03_holiday_calendar
     WHERE partner_id = :partner_id
       AND status = TRUE
       AND (
         (holiday_type = 'ONCE' AND holiday_date = :attendance_date)
         OR (holiday_type = 'YEARLY_VARIABLE' AND holiday_date = :attendance_date)
         OR (holiday_type = 'FIXED' AND holiday_month = MONTH(:attendance_date) AND holiday_day = DAYOFMONTH(:attendance_date))
       )
    ORDER BY holiday_id DESC
    LIMIT 1`,
    { partner_id: partnerId, attendance_date: dateStr }
  );
  const holiday = holidayRows[0];
  if (holiday) return { day_type: 'HOLIDAY', remarks: `Holiday: ${holiday.holiday_name}` };

  const weekday = weekdayName(dateStr);
  const weeklyRows = await queryRows<{ rule_name: string }>(
    `SELECT rule_name
     FROM EMP_T04_weekly_off_rules
     WHERE partner_id = :partner_id
       AND status = TRUE
       AND (effective_from IS NULL OR effective_from <= :attendance_date)
       AND (effective_to IS NULL OR effective_to >= :attendance_date)
       AND JSON_CONTAINS(off_days_json, JSON_QUOTE(:weekday_name))
    ORDER BY weekly_off_rule_id DESC
    LIMIT 1`,
    { partner_id: partnerId, attendance_date: dateStr, weekday_name: weekday }
  );
  const weekly = weeklyRows[0];
  if (weekly) return { day_type: 'WEEKLY_OFF', remarks: `Weekly off: ${weekly.rule_name}` };

  return { day_type: 'WORK_DAY', remarks: null };
}

function requirePartnerScope(bodyPartnerId?: number | null, employeePartnerId?: number | null): number {
  const partnerId = toNumber(bodyPartnerId ?? employeePartnerId);
  if (!partnerId) throw httpError(400, 'partner_id is required');
  return partnerId;
}

@Route('workforce')
@Tags('Workforce')
export class WorkforceController extends Controller {
  @Get('summary')
  @Security('jwt')
  public async summary(@Request() req: any): Promise<any> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const employee = await resolveEmployee(user.user_id);
    if (!employee?.employee_id || !employee.partner_id) {
      throw httpError(404, 'Employee profile not found');
    }

    await ensureLeaveBalances(employee.employee_id, employee.partner_id, new Date().getFullYear());
    const today = todayIndia();
    const currentDayState = await getPartnerDayState(employee.partner_id, today);

    const leavePolicies = await queryRows<LeavePolicyRow>(
      `SELECT * FROM EMP_T02_leave_policies WHERE partner_id = :partner_id AND status = TRUE ORDER BY leave_policy_id DESC`,
      { partner_id: employee.partner_id }
    );
    const holidays = await queryRows<HolidayRow>(
      `SELECT * FROM EMP_T03_holiday_calendar WHERE partner_id = :partner_id AND status = TRUE ORDER BY holiday_date DESC, holiday_id DESC LIMIT 12`,
      { partner_id: employee.partner_id }
    );
    const weeklyOffs = await queryRows<WeeklyOffRow>(
      `SELECT * FROM EMP_T04_weekly_off_rules WHERE partner_id = :partner_id AND status = TRUE ORDER BY weekly_off_rule_id DESC`,
      { partner_id: employee.partner_id }
    );
    const offices = await queryRows<OfficeLocationRow>(
      `SELECT * FROM EMP_T05_office_locations WHERE partner_id = :partner_id AND status = TRUE ORDER BY office_location_id DESC`,
      { partner_id: employee.partner_id }
    );
    const balances = await queryRows<LeaveBalanceRow>(
      `SELECT b.*, p.leave_name, p.leave_code, p.is_paid
       FROM EMP_T06_leave_balances b
       JOIN EMP_T02_leave_policies p ON p.leave_policy_id = b.leave_policy_id
       WHERE b.employee_id = :employee_id AND b.partner_id = :partner_id AND b.leave_year = :leave_year
       ORDER BY p.leave_name ASC`,
      { employee_id: employee.employee_id, partner_id: employee.partner_id, leave_year: new Date().getFullYear() }
    );
    const requests = await queryRows<LeaveRequestRow>(
      `SELECT lr.*, e.employee_name, e.employee_code, lp.leave_name, lp.is_paid
       FROM EMP_T07_leave_requests lr
       JOIN EMP_T01_employees e ON e.employee_id = lr.employee_id
       JOIN EMP_T02_leave_policies lp ON lp.leave_policy_id = lr.leave_policy_id
       WHERE lr.employee_id = :employee_id AND lr.deleted_at IS NULL
       ORDER BY lr.leave_request_id DESC
       LIMIT 12`,
      { employee_id: employee.employee_id }
    );
    const attendance = await queryRows<AttendanceRow>(
      `SELECT *
       FROM EMP_T08_attendance_logs
       WHERE employee_id = :employee_id
       ORDER BY attendance_date DESC, attendance_id DESC
       LIMIT 15`,
      { employee_id: employee.employee_id }
    );
    const todayAttendance = attendance.find((r) => r.attendance_date === today) ?? null;

    return {
      employee,
      employer: {
        partner_id: employee.partner_id,
        partner_name: employee.partner_name,
      },
      current_day_state: currentDayState,
      leave_policies: leavePolicies,
      holidays,
      weekly_off_rules: weeklyOffs,
      office_locations: offices,
      leave_balances: balances,
      leave_requests: requests,
      attendance_history: attendance,
      today_attendance: todayAttendance,
    };
  }

  @Get('leave-policies')
  @Security('jwt')
  public async listLeavePolicies(@Query() partner_id?: number): Promise<LeavePolicyRow[]> {
    return queryRows<LeavePolicyRow>(
      `SELECT * FROM EMP_T02_leave_policies
       WHERE (:partner_id IS NULL OR partner_id = :partner_id)
       ORDER BY leave_policy_id DESC`,
      { partner_id: partner_id ?? null }
    );
  }

  @Post('leave-policies')
  @Security('jwt')
  public async createLeavePolicy(@Body() body: LeavePolicyInput, @Request() req: any): Promise<{ leave_policy_id: number }> {
    const employee = await resolveEmployee(((req as any).user?.user_id ?? 0) as number);
    const partnerId = requirePartnerScope(body.partner_id, employee?.partner_id ?? null);
    const leaveCode = String(body.leave_code ?? '').trim();
    const leaveName = String(body.leave_name ?? '').trim();
    if (!leaveCode) throw httpError(400, 'leave_code is required');
    if (!leaveName) throw httpError(400, 'leave_name is required');

    const [result]: any = await pool.query(
      `INSERT INTO EMP_T02_leave_policies (
         partner_id, leave_code, leave_name, annual_limit_days, is_paid, allow_half_day,
         carry_forward_days, max_consecutive_days, min_notice_days, requires_approval, status
       ) VALUES (
         :partner_id, :leave_code, :leave_name, :annual_limit_days, :is_paid, :allow_half_day,
         :carry_forward_days, :max_consecutive_days, :min_notice_days, :requires_approval, :status
       )`,
      {
        partner_id: partnerId,
        leave_code: leaveCode,
        leave_name: leaveName,
        annual_limit_days: Number(body.annual_limit_days ?? 0),
        is_paid: body.is_paid !== false,
        allow_half_day: body.allow_half_day !== false,
        carry_forward_days: Number(body.carry_forward_days ?? 0),
        max_consecutive_days: Number(body.max_consecutive_days ?? 0),
        min_notice_days: Number(body.min_notice_days ?? 0),
        requires_approval: body.requires_approval !== false,
        status: body.status !== false,
      }
    );
    return { leave_policy_id: Number((result as any)[0]?.insertId) };
  }

  @Put('leave-policies/{leavePolicyId}')
  @Security('jwt')
  public async updateLeavePolicy(@Path() leavePolicyId: number, @Body() body: LeavePolicyInput): Promise<{ updated: true }> {
    const [result]: any = await pool.query(
      `UPDATE EMP_T02_leave_policies
       SET
         partner_id = COALESCE(:partner_id, partner_id),
         leave_code = COALESCE(NULLIF(TRIM(:leave_code), ''), leave_code),
         leave_name = COALESCE(NULLIF(TRIM(:leave_name), ''), leave_name),
         annual_limit_days = COALESCE(:annual_limit_days, annual_limit_days),
         is_paid = COALESCE(:is_paid, is_paid),
         allow_half_day = COALESCE(:allow_half_day, allow_half_day),
         carry_forward_days = COALESCE(:carry_forward_days, carry_forward_days),
         max_consecutive_days = COALESCE(:max_consecutive_days, max_consecutive_days),
         min_notice_days = COALESCE(:min_notice_days, min_notice_days),
         requires_approval = COALESCE(:requires_approval, requires_approval),
         status = COALESCE(:status, status)
       WHERE leave_policy_id = :leave_policy_id`,
      {
        leave_policy_id: leavePolicyId,
        partner_id: body.partner_id ?? null,
        leave_code: body.leave_code ?? null,
        leave_name: body.leave_name ?? null,
        annual_limit_days: body.annual_limit_days ?? null,
        is_paid: typeof body.is_paid === 'boolean' ? body.is_paid : null,
        allow_half_day: typeof body.allow_half_day === 'boolean' ? body.allow_half_day : null,
        carry_forward_days: body.carry_forward_days ?? null,
        max_consecutive_days: body.max_consecutive_days ?? null,
        min_notice_days: body.min_notice_days ?? null,
        requires_approval: typeof body.requires_approval === 'boolean' ? body.requires_approval : null,
        status: typeof body.status === 'boolean' ? body.status : null,
      }
    );
    if ((result as any)[0]?.affectedRows === 0) throw httpError(404, 'Leave policy not found');
    return { updated: true };
  }

  @Delete('leave-policies/{leavePolicyId}')
  @Security('jwt')
  public async deleteLeavePolicy(@Path() leavePolicyId: number): Promise<{ deleted: true }> {
    const [result]: any = await pool.query(`DELETE FROM EMP_T02_leave_policies WHERE leave_policy_id = :leave_policy_id`, { leave_policy_id: leavePolicyId });
    if ((result as any)[0]?.affectedRows === 0) throw httpError(404, 'Leave policy not found');
    return { deleted: true };
  }

  @Get('holidays')
  @Security('jwt')
  public async listHolidays(@Query() partner_id?: number): Promise<HolidayRow[]> {
    return queryRows<HolidayRow>(
      `SELECT * FROM EMP_T03_holiday_calendar
       WHERE (:partner_id IS NULL OR partner_id = :partner_id)
       ORDER BY COALESCE(holiday_date, CURDATE()) DESC, holiday_id DESC`,
      { partner_id: partner_id ?? null }
    );
  }

  @Post('holidays')
  @Security('jwt')
  public async createHoliday(@Body() body: HolidayInput, @Request() req: any): Promise<{ holiday_id: number }> {
    const employee = await resolveEmployee(((req as any).user?.user_id ?? 0) as number);
    const partnerId = requirePartnerScope(body.partner_id, employee?.partner_id ?? null);
    const [result]: any = await pool.query(
      `INSERT INTO EMP_T03_holiday_calendar (
         partner_id, holiday_name, holiday_type, holiday_date, holiday_month, holiday_day, holiday_year, is_paid, status
       ) VALUES (
         :partner_id, :holiday_name, :holiday_type, :holiday_date, :holiday_month, :holiday_day, :holiday_year, :is_paid, :status
       )`,
      {
        partner_id: partnerId,
        holiday_name: String(body.holiday_name ?? '').trim(),
        holiday_type: body.holiday_type ?? 'FIXED',
        holiday_date: asDate(body.holiday_date ?? null),
        holiday_month: body.holiday_month ?? null,
        holiday_day: body.holiday_day ?? null,
        holiday_year: body.holiday_year ?? null,
        is_paid: body.is_paid !== false,
        status: body.status !== false,
      }
    );
    return { holiday_id: Number((result as any)[0]?.insertId) };
  }

  @Put('holidays/{holidayId}')
  @Security('jwt')
  public async updateHoliday(@Path() holidayId: number, @Body() body: HolidayInput): Promise<{ updated: true }> {
    const [result]: any = await pool.query(
      `UPDATE EMP_T03_holiday_calendar
       SET
         partner_id = COALESCE(:partner_id, partner_id),
         holiday_name = COALESCE(NULLIF(TRIM(:holiday_name), ''), holiday_name),
         holiday_type = COALESCE(:holiday_type, holiday_type),
         holiday_date = COALESCE(:holiday_date, holiday_date),
         holiday_month = COALESCE(:holiday_month, holiday_month),
         holiday_day = COALESCE(:holiday_day, holiday_day),
         holiday_year = COALESCE(:holiday_year, holiday_year),
         is_paid = COALESCE(:is_paid, is_paid),
         status = COALESCE(:status, status)
       WHERE holiday_id = :holiday_id`,
      {
        holiday_id: holidayId,
        partner_id: body.partner_id ?? null,
        holiday_name: body.holiday_name ?? null,
        holiday_type: body.holiday_type ?? null,
        holiday_date: asDate(body.holiday_date ?? null),
        holiday_month: body.holiday_month ?? null,
        holiday_day: body.holiday_day ?? null,
        holiday_year: body.holiday_year ?? null,
        is_paid: typeof body.is_paid === 'boolean' ? body.is_paid : null,
        status: typeof body.status === 'boolean' ? body.status : null,
      }
    );
    if ((result as any)[0]?.affectedRows === 0) throw httpError(404, 'Holiday not found');
    return { updated: true };
  }

  @Delete('holidays/{holidayId}')
  @Security('jwt')
  public async deleteHoliday(@Path() holidayId: number): Promise<{ deleted: true }> {
    const [result]: any = await pool.query(`DELETE FROM EMP_T03_holiday_calendar WHERE holiday_id = :holiday_id`, { holiday_id: holidayId });
    if ((result as any)[0]?.affectedRows === 0) throw httpError(404, 'Holiday not found');
    return { deleted: true };
  }

  @Get('weekly-offs')
  @Security('jwt')
  public async listWeeklyOffRules(@Query() partner_id?: number): Promise<WeeklyOffRow[]> {
    return queryRows<WeeklyOffRow>(
      `SELECT * FROM EMP_T04_weekly_off_rules
       WHERE (:partner_id IS NULL OR partner_id = :partner_id)
       ORDER BY weekly_off_rule_id DESC`,
      { partner_id: partner_id ?? null }
    );
  }

  @Post('weekly-offs')
  @Security('jwt')
  public async createWeeklyOffRule(@Body() body: WeeklyOffInput, @Request() req: any): Promise<{ weekly_off_rule_id: number }> {
    const employee = await resolveEmployee(((req as any).user?.user_id ?? 0) as number);
    const partnerId = requirePartnerScope(body.partner_id, employee?.partner_id ?? null);
    const offDays = Array.isArray(body.off_days) ? body.off_days.map((d) => String(d).trim().toUpperCase()).filter(Boolean) : [];
    if (offDays.length === 0) throw httpError(400, 'off_days is required');
    const [result]: any = await pool.query(
      `INSERT INTO EMP_T04_weekly_off_rules (
         partner_id, country_id, rule_name, off_days_json, effective_from, effective_to, status
       ) VALUES (
         :partner_id, :country_id, :rule_name, :off_days_json, :effective_from, :effective_to, :status
       )`,
      {
        partner_id: partnerId,
        country_id: body.country_id ?? null,
        rule_name: String(body.rule_name ?? '').trim() || 'Weekly Off',
        off_days_json: JSON.stringify(offDays),
        effective_from: asDate(body.effective_from ?? null),
        effective_to: asDate(body.effective_to ?? null),
        status: body.status !== false,
      }
    );
    return { weekly_off_rule_id: Number((result as any)[0]?.insertId) };
  }

  @Put('weekly-offs/{weeklyOffRuleId}')
  @Security('jwt')
  public async updateWeeklyOffRule(@Path() weeklyOffRuleId: number, @Body() body: WeeklyOffInput): Promise<{ updated: true }> {
    const offDays = Array.isArray(body.off_days) ? body.off_days.map((d) => String(d).trim().toUpperCase()).filter(Boolean) : null;
    const [result]: any = await pool.query(
      `UPDATE EMP_T04_weekly_off_rules
       SET
         partner_id = COALESCE(:partner_id, partner_id),
         country_id = COALESCE(:country_id, country_id),
         rule_name = COALESCE(NULLIF(TRIM(:rule_name), ''), rule_name),
         off_days_json = COALESCE(:off_days_json, off_days_json),
         effective_from = COALESCE(:effective_from, effective_from),
         effective_to = COALESCE(:effective_to, effective_to),
         status = COALESCE(:status, status)
       WHERE weekly_off_rule_id = :weekly_off_rule_id`,
      {
        weekly_off_rule_id: weeklyOffRuleId,
        partner_id: body.partner_id ?? null,
        country_id: body.country_id ?? null,
        rule_name: body.rule_name ?? null,
        off_days_json: offDays ? JSON.stringify(offDays) : null,
        effective_from: asDate(body.effective_from ?? null),
        effective_to: asDate(body.effective_to ?? null),
        status: typeof body.status === 'boolean' ? body.status : null,
      }
    );
    if ((result as any)[0]?.affectedRows === 0) throw httpError(404, 'Weekly off rule not found');
    return { updated: true };
  }

  @Delete('weekly-offs/{weeklyOffRuleId}')
  @Security('jwt')
  public async deleteWeeklyOffRule(@Path() weeklyOffRuleId: number): Promise<{ deleted: true }> {
    const [result]: any = await pool.query(`DELETE FROM EMP_T04_weekly_off_rules WHERE weekly_off_rule_id = :weekly_off_rule_id`, { weekly_off_rule_id: weeklyOffRuleId });
    if ((result as any)[0]?.affectedRows === 0) throw httpError(404, 'Weekly off rule not found');
    return { deleted: true };
  }

  @Get('offices')
  @Security('jwt')
  public async listOfficeLocations(@Query() partner_id?: number): Promise<OfficeLocationRow[]> {
    return queryRows<OfficeLocationRow>(
      `SELECT * FROM EMP_T05_office_locations
       WHERE (:partner_id IS NULL OR partner_id = :partner_id)
       ORDER BY office_location_id DESC`,
      { partner_id: partner_id ?? null }
    );
  }

  @Post('offices')
  @Security('jwt')
  public async createOfficeLocation(@Body() body: OfficeLocationInput, @Request() req: any): Promise<{ office_location_id: number }> {
    const employee = await resolveEmployee(((req as any).user?.user_id ?? 0) as number);
    const partnerId = requirePartnerScope(body.partner_id, employee?.partner_id ?? null);
    const [result]: any = await pool.query(
      `INSERT INTO EMP_T05_office_locations (
         partner_id, location_name, country_id, state_id, city_id, address, latitude, longitude, radius_meters, status
       ) VALUES (
         :partner_id, :location_name, :country_id, :state_id, :city_id, :address, :latitude, :longitude, :radius_meters, :status
       )`,
      {
        partner_id: partnerId,
        location_name: String(body.location_name ?? '').trim(),
        country_id: body.country_id ?? null,
        state_id: body.state_id ?? null,
        city_id: body.city_id ?? null,
        address: body.address ?? null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        radius_meters: Number(body.radius_meters ?? 250),
        status: body.status !== false,
      }
    );
    return { office_location_id: Number((result as any)[0]?.insertId) };
  }

  @Put('offices/{officeLocationId}')
  @Security('jwt')
  public async updateOfficeLocation(@Path() officeLocationId: number, @Body() body: OfficeLocationInput): Promise<{ updated: true }> {
    const [result]: any = await pool.query(
      `UPDATE EMP_T05_office_locations
       SET
         partner_id = COALESCE(:partner_id, partner_id),
         location_name = COALESCE(NULLIF(TRIM(:location_name), ''), location_name),
         country_id = COALESCE(:country_id, country_id),
         state_id = COALESCE(:state_id, state_id),
         city_id = COALESCE(:city_id, city_id),
         address = COALESCE(:address, address),
         latitude = COALESCE(:latitude, latitude),
         longitude = COALESCE(:longitude, longitude),
         radius_meters = COALESCE(:radius_meters, radius_meters),
         status = COALESCE(:status, status)
       WHERE office_location_id = :office_location_id`,
      {
        office_location_id: officeLocationId,
        partner_id: body.partner_id ?? null,
        location_name: body.location_name ?? null,
        country_id: body.country_id ?? null,
        state_id: body.state_id ?? null,
        city_id: body.city_id ?? null,
        address: body.address ?? null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        radius_meters: body.radius_meters ?? null,
        status: typeof body.status === 'boolean' ? body.status : null,
      }
    );
    if ((result as any)[0]?.affectedRows === 0) throw httpError(404, 'Office location not found');
    return { updated: true };
  }

  @Delete('offices/{officeLocationId}')
  @Security('jwt')
  public async deleteOfficeLocation(@Path() officeLocationId: number): Promise<{ deleted: true }> {
    const [result]: any = await pool.query(`DELETE FROM EMP_T05_office_locations WHERE office_location_id = :office_location_id`, { office_location_id: officeLocationId });
    if ((result as any)[0]?.affectedRows === 0) throw httpError(404, 'Office location not found');
    return { deleted: true };
  }

  @Get('leave-balances')
  @Security('jwt')
  public async listLeaveBalances(@Query() employee_id?: number, @Query() partner_id?: number, @Query() leave_year?: number): Promise<LeaveBalanceRow[]> {
    return queryRows<LeaveBalanceRow>(
      `SELECT b.*, p.leave_name, p.leave_code, p.is_paid
       FROM EMP_T06_leave_balances b
       JOIN EMP_T02_leave_policies p ON p.leave_policy_id = b.leave_policy_id
       WHERE (:employee_id IS NULL OR b.employee_id = :employee_id)
         AND (:partner_id IS NULL OR b.partner_id = :partner_id)
         AND (:leave_year IS NULL OR b.leave_year = :leave_year)
       ORDER BY b.leave_balance_id DESC`,
      {
        employee_id: employee_id ?? null,
        partner_id: partner_id ?? null,
        leave_year: leave_year ?? null,
      }
    );
  }

  @Get('leave-requests')
  @Security('jwt')
  public async listLeaveRequests(@Query() employee_id?: number, @Query() partner_id?: number): Promise<LeaveRequestRow[]> {
    return queryRows<LeaveRequestRow>(
      `SELECT lr.*, e.employee_name, e.employee_code, lp.leave_name, lp.is_paid
       FROM EMP_T07_leave_requests lr
       JOIN EMP_T01_employees e ON e.employee_id = lr.employee_id
       JOIN EMP_T02_leave_policies lp ON lp.leave_policy_id = lr.leave_policy_id
       WHERE lr.deleted_at IS NULL
         AND (:employee_id IS NULL OR lr.employee_id = :employee_id)
         AND (:partner_id IS NULL OR lr.partner_id = :partner_id)
       ORDER BY lr.leave_request_id DESC`,
      {
        employee_id: employee_id ?? null,
        partner_id: partner_id ?? null,
      }
    );
  }

  @Post('leave-requests')
  @Security('jwt')
  public async createLeaveRequest(@Body() body: LeaveRequestInput, @Request() req: any): Promise<{ leave_request_id: number; balance_warning?: string | null }> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');
    const currentEmployee = await resolveEmployee(user.user_id);
    const employeeId = Number(body.employee_id ?? currentEmployee?.employee_id ?? 0);
    if (!employeeId) throw httpError(400, 'employee_id is required');
    const partnerId = requirePartnerScope(body.partner_id, currentEmployee?.partner_id ?? null);
    const policyId = Number(body.leave_policy_id ?? 0);
    if (!policyId) throw httpError(400, 'leave_policy_id is required');
    const leaveFrom = asDate(body.leave_from ?? null);
    const leaveTo = asDate(body.leave_to ?? null) ?? leaveFrom;
    if (!leaveFrom) throw httpError(400, 'leave_from is required');
    const mode = body.leave_mode ?? 'FULL';
    const leaveYear = new Date(`${leaveFrom}T00:00:00`).getFullYear();
    await ensureLeaveBalances(employeeId, partnerId, leaveYear);

    const policyRows = await queryRows<LeavePolicyRow>(`SELECT * FROM EMP_T02_leave_policies WHERE leave_policy_id = :leave_policy_id LIMIT 1`, { leave_policy_id: policyId });
    const policy = policyRows[0];
    if (!policy) throw httpError(404, 'Leave policy not found');

    const daysRequested = mode === 'FULL' ? 1 + Math.max(0, Math.floor((new Date(`${leaveTo}T00:00:00`).getTime() - new Date(`${leaveFrom}T00:00:00`).getTime()) / 86400000)) : 0.5;
    const balanceRows = await queryRows<LeaveBalanceRow>(
      `SELECT * FROM EMP_T06_leave_balances
       WHERE employee_id = :employee_id AND partner_id = :partner_id AND leave_policy_id = :leave_policy_id AND leave_year = :leave_year
       LIMIT 1`,
      { employee_id: employeeId, partner_id: partnerId, leave_policy_id: policyId, leave_year: leaveYear }
    );
    const balance = balanceRows[0];
    if (isTruthy(policy.is_paid) && balance && Number(balance.balance_days) < Number(daysRequested)) {
      throw httpError(400, 'Insufficient paid leave balance');
    }

    const [result]: any = await pool.query(
      `INSERT INTO EMP_T07_leave_requests (
         employee_id, partner_id, leave_policy_id, leave_year, leave_from, leave_to, leave_mode,
         days_requested, reason, document_path, status
       ) VALUES (
         :employee_id, :partner_id, :leave_policy_id, :leave_year, :leave_from, :leave_to, :leave_mode,
         :days_requested, :reason, :document_path, 'PENDING'
       )`,
      {
        employee_id: employeeId,
        partner_id: partnerId,
        leave_policy_id: policyId,
        leave_year: leaveYear,
        leave_from: leaveFrom,
        leave_to: leaveTo,
        leave_mode: mode,
        days_requested: daysRequested,
        reason: body.reason ?? null,
        document_path: body.document_path ?? null,
      }
    );
    return { leave_request_id: Number((result as any)[0]?.insertId), balance_warning: balance && Number(balance.balance_days) < Number(daysRequested) ? 'Balance may require approval' : null };
  }

  @Put('leave-requests/{leaveRequestId}/approve')
  @Security('jwt')
  public async approveLeaveRequest(@Path() leaveRequestId: number, @Body() body: ApproveInput, @Request() req: any): Promise<{ approved: true }> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');
    const approver = await resolveEmployee(user.user_id);
    const rowsReq = await queryRows<LeaveRequestRow>(`SELECT * FROM EMP_T07_leave_requests WHERE leave_request_id = :leave_request_id AND deleted_at IS NULL LIMIT 1`, { leave_request_id: leaveRequestId });
    const leaveRequest = rowsReq[0];
    if (!leaveRequest) throw httpError(404, 'Leave request not found');

    const policyRows = await queryRows<LeavePolicyRow>(`SELECT * FROM EMP_T02_leave_policies WHERE leave_policy_id = :leave_policy_id LIMIT 1`, { leave_policy_id: leaveRequest.leave_policy_id });
    const policy = policyRows[0];
    if (!policy) throw httpError(404, 'Leave policy not found');

    await pool.query(
      `UPDATE EMP_T07_leave_requests
       SET status = 'APPROVED', approval_remarks = :approval_remarks, approved_by = :approved_by, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE leave_request_id = :leave_request_id`,
      {
        leave_request_id: leaveRequestId,
        approval_remarks: body.approval_remarks ?? null,
        approved_by: approver?.employee_id ? user.user_id : user.user_id,
      }
    );

    if (isTruthy(policy.is_paid)) {
      await pool.query(
        `UPDATE EMP_T06_leave_balances
         SET used_days = used_days + :days_requested,
             balance_days = GREATEST(balance_days - :days_requested, 0),
             updated_at = CURRENT_TIMESTAMP
         WHERE employee_id = :employee_id AND partner_id = :partner_id AND leave_policy_id = :leave_policy_id AND leave_year = :leave_year`,
        {
          days_requested: Number(leaveRequest.days_requested ?? 0),
          employee_id: leaveRequest.employee_id,
          partner_id: leaveRequest.partner_id,
          leave_policy_id: leaveRequest.leave_policy_id,
          leave_year: leaveRequest.leave_year,
        }
      );
    }

    await pool.query(
      `UPDATE EMP_T08_attendance_logs
       SET day_type = 'LEAVE', status = 'CLOSED', remarks = COALESCE(remarks, 'Approved leave')
       WHERE employee_id = :employee_id AND attendance_date BETWEEN :leave_from AND :leave_to`,
      {
        employee_id: leaveRequest.employee_id,
        leave_from: leaveRequest.leave_from,
        leave_to: leaveRequest.leave_to,
      }
    );

    return { approved: true };
  }

  @Put('leave-requests/{leaveRequestId}/reject')
  @Security('jwt')
  public async rejectLeaveRequest(@Path() leaveRequestId: number, @Body() body: ApproveInput, @Request() req: any): Promise<{ rejected: true }> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');
    const leaveRequest = (await queryRows<LeaveRequestRow>(`SELECT * FROM EMP_T07_leave_requests WHERE leave_request_id = :leave_request_id AND deleted_at IS NULL LIMIT 1`, { leave_request_id: leaveRequestId }))[0];
    if (!leaveRequest) throw httpError(404, 'Leave request not found');

    await pool.query(
      `UPDATE EMP_T07_leave_requests
       SET status = 'REJECTED', approval_remarks = :approval_remarks, approved_by = :approved_by, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE leave_request_id = :leave_request_id`,
      {
        leave_request_id: leaveRequestId,
        approval_remarks: body.approval_remarks ?? null,
        approved_by: user.user_id,
      }
    );
    return { rejected: true };
  }

  @Get('attendance')
  @Security('jwt')
  public async attendance(@Query() employee_id?: number, @Query() partner_id?: number, @Query() date_from?: string, @Query() date_to?: string): Promise<AttendanceRow[]> {
    return queryRows<AttendanceRow>(
      `SELECT * FROM EMP_T08_attendance_logs
       WHERE (:employee_id IS NULL OR employee_id = :employee_id)
         AND (:partner_id IS NULL OR partner_id = :partner_id)
         AND (:date_from IS NULL OR attendance_date >= :date_from)
         AND (:date_to IS NULL OR attendance_date < :date_to)
       ORDER BY attendance_date DESC, attendance_id DESC`,
      {
        employee_id: employee_id ?? null,
        partner_id: partner_id ?? null,
        date_from: asDate(date_from ?? null),
        date_to: asDate(date_to ?? null),
      }
    );
  }

  @Get('monthly-report')
  @Security('jwt')
  public async monthlyReport(@Query() partner_id?: number, @Query() year?: number, @Query() month?: number): Promise<{
    month: number;
    year: number;
    partner_id: number | null;
    date_from: string;
    date_to: string;
    summary: MonthlyAttendanceSummaryRow[];
    attendance: AttendanceRow[];
  }> {
    const reportYear = Number.isFinite(Number(year)) ? Number(year) : new Date().getFullYear();
    const reportMonth = Number.isFinite(Number(month)) ? Number(month) : new Date().getMonth() + 1;
    const { date_from, date_to } = monthRange(reportYear, reportMonth);

    const attendance = await queryRows<AttendanceRow>(
      `SELECT * FROM EMP_T08_attendance_logs
       WHERE (:partner_id IS NULL OR partner_id = :partner_id)
         AND attendance_date >= :date_from
         AND attendance_date < :date_to
       ORDER BY attendance_date ASC, employee_id ASC, attendance_id ASC`,
      {
        partner_id: partner_id ?? null,
        date_from,
        date_to,
      }
    );

    const employees = await queryRows<{ employee_id: number; employee_code: string | null; employee_name: string; partner_id: number | null }>(
      `SELECT e.employee_id, e.employee_code, e.employee_name, e.partner_id
       FROM EMP_T01_employees e
       WHERE (:partner_id IS NULL OR e.partner_id = :partner_id)
       ORDER BY e.employee_id ASC`,
      { partner_id: partner_id ?? null }
    );

    const summaryMap = new Map<number, MonthlyAttendanceSummaryRow>();
    for (const emp of employees) {
      summaryMap.set(emp.employee_id, {
        employee_id: emp.employee_id,
        employee_code: emp.employee_code,
        employee_name: emp.employee_name,
        partner_id: emp.partner_id,
        present_days: 0,
        leave_days: 0,
        holiday_days: 0,
        weekly_off_days: 0,
        exception_days: 0,
        total_punch_days: 0,
        check_in_count: 0,
        check_out_count: 0,
        absent_days: 0,
      });
    }

    for (const row of attendance) {
      const current = summaryMap.get(row.employee_id) ?? {
        employee_id: row.employee_id,
        employee_code: row.employee_code ?? null,
        employee_name: row.employee_name ?? 'Employee',
        partner_id: row.partner_id ?? null,
        present_days: 0,
        leave_days: 0,
        holiday_days: 0,
        weekly_off_days: 0,
        exception_days: 0,
        total_punch_days: 0,
        check_in_count: 0,
        check_out_count: 0,
        absent_days: 0,
      };
      const hasPunch = Boolean(row.check_in_at || row.check_out_at);
      if (hasPunch) current.total_punch_days += 1;
      if (row.check_in_at) current.check_in_count += 1;
      if (row.check_out_at) current.check_out_count += 1;
      switch (row.day_type) {
        case 'WORK_DAY':
          current.present_days += hasPunch ? 1 : 0;
          break;
        case 'LEAVE':
          current.leave_days += 1;
          break;
        case 'HOLIDAY':
          current.holiday_days += 1;
          break;
        case 'WEEKLY_OFF':
          current.weekly_off_days += 1;
          break;
        case 'EXCEPTION':
          current.exception_days += 1;
          break;
      }
      summaryMap.set(row.employee_id, current);
    }

    const summary = Array.from(summaryMap.values()).map((row) => {
      const totalDaysInMonth = new Date(reportYear, reportMonth, 0).getDate();
      const usedDays = row.present_days + row.leave_days + row.holiday_days + row.weekly_off_days + row.exception_days;
      return {
        ...row,
        absent_days: Math.max(totalDaysInMonth - usedDays, 0),
      };
    });

    return {
      month: reportMonth,
      year: reportYear,
      partner_id: partner_id ?? null,
      date_from,
      date_to,
      summary,
      attendance,
    };
  }

  @Post('attendance/check-in')
  @Security('jwt')
  public async checkIn(@Body() body: AttendancePunchInput, @Request() req: any): Promise<{ attendance_id: number; day_type: string; remarks: string | null }> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');
    const employee = await resolveEmployee(user.user_id);
    if (!employee?.employee_id || !employee.partner_id) throw httpError(404, 'Employee profile not found');
    const attendanceDate = asDate(body.attendance_date ?? null) ?? todayIndia();
    const lat = toNumber(body.latitude);
    const lon = toNumber(body.longitude);
    const faceCapture = String(body.face_capture ?? '').trim();
    if (!faceCapture) throw httpError(400, 'face_capture is required');

    const dayState = await getPartnerDayState(employee.partner_id, attendanceDate);
    const officeRows = await queryRows<OfficeLocationRow>(
      `SELECT * FROM EMP_T05_office_locations WHERE partner_id = :partner_id AND status = TRUE ORDER BY office_location_id DESC`,
      { partner_id: employee.partner_id }
    );
    let distanceMeters: number | null = null;
    let officeWarning: string | null = null;
    if (lat !== null && lon !== null && officeRows.length > 0) {
      const distances = officeRows
        .filter((office) => office.latitude !== null && office.longitude !== null)
        .map((office) => ({
          office,
          distance: haversineMeters(lat, lon, Number(office.latitude), Number(office.longitude)),
        }));
      const nearest = distances.sort((a, b) => a.distance - b.distance)[0];
      if (nearest) {
        distanceMeters = Math.round(nearest.distance);
        if (distanceMeters > Number(nearest.office.radius_meters ?? 250)) {
          officeWarning = `Outside office radius (${nearest.office.location_name})`;
        }
      }
    }

    const dayType = officeWarning || dayState.day_type !== 'WORK_DAY' ? 'EXCEPTION' : 'WORK_DAY';
    const remarks = [dayState.remarks, officeWarning, body.remarks].filter(Boolean).join(' | ') || null;
    const [result]: any = await pool.query(
      `INSERT INTO EMP_T08_attendance_logs (
         employee_id, partner_id, attendance_date, check_in_at, check_in_latitude, check_in_longitude,
         check_in_distance_meters, check_in_face_capture, day_type, status, remarks
       ) VALUES (
         :employee_id, :partner_id, :attendance_date, CURRENT_TIMESTAMP, :check_in_latitude, :check_in_longitude,
         :check_in_distance_meters, :check_in_face_capture, :day_type, :status, :remarks
       )
       ON DUPLICATE KEY UPDATE
         check_in_at = COALESCE(check_in_at, CURRENT_TIMESTAMP),
         check_in_latitude = COALESCE(:check_in_latitude, check_in_latitude),
         check_in_longitude = COALESCE(:check_in_longitude, check_in_longitude),
         check_in_distance_meters = COALESCE(:check_in_distance_meters, check_in_distance_meters),
         check_in_face_capture = COALESCE(:check_in_face_capture, check_in_face_capture),
         day_type = VALUES(day_type),
         status = VALUES(status),
         remarks = COALESCE(VALUES(remarks), remarks),
         updated_at = CURRENT_TIMESTAMP`,
      {
        employee_id: employee.employee_id,
        partner_id: employee.partner_id,
        attendance_date: attendanceDate,
        check_in_latitude: lat,
        check_in_longitude: lon,
        check_in_distance_meters: distanceMeters,
        check_in_face_capture: faceCapture,
        day_type: dayType,
        status: dayType === 'EXCEPTION' ? 'EXCEPTION' : 'OPEN',
        remarks,
      }
    );

    const attendanceId = Number((result as any)[0]?.insertId ?? 0);
    const row = (await queryRows<AttendanceRow>(
      `SELECT * FROM EMP_T08_attendance_logs WHERE employee_id = :employee_id AND attendance_date = :attendance_date LIMIT 1`,
      { employee_id: employee.employee_id, attendance_date: attendanceDate }
    ))[0];
    return { attendance_id: Number(row?.attendance_id ?? attendanceId), day_type: String(row?.day_type ?? dayType), remarks: row?.remarks ?? remarks };
  }

  @Post('attendance/check-out')
  @Security('jwt')
  public async checkOut(@Body() body: AttendancePunchInput, @Request() req: any): Promise<{ attendance_id: number; day_type: string; remarks: string | null }> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');
    const employee = await resolveEmployee(user.user_id);
    if (!employee?.employee_id || !employee.partner_id) throw httpError(404, 'Employee profile not found');
    const attendanceDate = asDate(body.attendance_date ?? null) ?? todayIndia();
    const lat = toNumber(body.latitude);
    const lon = toNumber(body.longitude);
    const faceCapture = String(body.face_capture ?? '').trim();
    if (!faceCapture) throw httpError(400, 'face_capture is required');

    const existing = (await queryRows<AttendanceRow>(
      `SELECT * FROM EMP_T08_attendance_logs WHERE employee_id = :employee_id AND attendance_date = :attendance_date LIMIT 1`,
      { employee_id: employee.employee_id, attendance_date: attendanceDate }
    ))[0];
    if (!existing) throw httpError(404, 'Check-in not found for today');

    let distanceMeters: number | null = null;
    const officeRows = await queryRows<OfficeLocationRow>(
      `SELECT * FROM EMP_T05_office_locations WHERE partner_id = :partner_id AND status = TRUE ORDER BY office_location_id DESC`,
      { partner_id: employee.partner_id }
    );
    if (lat !== null && lon !== null && officeRows.length > 0) {
      const distances = officeRows
        .filter((office) => office.latitude !== null && office.longitude !== null)
        .map((office) => ({
          office,
          distance: haversineMeters(lat, lon, Number(office.latitude), Number(office.longitude)),
        }));
      const nearest = distances.sort((a, b) => a.distance - b.distance)[0];
      if (nearest) distanceMeters = Math.round(nearest.distance);
    }

    const remarks = [existing.remarks, body.remarks].filter(Boolean).join(' | ') || null;
    await pool.query(
      `UPDATE EMP_T08_attendance_logs
       SET
         check_out_at = CURRENT_TIMESTAMP,
         check_out_latitude = :check_out_latitude,
         check_out_longitude = :check_out_longitude,
         check_out_distance_meters = :check_out_distance_meters,
         check_out_face_capture = :check_out_face_capture,
         status = CASE WHEN day_type = 'EXCEPTION' THEN 'EXCEPTION' ELSE 'CLOSED' END,
         remarks = :remarks,
         updated_at = CURRENT_TIMESTAMP
       WHERE attendance_id = :attendance_id`,
      {
        attendance_id: existing.attendance_id,
        check_out_latitude: lat,
        check_out_longitude: lon,
        check_out_distance_meters: distanceMeters,
        check_out_face_capture: faceCapture,
        remarks,
      }
    );

    const updated = (await queryRows<AttendanceRow>(`SELECT * FROM EMP_T08_attendance_logs WHERE attendance_id = :attendance_id LIMIT 1`, { attendance_id: existing.attendance_id }))[0];
    return { attendance_id: Number(updated?.attendance_id ?? existing.attendance_id), day_type: String(updated?.day_type ?? existing.day_type), remarks: updated?.remarks ?? remarks };
  }
}
