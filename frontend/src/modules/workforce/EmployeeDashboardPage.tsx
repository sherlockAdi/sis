import { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import ScheduleIcon from "@mui/icons-material/Schedule";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import { AdAlertBox, AdCard, AdGrid } from "../../common/ad";
import { dashboardApi, type EmployeeDashboardResponse } from "../../common/services/dashboardApi";
import type { ApiError } from "../../common/services/apiFetch";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

function fmtTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function fmtDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function statusLabel(status: string | null | undefined): string {
  const s = String(status ?? "").trim().toUpperCase();
  if (!s) return "UNKNOWN";
  return s.replace(/_/g, " ");
}

function toneColor(status: string | null | undefined): "default" | "success" | "warning" | "error" | "info" {
  const s = String(status ?? "").trim().toUpperCase();
  if (s.includes("PRESENT")) return "success";
  if (s.includes("LEAVE")) return "warning";
  if (s.includes("ABSENT")) return "error";
  if (s.includes("HOLIDAY") || s.includes("WEEKLY_OFF")) return "info";
  if (s.includes("OPEN")) return "warning";
  return "default";
}

function StatCard({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: ReactNode;
  accent: string;
  hint?: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        border: "1px solid rgba(15,23,42,0.12)",
        borderRadius: 1,
        bgcolor: "#fff",
        p: 1.15,
        minHeight: 92,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 900, color: "#7c818b", letterSpacing: 0.6 }}>
        {label}
      </Typography>
      <Stack spacing={0.15} alignItems="flex-start">
        <Typography sx={{ fontSize: 30, lineHeight: 1, fontWeight: 950, color: accent }}>{value}</Typography>
        {hint ? (
          <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 700 }}>
            {hint}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}

function Ring({
  value,
  max,
  label,
  size = 140,
  stroke = 16,
}: {
  value: number;
  max: number;
  label: string;
  size?: number;
  stroke?: number;
}) {
  const start = 285;
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `conic-gradient(#243447 0deg ${start}deg, #e2e8f0 ${start}deg 360deg)`,
        p: `${stroke}px`,
        boxSizing: "border-box",
        position: "relative",
        display: "grid",
        placeItems: "center",
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          bgcolor: "#fff",
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.04)",
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 24, lineHeight: 1, fontWeight: 950 }}>{value}</Typography>
          <Typography variant="caption" sx={{ fontWeight: 900, color: "#111827", letterSpacing: 0.3 }}>
            {label}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default function EmployeeDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<EmployeeDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await dashboardApi.employee();
        if (!cancelled) setData(res);
      } catch (e: any) {
        if (!cancelled) setError((e as ApiError)?.message ?? "Failed to load employee dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hero = useMemo(() => {
    const employee = data?.employee;
    const today = data?.today;
    const ratio = data ? Math.max(0, Math.min(100, (data.summary.present_days / Math.max(data.summary.working_days || 1, 1)) * 100)) : 0;
    const efficiency = Math.max(0, Math.round(ratio - 4));
    const status = statusLabel(today?.attendance_status);
    const canCheckout = String(today?.attendance_status ?? "").toUpperCase() === "OPEN";
    const buttonLabel = canCheckout ? "CHECK OUT" : "CHECK IN";
    return {
      employee,
      today,
      ratio,
      efficiency,
      status,
      buttonLabel,
    };
  }, [data]);

  const leaveBreakdown = useMemo(() => {
    const items = data?.charts.leave_balance_breakdown ?? [];
    const total = items.reduce((sum, item) => sum + Number(item.value ?? 0), 0);
    return { items, total };
  }, [data]);

  const pendingRequests = data?.recent_leave_requests ?? [];

  if (loading && !data) {
    return (
      <AdCard animate={false} sx={{ border: "1px solid rgba(15,23,42,0.10)" }} contentSx={{ p: 3 }}>
        <Stack spacing={1}>
          <Typography variant="h6" fontWeight={950}>
            Loading employee dashboard...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fetching attendance, leave balance, and request summaries.
          </Typography>
        </Stack>
      </AdCard>
    );
  }

  return (
    <Stack spacing={2.25}>
      {error ? <AdAlertBox severity="error" title="Dashboard error" message={error} /> : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.55fr 0.9fr" },
          gap: 1.5,
          alignItems: "stretch",
        }}
      >
        <AdCard animate={false} contentSx={{ p: 0 }} sx={{ overflow: "hidden", border: "1px solid rgba(15,23,42,0.10)" }}>
          <Box
            sx={{
              p: 2,
              minHeight: 128,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.2fr 0.8fr" },
              gap: 1.75,
            }}
          >
            <Stack spacing={1.15}>
              <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 950, lineHeight: 1.15 }}>
                  Employee Dashboard
                </Typography>
                <Typography variant="body2" sx={{ color: "#111827", fontWeight: 800, mt: 0.25 }}>
                  {hero.employee?.employee_name ?? "Employee"}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.75, color: "#6b7280" }} flexWrap="wrap">
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <WorkOutlineIcon sx={{ fontSize: 15 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {data?.employee.partner_name ?? "Partner"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <FlagOutlinedIcon sx={{ fontSize: 15 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {data?.employee.work_location ?? "Factory Unit A"}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ color: "#111827" }}>
                <Chip size="small" icon={<ScheduleIcon fontSize="small" />} label={data?.employee.shift_timing ?? "09:00 AM - 06:00 PM"} variant="outlined" />
                <Chip
                  size="small"
                  icon={<EventAvailableIcon fontSize="small" />}
                  label={status}
                  color={toneColor(todayAttendanceToTone(data?.today?.attendance_status))}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
                <Box>
                  <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 800, letterSpacing: 0.4 }}>
                    Check-in at {fmtDateTime(data?.today?.check_in_at)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 800, letterSpacing: 0.4 }}>
                    Check-out at {fmtDateTime(data?.today?.check_out_at)}
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            <Stack alignItems="flex-end" justifyContent="space-between" spacing={1.5}>
              <Box
                sx={{
                  minWidth: 200,
                  bgcolor: "#172033",
                  color: "#dbe3f0",
                  borderRadius: 1,
                  p: 1.5,
                  minHeight: 104,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 10, color: "#8c93a4", fontWeight: 900, letterSpacing: 1.2 }}>
                    CURRENT STATUS
                  </Typography>
                  <Typography sx={{ fontSize: 17, fontWeight: 950, color: "#4ade80", mt: 0.35 }}>
                    {status}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#9da4b2", fontWeight: 700 }}>
                    Check in at {fmtTime(data?.today?.check_in_at)}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  onClick={() => navigate("/portal/employees/attendance/daily-attendance")}
                  sx={{
                    alignSelf: "flex-end",
                    bgcolor: "#111827",
                    color: "#fff",
                    fontWeight: 950,
                    borderRadius: 0.75,
                    minWidth: 112,
                    "&:hover": { bgcolor: "#000" },
                  }}
                >
                  {hero.buttonLabel}
                </Button>
              </Box>
            </Stack>
          </Box>
        </AdCard>

        <AdCard animate={false} contentSx={{ p: 0 }} sx={{ overflow: "hidden", border: "1px solid rgba(15,23,42,0.10)", bgcolor: "#182235" }}>
          <Box
            sx={{
              p: 2,
              minHeight: 128,
              color: "#c5cfdf",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#72819b", letterSpacing: 1.2 }}>
                PLANT CONDITION
              </Typography>
              <Typography sx={{ fontSize: 23, fontWeight: 950, color: "#e9eef7", mt: 0.35 }}>
                {hero.efficiency >= 90 ? "Optimal" : hero.efficiency >= 80 ? "Healthy" : "Stable"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#9da9be", maxWidth: 270, mt: 0.5, lineHeight: 1.35 }}>
                Shift efficiency is tracking {Math.max(0, Math.round(hero.efficiency))}% above the current working trend. Safety compliance: 100%.
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 0.75, justifyContent: "flex-end", alignItems: "flex-end" }}>
              <Box sx={{ width: 11, height: 18, bgcolor: "#334155", borderRadius: 0.5 }} />
              <Box sx={{ width: 11, height: 26, bgcolor: "#475569", borderRadius: 0.5 }} />
              <Box sx={{ width: 11, height: 22, bgcolor: "#64748b", borderRadius: 0.5 }} />
              <Box sx={{ width: 11, height: 36, bgcolor: "#94a3b8", borderRadius: 0.5 }} />
              <Box sx={{ width: 11, height: 28, bgcolor: "#cbd5e1", borderRadius: 0.5 }} />
              <Box sx={{ width: 11, height: 44, bgcolor: "#e2e8f0", borderRadius: 0.5 }} />
            </Box>
          </Box>
        </AdCard>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))", xl: "repeat(8, minmax(0, 1fr))" },
          gap: 1,
        }}
      >
        <StatCard label="PRESENT DAYS" value={data?.summary.present_days ?? 0} accent="#111827" hint={<span style={{ color: "#16a34a", fontWeight: 800 }}>↑</span>} />
        <StatCard label="ABSENT DAYS" value={data?.summary.absent_days ?? 0} accent="#dc2626" />
        <StatCard label="LEAVE DAYS" value={data?.summary.leave_days ?? 0} accent="#d97706" />
        <StatCard label="LEAVE BALANCE" value={data?.summary.leave_balance_days ?? 0} accent="#111827" />
        <StatCard label="PENDING REQ." value={data?.summary.pending_leave_requests ?? 0} accent="#dc2626" />
        <StatCard label="LATE CHECK-INS" value={data?.summary.late_checkins ?? 0} accent="#7c3aed" />
        <StatCard label="CHECK-INS" value={data?.summary.check_in_count ?? 0} accent="#111827" />
        <StatCard label="CHECK-OUTS" value={data?.summary.check_out_count ?? 0} accent="#16a34a" />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.55fr 0.95fr" },
          gap: 1.5,
          alignItems: "start",
        }}
      >
        <AdCard
          title="Recent Attendance"
          subtitle="View full history"
          animate={false}
          sx={{ border: "1px solid rgba(15,23,42,0.10)" }}
          contentSx={{ p: 0 }}
        >
          <AdGrid
            rows={(data?.recent_attendance ?? []).map((row, idx) => ({ id: `${row.attendance_date}-${idx}`, ...row }))}
            columns={[
              {
                field: "attendance_date",
                headerName: "Date",
                flex: 1,
                minWidth: 120,
                valueFormatter: (value) => fmtDate(value),
              },
              {
                field: "day_type",
                headerName: "Day Type",
                flex: 1,
                minWidth: 130,
                valueFormatter: (value) => String(value ?? "-"),
              },
              {
                field: "status",
                headerName: "Status",
                flex: 1,
                minWidth: 120,
                renderCell: (p) => (
                  <Chip
                    size="small"
                    label={statusLabel(p.value as any)}
                    color={toneColor(p.value as any)}
                    variant="outlined"
                  />
                ),
              },
              {
                field: "check_in_at",
                headerName: "Punch In",
                flex: 1,
                minWidth: 120,
                valueFormatter: (value) => fmtTime(value),
              },
              {
                field: "check_out_at",
                headerName: "Punch Out",
                flex: 1,
                minWidth: 120,
                valueFormatter: (value) => fmtTime(value),
              },
            ]}
            showToolbar={false}
            showExport={false}
            disableColumnMenu
            sx={{
              border: 0,
              borderRadius: 0,
              minHeight: 340,
            }}
          />
        </AdCard>

        <Stack spacing={1.5}>
          <AdCard
            title="Leave Balance"
            animate={false}
            sx={{ border: "1px solid rgba(15,23,42,0.10)" }}
            contentSx={{ p: 2 }}
          >
            <Stack spacing={1.5} alignItems="center">
              <Ring value={leaveBreakdown.total || data?.summary.leave_balance_days || 0} max={Math.max(leaveBreakdown.total || data?.summary.leave_balance_days || 1, 1)} label="TOTAL DAYS" />
              <Stack spacing={1} sx={{ width: "100%" }}>
                {(leaveBreakdown.items.length ? leaveBreakdown.items : [
                  { label: "Casual Leave (CL)", value: 0 },
                  { label: "Sick Leave (SL)", value: 0 },
                  { label: "Earned Leave (EL)", value: 0 },
                ]).map((item) => (
                  <Stack key={item.label} direction="row" justifyContent="space-between" spacing={1} alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#334155" }} />
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {item.label}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>
                      {Number(item.value ?? 0)} Days
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </AdCard>

          <AdCard
            title="Pending Requests"
            animate={false}
            sx={{ border: "1px solid rgba(15,23,42,0.10)" }}
            contentSx={{ p: 2 }}
          >
            <Stack spacing={1}>
              {pendingRequests.length ? (
                pendingRequests.map((req) => (
                  <Box
                    key={req.leave_request_id}
                    sx={{
                      border: "1px solid rgba(15,23,42,0.08)",
                      borderRadius: 2,
                      p: 1.25,
                      bgcolor: "rgba(255,255,255,0.75)",
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 850 }}>
                          {req.leave_name ?? "Leave"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fmtDate(req.leave_from)}
                          {req.leave_to ? ` - ${fmtDate(req.leave_to)}` : ""}
                        </Typography>
                      </Box>
                      <Chip size="small" label={statusLabel(req.status)} color={toneColor(req.status)} />
                    </Stack>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No pending leave requests.
                </Typography>
              )}
            </Stack>
          </AdCard>
        </Stack>
      </Box>
    </Stack>
  );
}

function todayAttendanceToTone(status: EmployeeDashboardResponse["today"]["attendance_status"] | undefined) {
  if (status === "PRESENT") return "success";
  if (status === "ABSENT") return "error";
  if (status === "LEAVE") return "warning";
  if (status === "HOLIDAY" || status === "WEEKLY_OFF") return "info";
  return "default";
}
