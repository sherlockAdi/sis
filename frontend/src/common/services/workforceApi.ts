import { apiFetch } from "./apiFetch";

export type WorkforceEmployee = {
  employee_id: number;
  employee_code: string | null;
  employee_name: string;
  partner_id: number | null;
  partner_name: string | null;
  work_location: string | null;
  shift_timing: string | null;
};

export type LeavePolicyRow = {
  leave_policy_id: number;
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
  created_at: string;
  updated_at: string;
};

export type HolidayRow = {
  holiday_id: number;
  partner_id: number;
  holiday_name: string;
  holiday_type: "FIXED" | "YEARLY_VARIABLE" | "ONCE";
  holiday_date: string | null;
  holiday_month: number | null;
  holiday_day: number | null;
  holiday_year: number | null;
  is_paid: boolean;
  status: boolean;
  created_at: string;
  updated_at: string;
};

export type WeeklyOffRow = {
  weekly_off_rule_id: number;
  partner_id: number;
  country_id: number | null;
  rule_name: string;
  off_days_json: string;
  effective_from: string | null;
  effective_to: string | null;
  status: boolean;
  created_at: string;
  updated_at: string;
};

export type OfficeLocationRow = {
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
  status: boolean;
  created_at: string;
  updated_at: string;
};

export type LeaveBalanceRow = {
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
  created_at: string;
  updated_at: string;
  leave_name?: string;
  leave_code?: string;
  is_paid?: boolean;
};

export type LeaveRequestRow = {
  leave_request_id: number;
  employee_id: number;
  partner_id: number;
  leave_policy_id: number;
  leave_year: number;
  leave_from: string;
  leave_to: string;
  leave_mode: "FULL" | "FIRST_HALF" | "SECOND_HALF";
  days_requested: number;
  reason: string | null;
  document_path: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  approval_remarks: string | null;
  approved_by: number | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  employee_name?: string;
  employee_code?: string;
  leave_name?: string;
  is_paid?: boolean;
};

export type AttendanceRow = {
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
  day_type: "WORK_DAY" | "HOLIDAY" | "WEEKLY_OFF" | "LEAVE" | "EXCEPTION";
  status: "OPEN" | "CLOSED" | "EXCEPTION";
  remarks: string | null;
  created_at: string;
  updated_at: string;
  employee_name?: string;
  employee_code?: string;
};

export type MonthlyAttendanceSummaryRow = {
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

export type WorkforceSummary = {
  employee: WorkforceEmployee;
  employer: {
    partner_id: number;
    partner_name: string | null;
  };
  current_day_state: {
    day_type: "WORK_DAY" | "HOLIDAY" | "WEEKLY_OFF";
    remarks: string | null;
  };
  leave_policies: LeavePolicyRow[];
  holidays: HolidayRow[];
  weekly_off_rules: WeeklyOffRow[];
  office_locations: OfficeLocationRow[];
  leave_balances: LeaveBalanceRow[];
  leave_requests: LeaveRequestRow[];
  attendance_history: AttendanceRow[];
  today_attendance: AttendanceRow | null;
};

export type MonthlyReport = {
  month: number;
  year: number;
  partner_id: number | null;
  date_from: string;
  date_to: string;
  day_states: {
    attendance_date: string;
    day_type: "WORK_DAY" | "HOLIDAY" | "WEEKLY_OFF";
    remarks: string | null;
  }[];
  summary: MonthlyAttendanceSummaryRow[];
  attendance: AttendanceRow[];
};

export const workforceApi = {
  summary: () => apiFetch<WorkforceSummary>(`/workforce/summary`, { method: "GET" }),
  leavePolicies: {
    list: (partner_id?: number) => apiFetch<LeavePolicyRow[]>(`/workforce/leave-policies${typeof partner_id === "number" ? `?partner_id=${partner_id}` : ""}`, { method: "GET" }),
    create: (input: Partial<LeavePolicyRow> & { partner_id?: number }) => apiFetch<{ leave_policy_id: number }>(`/workforce/leave-policies`, { method: "POST", body: JSON.stringify(input) }),
    update: (leave_policy_id: number, input: Partial<LeavePolicyRow> & { partner_id?: number }) => apiFetch<{ updated: true }>(`/workforce/leave-policies/${leave_policy_id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (leave_policy_id: number) => apiFetch<{ deleted: true }>(`/workforce/leave-policies/${leave_policy_id}`, { method: "DELETE" }),
  },
  holidays: {
    list: (partner_id?: number) => apiFetch<HolidayRow[]>(`/workforce/holidays${typeof partner_id === "number" ? `?partner_id=${partner_id}` : ""}`, { method: "GET" }),
    create: (input: Partial<HolidayRow> & { partner_id?: number }) => apiFetch<{ holiday_id: number }>(`/workforce/holidays`, { method: "POST", body: JSON.stringify(input) }),
    update: (holiday_id: number, input: Partial<HolidayRow> & { partner_id?: number }) => apiFetch<{ updated: true }>(`/workforce/holidays/${holiday_id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (holiday_id: number) => apiFetch<{ deleted: true }>(`/workforce/holidays/${holiday_id}`, { method: "DELETE" }),
  },
  weeklyOffs: {
    list: (partner_id?: number) => apiFetch<WeeklyOffRow[]>(`/workforce/weekly-offs${typeof partner_id === "number" ? `?partner_id=${partner_id}` : ""}`, { method: "GET" }),
    create: (input: Partial<WeeklyOffRow> & { partner_id?: number; off_days?: string[] }) => apiFetch<{ weekly_off_rule_id: number }>(`/workforce/weekly-offs`, { method: "POST", body: JSON.stringify(input) }),
    update: (weekly_off_rule_id: number, input: Partial<WeeklyOffRow> & { partner_id?: number; off_days?: string[] }) => apiFetch<{ updated: true }>(`/workforce/weekly-offs/${weekly_off_rule_id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (weekly_off_rule_id: number) => apiFetch<{ deleted: true }>(`/workforce/weekly-offs/${weekly_off_rule_id}`, { method: "DELETE" }),
  },
  offices: {
    list: (partner_id?: number) => apiFetch<OfficeLocationRow[]>(`/workforce/offices${typeof partner_id === "number" ? `?partner_id=${partner_id}` : ""}`, { method: "GET" }),
    create: (input: Partial<OfficeLocationRow> & { partner_id?: number }) => apiFetch<{ office_location_id: number }>(`/workforce/offices`, { method: "POST", body: JSON.stringify(input) }),
    update: (office_location_id: number, input: Partial<OfficeLocationRow> & { partner_id?: number }) => apiFetch<{ updated: true }>(`/workforce/offices/${office_location_id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (office_location_id: number) => apiFetch<{ deleted: true }>(`/workforce/offices/${office_location_id}`, { method: "DELETE" }),
  },
  leaveBalances: {
    list: (employee_id?: number, partner_id?: number, leave_year?: number) => {
      const params = new URLSearchParams();
      if (typeof employee_id === "number") params.set("employee_id", String(employee_id));
      if (typeof partner_id === "number") params.set("partner_id", String(partner_id));
      if (typeof leave_year === "number") params.set("leave_year", String(leave_year));
      const q = params.toString();
      return apiFetch<LeaveBalanceRow[]>(`/workforce/leave-balances${q ? `?${q}` : ""}`, { method: "GET" });
    },
  },
  leaveRequests: {
    list: (filters?: { employee_id?: number; partner_id?: number }) => {
      const params = new URLSearchParams();
      if (typeof filters?.employee_id === "number") params.set("employee_id", String(filters.employee_id));
      if (typeof filters?.partner_id === "number") params.set("partner_id", String(filters.partner_id));
      const q = params.toString();
      return apiFetch<LeaveRequestRow[]>(`/workforce/leave-requests${q ? `?${q}` : ""}`, { method: "GET" });
    },
    create: (input: {
      employee_id?: number;
      partner_id?: number;
      leave_policy_id: number;
      leave_from: string;
      leave_to?: string;
      leave_mode?: "FULL" | "FIRST_HALF" | "SECOND_HALF";
      reason?: string | null;
      document_path?: string | null;
    }) => apiFetch<{ leave_request_id: number; balance_warning?: string | null }>(`/workforce/leave-requests`, { method: "POST", body: JSON.stringify(input) }),
    approve: (leave_request_id: number, input?: { approval_remarks?: string | null }) => apiFetch<{ approved: true }>(`/workforce/leave-requests/${leave_request_id}/approve`, { method: "PUT", body: JSON.stringify(input ?? {}) }),
    reject: (leave_request_id: number, input?: { approval_remarks?: string | null }) => apiFetch<{ rejected: true }>(`/workforce/leave-requests/${leave_request_id}/reject`, { method: "PUT", body: JSON.stringify(input ?? {}) }),
  },
  attendance: {
    list: (filters?: { employee_id?: number; partner_id?: number; date_from?: string; date_to?: string }) => {
      const params = new URLSearchParams();
      if (typeof filters?.employee_id === "number") params.set("employee_id", String(filters.employee_id));
      if (typeof filters?.partner_id === "number") params.set("partner_id", String(filters.partner_id));
      if (typeof filters?.date_from === "string") params.set("date_from", filters.date_from);
      if (typeof filters?.date_to === "string") params.set("date_to", filters.date_to);
      const q = params.toString();
      return apiFetch<AttendanceRow[]>(`/workforce/attendance${q ? `?${q}` : ""}`, { method: "GET" });
    },
    checkIn: (input: {
      attendance_date?: string;
      latitude?: number | null;
      longitude?: number | null;
      face_capture: string;
      remarks?: string | null;
    }) => apiFetch<{ attendance_id: number; day_type: string; remarks: string | null }>(`/workforce/attendance/check-in`, { method: "POST", body: JSON.stringify(input) }),
    checkOut: (input: {
      attendance_date?: string;
      latitude?: number | null;
      longitude?: number | null;
      face_capture: string;
      remarks?: string | null;
    }) => apiFetch<{ attendance_id: number; day_type: string; remarks: string | null }>(`/workforce/attendance/check-out`, { method: "POST", body: JSON.stringify(input) }),
  },
  monthlyReport: (partner_id?: number, year?: number, month?: number) => {
    const params = new URLSearchParams();
    if (typeof partner_id === "number") params.set("partner_id", String(partner_id));
    if (typeof year === "number") params.set("year", String(year));
    if (typeof month === "number") params.set("month", String(month));
    const q = params.toString();
    return apiFetch<MonthlyReport>(`/workforce/monthly-report${q ? `?${q}` : ""}`, { method: "GET" });
  },
};
