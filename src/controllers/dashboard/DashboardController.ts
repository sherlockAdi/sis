import { Controller, Get, Request, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { pool } from '../../db/pool';
import { getSelfProfile } from '../../services/authService';
import { getPartnerByUserId } from '../../services/partnerService';
import { getCandidateProfileMissingFields, type CandidateProfileLike } from '../../utils/candidateProfileCompleteness';
import { httpError } from '../../utils/httpErrors';

const INDIA_TZ = 'Asia/Kolkata';

type DashboardTone = 'slate' | 'green' | 'red' | 'amber' | 'blue' | 'orange' | 'violet';

type DashboardCard = {
  key: string;
  label: string;
  value: number;
  trend: string;
  tone: DashboardTone;
};

type DashboardDayPoint = {
  day: string;
  present: number;
  absent: number;
};

type EmployeeDashboardDayPoint = {
  day: string;
  present: number;
  absent: number;
  leave: number;
  holiday: number;
  weekly_off: number;
};

type DashboardResponse = {
  role: 'ADMIN';
  title: string;
  generated_at: string;
  summary: {
    total_employees: number;
    active_employees: number;
    present_today: number;
    absent_today: number;
    on_leave: number;
    open_tickets: number;
    pending_approvals: number;
    active_partners: number;
    open_jobs: number;
    deployed_this_month: number;
    weekly_off_today: number;
    holiday_today: number;
    late_checkins: number;
  };
  cards: DashboardCard[];
  charts: {
    attendance_by_day: DashboardDayPoint[];
    status_breakdown: { label: string; value: number }[];
  };
};

type PartnerDashboardResponse = {
  role: 'SOURCING' | 'PARTNER';
  title: string;
  generated_at: string;
  partner: {
    partner_id: number;
    partner_code: string | null;
    partner_name: string;
  };
  summary: {
    total_jobs: number;
    active_jobs: number;
    total_applications: number;
    shortlisted: number;
    interviews_scheduled: number;
    selected: number;
    deployed: number;
    pending_actions: number;
    rejected: number;
    recent_applications: number;
  };
  cards: DashboardCard[];
  charts: {
    application_pipeline: { label: string; value: number }[];
    jobs_by_status: { label: string; value: number }[];
    applications_by_day: DashboardDayPoint[];
  };
};

type CandidateDashboardResponse = {
  role: 'CANDIDATE';
  title: string;
  generated_at: string;
  candidate: {
    candidate_id: number;
    candidate_code: string | null;
    first_name: string | null;
    last_name: string | null;
    full_name: string;
    phone: string | null;
    email: string | null;
    status: string | null;
    is_verified: boolean;
    profile_complete: boolean;
    missing_fields: string[];
    missing_fields_count: number;
    documents_uploaded: number;
    documents_pending: number;
    total_applications: number;
    total_deployments: number;
  };
  summary: {
    total_applications: number;
    draft_applications: number;
    submitted_applications: number;
    under_review: number;
    interviews_scheduled: number;
    shortlisted: number;
    selected: number;
    deployed: number;
    rejected: number;
    documents_uploaded: number;
    documents_pending: number;
    pending_actions: number;
  };
  cards: DashboardCard[];
  charts: {
    application_pipeline: { label: string; value: number }[];
    document_status_breakdown: { label: string; value: number }[];
    deployment_status_breakdown: { label: string; value: number }[];
  };
  recent_applications: {
    application_id: number;
    job_title: string;
    job_code: string | null;
    application_date: string | null;
    status: string | null;
  }[];
  recent_deployments: {
    deployment_id: number;
    job_title: string;
    job_code: string | null;
    current_status: string | null;
    created_at: string;
  }[];
};

type EmployeeDashboardResponse = {
  role: 'EMPLOYEE';
  title: string;
  generated_at: string;
  employee: {
    employee_id: number;
    employee_code: string | null;
    employee_name: string;
    partner_id: number | null;
    partner_name: string | null;
    work_location: string | null;
    shift_timing: string | null;
    employment_status: string | null;
  };
  today: {
    date: string;
    day_type: 'WORK_DAY' | 'HOLIDAY' | 'WEEKLY_OFF';
    attendance_status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HOLIDAY' | 'WEEKLY_OFF' | 'OPEN' | 'NONE';
    remarks: string | null;
    check_in_at: string | null;
    check_out_at: string | null;
  };
  summary: {
    month: number;
    year: number;
    total_days_in_month: number;
    working_days: number;
    present_days: number;
    absent_days: number;
    leave_days: number;
    holiday_days: number;
    weekly_off_days: number;
    late_checkins: number;
    check_in_count: number;
    check_out_count: number;
    pending_leave_requests: number;
    approved_leave_requests: number;
    rejected_leave_requests: number;
    leave_balance_days: number;
  };
  cards: DashboardCard[];
  charts: {
    attendance_trend: EmployeeDashboardDayPoint[];
    leave_balance_breakdown: { label: string; value: number }[];
  };
  recent_attendance: {
    attendance_date: string;
    day_type: string;
    status: string;
    check_in_at: string | null;
    check_out_at: string | null;
  }[];
  recent_leave_requests: {
    leave_request_id: number;
    leave_name: string | null;
    leave_from: string;
    leave_to: string | null;
    leave_mode: string | null;
    days_requested: number;
    status: string | null;
    approval_remarks: string | null;
  }[];
};

type CountRow = RowDataPacket & { c: number };
type PartnerCountRow = RowDataPacket & { partner_id: number; employee_count: number };
type AttendanceByDayRow = RowDataPacket & { day_key: string; present_count: number };
type DeploymentRow = RowDataPacket & { deployment_id: number; current_status: string | null; created_at: string };
type PartnerJobRow = RowDataPacket & { job_id: number; status: string | null; created_at: string };
type PartnerApplicationRow = RowDataPacket & {
  application_id: number;
  candidate_id: number;
  candidate_name: string;
  job_id: number;
  job_title: string;
  job_code: string | null;
  application_date: string | null;
  status: string | null;
};
type PartnerInterviewRow = RowDataPacket & {
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
type CandidateDashboardApplicationRow = RowDataPacket & {
  application_id: number;
  candidate_id: number;
  candidate_name: string;
  job_id: number;
  job_title: string;
  job_code: string | null;
  application_date: string | null;
  status: string | null;
};
type CandidateDashboardDocumentRow = RowDataPacket & {
  id: number;
  application_id: number | null;
  candidate_id: number;
  document_type_id: number;
  document_name: string | null;
  file_path: string | null;
  uploaded_at: string | null;
};
type CandidateDashboardDeploymentRow = RowDataPacket & {
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
type CandidateDashboardProfileRow = CandidateProfileLike & {
  candidate_id: number;
  candidate_code: string | null;
  status: string | null;
  user_id: number | null;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email?: string | null;
};
type EmployeeProfileRow = RowDataPacket & {
  employee_id: number;
  employee_code: string | null;
  employee_name: string;
  partner_id: number | null;
  partner_name: string | null;
  work_location: string | null;
  shift_timing: string | null;
  employment_status: string | null;
};
type EmployeeLeaveBalanceRow = RowDataPacket & {
  leave_balance_id: number;
  employee_id: number;
  partner_id: number;
  leave_policy_id: number;
  leave_year: number;
  opening_balance: number;
  credited_days: number;
  used_days: number;
  balance_days: number;
  status: boolean;
  leave_name: string | null;
  leave_code: string | null;
  is_paid: number | boolean | null;
};
type LeavePolicyLiteRow = RowDataPacket & {
  leave_policy_id: number;
  annual_limit_days: number;
};
type EmployeeLeaveRequestRow = RowDataPacket & {
  leave_request_id: number;
  employee_id: number;
  partner_id: number;
  leave_policy_id: number;
  leave_year: number;
  leave_from: string;
  leave_to: string | null;
  leave_mode: string | null;
  days_requested: number;
  reason: string | null;
  document_path: string | null;
  status: string | null;
  approval_remarks: string | null;
  approved_by: number | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  leave_name: string | null;
  leave_code: string | null;
  is_paid: number | boolean | null;
};
type EmployeeAttendanceRow = RowDataPacket & {
  attendance_id: number;
  employee_id: number;
  partner_id: number;
  attendance_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  day_type: string;
  status: string;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  employee_name?: string;
  employee_code?: string;
};

function todayIndia(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: INDIA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
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

function weekdayName(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: INDIA_TZ, weekday: 'long' }).format(new Date(`${dateStr}T00:00:00+05:30`));
}

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ');
}

function normalizeDateKey(value: string | null | undefined): string {
  return String(value ?? '').trim().slice(0, 10);
}

function dayKeyToDate(dayKey: string): Date {
  return new Date(`${dayKey}T00:00:00+05:30`);
}

function addDays(dayKey: string, days: number): string | null {
  const date = dayKeyToDate(dayKey);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + days);
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: INDIA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return formatted;
}

function formatLocalTime(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: INDIA_TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function parseShiftStart(shiftTiming: string | null): string | null {
  const raw = String(shiftTiming ?? '').trim();
  if (!raw) return null;
  const match = raw.match(/(\d{1,2}:\d{2})(?:\s*([AP]M))?/i);
  if (!match) return null;
  const timePart = match[1];
  const suffix = match[2]?.toUpperCase() ?? null;
  const [hoursStr, minutesStr] = timePart.split(':');
  let hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (suffix === 'AM') {
    if (hours === 12) hours = 0;
  } else if (suffix === 'PM' && hours < 12) {
    hours += 12;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

function compareLocalTime(a: string, b: string): number {
  return a.localeCompare(b);
}

function classifyCandidateApplicationStatus(value: string | null | undefined): string {
  const status = normalizeStatus(value);
  if (!status) return 'pending';
  if (status.includes('draft')) return 'draft';
  if (status.includes('shortlist')) return 'shortlisted';
  if (status.includes('interview')) return 'interview';
  if (status.includes('select') || status.includes('approve')) return 'selected';
  if (status.includes('deploy')) return 'deployed';
  if (status.includes('reject')) return 'rejected';
  if (status.includes('review') || status.includes('screen')) return 'under_review';
  if (status.includes('apply') || status.includes('submit')) return 'submitted';
  return 'pending';
}

function buildFullName(firstName: string | null | undefined, lastName: string | null | undefined): string {
  return `${String(firstName ?? '').trim()} ${String(lastName ?? '').trim()}`.trim();
}

async function ensureLeaveBalances(employeeId: number, partnerId: number, leaveYear: number): Promise<void> {
  const policies = await queryRows<LeavePolicyLiteRow>(
    `SELECT leave_policy_id, annual_limit_days
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

async function queryRows<T>(sql: string, params?: Record<string, unknown>): Promise<T[]> {
  const [result] = await pool.query(sql, params as any);
  return Array.isArray(result) ? (result as T[]) : [];
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
       AND (
         effective_to IS NULL
         OR effective_to >= :attendance_date
         OR DATE(effective_to) = DATE(effective_from)
       )
       AND JSON_CONTAINS(off_days_json, JSON_QUOTE(:weekday_name))
     ORDER BY weekly_off_rule_id DESC
     LIMIT 1`,
    { partner_id: partnerId, attendance_date: dateStr, weekday_name: weekday }
  );
  const weekly = weeklyRows[0];
  if (weekly) return { day_type: 'WEEKLY_OFF', remarks: `Weekly off: ${weekly.rule_name}` };

  return { day_type: 'WORK_DAY', remarks: null };
}

function buildDayRange(daysBack: number): string[] {
  const out: string[] = [];
  const base = new Date(`${todayIndia()}T00:00:00+05:30`);
  for (let i = daysBack; i >= 0; i -= 1) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    const label = new Intl.DateTimeFormat('en-CA', {
      timeZone: INDIA_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
    out.push(label);
  }
  return out;
}

@Route('dashboard')
@Tags('Dashboard')
export class DashboardController extends Controller {
  @Get('candidate')
  @Security('jwt')
  public async candidate(@Request() req: any): Promise<CandidateDashboardResponse> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const profile = await getSelfProfile(user.user_id);
    const roleCode = String(profile.role_code ?? '').trim().toUpperCase();
    if (roleCode !== 'CANDIDATE') {
      throw httpError(403, 'Forbidden');
    }

    const candidateRows = await queryRows<CandidateDashboardProfileRow>(
      `SELECT
         c.candidate_id,
         c.candidate_code,
         c.first_name,
         c.last_name,
         c.phone,
         c.email,
         c.passport_number,
         c.country_id,
         c.state_id,
         c.city_id,
         c.father_name,
         c.address1,
         c.address2,
         c.pincode,
         c.dob,
         c.gender,
         c.skills,
         c.education,
         c.experience,
         c.industry_type,
         c.resume_file_path,
         c.passport_expiry_date,
         c.passport_file_path,
         c.aadhar_number,
         c.aadhar_file_path,
         c.pan_number,
         c.pan_file_path,
         c.voter_id_number,
         c.voter_id_file_path,
         c.profile_photo_file_path,
         c.languages_known,
         c.status,
         c.is_verified,
         c.user_id,
         c.created_at,
         c.updated_at,
         c.deleted_at
       FROM REC_T01_candidates c
       WHERE c.user_id = :user_id
       ORDER BY c.candidate_id DESC
       LIMIT 1`,
      { user_id: user.user_id }
    );
    const candidate = candidateRows[0];
    if (!candidate?.candidate_id) {
      throw httpError(404, 'Candidate profile not found');
    }

    const [applications, documents, deployments] = await Promise.all([
      callProc<RowDataPacket & CandidateDashboardApplicationRow>(
        `CALL sp_rec_applications('LIST_BY_CANDIDATE', NULL, :candidate_id, NULL, NULL, NULL, NULL)`,
        { candidate_id: candidate.candidate_id }
      ),
      callProc<RowDataPacket & CandidateDashboardDocumentRow>(
        `CALL sp_rec_candidate_documents('LIST_BY_CANDIDATE', NULL, :candidate_id, NULL, NULL)`,
        { candidate_id: candidate.candidate_id }
      ),
      callProc<RowDataPacket & CandidateDashboardDeploymentRow>(
        `CALL sp_dep_deployments('LIST_BY_CANDIDATE', NULL, :candidate_id, NULL, NULL, NULL, NULL)`,
        { candidate_id: candidate.candidate_id }
      ),
    ]);

    const missingFields = getCandidateProfileMissingFields(candidate);
    const profileComplete = missingFields.length === 0;
    const isVerified = Boolean(candidate.is_verified);

    const applicationStatusCounts = {
      draft: 0,
      submitted: 0,
      under_review: 0,
      shortlisted: 0,
      interview: 0,
      selected: 0,
      deployed: 0,
      rejected: 0,
      pending: 0,
    };
    for (const row of applications) {
      const key = classifyCandidateApplicationStatus(row.status);
      if (key in applicationStatusCounts) {
        applicationStatusCounts[key as keyof typeof applicationStatusCounts] += 1;
      }
    }

    const documentsUploaded = documents.filter((doc) => Boolean(String(doc.file_path ?? '').trim())).length;
    const documentsPending = Math.max(documents.length - documentsUploaded, 0);

    const deploymentStatusMap = new Map<string, number>();
    for (const row of deployments) {
      const status = normalizeStatus(row.current_status) || 'unknown';
      deploymentStatusMap.set(status, (deploymentStatusMap.get(status) ?? 0) + 1);
    }

    const totalApplications = applications.length;
    const totalDeployments = deployments.length;
    const pendingActions = Math.max(
      totalApplications - applicationStatusCounts.selected - applicationStatusCounts.deployed - applicationStatusCounts.rejected,
      0
    );
    const fullName = buildFullName(candidate.first_name ?? null, candidate.last_name ?? null) || 'Candidate';

    const recentApplications = [...applications]
      .sort((a, b) => String(b.application_date ?? '').localeCompare(String(a.application_date ?? '')))
      .slice(0, 5)
      .map((row) => ({
        application_id: row.application_id,
        job_title: row.job_title,
        job_code: row.job_code,
        application_date: row.application_date,
        status: row.status,
      }));

    const recentDeployments = [...deployments]
      .sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')))
      .slice(0, 5)
      .map((row) => ({
        deployment_id: row.deployment_id,
        job_title: row.job_title,
        job_code: row.job_code,
        current_status: row.current_status,
        created_at: row.created_at,
      }));

    return {
      role: 'CANDIDATE',
      title: 'Candidate Dashboard',
      generated_at: new Date().toISOString(),
      candidate: {
        candidate_id: candidate.candidate_id,
        candidate_code: candidate.candidate_code,
        first_name: candidate.first_name ?? null,
        last_name: candidate.last_name ?? null,
        full_name: fullName,
        phone: candidate.phone ?? null,
        email: candidate.email ?? null,
        status: candidate.status ?? null,
        is_verified: isVerified,
        profile_complete: profileComplete,
        missing_fields: missingFields,
        missing_fields_count: missingFields.length,
        documents_uploaded: documentsUploaded,
        documents_pending: documentsPending,
        total_applications: totalApplications,
        total_deployments: totalDeployments,
      },
      summary: {
        total_applications: totalApplications,
        draft_applications: applicationStatusCounts.draft,
        submitted_applications: applicationStatusCounts.submitted,
        under_review: applicationStatusCounts.under_review,
        interviews_scheduled: applicationStatusCounts.interview,
        shortlisted: applicationStatusCounts.shortlisted,
        selected: applicationStatusCounts.selected,
        deployed: applicationStatusCounts.deployed,
        rejected: applicationStatusCounts.rejected,
        documents_uploaded: documentsUploaded,
        documents_pending: documentsPending,
        pending_actions: pendingActions,
      },
      cards: [
        { key: 'total_applications', label: 'Total Applications', value: totalApplications, trend: 'My applications', tone: 'slate' },
        { key: 'draft_applications', label: 'Draft Applications', value: applicationStatusCounts.draft, trend: 'Saved drafts', tone: 'orange' },
        { key: 'submitted_applications', label: 'Submitted', value: applicationStatusCounts.submitted, trend: 'Applied jobs', tone: 'blue' },
        { key: 'shortlisted', label: 'Shortlisted', value: applicationStatusCounts.shortlisted, trend: 'Under review', tone: 'amber' },
        { key: 'interviews_scheduled', label: 'Interviews', value: applicationStatusCounts.interview, trend: 'Interview stage', tone: 'violet' },
        { key: 'selected', label: 'Selected', value: applicationStatusCounts.selected, trend: 'Offer / approval', tone: 'green' },
        { key: 'deployed', label: 'Deployed', value: applicationStatusCounts.deployed, trend: 'Joined jobs', tone: 'green' },
        { key: 'pending_actions', label: 'Pending Actions', value: pendingActions, trend: 'Needs follow-up', tone: 'red' },
      ],
      charts: {
        application_pipeline: [
          { label: 'Draft', value: applicationStatusCounts.draft },
          { label: 'Submitted', value: applicationStatusCounts.submitted },
          { label: 'Under Review', value: applicationStatusCounts.under_review },
          { label: 'Interview', value: applicationStatusCounts.interview },
          { label: 'Selected', value: applicationStatusCounts.selected },
          { label: 'Deployed', value: applicationStatusCounts.deployed },
        ],
        document_status_breakdown: [
          { label: 'Uploaded', value: documentsUploaded },
          { label: 'Pending', value: documentsPending },
        ],
        deployment_status_breakdown: Array.from(deploymentStatusMap.entries()).slice(0, 6).map(([label, value]) => ({
          label: label.replace(/\b\w/g, (ch) => ch.toUpperCase()),
          value,
        })),
      },
      recent_applications: recentApplications,
      recent_deployments: recentDeployments,
    };
  }

  @Get('partner')
  @Security('jwt')
  public async partner(@Request() req: any): Promise<PartnerDashboardResponse> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const profile = await getSelfProfile(user.user_id);
    const roleCode = String(profile.role_code ?? '').trim().toUpperCase();
    if (roleCode !== 'SOURCING' && roleCode !== 'PARTNER') {
      throw httpError(403, 'Forbidden');
    }

    const partner = await getPartnerByUserId(user.user_id);
    if (!partner?.partner_id) throw httpError(403, 'Partner profile not found');

    const now = new Date();
    const { date_from, date_to } = monthRange(now.getFullYear(), now.getMonth() + 1);
    const [jobs, applications, interviews] = await Promise.all([
      callProc<RowDataPacket & PartnerJobRow>(
        `CALL sp_job_jobs('LIST_BY_PARTNER', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, :partner_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
        { partner_id: partner.partner_id }
      ),
      callProc<RowDataPacket & PartnerApplicationRow>(
        `CALL sp_rec_applications('LIST_BY_PARTNER', NULL, NULL, NULL, NULL, NULL, :partner_id)`,
        { partner_id: partner.partner_id }
      ),
      callProc<RowDataPacket & PartnerInterviewRow>(
        `CALL sp_rec_partner_interviews(:partner_id)`,
        { partner_id: partner.partner_id }
      ),
    ]);

    const activeJobs = jobs.filter((job) => {
      const status = normalizeStatus(job.status);
      return status.includes('open') || status.includes('active') || status.includes('publish') || status.includes('live');
    }).length;

    const appStatus = (row: PartnerApplicationRow) => normalizeStatus(row.status);
    const totalApplications = applications.length;
    const shortlisted = applications.filter((row) => appStatus(row).includes('shortlist')).length;
    const interviewStage = applications.filter((row) => appStatus(row).includes('interview')).length;
    const selected = applications.filter((row) => appStatus(row).includes('select') || appStatus(row).includes('approved')).length;
    const deployed = applications.filter((row) => appStatus(row).includes('deploy')).length;
    const rejected = applications.filter((row) => appStatus(row).includes('reject')).length;
    const pendingActions = Math.max(totalApplications - shortlisted - interviewStage - selected - deployed - rejected, 0);

    const recentApplications = applications.filter((row) => {
      const appDate = String(row.application_date ?? '').slice(0, 10);
      return appDate >= date_from && appDate < date_to;
    }).length;

    const dayKeys = buildDayRange(6);
    const applicationsByDay = dayKeys.map((dayKey) => {
      const count = applications.filter((row) => String(row.application_date ?? '').slice(0, 10) === dayKey).length;
      return {
        day: dayKey.slice(5),
        present: count,
        absent: 0,
      };
    });

    const jobsByStatusMap = new Map<string, number>();
    for (const job of jobs) {
      const status = normalizeStatus(job.status) || 'unknown';
      jobsByStatusMap.set(status, (jobsByStatusMap.get(status) ?? 0) + 1);
    }
    const jobsByStatus = Array.from(jobsByStatusMap.entries()).slice(0, 4).map(([label, value]) => ({
      label: label.replace(/\b\w/g, (ch) => ch.toUpperCase()),
      value,
    }));

    return {
      role: roleCode as 'SOURCING' | 'PARTNER',
      title: 'Sourcing Partner Dashboard',
      generated_at: new Date().toISOString(),
      partner: {
        partner_id: partner.partner_id,
        partner_code: partner.partner_code,
        partner_name: partner.partner_name,
      },
      summary: {
        total_jobs: jobs.length,
        active_jobs: activeJobs,
        total_applications: totalApplications,
        shortlisted,
        interviews_scheduled: interviews.length,
        selected,
        deployed,
        pending_actions: pendingActions,
        rejected,
        recent_applications: recentApplications,
      },
      cards: [
        { key: 'total_jobs', label: 'Total Jobs', value: jobs.length, trend: 'Live mandates', tone: 'slate' },
        { key: 'active_jobs', label: 'Active Jobs', value: activeJobs, trend: 'Open positions', tone: 'blue' },
        { key: 'applications', label: 'Applications', value: totalApplications, trend: 'All applications', tone: 'green' },
        { key: 'shortlisted', label: 'Shortlisted', value: shortlisted, trend: 'Under review', tone: 'amber' },
        { key: 'interviews', label: 'Interviews', value: interviews.length, trend: 'Scheduled interviews', tone: 'violet' },
        { key: 'selected', label: 'Selected', value: selected, trend: 'Final selection', tone: 'orange' },
        { key: 'deployed', label: 'Deployed', value: deployed, trend: 'Moved to workforce', tone: 'green' },
        { key: 'pending_actions', label: 'Pending Actions', value: pendingActions, trend: 'Needs follow-up', tone: 'red' },
      ],
      charts: {
        application_pipeline: [
          { label: 'Applied', value: Math.max(totalApplications - shortlisted - interviewStage - selected - deployed - rejected, 0) },
          { label: 'Shortlisted', value: shortlisted },
          { label: 'Interview', value: interviewStage },
          { label: 'Selected', value: selected },
          { label: 'Deployed', value: deployed },
        ],
        jobs_by_status: jobsByStatus,
        applications_by_day: applicationsByDay,
      },
    };
  }

  @Get('employee')
  @Security('jwt')
  public async employee(@Request() req: any): Promise<EmployeeDashboardResponse> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const profile = await getSelfProfile(user.user_id);
    const roleCode = String(profile.role_code ?? '').trim().toUpperCase();
    if (roleCode !== 'EMPLOYEE') {
      throw httpError(403, 'Forbidden');
    }

    const employeeRows = await queryRows<EmployeeProfileRow>(
      `SELECT e.employee_id, e.employee_code, e.employee_name, e.partner_id, p.partner_name, e.work_location, e.shift_timing, e.employment_status
       FROM EMP_T01_employees e
       JOIN REC_T01_candidates c ON c.candidate_id = e.candidate_id
       LEFT JOIN PART_T01_partners p ON p.partner_id = e.partner_id
       WHERE c.user_id = :user_id
       ORDER BY e.employee_id DESC
       LIMIT 1`,
      { user_id: user.user_id }
    );
    const employee = employeeRows[0];
    if (!employee?.employee_id || !employee.partner_id) {
      throw httpError(404, 'Employee profile not found');
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const { date_from, date_to } = monthRange(year, month);
    const today = todayIndia();

    await ensureLeaveBalances(employee.employee_id, employee.partner_id, year);

    const [monthAttendance, leaveBalances, leaveRequests, recentAttendance] = await Promise.all([
      queryRows<EmployeeAttendanceRow>(
        `SELECT a.*, e.employee_name, e.employee_code
         FROM EMP_T08_attendance_logs a
         LEFT JOIN EMP_T01_employees e ON e.employee_id = a.employee_id
         WHERE a.employee_id = :employee_id
           AND a.attendance_date >= :date_from
           AND a.attendance_date < :date_to
         ORDER BY a.attendance_date ASC, a.attendance_id ASC`,
        { employee_id: employee.employee_id, date_from, date_to }
      ),
      queryRows<EmployeeLeaveBalanceRow>(
        `SELECT b.*, p.leave_name, p.leave_code, p.is_paid
         FROM EMP_T06_leave_balances b
         JOIN EMP_T02_leave_policies p ON p.leave_policy_id = b.leave_policy_id
         WHERE b.employee_id = :employee_id
           AND b.partner_id = :partner_id
           AND b.leave_year = :leave_year
         ORDER BY p.leave_name ASC`,
        { employee_id: employee.employee_id, partner_id: employee.partner_id, leave_year: year }
      ),
      queryRows<EmployeeLeaveRequestRow>(
        `SELECT lr.*, lp.leave_name, lp.leave_code, lp.is_paid
         FROM EMP_T07_leave_requests lr
         JOIN EMP_T02_leave_policies lp ON lp.leave_policy_id = lr.leave_policy_id
         WHERE lr.employee_id = :employee_id
           AND lr.deleted_at IS NULL
         ORDER BY lr.leave_request_id DESC
         LIMIT 12`,
        { employee_id: employee.employee_id }
      ),
      queryRows<EmployeeAttendanceRow>(
        `SELECT a.*, e.employee_name, e.employee_code
         FROM EMP_T08_attendance_logs a
         LEFT JOIN EMP_T01_employees e ON e.employee_id = a.employee_id
         WHERE a.employee_id = :employee_id
         ORDER BY a.attendance_date DESC, a.attendance_id DESC
         LIMIT 10`,
        { employee_id: employee.employee_id }
      ),
    ]);

    const attendanceByDate = new Map<string, EmployeeAttendanceRow>();
    for (const row of monthAttendance) {
      attendanceByDate.set(normalizeDateKey(row.attendance_date), row);
    }

    const approvedLeaveDates = new Set<string>();
    for (const request of leaveRequests) {
      if (normalizeStatus(request.status) !== 'approved') continue;
      const start = normalizeDateKey(request.leave_from);
      const end = normalizeDateKey(request.leave_to ?? request.leave_from);
      if (!start || !end) continue;
      let cursor = start;
      while (cursor <= end) {
        if (cursor >= date_from && cursor < date_to) approvedLeaveDates.add(cursor);
        const nextCursor = addDays(cursor, 1);
        if (!nextCursor) break;
        cursor = nextCursor;
      }
    }

    const monthAttendanceTrend: EmployeeDashboardDayPoint[] = [];
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    let workingDays = 0;
    let presentDays = 0;
    let absentDays = 0;
    let leaveDays = 0;
    let holidayDays = 0;
    let weeklyOffDays = 0;
    let lateCheckins = 0;
    let checkInCount = 0;
    let checkOutCount = 0;

    const shiftStart = parseShiftStart(employee.shift_timing);

    for (let day = 1; day <= totalDaysInMonth; day += 1) {
      const dayKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayState = await getPartnerDayState(employee.partner_id, dayKey);
      const attendance = attendanceByDate.get(dayKey) ?? null;
      const hasPunch = Boolean(attendance?.check_in_at || attendance?.check_out_at);
      const isApprovedLeave = approvedLeaveDates.has(dayKey);
      const isHoliday = dayState.day_type === 'HOLIDAY';
      const isWeeklyOff = dayState.day_type === 'WEEKLY_OFF';
      const isWorkDay = dayState.day_type === 'WORK_DAY';

      if (hasPunch) {
        checkInCount += attendance?.check_in_at ? 1 : 0;
        checkOutCount += attendance?.check_out_at ? 1 : 0;
      }
      if (isWorkDay) workingDays += 1;
      if (isHoliday) holidayDays += 1;
      if (isWeeklyOff) weeklyOffDays += 1;
      if (isApprovedLeave) leaveDays += 1;
      if (isWorkDay && hasPunch && attendance?.check_in_at && shiftStart) {
        const localCheckIn = formatLocalTime(attendance.check_in_at);
        if (localCheckIn && compareLocalTime(localCheckIn, shiftStart) > 0) {
          lateCheckins += 1;
        }
      }

      let present = 0;
      let absent = 0;
      let leave = 0;
      let holiday = 0;
      let weekly_off = 0;

      if (isHoliday) {
        holiday = 1;
      } else if (isWeeklyOff) {
        weekly_off = 1;
      } else if (isApprovedLeave && !hasPunch) {
        leave = 1;
      } else if (isWorkDay) {
        if (hasPunch) present = 1;
        else absent = 1;
      }

      presentDays += present;
      absentDays += absent;
      monthAttendanceTrend.push({
        day: dayKey.slice(5),
        present,
        absent,
        leave,
        holiday,
        weekly_off,
      });
    }

    const leaveBalanceDays = leaveBalances.reduce((sum, row) => sum + Number(row.balance_days ?? 0), 0);
    const pendingLeaveRequests = leaveRequests.filter((row) => normalizeStatus(row.status) === 'pending').length;
    const approvedLeaveRequests = leaveRequests.filter((row) => normalizeStatus(row.status) === 'approved').length;
    const rejectedLeaveRequests = leaveRequests.filter((row) => normalizeStatus(row.status) === 'rejected').length;
    const todayAttendance = attendanceByDate.get(today) ?? null;
    const todayState = await getPartnerDayState(employee.partner_id, today);
    const todayLeave = approvedLeaveDates.has(today);
    const todayAttendanceStatus = (() => {
      if (todayAttendance?.check_in_at || todayAttendance?.check_out_at) {
        if (normalizeStatus(todayAttendance.day_type) === 'leave') return 'LEAVE';
        if (normalizeStatus(todayAttendance.day_type) === 'holiday') return 'HOLIDAY';
        if (normalizeStatus(todayAttendance.day_type) === 'weekly off') return 'WEEKLY_OFF';
        return todayAttendance.check_out_at ? 'PRESENT' : 'OPEN';
      }
      if (todayLeave) return 'LEAVE';
      if (todayState.day_type === 'HOLIDAY') return 'HOLIDAY';
      if (todayState.day_type === 'WEEKLY_OFF') return 'WEEKLY_OFF';
      if (todayState.day_type === 'WORK_DAY') return 'ABSENT';
      return 'NONE';
    })();

    const absentDaysFromCalendar = Math.max(workingDays - presentDays - leaveDays, 0);
    const normalizedAbsentDays = Math.max(absentDays, absentDaysFromCalendar);

    return {
      role: 'EMPLOYEE',
      title: 'Employee Dashboard',
      generated_at: new Date().toISOString(),
      employee: {
        employee_id: employee.employee_id,
        employee_code: employee.employee_code,
        employee_name: employee.employee_name,
        partner_id: employee.partner_id,
        partner_name: employee.partner_name,
        work_location: employee.work_location,
        shift_timing: employee.shift_timing,
        employment_status: employee.employment_status,
      },
      today: {
        date: today,
        day_type: todayState.day_type,
        attendance_status: todayAttendanceStatus,
        remarks: todayState.remarks,
        check_in_at: todayAttendance?.check_in_at ?? null,
        check_out_at: todayAttendance?.check_out_at ?? null,
      },
      summary: {
        month,
        year,
        total_days_in_month: totalDaysInMonth,
        working_days: workingDays,
        present_days: presentDays,
        absent_days: normalizedAbsentDays,
        leave_days: leaveDays,
        holiday_days: holidayDays,
        weekly_off_days: weeklyOffDays,
        late_checkins: lateCheckins,
        check_in_count: checkInCount,
        check_out_count: checkOutCount,
        pending_leave_requests: pendingLeaveRequests,
        approved_leave_requests: approvedLeaveRequests,
        rejected_leave_requests: rejectedLeaveRequests,
        leave_balance_days: leaveBalanceDays,
      },
      cards: [
        { key: 'present_days', label: 'Present Days', value: presentDays, trend: 'This month', tone: 'green' },
        { key: 'absent_days', label: 'Absent Days', value: normalizedAbsentDays, trend: 'Working gaps', tone: 'red' },
        { key: 'leave_days', label: 'Leave Days', value: leaveDays, trend: 'Approved leave', tone: 'amber' },
        { key: 'leave_balance', label: 'Leave Balance', value: leaveBalanceDays, trend: 'Available days', tone: 'blue' },
        { key: 'pending_requests', label: 'Pending Requests', value: pendingLeaveRequests, trend: 'Needs action', tone: 'orange' },
        { key: 'late_checkins', label: 'Late Check-ins', value: lateCheckins, trend: 'Shift start delays', tone: 'violet' },
        { key: 'check_ins', label: 'Check-ins', value: checkInCount, trend: 'Punch-ins', tone: 'slate' },
        { key: 'check_outs', label: 'Check-outs', value: checkOutCount, trend: 'Punch-outs', tone: 'green' },
      ],
      charts: {
        attendance_trend: monthAttendanceTrend.slice(Math.max(monthAttendanceTrend.length - 7, 0)),
        leave_balance_breakdown: leaveBalances.map((row) => ({
          label: String(row.leave_code ?? row.leave_name ?? 'Leave'),
          value: Number(row.balance_days ?? 0),
        })),
      },
      recent_attendance: recentAttendance.slice(0, 7).map((row) => ({
        attendance_date: normalizeDateKey(row.attendance_date),
        day_type: row.day_type,
        status: row.status,
        check_in_at: row.check_in_at,
        check_out_at: row.check_out_at,
      })),
      recent_leave_requests: leaveRequests.slice(0, 5).map((row) => ({
        leave_request_id: row.leave_request_id,
        leave_name: row.leave_name,
        leave_from: normalizeDateKey(row.leave_from),
        leave_to: normalizeDateKey(row.leave_to ?? row.leave_from) || null,
        leave_mode: row.leave_mode,
        days_requested: Number(row.days_requested ?? 0),
        status: row.status,
        approval_remarks: row.approval_remarks,
      })),
    };
  }

  @Get('admin')
  @Security('jwt')
  public async admin(@Request() req: any): Promise<DashboardResponse> {
    const user = (req as any).user as { user_id?: number } | undefined;
    if (!user?.user_id) throw httpError(401, 'Unauthorized');

    const profile = await getSelfProfile(user.user_id);
    const roleCode = String(profile.role_code ?? '').trim().toUpperCase();
    if (roleCode !== 'ADMIN' && roleCode !== 'SUPER_ADMIN') {
      throw httpError(403, 'Forbidden');
    }

    const today = todayIndia();
    const now = new Date();
    const { date_from, date_to } = monthRange(now.getFullYear(), now.getMonth() + 1);

    const [
      totalEmployeesRows,
      activeEmployeesRows,
      presentRows,
      leaveRows,
      openTicketRows,
      pendingApprovalRows,
      partnerRows,
      openJobRows,
      lateRows,
      deployedRows,
      partnerEmployeeRows,
      attendanceByDayRows,
    ] = await Promise.all([
      queryRows<CountRow>(
        `SELECT COUNT(*) AS c
         FROM EMP_T01_employees
         WHERE deleted_at IS NULL`
      ),
      queryRows<CountRow>(
        `SELECT COUNT(*) AS c
         FROM EMP_T01_employees
         WHERE deleted_at IS NULL
           AND COALESCE(UPPER(employment_status), '') NOT IN ('RESIGNED', 'LEFT', 'TERMINATED', 'DISABLED')`
      ),
      queryRows<CountRow>(
        `SELECT COUNT(DISTINCT employee_id) AS c
         FROM EMP_T08_attendance_logs
         WHERE attendance_date = :today
           AND (check_in_at IS NOT NULL OR check_out_at IS NOT NULL)`,
        { today }
      ),
      queryRows<CountRow>(
        `SELECT COUNT(DISTINCT lr.employee_id) AS c
         FROM EMP_T07_leave_requests lr
         WHERE lr.deleted_at IS NULL
           AND lr.status = 'APPROVED'
           AND :today BETWEEN lr.leave_from AND lr.leave_to`,
        { today }
      ),
      queryRows<CountRow>(
        `SELECT COUNT(*) AS c
         FROM TCK_T01_tickets t
         JOIN TCK_M02_ticket_statuses s ON s.ticket_status_id = t.ticket_status_id
         WHERE UPPER(COALESCE(s.ticket_status_code, '')) = 'OPEN'`
      ),
      queryRows<CountRow>(
        `SELECT COUNT(*) AS c
         FROM EMP_T07_leave_requests
         WHERE deleted_at IS NULL
           AND status = 'PENDING'`
      ),
      queryRows<CountRow>(
        `SELECT COUNT(*) AS c
         FROM PART_T01_partners
         WHERE status = TRUE`
      ),
      queryRows<CountRow>(
        `SELECT COUNT(*) AS c
         FROM JOB_T01_jobs
         WHERE UPPER(COALESCE(status, '')) = 'OPEN'`
      ),
      queryRows<CountRow>(
        `SELECT COUNT(*) AS c
         FROM EMP_T08_attendance_logs
         WHERE attendance_date = :today
           AND check_in_at IS NOT NULL
           AND TIME(DATE_ADD(check_in_at, INTERVAL 330 MINUTE)) > '09:30:00'`,
        { today }
      ),
      callProc<RowDataPacket & DeploymentRow>(
        `CALL sp_dep_deployments('LIST', NULL, NULL, NULL, NULL, NULL, NULL)`
      ),
      queryRows<PartnerCountRow>(
        `SELECT partner_id, COUNT(*) AS employee_count
         FROM EMP_T01_employees
         WHERE deleted_at IS NULL
           AND partner_id IS NOT NULL
         GROUP BY partner_id`
      ),
      queryRows<AttendanceByDayRow>(
        `SELECT DATE_FORMAT(attendance_date, '%Y-%m-%d') AS day_key, COUNT(DISTINCT employee_id) AS present_count
         FROM EMP_T08_attendance_logs
         WHERE attendance_date >= :date_from
           AND attendance_date < :date_to
           AND (check_in_at IS NOT NULL OR check_out_at IS NOT NULL)
         GROUP BY DATE_FORMAT(attendance_date, '%Y-%m-%d')
         ORDER BY day_key ASC`,
        { date_from, date_to }
      ),
    ]);

    const totalEmployees = Number(totalEmployeesRows[0]?.c ?? 0);
    const activeEmployees = Number(activeEmployeesRows[0]?.c ?? 0);
    const presentToday = Number(presentRows[0]?.c ?? 0);
    const onLeave = Number(leaveRows[0]?.c ?? 0);
    const openTickets = Number(openTicketRows[0]?.c ?? 0);
    const pendingApprovals = Number(pendingApprovalRows[0]?.c ?? 0);
    const activePartners = Number(partnerRows[0]?.c ?? 0);
    const openJobs = Number(openJobRows[0]?.c ?? 0);
    const lateCheckins = Number(lateRows[0]?.c ?? 0);

    const deploymentsThisMonth = deployedRows.filter((row) => {
      const createdAt = new Date(String(row.created_at ?? ''));
      const start = new Date(`${date_from}T00:00:00+05:30`);
      const end = new Date(`${date_to}T00:00:00+05:30`);
      const status = String(row.current_status ?? '').trim().toLowerCase();
      return Number.isFinite(createdAt.getTime()) && createdAt >= start && createdAt < end && status === 'deployed';
    }).length;

    const partnerCountMap = new Map<number, number>();
    for (const row of partnerEmployeeRows) {
      partnerCountMap.set(Number(row.partner_id), Number(row.employee_count ?? 0));
    }

    let holidayToday = 0;
    let weeklyOffToday = 0;
    for (const [partnerId, employeeCount] of partnerCountMap.entries()) {
      const state = await getPartnerDayState(partnerId, today);
      if (state.day_type === 'HOLIDAY') holidayToday += employeeCount;
      if (state.day_type === 'WEEKLY_OFF') weeklyOffToday += employeeCount;
    }

    const absentToday = Math.max(totalEmployees - presentToday - onLeave - holidayToday - weeklyOffToday, 0);

    const weekDays = buildDayRange(6);
    const attendanceByDay = weekDays.map((day) => {
      const row = attendanceByDayRows.find((r) => r.day_key === day);
      const present = Number(row?.present_count ?? 0);
      return {
        day: day.slice(5),
        present,
        absent: Math.max(activeEmployees - present, 0),
      };
    });

    return {
      role: 'ADMIN',
      title: 'Industrial Dashboard',
      generated_at: new Date().toISOString(),
      summary: {
        total_employees: totalEmployees,
        active_employees: activeEmployees,
        present_today: presentToday,
        absent_today: absentToday,
        on_leave: onLeave,
        open_tickets: openTickets,
        pending_approvals: pendingApprovals,
        active_partners: activePartners,
        open_jobs: openJobs,
        deployed_this_month: deploymentsThisMonth,
        weekly_off_today: weeklyOffToday,
        holiday_today: holidayToday,
        late_checkins: lateCheckins,
      },
      cards: [
        { key: 'total_employees', label: 'Total Employees', value: totalEmployees, trend: 'Live headcount', tone: 'slate' },
        { key: 'active_employees', label: 'Active Employees', value: activeEmployees, trend: 'Working roster', tone: 'blue' },
        { key: 'present_today', label: 'Present Today', value: presentToday, trend: 'Today check-ins', tone: 'green' },
        { key: 'absent_today', label: 'Absent Today', value: absentToday, trend: 'Needs follow-up', tone: 'red' },
        { key: 'on_leave', label: 'On Leave', value: onLeave, trend: 'Approved leave', tone: 'amber' },
        { key: 'open_tickets', label: 'Open Tickets', value: openTickets, trend: 'Requires action', tone: 'orange' },
        { key: 'pending_approvals', label: 'Pending Approvals', value: pendingApprovals, trend: 'Awaiting review', tone: 'violet' },
        { key: 'active_partners', label: 'Active Partners', value: activePartners, trend: 'Partner network', tone: 'slate' },
        { key: 'open_jobs', label: 'Open Jobs', value: openJobs, trend: 'Recruitment pipeline', tone: 'blue' },
        { key: 'deployed_this_month', label: 'Deployed This Month', value: deploymentsThisMonth, trend: 'Current month', tone: 'green' },
        { key: 'weekly_off_today', label: 'Weekly Off Today', value: weeklyOffToday, trend: 'Roster break', tone: 'amber' },
        { key: 'late_checkins', label: 'Late Check-ins', value: lateCheckins, trend: 'After 9:30 AM', tone: 'red' },
      ],
      charts: {
        attendance_by_day: attendanceByDay,
        status_breakdown: [
          { label: 'Present', value: presentToday },
          { label: 'Absent', value: absentToday },
          { label: 'Leave', value: onLeave },
        ],
      },
    };
  }
}
