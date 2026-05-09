import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { AdAlertBox, AdCard } from "../../common/ad";
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

function MetricCard({ card }: { card: DashboardCard }) {
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
    <AdCard
      animate={false}
      sx={{
        backgroundColor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 0,
        boxShadow: "none",
        minHeight: 102,
      }}
      contentSx={{ p: 1.5, height: "100%" }}
    >
      <Stack spacing={0.75} sx={{ height: "100%" }}>
        <Typography
          variant="caption"
          sx={{
            color: "#6b7280",
            fontWeight: 900,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            lineHeight: 1.15,
            minHeight: 28,
          }}
        >
          {card.label}
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="flex-end" sx={{ flex: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 0.95, color: "#111827", letterSpacing: -1 }}>
            {formatK(card.value)}
          </Typography>
          <Stack spacing={0.25} sx={{ pb: 0.4 }}>
            <Typography variant="body2" sx={{ color: valueColor, fontWeight: 800, lineHeight: 1 }}>
              {card.trend}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </AdCard>
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

  const quickStats = [
    { icon: <GroupsOutlinedIcon sx={{ fontSize: 18 }} />, label: "Active Partners", value: data?.summary.active_partners ?? 0, tone: "slate" as const },
    { icon: <WorkOutlineIcon sx={{ fontSize: 18 }} />, label: "Open Jobs", value: data?.summary.open_jobs ?? 0, tone: "blue" as const },
    { icon: <BadgeOutlinedIcon sx={{ fontSize: 18 }} />, label: "Deployed (Month)", value: data?.summary.deployed_this_month ?? 0, tone: "blue" as const },
    { icon: <AccessTimeOutlinedIcon sx={{ fontSize: 18 }} />, label: "Late Check-ins", value: data?.summary.late_checkins ?? 0, tone: "red" as const },
  ];

  const weeklyData = data?.charts.attendance_by_day ?? [];
  const cards = data?.cards ?? [];

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

  return (
    <Stack spacing={2.25}>
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
          <MetricCard key={card.key} card={card} />
        ))}
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
          Quick Stats
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
            gap: 1.2,
          }}
        >
          {quickStats.map((item) => (
            <QuickStatCard key={item.label} {...item} />
          ))}
        </Box>
      </Stack>
    </Stack>
  );
}
