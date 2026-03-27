import { Box, Chip, Stack, Typography } from "@mui/material";
import type { WorkflowItem, WorkflowPriority, WorkflowStage } from "./workflowDummyData";
import { workflowStages } from "./workflowDummyData";
import dayjs from "dayjs";

type SeriesPoint = { label: string; value: number; color: string };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function priorityColor(priority: WorkflowPriority) {
  switch (priority) {
    case "Critical":
      return "#ef4444";
    case "High":
      return "#f59e0b";
    case "Medium":
      return "#3b82f6";
    case "Low":
    default:
      return "#64748b";
  }
}

function stageColor(stageId: WorkflowStage["id"]) {
  switch (stageId) {
    case "inbox":
      return "#0ea5e9";
    case "screening":
      return "#6366f1";
    case "interview":
      return "#8b5cf6";
    case "documentation":
      return "#14b8a6";
    case "deployment":
      return "#f97316";
    case "done":
    default:
      return "#22c55e";
  }
}

function DonutChart({
  points,
  size = 140,
  thickness = 14,
  centerLabel,
}: {
  points: SeriesPoint[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
}) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = points.reduce((s, p) => s + p.value, 0);

  let offset = 0;
  const rings = points
    .filter((p) => p.value > 0)
    .map((p) => {
      const frac = total ? p.value / total : 0;
      const dash = `${frac * circumference} ${circumference}`;
      const o = offset;
      offset += frac * circumference;
      return { ...p, dash, offset: o };
    });

  return (
    <Box sx={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(2,6,23,0.08)"
          strokeWidth={thickness}
        />
        {rings.map((r) => (
          <circle
            key={r.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={r.color}
            strokeWidth={thickness}
            strokeDasharray={r.dash}
            strokeDashoffset={-r.offset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ))}
      </svg>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          textAlign: "center",
          px: 1,
        }}
      >
        <Typography variant="h5" fontWeight={900} sx={{ lineHeight: 1 }}>
          {total}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {centerLabel ?? "Items"}
        </Typography>
      </Box>
    </Box>
  );
}

function BarList({
  title,
  points,
  maxValue,
}: {
  title: string;
  points: SeriesPoint[];
  maxValue?: number;
}) {
  const max = maxValue ?? Math.max(1, ...points.map((p) => p.value));
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2" fontWeight={900}>
        {title}
      </Typography>
      <Stack spacing={0.75}>
        {points.map((p) => {
          const pct = clamp((p.value / max) * 100, 0, 100);
          return (
            <Stack key={p.label} spacing={0.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                <Typography variant="caption" color="text.secondary">
                  {p.label}
                </Typography>
                <Typography variant="caption" fontWeight={800}>
                  {p.value}
                </Typography>
              </Stack>
              <Box
                sx={{
                  height: 8,
                  borderRadius: 999,
                  bgcolor: "rgba(2,6,23,0.08)",
                  overflow: "hidden",
                }}
              >
                <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: p.color }} />
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}

function MiniTrend({
  title,
  series,
  color,
}: {
  title: string;
  series: { x: string; y: number }[];
  color: string;
}) {
  const w = 320;
  const h = 84;
  const pad = 10;
  const maxY = Math.max(1, ...series.map((s) => s.y));
  const pts = series.map((s, idx) => {
    const x = pad + (idx * (w - pad * 2)) / Math.max(1, series.length - 1);
    const y = h - pad - (s.y * (h - pad * 2)) / maxY;
    return { ...s, x, y };
  });
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const last = series[series.length - 1]?.y ?? 0;
  return (
    <Stack spacing={0.75}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline">
        <Typography variant="subtitle2" fontWeight={900}>
          {title}
        </Typography>
        <Chip size="small" label={`Now: ${last}`} variant="outlined" />
      </Stack>
      <Box
        sx={{
          borderRadius: 2,
          border: "1px solid rgba(2,6,23,0.10)",
          bgcolor: "rgba(255,255,255,0.7)",
          px: 1,
          py: 0.75,
        }}
      >
        <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
          <path d={d} fill="none" stroke={color} strokeWidth="2.5" />
          {pts.map((p) => (
            <circle key={p.x} cx={p.x} cy={p.y} r="3" fill={color} />
          ))}
        </svg>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            {series[0]?.x ?? ""}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {series[series.length - 1]?.x ?? ""}
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}

function bucketByLastDays(items: WorkflowItem[], days: number) {
  const end = dayjs();
  const start = end.subtract(days - 1, "day").startOf("day");
  const buckets = Array.from({ length: days }, (_, i) => start.add(i, "day"));

  const created = buckets.map((d) => {
    const count = items.filter((it) => dayjs(it.createdAt).isSame(d, "day")).length;
    return { x: d.format("DD MMM"), y: count };
  });

  const done = buckets.map((d) => {
    const count = items
      .filter((it) => it.stageId === "done")
      .filter((it) => dayjs(it.dueDate).isSame(d, "day")).length;
    return { x: d.format("DD MMM"), y: count };
  });

  return { created, done };
}

export default function WorkflowCharts({ items }: { items: WorkflowItem[] }) {
  const stagePoints: SeriesPoint[] = workflowStages.map((s) => ({
    label: s.label,
    value: items.filter((i) => i.stageId === s.id).length,
    color: stageColor(s.id),
  }));

  const priorityOrder: WorkflowPriority[] = ["Critical", "High", "Medium", "Low"];
  const priorityPoints: SeriesPoint[] = priorityOrder.map((p) => ({
    label: p,
    value: items.filter((i) => i.priority === p).length,
    color: priorityColor(p),
  }));

  const { created, done } = bucketByLastDays(items, 10);

  return (
    <Stack spacing={2}>
      <Stack spacing={0.25}>
        <Typography variant="h6" fontWeight={900}>
          Charts & Visualizations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Quick insights from the current filtered items.
        </Typography>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">
        <Stack
          spacing={1}
          sx={{
            flex: 1,
            borderRadius: 3,
            border: "1px solid rgba(2,6,23,0.10)",
            bgcolor: "rgba(255,255,255,0.78)",
            p: 1.5,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <DonutChart points={stagePoints} centerLabel="Items" />
            <BarList title="By Stage" points={stagePoints} />
          </Stack>
        </Stack>

        <Stack
          spacing={1}
          sx={{
            flex: 1,
            borderRadius: 3,
            border: "1px solid rgba(2,6,23,0.10)",
            bgcolor: "rgba(255,255,255,0.78)",
            p: 1.5,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <DonutChart points={priorityPoints} centerLabel="Priorities" />
            <BarList title="By Priority" points={priorityPoints} />
          </Stack>
        </Stack>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Box sx={{ flex: 1 }}>
          <MiniTrend title="Created (last 10 days)" series={created} color="#3b82f6" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <MiniTrend title="Done (proxy, last 10 days)" series={done} color="#22c55e" />
        </Box>
      </Stack>
    </Stack>
  );
}

