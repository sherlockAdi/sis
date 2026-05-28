import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import DashboardCustomizeOutlinedIcon from "@mui/icons-material/DashboardCustomizeOutlined";
import FlightTakeoffOutlinedIcon from "@mui/icons-material/FlightTakeoffOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { useNavigate } from "react-router-dom";
import { AdAlertBox, AdButton, AdCard } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { dashboardApi, type DashboardCard, type DashboardResponse } from "../../common/services/dashboardApi";

type Tone = DashboardCard["tone"];

const TONE_MAP: Record<Tone, { bg: string; fg: string; soft: string }> = {
  slate: { bg: "#e5e7eb", fg: "#111827", soft: "#f3f4f6" },
  green: { bg: "#fee2e2", fg: "#b91c1c", soft: "#fef2f2" },
  red: { bg: "#dbeafe", fg: "#1d4ed8", soft: "#eff6ff" },
  amber: { bg: "#fef3c7", fg: "#b45309", soft: "#fffbeb" },
  blue: { bg: "#dbeafe", fg: "#1d4ed8", soft: "#eff6ff" },
  orange: { bg: "#fde68a", fg: "#92400e", soft: "#fffbeb" },
  violet: { bg: "#ede9fe", fg: "#6d28d9", soft: "#f5f3ff" },
};

function formatK(value: number): string {
  return String(value ?? 0);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function pct(value: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

function MetricCard({ card, to, helper, onOpen }: { card: DashboardCard; to?: string; helper?: string; onOpen?: (to: string) => void }) {
  const tone = TONE_MAP[card.tone];
  const valueColor =
    card.key === "absent_today"
      ? "#dc2626"
      : card.key === "on_leave"
        ? "#8b5e34"
        : card.key === "open_tickets"
          ? "#1d4ed8"
          : card.key === "pending_approvals"
            ? "#8b5e34"
            : "#111827";
  return (
    <Box
      role={to ? "button" : undefined}
      tabIndex={to ? 0 : undefined}
      onClick={() => to && onOpen?.(to)}
      onKeyDown={(event) => {
        if (to && (event.key === "Enter" || event.key === " ")) onOpen?.(to);
      }}
      sx={{ height: "100%", cursor: to ? "pointer" : "default", outline: "none" }}
    >
      <AdCard
        animate={false}
        sx={{
          backgroundColor: "#fff",
          border: `1px solid ${tone.bg}`,
          borderRadius: 0,
          boxShadow: "none",
          minHeight: 118,
          transition: "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
          "&:hover": to
            ? {
                transform: "translateY(-2px)",
                boxShadow: "0 10px 24px rgba(15,23,42,0.10)",
                borderColor: tone.fg,
              }
            : undefined,
        }}
        contentSx={{ p: 1.5, height: "100%" }}
      >
        <Stack spacing={0.75} sx={{ height: "100%" }}>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                fontWeight: 900,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                lineHeight: 1.15,
                flex: 1,
                minHeight: 28,
              }}
            >
              {card.label}
            </Typography>
            {to ? <ArrowForwardIcon sx={{ fontSize: 17, color: tone.fg }} /> : null}
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="flex-end" sx={{ flex: 1 }}>
            <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 0.95, color: "#111827", letterSpacing: 0 }}>
              {formatK(card.value)}
            </Typography>
            <Stack spacing={0.25} sx={{ pb: 0.4, minWidth: 0 }}>
              <Typography variant="body2" sx={{ color: valueColor, fontWeight: 800, lineHeight: 1 }}>
                {card.trend}
              </Typography>
              {helper ? (
                <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 700, lineHeight: 1.1 }}>
                  {helper}
                </Typography>
              ) : null}
            </Stack>
          </Stack>
        </Stack>
      </AdCard>
    </Box>
  );
}

function InsightCard({
  label,
  value,
  detail,
  progress,
  tone,
  onClick,
}: {
  label: string;
  value: string;
  detail: string;
  progress: number;
  tone: "green" | "blue" | "red" | "amber";
  onClick: () => void;
}) {
  const color = {
    green: "#15803d",
    blue: "#1d4ed8",
    red: "#dc2626",
    amber: "#b45309",
  }[tone];

  return (
    <AdCard
      animate={false}
      sx={{
        backgroundColor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 0,
        boxShadow: "none",
        height: "100%",
      }}
      contentSx={{ p: 1.5, height: "100%" }}
    >
      <Stack spacing={1.25} sx={{ height: "100%" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Typography variant="body2" sx={{ color: "#111827", fontWeight: 900 }}>
            {label}
          </Typography>
          <Chip size="small" label={value} sx={{ fontWeight: 900, color, bgcolor: `${color}14` }} />
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 0,
            bgcolor: "#f3f4f6",
            "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 0 },
          }}
        />
        <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 700, flex: 1 }}>
          {detail}
        </Typography>
        <Button size="small" endIcon={<ArrowForwardIcon />} onClick={onClick} sx={{ alignSelf: "flex-start", fontWeight: 900 }}>
          Open
        </Button>
      </Stack>
    </AdCard>
  );
}

function ShortcutCard({
  icon,
  label,
  description,
  to,
  count,
  onOpen,
}: {
  icon: ReactNode;
  label: string;
  description: string;
  to: string;
  count?: number;
  onOpen: (to: string) => void;
}) {
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => onOpen(to)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onOpen(to);
      }}
      sx={{ cursor: "pointer", outline: "none" }}
    >
      <AdCard
        animate={false}
        sx={{
          backgroundColor: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 0,
          boxShadow: "none",
          transition: "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
          "&:hover": { transform: "translateY(-2px)", boxShadow: "0 10px 24px rgba(15,23,42,0.10)", borderColor: "#111827" },
        }}
        contentSx={{ p: 1.4 }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ width: 34, height: 34, display: "grid", placeItems: "center", bgcolor: "#f3f4f6", color: "#111827" }}>
            {icon}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" sx={{ fontWeight: 900, color: "#111827" }} noWrap>
                {label}
              </Typography>
              {typeof count === "number" ? <Chip size="small" label={count} sx={{ height: 20, fontWeight: 900 }} /> : null}
            </Stack>
            <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 700 }} noWrap>
              {description}
            </Typography>
          </Box>
          <ArrowForwardIcon sx={{ fontSize: 18, color: "#6b7280" }} />
        </Stack>
      </AdCard>
    </Box>
  );
}

function WeeklyAttendanceChart({ data }: { data: DashboardResponse["charts"]["attendance_by_day"] }) {
  const bars = useMemo(() => {
    const labels = ["MON", "TUE", "WED", "THU", "FRI"];
    return data.slice(0, 5).map((item, index) => ({
      label: labels[index] ?? item.day.toUpperCase(),
      value: item.present,
      raw: item,
    }));
  }, [data]);

  const maxValue = Math.max(1, ...bars.map((b) => b.value));

  return (
    <AdCard
      animate={false}
      sx={{
        backgroundColor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 0,
        boxShadow: "none",
        height: "100%",
      }}
      contentSx={{ p: 2, height: "100%" }}
    >
      <Stack spacing={2} sx={{ height: "100%" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#111827" }}>
            Weekly Attendance
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 900, color: "#6b7280", letterSpacing: 0.8 }}>
            MON - FRI
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1.15} alignItems="flex-end" sx={{ flex: 1, pt: 0.5 }}>
          {bars.map((bar) => {
            const height = Math.max(28, Math.round((bar.value / maxValue) * 118));
            return (
              <Stack key={bar.label} spacing={1} alignItems="center" sx={{ flex: 1 }}>
                <Box
                  sx={{
                    width: "100%",
                    height: 124,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: "78%",
                      height,
                      bgcolor: "#111827",
                      position: "relative",
                    }}
                  >
                    <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
                      <Box sx={{ flex: 1, bgcolor: "#fff", opacity: 0.2 }} />
                      <Box sx={{ height: 14, bgcolor: "#d8b4c3" }} />
                      <Box sx={{ height: 6, bgcolor: "#111827" }} />
                    </Box>
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 900, color: "#111827" }}>
                  {bar.label}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </Stack>
    </AdCard>
  );
}

function StatusBreakdown({ data }: { data: DashboardResponse }) {
  const total = Math.max(1, data.summary.total_employees ?? 0);
  const present = data.summary.present_today ?? 0;
  const absent = data.summary.absent_today ?? 0;
  const leave = data.summary.on_leave ?? 0;
  const ringValues = [
    { label: "Present", value: present, color: "#111111" },
    { label: "Absent", value: absent, color: "#dc2626" },
    { label: "On Leave", value: leave, color: "#b08a5a" },
  ];
  const ringTotal = Math.max(1, present + absent + leave);
  const ringSize = 120;
  const strokeWidth = 12;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = circumference * 0.16;

  return (
    <AdCard
      animate={false}
      sx={{
        backgroundColor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 0,
        boxShadow: "none",
        height: "100%",
      }}
      contentSx={{ p: 2, height: "100%" }}
    >
      <Stack spacing={1.75} sx={{ height: "100%" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#111827" }}>
            Staff Status Breakdown
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 900, letterSpacing: 0.8, color: "#6b7280" }}>
            CURRENT SESSION
          </Typography>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2.25} sx={{ flex: 1, alignItems: "center" }}>
          <Box sx={{ position: "relative", width: ringSize, height: ringSize, flexShrink: 0 }}>
            <Stack
              spacing={0.25}
              alignItems="center"
              justifyContent="center"
              sx={{ position: "absolute", inset: 0 }}
            >
              <Typography variant="h4" sx={{ fontWeight: 900, color: "#111827", lineHeight: 0.95 }}>
                {total}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 900, color: "#111827", letterSpacing: 0.5 }}>
                TOTAL
              </Typography>
            </Stack>
            <Box
              component="svg"
              viewBox={`0 0 ${ringSize} ${ringSize}`}
              sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            >
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="#f0f0f0"
                strokeWidth={strokeWidth}
              />
              {ringValues.map((item) => {
                const length = (item.value / ringTotal) * circumference;
                const circle = (
                  <circle
                    key={item.label}
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="butt"
                    strokeDasharray={`${length} ${circumference - length}`}
                    strokeDashoffset={-offset}
                    transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                  />
                );
                offset += length;
                return circle;
              })}
            </Box>
          </Box>

          <Stack spacing={1.45} sx={{ flex: 1, width: "100%" }}>
            {ringValues.map((row) => (
              <Stack key={row.label} direction="row" alignItems="center" spacing={1.25}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: row.color,
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body2" sx={{ flex: 1, color: "#111827", fontWeight: 700 }}>
                  {row.label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900, color: "#111827" }}>
                  {row.value}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </AdCard>
  );
}

function QuickStatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "slate" | "blue" | "red" | "green" | "amber";
}) {
  const palette = {
    slate: { bg: "#e5e7eb", fg: "#111827" },
    blue: { bg: "#dbeafe", fg: "#1d4ed8" },
    red: { bg: "#fee2e2", fg: "#dc2626" },
    green: { bg: "#dcfce7", fg: "#15803d" },
    amber: { bg: "#fef3c7", fg: "#b45309" },
  }[tone];

  return (
    <AdCard
      animate={false}
      sx={{
        backgroundColor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 0,
        boxShadow: "none",
        minHeight: 62,
      }}
      contentSx={{ p: 1.2 }}
    >
      <Stack direction="row" spacing={1.1} alignItems="center">
        <Box
          sx={{
            width: 32,
            height: 32,
            display: "grid",
            placeItems: "center",
            bgcolor: palette.bg,
            color: palette.fg,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="baseline">
            <Typography variant="h6" sx={{ fontWeight: 900, color: tone === "red" ? "#dc2626" : "#111827", lineHeight: 1 }}>
              {String(value).padStart(2, "0")}
            </Typography>
            <Typography variant="body2" sx={{ color: "#374151", fontWeight: 700 }}>
              {label}
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </AdCard>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await dashboardApi.admin();
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(((e as ApiError)?.message ?? "Failed to load dashboard data.") as string);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const weeklyData = data?.charts.attendance_by_day ?? [];
  const cards = data?.cards ?? [];
  const openPath = (to: string) => navigate(to);

  if (loading) {
    return (
      <AdCard animate={false} sx={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", boxShadow: "none" }} contentSx={{ p: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#111827" }}>
          Loading dashboard...
        </Typography>
      </AdCard>
    );
  }

  if (error) {
    return <AdAlertBox severity="error" title="Dashboard error" message={error} />;
  }

  if (!data) return null;

  const cardLinks: Record<string, string> = {
    total_employees: "/portal/employees",
    active_employees: "/portal/employees",
    present_today: "/portal/attendance/logs",
    absent_today: "/portal/attendance/logs",
    on_leave: "/portal/attendance/leave-requests",
    open_tickets: "/portal/helpdesk/open",
    pending_approvals: "/portal/attendance/leave-requests",
    active_partners: "/portal/partners",
    open_jobs: "/portal/jobs",
    deployed_this_month: "/portal/deployment",
    weekly_off_today: "/portal/attendance/weekly-off",
    holiday_today: "/portal/attendance/holidays",
    late_checkins: "/portal/attendance/logs",
  };
  const cardHelpers: Record<string, string> = {
    total_employees: "View employee records",
    active_employees: "Active workforce",
    present_today: "Open attendance logs",
    absent_today: "Review exceptions",
    on_leave: "Review leave flow",
    open_tickets: "Resolve helpdesk queue",
    pending_approvals: "Approve pending items",
    active_partners: "Manage partners",
    open_jobs: "Manage job mandates",
    deployed_this_month: "Open deployment tracker",
    late_checkins: "Review late punches",
  };
  const totalAttendance = data.summary.present_today + data.summary.absent_today + data.summary.on_leave;
  const attendanceRate = pct(data.summary.present_today, totalAttendance);
  const activeEmployeeRate = pct(data.summary.active_employees, data.summary.total_employees);
  const exceptionCount = data.summary.absent_today + data.summary.on_leave + data.summary.late_checkins;
  const deploymentProgress = pct(data.summary.deployed_this_month, Math.max(1, data.summary.open_jobs + data.summary.deployed_this_month));
  const shortcuts = [
    {
      icon: <AddCircleOutlineIcon sx={{ fontSize: 19 }} />,
      label: "Create Job",
      description: "Add a new job mandate",
      to: "/portal/jobs/new",
    },
    {
      icon: <AssignmentIndOutlinedIcon sx={{ fontSize: 19 }} />,
      label: "Add Candidate",
      description: "Create recruitment profile",
      to: "/portal/recruitment/candidates/new",
    },
    {
      icon: <BusinessOutlinedIcon sx={{ fontSize: 19 }} />,
      label: "Partners",
      description: "Onboard and manage partners",
      to: "/portal/partners",
      count: data.summary.active_partners,
    },
    {
      icon: <HelpOutlineOutlinedIcon sx={{ fontSize: 19 }} />,
      label: "Helpdesk",
      description: "Open tickets and escalations",
      to: "/portal/helpdesk/open",
      count: data.summary.open_tickets,
    },
    {
      icon: <FlightTakeoffOutlinedIcon sx={{ fontSize: 19 }} />,
      label: "Deployment",
      description: "Visa, travel and joining",
      to: "/portal/deployment",
      count: data.summary.deployed_this_month,
    },
    {
      icon: <SettingsOutlinedIcon sx={{ fontSize: 19 }} />,
      label: "Settings",
      description: "Masters and system setup",
      to: "/portal/settings",
    },
    {
      icon: <ManageAccountsOutlinedIcon sx={{ fontSize: 19 }} />,
      label: "Menu Roles",
      description: "Permissions and role access",
      to: "/portal/admin/menu-management",
    },
    {
      icon: <DashboardCustomizeOutlinedIcon sx={{ fontSize: 19 }} />,
      label: "Reports",
      description: "Analytics workspace",
      to: "/portal/reports",
    },
  ];

  return (
    <Stack spacing={2.25}>
      <AdCard
        animate={false}
        sx={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 0, boxShadow: "none" }}
        contentSx={{ p: 2 }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <VisibilityOutlinedIcon sx={{ color: "#111827" }} />
              <Typography variant="h5" sx={{ fontWeight: 950, color: "#111827" }}>
                Admin Control Center
              </Typography>
              <Chip size="small" label={data.title || "Live Dashboard"} sx={{ fontWeight: 900 }} />
            </Stack>
            <Typography variant="body2" sx={{ mt: 0.75, color: "#6b7280", fontWeight: 700 }}>
              Workforce, recruitment, attendance, partner and support activity in one place.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Chip
              icon={<CalendarMonthOutlinedIcon fontSize="small" />}
              label={`Updated ${formatDateTime(data.generated_at)}`}
              sx={{ fontWeight: 900, justifyContent: "flex-start" }}
            />
            <AdButton startIcon={<AddCircleOutlineIcon fontSize="small" />} onClick={() => navigate("/portal/jobs/new")}>
              New Job
            </AdButton>
            <AdButton variant="secondary" startIcon={<AssignmentTurnedInOutlinedIcon fontSize="small" />} onClick={() => navigate("/portal/attendance/leave-requests")}>
              Approvals
            </AdButton>
          </Stack>
        </Stack>
      </AdCard>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr 1fr",
            md: "repeat(3, minmax(0, 1fr))",
            lg: "repeat(6, minmax(0, 1fr))",
          },
          gap: 1.2,
        }}
      >
        {cards.slice(0, 6).map((card) => (
          <MetricCard key={card.key} card={card} to={cardLinks[card.key]} helper={cardHelpers[card.key]} onOpen={openPath} />
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
          gap: 1.2,
        }}
      >
        <InsightCard
          label="Attendance Health"
          value={`${attendanceRate}%`}
          detail={`${data.summary.present_today} present, ${exceptionCount} exceptions today`}
          progress={attendanceRate}
          tone={attendanceRate >= 85 ? "green" : attendanceRate >= 65 ? "amber" : "red"}
          onClick={() => navigate("/portal/attendance/logs")}
        />
        <InsightCard
          label="Active Workforce"
          value={`${activeEmployeeRate}%`}
          detail={`${data.summary.active_employees} active out of ${data.summary.total_employees} employees`}
          progress={activeEmployeeRate}
          tone={activeEmployeeRate >= 80 ? "green" : "blue"}
          onClick={() => navigate("/portal/employees")}
        />
        <InsightCard
          label="Deployment Flow"
          value={`${data.summary.deployed_this_month}`}
          detail={`${data.summary.open_jobs} open jobs feeding deployment this month`}
          progress={deploymentProgress}
          tone="blue"
          onClick={() => navigate("/portal/deployment")}
        />
        <InsightCard
          label="Attention Queue"
          value={`${data.summary.pending_approvals + data.summary.open_tickets}`}
          detail={`${data.summary.pending_approvals} approvals and ${data.summary.open_tickets} tickets pending`}
          progress={pct(data.summary.pending_approvals + data.summary.open_tickets, Math.max(1, data.summary.total_employees))}
          tone={data.summary.pending_approvals || data.summary.open_tickets ? "amber" : "green"}
          onClick={() => navigate("/portal/helpdesk/open")}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: 1.5,
        }}
      >
        <WeeklyAttendanceChart data={weeklyData} />
        <StatusBreakdown data={data} />
      </Box>

      <Stack spacing={1}>
        <Typography variant="body2" sx={{ fontWeight: 900, color: "#111827" }}>
          Quick Actions
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
            gap: 1.2,
          }}
        >
          {shortcuts.map((item) => (
            <ShortcutCard key={item.label} {...item} onOpen={openPath} />
          ))}
        </Box>
      </Stack>
    </Stack>
  );
}
