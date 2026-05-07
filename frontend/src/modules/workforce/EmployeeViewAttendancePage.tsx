import { useEffect, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import TodayIcon from "@mui/icons-material/Today";
import PlaceIcon from "@mui/icons-material/Place";
import { AdAlertBox, AdButton, AdCard, AdGrid, AdNotification, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { workforceApi, type MonthlyReport, type WorkforceSummary } from "../../common/services/workforceApi";

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
}

function formatGridDate(input: any): string {
  return formatDate(input?.value ?? input ?? null);
}

function formatGridDateTime(input: any): string {
  return formatDateTime(input?.value ?? input ?? null);
}

function toYm(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(2,6,23,0.03)", border: "1px solid rgba(2,6,23,0.06)" }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={800} sx={{ wordBreak: "break-word" }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function EmployeeViewAttendancePage() {
  const [summary, setSummary] = useState<WorkforceSummary | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [reportMonth, setReportMonth] = useState(toYm(new Date()));
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await workforceApi.summary();
      setSummary(data);
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load attendance summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!summary?.employer?.partner_id) return;
    let active = true;
    (async () => {
      setReportLoading(true);
      try {
        const [year, month] = reportMonth.split("-").map(Number);
        const report = await workforceApi.monthlyReport(summary.employer.partner_id, year, month);
        if (active) setMonthlyReport(report);
      } catch (e: any) {
        if (active) {
          setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load monthly attendance report", severity: "error" });
        }
      } finally {
        if (active) setReportLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [summary?.employer?.partner_id, reportMonth]);

  const currentEmployeeId = summary?.employee?.employee_id;
  const currentEmployeeCode = summary?.employee?.employee_code;
  const punchRows = (monthlyReport?.attendance ?? []).filter((row) => String(row.employee_id) === String(currentEmployeeId ?? ""));

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={900}>
            View Attendance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Month-wise attendance report under your employer policy
          </Typography>
        </Stack>
        <AdButton startIcon={<TodayIcon fontSize="small" />} onClick={refresh}>
          Refresh
        </AdButton>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard
        title="Month Wise Attendance"
        subtitle="Select a month to review your attendance summary"
        animate={false}
        contentSx={{ p: 2 }}
      >
        <Stack spacing={2}>
          <Box sx={{ maxWidth: 220 }}>
            <AdTextBox label="Select Month" type="month" value={reportMonth} onChange={(v) => setReportMonth(v)} />
          </Box>
          <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" } }}>
            <Metric label="Present Days" value={String((monthlyReport?.summary ?? []).find((row) => String(row.employee_id) === String(currentEmployeeId ?? ""))?.present_days ?? 0)} />
            <Metric label="Leave Days" value={String((monthlyReport?.summary ?? []).find((row) => String(row.employee_id) === String(currentEmployeeId ?? ""))?.leave_days ?? 0)} />
            <Metric label="Holiday Days" value={String((monthlyReport?.summary ?? []).find((row) => String(row.employee_id) === String(currentEmployeeId ?? ""))?.holiday_days ?? 0)} />
            <Metric label="Weekly Off" value={String((monthlyReport?.summary ?? []).find((row) => String(row.employee_id) === String(currentEmployeeId ?? ""))?.weekly_off_days ?? 0)} />
            <Metric label="Absent" value={String((monthlyReport?.summary ?? []).find((row) => String(row.employee_id) === String(currentEmployeeId ?? ""))?.absent_days ?? 0)} />
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip size="small" icon={<PlaceIcon fontSize="small" />} label={summary?.employee.employee_name ?? "Employee"} />
            <Chip size="small" label={monthlyReport ? `${monthlyReport.year}-${String(monthlyReport.month).padStart(2, "0")}` : "Month pending"} variant="outlined" />
          </Stack>
        </Stack>
      </AdCard>

      <AdCard title="Punch Details" subtitle="Day-wise check in and check out records" animate={false} contentSx={{ p: 0 }}>
        <AdGrid
          rows={punchRows.map((row) => ({ id: row.attendance_id, ...row }))}
          columns={[
            { field: "attendance_date", headerName: "Date", width: 120, valueFormatter: (p: any) => formatGridDate(p) },
            { field: "check_in_at", headerName: "Check In", width: 170, valueFormatter: (p: any) => formatGridDateTime(p) },
            { field: "check_out_at", headerName: "Check Out", width: 170, valueFormatter: (p: any) => formatGridDateTime(p) },
            { field: "day_type", headerName: "Day Type", width: 130 },
            { field: "status", headerName: "Status", width: 110 },
            { field: "remarks", headerName: "Remarks", flex: 1, minWidth: 220 },
          ] as any}
          loading={reportLoading || loading}
          showExport={false}
          disableColumnMenu
          autoHeight
        />
      </AdCard>
    </Stack>
  );
}
