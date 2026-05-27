import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Stack, Tab, Tabs, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import { AdAlertBox, AdButton, AdCard, AdDropDown, AdGrid, AdModal, AdNotification, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { workforceApi, type AttendanceRow, type HolidayRow, type LeavePolicyRow, type MonthlyAttendanceSummaryRow, type OfficeLocationRow, type WeeklyOffRow } from "../../common/services/workforceApi";
import { partnersApi, type PartnerRow } from "../../common/services/partnersApi";

type PolicyForm = {
  leave_policy_id?: number;
  partner_id: string;
  leave_code: string;
  leave_name: string;
  annual_limit_days: string;
  is_paid: boolean;
  allow_half_day: boolean;
  carry_forward_days: string;
  max_consecutive_days: string;
  min_notice_days: string;
  requires_approval: boolean;
  status: boolean;
};

type HolidayForm = {
  holiday_id?: number;
  partner_id: string;
  holiday_name: string;
  holiday_type: "FIXED" | "YEARLY_VARIABLE" | "ONCE";
  holiday_date: string;
  holiday_month: string;
  holiday_day: string;
  holiday_year: string;
  is_paid: boolean;
  status: boolean;
};

type WeeklyForm = {
  weekly_off_rule_id?: number;
  partner_id: string;
  country_id: string;
  rule_name: string;
  off_days: string;
  effective_from: string;
  effective_to: string;
  status: boolean;
};

type OfficeForm = {
  office_location_id?: number;
  partner_id: string;
  location_name: string;
  country_id: string;
  state_id: string;
  city_id: string;
  address: string;
  latitude: string;
  longitude: string;
  radius_meters: string;
  status: boolean;
};

function num(v: string): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function ymd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function monthRange(year: number, month: number) {
  const mm = String(month).padStart(2, "0");
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const nextMm = String(next.month).padStart(2, "0");
  return { date_from: `${year}-${mm}-01`, date_to: `${next.year}-${nextMm}-01` };
}

export default function WorkforceManagementPage() {
  const [tab, setTab] = useState(0);
  const [partnerId, setPartnerId] = useState("");
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1));
  const [loading, setLoading] = useState(true);
  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [policies, setPolicies] = useState<LeavePolicyRow[]>([]);
  const [holidays, setHolidays] = useState<HolidayRow[]>([]);
  const [weeklyOffs, setWeeklyOffs] = useState<WeeklyOffRow[]>([]);
  const [offices, setOffices] = useState<OfficeLocationRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlyAttendanceSummaryRow[]>([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState<AttendanceRow[]>([]);

  const [policyModal, setPolicyModal] = useState(false);
  const [holidayModal, setHolidayModal] = useState(false);
  const [weeklyModal, setWeeklyModal] = useState(false);
  const [officeModal, setOfficeModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicyRow | null>(null);
  const [editingHoliday, setEditingHoliday] = useState<HolidayRow | null>(null);
  const [editingWeekly, setEditingWeekly] = useState<WeeklyOffRow | null>(null);
  const [editingOffice, setEditingOffice] = useState<OfficeLocationRow | null>(null);

  const [policyForm, setPolicyForm] = useState<PolicyForm>({
    partner_id: "",
    leave_code: "",
    leave_name: "",
    annual_limit_days: "12",
    is_paid: true,
    allow_half_day: true,
    carry_forward_days: "0",
    max_consecutive_days: "0",
    min_notice_days: "0",
    requires_approval: true,
    status: true,
  });
  const [holidayForm, setHolidayForm] = useState<HolidayForm>({
    partner_id: "",
    holiday_name: "",
    holiday_type: "FIXED",
    holiday_date: ymd(new Date()),
    holiday_month: "",
    holiday_day: "",
    holiday_year: "",
    is_paid: true,
    status: true,
  });
  const [weeklyForm, setWeeklyForm] = useState<WeeklyForm>({
    partner_id: "",
    country_id: "",
    rule_name: "Weekend Rule",
    off_days: "SATURDAY,SUNDAY",
    effective_from: ymd(new Date()),
    effective_to: "",
    status: true,
  });
  const [officeForm, setOfficeForm] = useState<OfficeForm>({
    partner_id: "",
    location_name: "",
    country_id: "",
    state_id: "",
    city_id: "",
    address: "",
    latitude: "",
    longitude: "",
    radius_meters: "250",
    status: true,
  });

  const partnerIdNumber = useMemo(() => {
    const n = Number(partnerId);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [partnerId]);

  const reportYearNumber = useMemo(() => {
    const n = Number(reportYear);
    return Number.isFinite(n) ? n : new Date().getFullYear();
  }, [reportYear]);

  const reportMonthNumber = useMemo(() => {
    const n = Number(reportMonth);
    return Number.isFinite(n) && n >= 1 && n <= 12 ? n : new Date().getMonth() + 1;
  }, [reportMonth]);

  const reportRange = useMemo(() => monthRange(reportYearNumber, reportMonthNumber), [reportYearNumber, reportMonthNumber]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, h, w, o, a] = await Promise.all([
        workforceApi.leavePolicies.list(partnerIdNumber),
        workforceApi.holidays.list(partnerIdNumber),
        workforceApi.weeklyOffs.list(partnerIdNumber),
        workforceApi.offices.list(partnerIdNumber),
        workforceApi.attendance.list({
          partner_id: partnerIdNumber,
          date_from: reportRange.date_from,
          date_to: reportRange.date_to,
        }),
      ]);
      setPolicies(p);
      setHolidays(h);
      setWeeklyOffs(w);
      setOffices(o);
      setAttendance(a);
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load workforce data");
    } finally {
      setLoading(false);
    }
  };

  const refreshMonthlyReport = async () => {
    setMonthlyLoading(true);
    try {
      const report = await workforceApi.monthlyReport(partnerIdNumber, reportYearNumber, reportMonthNumber);
      setMonthlySummary(report.summary);
      setMonthlyAttendance(report.attendance);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load monthly report", severity: "error" });
    } finally {
      setMonthlyLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setPartners(await partnersApi.list(true));
      } catch {
        setPartners([]);
      }
    })();
    (async () => {
      await Promise.all([refresh(), refreshMonthlyReport()]);
    })();
  }, []);

  const partnerOptions = useMemo(
    () =>
      partners
        .slice()
        .sort((a, b) => String(a.partner_name ?? "").localeCompare(String(b.partner_name ?? "")))
        .map((p) => ({ label: `${p.partner_name}${p.partner_code ? ` (${p.partner_code})` : ""}`, value: String(p.partner_id) })),
    [partners]
  );

  const openPolicyModal = (row?: LeavePolicyRow | null) => {
    setEditingPolicy(row ?? null);
    setPolicyForm({
      partner_id: row ? String(row.partner_id) : partnerId,
      leave_code: row?.leave_code ?? "",
      leave_name: row?.leave_name ?? "",
      annual_limit_days: String(row?.annual_limit_days ?? 12),
      is_paid: Boolean(row?.is_paid ?? true),
      allow_half_day: Boolean(row?.allow_half_day ?? true),
      carry_forward_days: String(row?.carry_forward_days ?? 0),
      max_consecutive_days: String(row?.max_consecutive_days ?? 0),
      min_notice_days: String(row?.min_notice_days ?? 0),
      requires_approval: Boolean(row?.requires_approval ?? true),
      status: Boolean(row?.status ?? true),
    });
    setPolicyModal(true);
  };

  const openHolidayModal = (row?: HolidayRow | null) => {
    setEditingHoliday(row ?? null);
    setHolidayForm({
      partner_id: row ? String(row.partner_id) : partnerId,
      holiday_name: row?.holiday_name ?? "",
      holiday_type: row?.holiday_type ?? "FIXED",
      holiday_date: row?.holiday_date?.slice(0, 10) ?? ymd(new Date()),
      holiday_month: row?.holiday_month ? String(row.holiday_month) : "",
      holiday_day: row?.holiday_day ? String(row.holiday_day) : "",
      holiday_year: row?.holiday_year ? String(row.holiday_year) : "",
      is_paid: Boolean(row?.is_paid ?? true),
      status: Boolean(row?.status ?? true),
    });
    setHolidayModal(true);
  };

  const openWeeklyModal = (row?: WeeklyOffRow | null) => {
    setEditingWeekly(row ?? null);
    const parsed = row ? JSON.parse(row.off_days_json || "[]") : ["SATURDAY", "SUNDAY"];
    setWeeklyForm({
      partner_id: row ? String(row.partner_id) : partnerId,
      country_id: row?.country_id ? String(row.country_id) : "",
      rule_name: row?.rule_name ?? "Weekend Rule",
      off_days: Array.isArray(parsed) ? parsed.join(",") : "SATURDAY,SUNDAY",
      effective_from: row?.effective_from?.slice(0, 10) ?? ymd(new Date()),
      effective_to: row?.effective_to?.slice(0, 10) ?? "",
      status: Boolean(row?.status ?? true),
    });
    setWeeklyModal(true);
  };

  const openOfficeModal = (row?: OfficeLocationRow | null) => {
    setEditingOffice(row ?? null);
    setOfficeForm({
      partner_id: row ? String(row.partner_id) : partnerId,
      location_name: row?.location_name ?? "",
      country_id: row?.country_id ? String(row.country_id) : "",
      state_id: row?.state_id ? String(row.state_id) : "",
      city_id: row?.city_id ? String(row.city_id) : "",
      address: row?.address ?? "",
      latitude: row?.latitude !== null && row?.latitude !== undefined ? String(row.latitude) : "",
      longitude: row?.longitude !== null && row?.longitude !== undefined ? String(row.longitude) : "",
      radius_meters: String(row?.radius_meters ?? 250),
      status: Boolean(row?.status ?? true),
    });
    setOfficeModal(true);
  };

  const savePolicy = async () => {
    const input = {
      partner_id: num(policyForm.partner_id),
      leave_code: policyForm.leave_code.trim(),
      leave_name: policyForm.leave_name.trim(),
      annual_limit_days: num(policyForm.annual_limit_days) ?? 0,
      is_paid: policyForm.is_paid,
      allow_half_day: policyForm.allow_half_day,
      carry_forward_days: num(policyForm.carry_forward_days) ?? 0,
      max_consecutive_days: num(policyForm.max_consecutive_days) ?? 0,
      min_notice_days: num(policyForm.min_notice_days) ?? 0,
      requires_approval: policyForm.requires_approval,
      status: policyForm.status,
    };
    if (!input.partner_id || !input.leave_code || !input.leave_name) {
      setToast({ open: true, message: "Partner, code and name are required.", severity: "warning" });
      return;
    }
    try {
      if (editingPolicy) await workforceApi.leavePolicies.update(editingPolicy.leave_policy_id, input);
      else await workforceApi.leavePolicies.create(input);
      setToast({ open: true, message: "Leave policy saved.", severity: "success" });
      setPolicyModal(false);
      await Promise.all([refresh(), refreshMonthlyReport()]);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to save policy", severity: "error" });
    }
  };

  const saveHoliday = async () => {
    const input = {
      partner_id: num(holidayForm.partner_id),
      holiday_name: holidayForm.holiday_name.trim(),
      holiday_type: holidayForm.holiday_type,
      holiday_date: holidayForm.holiday_date || null,
      holiday_month: num(holidayForm.holiday_month),
      holiday_day: num(holidayForm.holiday_day),
      holiday_year: num(holidayForm.holiday_year),
      is_paid: holidayForm.is_paid,
      status: holidayForm.status,
    };
    if (!input.partner_id || !input.holiday_name) {
      setToast({ open: true, message: "Partner and holiday name are required.", severity: "warning" });
      return;
    }
    try {
      if (editingHoliday) await workforceApi.holidays.update(editingHoliday.holiday_id, input);
      else await workforceApi.holidays.create(input);
      setToast({ open: true, message: "Holiday saved.", severity: "success" });
      setHolidayModal(false);
      await Promise.all([refresh(), refreshMonthlyReport()]);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to save holiday", severity: "error" });
    }
  };

  const saveWeekly = async () => {
    const input = {
      partner_id: num(weeklyForm.partner_id),
      country_id: num(weeklyForm.country_id),
      rule_name: weeklyForm.rule_name.trim(),
      off_days: weeklyForm.off_days.split(",").map((d) => d.trim().toUpperCase()).filter(Boolean),
      effective_from: weeklyForm.effective_from || null,
      effective_to: weeklyForm.effective_to || null,
      status: weeklyForm.status,
    };
    if (!input.partner_id || input.off_days.length === 0) {
      setToast({ open: true, message: "Partner and off days are required.", severity: "warning" });
      return;
    }
    try {
      if (editingWeekly) await workforceApi.weeklyOffs.update(editingWeekly.weekly_off_rule_id, input);
      else await workforceApi.weeklyOffs.create(input);
      setToast({ open: true, message: "Weekly off rule saved.", severity: "success" });
      setWeeklyModal(false);
      await Promise.all([refresh(), refreshMonthlyReport()]);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to save weekly off rule", severity: "error" });
    }
  };

  const saveOffice = async () => {
    const input = {
      partner_id: num(officeForm.partner_id),
      location_name: officeForm.location_name.trim(),
      country_id: num(officeForm.country_id),
      state_id: num(officeForm.state_id),
      city_id: num(officeForm.city_id),
      address: officeForm.address.trim() || null,
      latitude: num(officeForm.latitude),
      longitude: num(officeForm.longitude),
      radius_meters: num(officeForm.radius_meters) ?? 250,
      status: officeForm.status,
    };
    if (!input.partner_id || !input.location_name) {
      setToast({ open: true, message: "Partner and location name are required.", severity: "warning" });
      return;
    }
    try {
      if (editingOffice) await workforceApi.offices.update(editingOffice.office_location_id, input);
      else await workforceApi.offices.create(input);
      setToast({ open: true, message: "Office saved.", severity: "success" });
      setOfficeModal(false);
      await Promise.all([refresh(), refreshMonthlyReport()]);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to save office", severity: "error" });
    }
  };

  const policyColumns = useMemo(
    () => [
      { field: "leave_code", headerName: "Code", width: 120 },
      { field: "leave_name", headerName: "Leave Type", flex: 1, minWidth: 180 },
      { field: "annual_limit_days", headerName: "Annual", width: 90 },
      { field: "carry_forward_days", headerName: "Carry Fwd", width: 100 },
      { field: "max_consecutive_days", headerName: "Max Days", width: 100 },
      { field: "min_notice_days", headerName: "Notice", width: 90 },
      { field: "is_paid", headerName: "Paid", width: 90, renderCell: (p: any) => <Chip size="small" label={p.value ? "Yes" : "No"} color={p.value ? "success" : "default"} /> },
      {
        field: "__actions",
        headerName: "Actions",
        width: 170,
        renderCell: (p: any) => (
          <Stack direction="row" spacing={1}>
            <AdButton variant="text" startIcon={<EditIcon fontSize="small" />} onClick={() => openPolicyModal(p.row as LeavePolicyRow)}>
              Edit
            </AdButton>
            <AdButton variant="text" color="error" startIcon={<DeleteIcon fontSize="small" />} onClick={async () => { await workforceApi.leavePolicies.remove((p.row as LeavePolicyRow).leave_policy_id); await Promise.all([refresh(), refreshMonthlyReport()]); }}>
              Delete
            </AdButton>
          </Stack>
        ),
      },
    ],
    [partnerId],
  );

  const holidayColumns = useMemo(
    () => [
      { field: "holiday_name", headerName: "Holiday", flex: 1, minWidth: 180 },
      { field: "holiday_type", headerName: "Type", width: 160 },
      { field: "holiday_date", headerName: "Date", width: 120 },
      { field: "holiday_year", headerName: "Year", width: 90 },
      { field: "is_paid", headerName: "Paid", width: 90, renderCell: (p: any) => <Chip size="small" label={p.value ? "Yes" : "No"} color={p.value ? "success" : "default"} /> },
      {
        field: "__actions",
        headerName: "Actions",
        width: 170,
        renderCell: (p: any) => (
          <Stack direction="row" spacing={1}>
            <AdButton variant="text" startIcon={<EditIcon fontSize="small" />} onClick={() => openHolidayModal(p.row as HolidayRow)}>
              Edit
            </AdButton>
            <AdButton variant="text" color="error" startIcon={<DeleteIcon fontSize="small" />} onClick={async () => { await workforceApi.holidays.remove((p.row as HolidayRow).holiday_id); await Promise.all([refresh(), refreshMonthlyReport()]); }}>
              Delete
            </AdButton>
          </Stack>
        ),
      },
    ],
    [partnerId],
  );

  const weeklyColumns = useMemo(
    () => [
      { field: "rule_name", headerName: "Rule", flex: 1, minWidth: 180 },
      { field: "off_days_json", headerName: "Off Days", flex: 1, minWidth: 160, valueGetter: (p: any) => p.value },
      { field: "effective_from", headerName: "From", width: 120 },
      { field: "effective_to", headerName: "To", width: 120 },
      { field: "status", headerName: "Status", width: 90, renderCell: (p: any) => <Chip size="small" label={p.value ? "Active" : "Off"} color={p.value ? "success" : "default"} /> },
      {
        field: "__actions",
        headerName: "Actions",
        width: 170,
        renderCell: (p: any) => (
          <Stack direction="row" spacing={1}>
            <AdButton variant="text" startIcon={<EditIcon fontSize="small" />} onClick={() => openWeeklyModal(p.row as WeeklyOffRow)}>
              Edit
            </AdButton>
            <AdButton variant="text" color="error" startIcon={<DeleteIcon fontSize="small" />} onClick={async () => { await workforceApi.weeklyOffs.remove((p.row as WeeklyOffRow).weekly_off_rule_id); await Promise.all([refresh(), refreshMonthlyReport()]); }}>
              Delete
            </AdButton>
          </Stack>
        ),
      },
    ],
    [partnerId],
  );

  const officeColumns = useMemo(
    () => [
      { field: "location_name", headerName: "Office", flex: 1, minWidth: 180 },
      { field: "country_id", headerName: "Country", width: 90 },
      { field: "state_id", headerName: "State", width: 90 },
      { field: "city_id", headerName: "City", width: 90 },
      { field: "radius_meters", headerName: "Radius", width: 90 },
      { field: "status", headerName: "Status", width: 90, renderCell: (p: any) => <Chip size="small" label={p.value ? "Active" : "Off"} color={p.value ? "success" : "default"} /> },
      {
        field: "__actions",
        headerName: "Actions",
        width: 170,
        renderCell: (p: any) => (
          <Stack direction="row" spacing={1}>
            <AdButton variant="text" startIcon={<EditIcon fontSize="small" />} onClick={() => openOfficeModal(p.row as OfficeLocationRow)}>
              Edit
            </AdButton>
            <AdButton variant="text" color="error" startIcon={<DeleteIcon fontSize="small" />} onClick={async () => { await workforceApi.offices.remove((p.row as OfficeLocationRow).office_location_id); await Promise.all([refresh(), refreshMonthlyReport()]); }}>
              Delete
            </AdButton>
          </Stack>
        ),
      },
    ],
    [partnerId],
  );

  const attendanceColumns = useMemo(
    () => [
      { field: "employee_name", headerName: "Employee", flex: 1, minWidth: 180 },
      { field: "attendance_date", headerName: "Date", width: 120 },
      { field: "check_in_at", headerName: "Check In", width: 170 },
      { field: "check_out_at", headerName: "Check Out", width: 170 },
      { field: "day_type", headerName: "Day Type", width: 120 },
      { field: "status", headerName: "Status", width: 120 },
      { field: "remarks", headerName: "Remarks", flex: 1, minWidth: 220 },
    ],
    [],
  );

  const monthlyColumns = useMemo(
    () => [
      { field: "employee_name", headerName: "Employee", flex: 1, minWidth: 180 },
      { field: "employee_code", headerName: "Code", width: 120 },
      { field: "present_days", headerName: "Present", width: 90 },
      { field: "leave_days", headerName: "Leave", width: 90 },
      { field: "holiday_days", headerName: "Holiday", width: 90 },
      { field: "weekly_off_days", headerName: "Weekly Off", width: 100 },
      { field: "exception_days", headerName: "Exception", width: 100 },
      { field: "absent_days", headerName: "Absent", width: 90 },
      { field: "check_in_count", headerName: "Check In", width: 90 },
      { field: "check_out_count", headerName: "Check Out", width: 100 },
      { field: "total_punch_days", headerName: "Punch Days", width: 100 },
    ],
    [],
  );

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" flexWrap="wrap" gap={2}>
        <Stack spacing={0.25} sx={{ minWidth: 260 }}>
          <Typography variant="h5" fontWeight={900}>
            Workforce Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Employer-wise leave, holidays, weekly offs, office geo fences and attendance logs
          </Typography>
          <AdDropDown
            label="Select Partner"
            variant="standard"
            options={partnerOptions}
            value={partnerId}
            onChange={(v) => setPartnerId(String(v))}
          />
        </Stack>
        <AdButton startIcon={<SaveIcon fontSize="small" />} onClick={refresh}>
          Load
        </AdButton>
      </Stack>
      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <Tabs value={tab} onChange={(_e, value) => setTab(value)} variant="scrollable" allowScrollButtonsMobile>
        <Tab label="Leave Policies" />
        <Tab label="Holidays" />
        <Tab label="Weekly Off" />
        <Tab label="Offices" />
        <Tab label="Attendance" />
        <Tab label="Monthly Report" />
      </Tabs>

      {tab === 0 && (
        <AdCard
          title="Leave Policies"
          subtitle="Paid/unpaid and annual allowance per employer"
          headerRight={<AdButton startIcon={<AddIcon fontSize="small" />} onClick={() => openPolicyModal()}>New Policy</AdButton>}
          animate={false}
          contentSx={{ p: 0 }}
        >
          <AdGrid rows={policies.map((r) => ({ id: r.leave_policy_id, ...r }))} columns={policyColumns as any} loading={loading} disableColumnMenu autoHeight />
        </AdCard>
      )}

      {tab === 1 && (
        <AdCard
          title="Holidays"
          subtitle="Fixed-date and yearly variable holiday calendar"
          headerRight={<AdButton startIcon={<AddIcon fontSize="small" />} onClick={() => openHolidayModal()}>New Holiday</AdButton>}
          animate={false}
          contentSx={{ p: 0 }}
        >
          <AdGrid rows={holidays.map((r) => ({ id: r.holiday_id, ...r }))} columns={holidayColumns as any} loading={loading} disableColumnMenu autoHeight />
        </AdCard>
      )}

      {tab === 2 && (
        <AdCard
          title="Weekly Off"
          subtitle="Saturday/Sunday or any employer-specific off-day pattern"
          headerRight={<AdButton startIcon={<AddIcon fontSize="small" />} onClick={() => openWeeklyModal()}>New Rule</AdButton>}
          animate={false}
          contentSx={{ p: 0 }}
        >
          <AdGrid rows={weeklyOffs.map((r) => ({ id: r.weekly_off_rule_id, ...r }))} columns={weeklyColumns as any} loading={loading} disableColumnMenu autoHeight />
        </AdCard>
      )}

      {tab === 3 && (
        <AdCard
          title="Office Geo Locations"
          subtitle="Office geofences for browser location validation"
          headerRight={<AdButton startIcon={<AddIcon fontSize="small" />} onClick={() => openOfficeModal()}>New Office</AdButton>}
          animate={false}
          contentSx={{ p: 0 }}
        >
          <AdGrid rows={offices.map((r) => ({ id: r.office_location_id, ...r }))} columns={officeColumns as any} loading={loading} disableColumnMenu autoHeight />
        </AdCard>
      )}

      {tab === 4 && (
        <AdCard title="Attendance Logs" subtitle="Check-in/out history with employer and geo status" animate={false} contentSx={{ p: 0 }}>
          <AdGrid rows={attendance.map((r) => ({ id: r.attendance_id, ...r }))} columns={attendanceColumns as any} loading={loading} disableColumnMenu autoHeight />
        </AdCard>
      )}

      {tab === 5 && (
        <Stack spacing={2.5}>
          <AdCard
            title="Monthly Report"
            subtitle="Employee attendance summary for one employer and month"
            headerRight={
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <AdTextBox label="Year" value={reportYear} onChange={setReportYear} />
                <AdDropDown
                  label="Month"
                  variant="standard"
                  value={reportMonth}
                  options={[
                    { label: "January", value: "1" },
                    { label: "February", value: "2" },
                    { label: "March", value: "3" },
                    { label: "April", value: "4" },
                    { label: "May", value: "5" },
                    { label: "June", value: "6" },
                    { label: "July", value: "7" },
                    { label: "August", value: "8" },
                    { label: "September", value: "9" },
                    { label: "October", value: "10" },
                    { label: "November", value: "11" },
                    { label: "December", value: "12" },
                  ]}
                  onChange={(v) => setReportMonth(String(v))}
                />
                <AdButton onClick={async () => Promise.all([refresh(), refreshMonthlyReport()])}>Load Month</AdButton>
              </Stack>
            }
            animate={false}
            contentSx={{ p: 0 }}
          >
              <AdGrid rows={monthlySummary.map((r) => ({ id: r.employee_id, ...r }))} columns={monthlyColumns as any} loading={monthlyLoading} disableColumnMenu autoHeight />
          </AdCard>

          <AdCard title="Monthly Attendance Rows" subtitle={`${reportRange.date_from} to ${reportRange.date_to}`} animate={false} contentSx={{ p: 0 }}>
            <AdGrid rows={monthlyAttendance.map((r) => ({ id: r.attendance_id, ...r }))} columns={attendanceColumns as any} loading={monthlyLoading} disableColumnMenu autoHeight />
          </AdCard>
        </Stack>
      )}

      <AdModal open={policyModal} onClose={() => setPolicyModal(false)} title={editingPolicy ? "Edit Leave Policy" : "New Leave Policy"} maxWidth="sm" actions={<AdButton startIcon={<SaveIcon fontSize="small" />} onClick={savePolicy}>Save</AdButton>}>
        <Stack spacing={2}>
          <AdDropDown
            label="Partner"
            variant="standard"
            options={partnerOptions}
            value={policyForm.partner_id}
            onChange={(v) => setPolicyForm((f) => ({ ...f, partner_id: String(v) }))}
          />
          <AdTextBox variant="standard" label="Leave Code" value={policyForm.leave_code} onChange={(v) => setPolicyForm((f) => ({ ...f, leave_code: v }))} />
          <AdTextBox variant="standard" label="Leave Name" value={policyForm.leave_name} onChange={(v) => setPolicyForm((f) => ({ ...f, leave_name: v }))} />
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <AdTextBox variant="standard" label="Annual Limit" value={policyForm.annual_limit_days} onChange={(v) => setPolicyForm((f) => ({ ...f, annual_limit_days: v }))} />
            <AdTextBox variant="standard" label="Carry Forward" value={policyForm.carry_forward_days} onChange={(v) => setPolicyForm((f) => ({ ...f, carry_forward_days: v }))} />
            <AdTextBox variant="standard" label="Max Consecutive" value={policyForm.max_consecutive_days} onChange={(v) => setPolicyForm((f) => ({ ...f, max_consecutive_days: v }))} />
            <AdTextBox variant="standard" label="Min Notice" value={policyForm.min_notice_days} onChange={(v) => setPolicyForm((f) => ({ ...f, min_notice_days: v }))} />
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip size="small" label={policyForm.is_paid ? "Paid" : "Unpaid"} color={policyForm.is_paid ? "success" : "default"} onClick={() => setPolicyForm((f) => ({ ...f, is_paid: !f.is_paid }))} />
            <Chip size="small" label={policyForm.allow_half_day ? "Half day allowed" : "Half day blocked"} color={policyForm.allow_half_day ? "success" : "default"} onClick={() => setPolicyForm((f) => ({ ...f, allow_half_day: !f.allow_half_day }))} />
            <Chip size="small" label={policyForm.requires_approval ? "Approval required" : "Auto-approved"} color={policyForm.requires_approval ? "success" : "default"} onClick={() => setPolicyForm((f) => ({ ...f, requires_approval: !f.requires_approval }))} />
            <Chip size="small" label={policyForm.status ? "Active" : "Inactive"} color={policyForm.status ? "success" : "default"} onClick={() => setPolicyForm((f) => ({ ...f, status: !f.status }))} />
          </Stack>
        </Stack>
      </AdModal>

      <AdModal open={holidayModal} onClose={() => setHolidayModal(false)} title={editingHoliday ? "Edit Holiday" : "New Holiday"} maxWidth="sm" actions={<AdButton startIcon={<SaveIcon fontSize="small" />} onClick={saveHoliday}>Save</AdButton>}>
        <Stack spacing={2}>
          <AdDropDown
            label="Partner"
            variant="standard"
            options={partnerOptions}
            value={holidayForm.partner_id}
            onChange={(v) => setHolidayForm((f) => ({ ...f, partner_id: String(v) }))}
          />
          <AdTextBox variant="standard" label="Holiday Name" value={holidayForm.holiday_name} onChange={(v) => setHolidayForm((f) => ({ ...f, holiday_name: v }))} />
          <AdDropDown
            label="Holiday Type"
            variant="standard"
            options={[
              { label: "Fixed Every Year", value: "FIXED" },
              { label: "Variable Every Year", value: "YEARLY_VARIABLE" },
              { label: "One-time", value: "ONCE" },
            ]}
            value={holidayForm.holiday_type}
            onChange={(v) => setHolidayForm((f) => ({ ...f, holiday_type: v as any }))}
          />
          <AdTextBox variant="standard" label="Holiday Date" type="date" value={holidayForm.holiday_date} onChange={(v) => setHolidayForm((f) => ({ ...f, holiday_date: v }))} />
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" } }}>
            <AdTextBox variant="standard" label="Month" value={holidayForm.holiday_month} onChange={(v) => setHolidayForm((f) => ({ ...f, holiday_month: v }))} />
            <AdTextBox variant="standard" label="Day" value={holidayForm.holiday_day} onChange={(v) => setHolidayForm((f) => ({ ...f, holiday_day: v }))} />
            <AdTextBox variant="standard" label="Year" value={holidayForm.holiday_year} onChange={(v) => setHolidayForm((f) => ({ ...f, holiday_year: v }))} />
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip size="small" label={holidayForm.is_paid ? "Paid" : "Unpaid"} color={holidayForm.is_paid ? "success" : "default"} onClick={() => setHolidayForm((f) => ({ ...f, is_paid: !f.is_paid }))} />
            <Chip size="small" label={holidayForm.status ? "Active" : "Inactive"} color={holidayForm.status ? "success" : "default"} onClick={() => setHolidayForm((f) => ({ ...f, status: !f.status }))} />
          </Stack>
        </Stack>
      </AdModal>

      <AdModal open={weeklyModal} onClose={() => setWeeklyModal(false)} title={editingWeekly ? "Edit Weekly Off" : "New Weekly Off"} maxWidth="sm" actions={<AdButton startIcon={<SaveIcon fontSize="small" />} onClick={saveWeekly}>Save</AdButton>}>
        <Stack spacing={2}>
          <AdDropDown
            label="Partner"
            variant="standard"
            options={partnerOptions}
            value={weeklyForm.partner_id}
            onChange={(v) => setWeeklyForm((f) => ({ ...f, partner_id: String(v) }))}
          />
          <AdTextBox variant="standard" label="Rule Name" value={weeklyForm.rule_name} onChange={(v) => setWeeklyForm((f) => ({ ...f, rule_name: v }))} />
          <AdTextBox variant="standard" label="Off Days" value={weeklyForm.off_days} onChange={(v) => setWeeklyForm((f) => ({ ...f, off_days: v }))} placeholder="SATURDAY,SUNDAY" />
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <AdTextBox variant="standard" label="Country ID" value={weeklyForm.country_id} onChange={(v) => setWeeklyForm((f) => ({ ...f, country_id: v }))} />
            <AdTextBox variant="standard" label="Effective From" type="date" value={weeklyForm.effective_from} onChange={(v) => setWeeklyForm((f) => ({ ...f, effective_from: v }))} />
            <AdTextBox variant="standard" label="Effective To" type="date" value={weeklyForm.effective_to} onChange={(v) => setWeeklyForm((f) => ({ ...f, effective_to: v }))} />
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip size="small" label={weeklyForm.status ? "Active" : "Inactive"} color={weeklyForm.status ? "success" : "default"} onClick={() => setWeeklyForm((f) => ({ ...f, status: !f.status }))} />
          </Stack>
        </Stack>
      </AdModal>

      <AdModal open={officeModal} onClose={() => setOfficeModal(false)} title={editingOffice ? "Edit Office" : "New Office"} maxWidth="sm" actions={<AdButton startIcon={<SaveIcon fontSize="small" />} onClick={saveOffice}>Save</AdButton>}>
        <Stack spacing={2}>
          <AdDropDown
            label="Partner"
            variant="standard"
            options={partnerOptions}
            value={officeForm.partner_id}
            onChange={(v) => setOfficeForm((f) => ({ ...f, partner_id: String(v) }))}
          />
          <AdTextBox variant="standard" label="Location Name" value={officeForm.location_name} onChange={(v) => setOfficeForm((f) => ({ ...f, location_name: v }))} />
          <AdTextBox variant="standard" label="Address" value={officeForm.address} onChange={(v) => setOfficeForm((f) => ({ ...f, address: v }))} />
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" } }}>
            <AdTextBox variant="standard" label="Country ID" value={officeForm.country_id} onChange={(v) => setOfficeForm((f) => ({ ...f, country_id: v }))} />
            <AdTextBox variant="standard" label="State ID" value={officeForm.state_id} onChange={(v) => setOfficeForm((f) => ({ ...f, state_id: v }))} />
            <AdTextBox variant="standard" label="City ID" value={officeForm.city_id} onChange={(v) => setOfficeForm((f) => ({ ...f, city_id: v }))} />
            <AdTextBox variant="standard" label="Latitude" value={officeForm.latitude} onChange={(v) => setOfficeForm((f) => ({ ...f, latitude: v }))} />
            <AdTextBox variant="standard" label="Longitude" value={officeForm.longitude} onChange={(v) => setOfficeForm((f) => ({ ...f, longitude: v }))} />
            <AdTextBox variant="standard" label="Radius (meters)" value={officeForm.radius_meters} onChange={(v) => setOfficeForm((f) => ({ ...f, radius_meters: v }))} />
          </Box>
          <Chip size="small" label={officeForm.status ? "Active" : "Inactive"} color={officeForm.status ? "success" : "default"} onClick={() => setOfficeForm((f) => ({ ...f, status: !f.status }))} />
        </Stack>
      </AdModal>
    </Stack>
  );
}
