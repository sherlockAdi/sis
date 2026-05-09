import { apiFetch } from "./apiFetch";

export type DashboardTone = "slate" | "green" | "red" | "amber" | "blue" | "orange" | "violet";

export type DashboardCard = {
  key: string;
  label: string;
  value: number;
  trend: string;
  tone: DashboardTone;
};

export type DashboardResponse = {
  role: "ADMIN";
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
    attendance_by_day: { day: string; present: number; absent: number }[];
    status_breakdown: { label: string; value: number }[];
  };
};

export type PartnerDashboardResponse = {
  role: "SOURCING" | "PARTNER";
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
    applications_by_day: { day: string; present: number; absent: number }[];
  };
};

export type CandidateDashboardResponse = {
  role: "CANDIDATE";
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

export type EmployeeDashboardResponse = {
  role: "EMPLOYEE";
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
    day_type: "WORK_DAY" | "HOLIDAY" | "WEEKLY_OFF";
    attendance_status: "PRESENT" | "ABSENT" | "LEAVE" | "HOLIDAY" | "WEEKLY_OFF" | "OPEN" | "NONE";
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
    attendance_trend: {
      day: string;
      present: number;
      absent: number;
      leave: number;
      holiday: number;
      weekly_off: number;
    }[];
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

export const dashboardApi = {
  admin: () => apiFetch<DashboardResponse>(`/dashboard/admin`, { method: "GET" }),
  partner: () => apiFetch<PartnerDashboardResponse>(`/dashboard/partner`, { method: "GET" }),
  candidate: () => apiFetch<CandidateDashboardResponse>(`/dashboard/candidate`, { method: "GET" }),
  employee: () => apiFetch<EmployeeDashboardResponse>(`/dashboard/employee`, { method: "GET" }),
};
