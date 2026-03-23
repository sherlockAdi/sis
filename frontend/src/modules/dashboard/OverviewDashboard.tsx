import { useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import GroupsIcon from "@mui/icons-material/Groups";
import FolderCopyIcon from "@mui/icons-material/FolderCopy";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import PaidIcon from "@mui/icons-material/Paid";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { AdCard } from "../../common/ad";
import { createOverviewDummyData, type ApplicantItem, type ClockItem } from "./overviewDummyData";

type KpiTone = "orange" | "teal" | "blue" | "pink" | "purple" | "red" | "green" | "slate";

function toneColors(tone: KpiTone) {
  switch (tone) {
    case "orange":
      return { bg: "rgba(249,115,22,0.14)", fg: "#ea580c" };
    case "teal":
      return { bg: "rgba(20,184,166,0.14)", fg: "#0f766e" };
    case "blue":
      return { bg: "rgba(59,130,246,0.14)", fg: "#2563eb" };
    case "pink":
      return { bg: "rgba(236,72,153,0.14)", fg: "#db2777" };
    case "purple":
      return { bg: "rgba(168,85,247,0.14)", fg: "#7c3aed" };
    case "red":
      return { bg: "rgba(239,68,68,0.14)", fg: "#dc2626" };
    case "green":
      return { bg: "rgba(34,197,94,0.14)", fg: "#16a34a" };
    case "slate":
    default:
      return { bg: "rgba(2,6,23,0.08)", fg: "#0f172a" };
  }
}

function KpiTile({
  label,
  value,
  helper,
  tone,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  tone: KpiTone;
  icon: any;
}) {
  const c = toneColors(tone);
  return (
    <AdCard
      animate={false}
      sx={{
        backgroundColor: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(2,6,23,0.08)",
        boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
        height: "100%",
        minHeight: 172,
      }}
      contentSx={{ p: 2, height: "100%" }}
    >
      <Stack spacing={1.1} sx={{ height: "100%" }}>
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            bgcolor: c.bg,
            color: c.fg,
            fontWeight: 900,
          }}
        >
          {icon}
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: 800, lineHeight: 1.2, minHeight: 34 }}
        >
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.2 }}>
          {value}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" sx={{ color: "#f97316", fontWeight: 800 }}>
          {helper}
        </Typography>
      </Stack>
    </AdCard>
  );
}

function HorizontalBars({
  items,
  valueMax,
  barColor = "#f97316",
}: {
  items: { label: string; value: number }[];
  valueMax?: number;
  barColor?: string;
}) {
  const max = valueMax ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <Stack spacing={1.25}>
      {items.map((i) => {
        const pct = Math.max(0, Math.min(100, (i.value / max) * 100));
        return (
          <Stack key={i.label} direction="row" spacing={1.5} alignItems="center">
            <Typography variant="caption" color="text.secondary" sx={{ width: 96 }}>
              {i.label}
            </Typography>
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  height: 10,
                  borderRadius: 999,
                  bgcolor: "rgba(2,6,23,0.06)",
                  overflow: "hidden",
                }}
              >
                <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: barColor, borderRadius: 999 }} />
              </Box>
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
}

function StackedBar({
  total,
  parts,
}: {
  total: number;
  parts: { label: string; value: number; color: string }[];
}) {
  const safeTotal = total || parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <Stack spacing={1.25}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline">
        <Typography variant="body2" color="text.secondary">
          Total Employee
        </Typography>
        <Typography variant="h6" fontWeight={950}>
          {total}
        </Typography>
      </Stack>
      <Box
        sx={{
          height: 16,
          borderRadius: 999,
          overflow: "hidden",
          bgcolor: "rgba(2,6,23,0.06)",
          display: "flex",
        }}
      >
        {parts.map((p) => (
          <Box
            key={p.label}
            sx={{
              width: `${Math.max(0, (p.value / safeTotal) * 100)}%`,
              bgcolor: p.color,
            }}
          />
        ))}
      </Box>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {parts.map((p) => (
          <Chip
            key={p.label}
            size="small"
            label={`${p.label}: ${p.value}`}
            sx={{
              bgcolor: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(2,6,23,0.08)",
              "& .MuiChip-label": { fontWeight: 800 },
            }}
          />
        ))}
      </Stack>
    </Stack>
  );
}

function SemiGauge({
  value,
  max,
  segments,
}: {
  value: number;
  max: number;
  segments: { color: string; value: number; label: string }[];
}) {
  const size = 260;
  const stroke = 24;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * r; // half circle

  let offset = 0;
  const rings = segments.map((s) => {
    const frac = s.value / Math.max(1, max);
    const dash = `${frac * circumference} ${circumference}`;
    const o = offset;
    offset += frac * circumference;
    return { ...s, dash, offset: o };
  });

  const clamped = Math.max(0, Math.min(max, value));
  const pointerFrac = clamped / Math.max(1, max);
  const pointerAngle = -180 + pointerFrac * 180; // left to right
  const pointerLen = r - 10;
  const px = cx + pointerLen * Math.cos((pointerAngle * Math.PI) / 180);
  const py = cy + pointerLen * Math.sin((pointerAngle * Math.PI) / 180);

  return (
    <Box sx={{ position: "relative", width: size, height: size / 2 + 36 }}>
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        <g transform={`translate(0, 0)`}>
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="rgba(2,6,23,0.08)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {rings.map((s) => (
            <path
              key={s.label}
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={s.dash}
              strokeDashoffset={-s.offset}
              strokeLinecap="butt"
            />
          ))}
          <line
            x1={cx}
            y1={cy}
            x2={px}
            y2={py}
            stroke="#0f172a"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="6" fill="#0f172a" />
        </g>
      </svg>
      <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 0, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Total Attendance
        </Typography>
        <Typography variant="h5" fontWeight={950}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

function roleChip(app: ApplicantItem) {
  const map: Record<ApplicantItem["roleColor"], { bg: string; fg: string }> = {
    teal: { bg: "rgba(14,116,144,0.10)", fg: "#0e7490" },
    blue: { bg: "rgba(37,99,235,0.10)", fg: "#2563eb" },
    purple: { bg: "rgba(147,51,234,0.10)", fg: "#9333ea" },
    gray: { bg: "rgba(15,23,42,0.08)", fg: "#0f172a" },
  };
  const c = map[app.roleColor] ?? map.gray;
  return (
    <Chip
      size="small"
      label={app.role}
      sx={{
        bgcolor: c.bg,
        color: c.fg,
        border: "1px solid rgba(2,6,23,0.08)",
        "& .MuiChip-label": { fontWeight: 900 },
      }}
    />
  );
}

function clockStatusChip(item: ClockItem) {
  const late = item.status === "Late";
  return (
    <Chip
      size="small"
      label={late ? "Late" : "On Time"}
      sx={{
        bgcolor: late ? "rgba(239,68,68,0.10)" : "rgba(34,197,94,0.12)",
        color: late ? "#dc2626" : "#16a34a",
        border: "1px solid rgba(2,6,23,0.08)",
        "& .MuiChip-label": { fontWeight: 900 },
      }}
    />
  );
}

export default function OverviewDashboard({ userName }: { userName: string }) {
  const data = useMemo(() => createOverviewDummyData(), []);
  const [todos, setTodos] = useState(data.todos);

  const deptBars = useMemo(
    () => data.departments.map((d) => ({ label: d.dept, value: d.count })),
    [data.departments],
  );

  const attendanceSegments = useMemo(
    () => [
      { label: "Present", value: data.attendance.present, color: "#facc15" },
      { label: "Late", value: data.attendance.late, color: "#0f766e" },
      { label: "Permission", value: data.attendance.permission, color: "#ef4444" },
      { label: "Absent", value: data.attendance.absent, color: "#db2777" },
    ],
    [data.attendance],
  );

  return (
    <Stack spacing={2.5}>
      <AdCard
        animate={false}
        sx={{
          backgroundColor: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(2,6,23,0.08)",
          boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
        }}
        contentSx={{ p: 2 }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: "rgba(37,99,235,0.14)", color: "#2563eb", fontWeight: 950 }}>
              {userName.slice(0, 2).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" fontWeight={950} noWrap>
                  Welcome Back, {userName}
                </Typography>
                <IconButton size="small" aria-label="edit">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                You have <b>0</b> Leave Requests Today
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", md: "flex-end" }} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<PersonAddAltIcon />}
              sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2, bgcolor: "#0f766e", "&:hover": { bgcolor: "#115e59" } }}
            >
              Add Employee
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2, bgcolor: "#f97316", "&:hover": { bgcolor: "#ea580c" } }}
            >
              Create new Job
            </Button>
          </Stack>
        </Stack>
      </AdCard>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
        }}
      >
        {data.kpis.map((k) => (
          <Box key={k.key}>
            <KpiTile
              label={k.label}
              value={k.value}
              helper={k.helper}
              tone={k.tone as any}
              icon={
                k.key === "attendance" ? (
                  <EventAvailableIcon fontSize="small" />
                ) : k.key === "projects" ? (
                  <FolderCopyIcon fontSize="small" />
                ) : k.key === "clients" ? (
                  <GroupsIcon fontSize="small" />
                ) : k.key === "tasks" ? (
                  <FactCheckIcon fontSize="small" />
                ) : k.key === "earnings" ? (
                  <PaidIcon fontSize="small" />
                ) : k.key === "profit" ? (
                  <TrendingUpIcon fontSize="small" />
                ) : k.key === "applicants" ? (
                  <PersonSearchIcon fontSize="small" />
                ) : (
                  <WorkOutlineIcon fontSize="small" />
                )
              }
            />
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          gap: 2,
          alignItems: "stretch",
        }}
      >
        <Box sx={{ display: "flex" }}>
          <AdCard
            title="Employees By Department"
            animate={false}
            sx={{
              backgroundColor: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(2,6,23,0.08)",
              boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
              flex: 1,
            }}
            contentSx={{ p: 2 }}
            headerRight={
              <Button
                size="small"
                variant="outlined"
                startIcon={<CalendarMonthIcon />}
                sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
              >
                This Week
              </Button>
            }
          >
            <HorizontalBars items={deptBars} barColor="#f97316" />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
              No of Employees increased by <b style={{ color: "#16a34a" }}>+20%</b> from last Week
            </Typography>
          </AdCard>
        </Box>

        <Box sx={{ display: "flex" }}>
          <AdCard
            title="Employee Status"
            animate={false}
            sx={{
              backgroundColor: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(2,6,23,0.08)",
              boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
              flex: 1,
            }}
            contentSx={{ p: 2 }}
            headerRight={
              <Button
                size="small"
                variant="outlined"
                startIcon={<CalendarMonthIcon />}
                sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
              >
                This Week
              </Button>
            }
          >
            <StackedBar
              total={data.attendance.total}
              parts={[
                { label: "Present", value: data.attendance.present, color: "#facc15" },
                { label: "Late", value: data.attendance.late, color: "#0f766e" },
                { label: "Permission", value: data.attendance.permission, color: "#ef4444" },
                { label: "Absent", value: data.attendance.absent, color: "#db2777" },
              ]}
            />
          </AdCard>
        </Box>

        <Box sx={{ display: "flex" }}>
          <AdCard
            title="Attendance Overview"
            animate={false}
            sx={{
              backgroundColor: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(2,6,23,0.08)",
              boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
              flex: 1,
            }}
            contentSx={{ p: 2 }}
            headerRight={
              <Button
                size="small"
                variant="outlined"
                startIcon={<CalendarMonthIcon />}
                sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
              >
                Today
              </Button>
            }
          >
            <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems="center">
              <SemiGauge value={data.attendance.present} max={data.attendance.total} segments={attendanceSegments} />
              <Box sx={{ flex: 1, width: "100%" }}>
                <Typography variant="subtitle2" fontWeight={950} sx={{ mb: 1 }}>
                  Status
                </Typography>
                <Stack spacing={1}>
                  {[
                    { label: "Present", value: data.attendance.present, color: "#22c55e" },
                    { label: "Late", value: data.attendance.late, color: "#0f766e" },
                    { label: "Permission", value: data.attendance.permission, color: "#facc15" },
                    { label: "Absent", value: data.attendance.absent, color: "#ef4444" },
                  ].map((s) => (
                    <Stack key={s.label} direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: s.color }} />
                        <Typography variant="body2" color="text.secondary">
                          {s.label}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" fontWeight={900}>
                        {Math.round((s.value / data.attendance.total) * 100)}%
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
                <Divider sx={{ my: 1.5 }} />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Total Absenties
                  </Typography>
                  <Button size="small" sx={{ textTransform: "none", fontWeight: 900 }}>
                    View Details
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </AdCard>
        </Box>

        <Box sx={{ display: "flex" }}>
          <AdCard
            title="Clock-In/Out"
            animate={false}
            sx={{
              backgroundColor: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(2,6,23,0.08)",
              boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
              flex: 1,
            }}
            contentSx={{ p: 2 }}
            headerRight={
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip size="small" label="All Departments" variant="outlined" />
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<CalendarMonthIcon />}
                  sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
                >
                  Today
                </Button>
              </Stack>
            }
          >
            <Stack spacing={1.25}>
              {data.clockItems.map((c) => (
                <Box
                  key={c.id}
                  sx={{
                    p: 1.25,
                    borderRadius: 3,
                    border: "1px dashed rgba(2,6,23,0.14)",
                    bgcolor: "rgba(2,6,23,0.01)",
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: "rgba(2,6,23,0.06)", color: "#0f172a", fontWeight: 950 }}>
                        {c.name.slice(0, 2).toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={950} noWrap>
                          {c.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {c.title}
                        </Typography>
                      </Box>
                    </Stack>
                    {clockStatusChip(c)}
                  </Stack>

                  <Divider sx={{ my: 1 }} />

                  <Stack direction="row" spacing={2} justifyContent="space-between" flexWrap="wrap">
                    <Typography variant="caption" color="text.secondary">
                      • Clock In <b style={{ color: "#0f172a" }}>{c.clockIn}</b>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      • Clock Out <b style={{ color: "#0f172a" }}>{c.clockOut}</b>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      • Production <b style={{ color: "#0f172a" }}>{c.production}</b>
                    </Typography>
                  </Stack>
                </Box>
              ))}
              <Button variant="contained" sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2, bgcolor: "rgba(2,6,23,0.06)", color: "#0f172a", "&:hover": { bgcolor: "rgba(2,6,23,0.10)" } }}>
                View All Attendance
              </Button>
            </Stack>
          </AdCard>
        </Box>

        <Box sx={{ display: "flex" }}>
          <AdCard
            title="Jobs Applicants"
            animate={false}
            sx={{
              backgroundColor: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(2,6,23,0.08)",
              boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
              flex: 1,
            }}
            contentSx={{ p: 2 }}
            headerRight={
              <Button size="small" variant="outlined" sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}>
                View All
              </Button>
            }
          >
            <Box
              sx={{
                height: 34,
                borderRadius: 2.5,
                bgcolor: "rgba(2,6,23,0.06)",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                overflow: "hidden",
                mb: 1.5,
              }}
            >
              <Box sx={{ display: "grid", placeItems: "center", fontWeight: 900, color: "#0f172a" }}>
                Openings
              </Box>
              <Box sx={{ display: "grid", placeItems: "center", fontWeight: 900, bgcolor: "#f97316", color: "white" }}>
                Applicants
              </Box>
            </Box>

            <Stack spacing={1.25}>
              {data.applicants.map((a) => (
                <Stack
                  key={a.id}
                  direction="row"
                  spacing={1.25}
                  alignItems="center"
                  sx={{ py: 0.75 }}
                >
                  <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(2,6,23,0.06)", color: "#0f172a", fontWeight: 950 }}>
                    {a.name.slice(0, 2).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={950} noWrap>
                      {a.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      Exp : {a.exp} &nbsp;•&nbsp; {a.country}
                    </Typography>
                  </Box>
                  {roleChip(a)}
                </Stack>
              ))}
            </Stack>
          </AdCard>
        </Box>

        <Box sx={{ display: "flex" }}>
          <AdCard
            title="Todo"
            animate={false}
            sx={{
              backgroundColor: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(2,6,23,0.08)",
              boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
              flex: 1,
            }}
            contentSx={{ p: 2 }}
            headerRight={
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<CalendarMonthIcon />}
                  sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
                >
                  Today
                </Button>
                <IconButton size="small" aria-label="add todo">
                  <AddIcon fontSize="small" />
                </IconButton>
              </Stack>
            }
          >
            <Stack spacing={1.25}>
              {todos.map((t) => (
                <Stack
                  key={t.id}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{
                    p: 1,
                    borderRadius: 3,
                    border: "1px solid rgba(2,6,23,0.08)",
                    bgcolor: "rgba(2,6,23,0.01)",
                  }}
                >
                  <Checkbox
                    checked={t.done}
                    onChange={(e) => setTodos((x) => x.map((it) => (it.id === t.id ? { ...it, done: e.target.checked } : it)))}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={900}
                      noWrap
                      sx={{ textDecoration: t.done ? "line-through" : "none", opacity: t.done ? 0.65 : 1 }}
                    >
                      {t.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t.dueLabel}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </AdCard>
        </Box>
      </Box>
    </Stack>
  );
}
