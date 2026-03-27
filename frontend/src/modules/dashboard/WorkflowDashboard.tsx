import { useMemo, useState } from "react";
import {
  Box,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TimelapseIcon from "@mui/icons-material/Timelapse";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import BlockIcon from "@mui/icons-material/Block";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import { AdCard, AdGrid } from "../../common/ad";
import dayjs from "dayjs";
import WorkflowCharts from "./WorkflowCharts";
import {
  canMoveStage,
  createDummyWorkflowItems,
  moveItemStage,
  type WorkflowItem,
  type WorkflowItemStatus,
  type WorkflowPriority,
  type WorkflowStageId,
  workflowStages,
} from "./workflowDummyData";

function priorityColor(priority: WorkflowPriority): "default" | "success" | "warning" | "error" | "info" {
  switch (priority) {
    case "Critical":
      return "error";
    case "High":
      return "warning";
    case "Medium":
      return "info";
    case "Low":
    default:
      return "default";
  }
}

function statusColor(status: WorkflowItemStatus): "default" | "success" | "warning" | "error" {
  switch (status) {
    case "Blocked":
      return "error";
    case "On Hold":
      return "warning";
    case "Open":
    default:
      return "success";
  }
}

function stageLabel(stageId: WorkflowStageId) {
  return workflowStages.find((s) => s.id === stageId)?.label ?? stageId;
}

function isOverdue(item: WorkflowItem) {
  const due = dayjs(item.dueDate);
  return item.stageId !== "done" && due.isValid() && due.isBefore(dayjs(), "day");
}

function formatDue(iso: string) {
  const d = dayjs(iso);
  if (!d.isValid()) return "-";
  return d.format("DD MMM YYYY");
}

function StatTile({
  label,
  value,
  helper,
  tone,
  icon,
}: {
  label: string;
  value: string | number;
  helper: string;
  tone: "slate" | "blue" | "green" | "orange" | "red" | "teal";
  icon: any;
}) {
  const palette =
    tone === "red"
      ? { bg: "rgba(239,68,68,0.10)", fg: "#dc2626" }
      : tone === "orange"
        ? { bg: "rgba(249,115,22,0.12)", fg: "#ea580c" }
        : tone === "green"
          ? { bg: "rgba(34,197,94,0.12)", fg: "#16a34a" }
          : tone === "blue"
            ? { bg: "rgba(59,130,246,0.12)", fg: "#2563eb" }
            : tone === "teal"
              ? { bg: "rgba(20,184,166,0.12)", fg: "#0f766e" }
              : { bg: "rgba(2,6,23,0.08)", fg: "#0f172a" };

  return (
    <AdCard
      animate={false}
      sx={{
        backgroundColor: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(2,6,23,0.08)",
        boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
        height: "100%",
        minHeight: 132,
      }}
      contentSx={{ p: 2, height: "100%" }}
    >
      <Stack spacing={1} sx={{ height: "100%" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              bgcolor: palette.bg,
              color: palette.fg,
            }}
          >
            {icon}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>
            {helper}
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.2 }}>
          {value}
        </Typography>
        <Box sx={{ flex: 1 }} />
      </Stack>
    </AdCard>
  );
}

export default function WorkflowDashboard({ currentUser }: { currentUser?: string }) {
  const [items, setItems] = useState<WorkflowItem[]>(() => createDummyWorkflowItems());
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<WorkflowStageId | "all">("all");
  const [assignee, setAssignee] = useState<string>("all");

  const assignees = useMemo(() => {
    const set = new Set(items.map((i) => i.assignee).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (stage !== "all" && it.stageId !== stage) return false;
      if (assignee !== "all" && it.assignee !== assignee) return false;
      if (!q) return true;
      const hay = `${it.refNo} ${it.title} ${it.module} ${it.assignee} ${it.tags.join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, stage, assignee]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const inProgress = filtered.filter((i) => i.stageId !== "done").length;
    const done = filtered.filter((i) => i.stageId === "done").length;
    const blocked = filtered.filter((i) => i.status === "Blocked").length;
    const overdue = filtered.filter((i) => isOverdue(i)).length;
    const dueSoon = filtered.filter((i) => {
      if (i.stageId === "done") return false;
      const d = dayjs(i.dueDate);
      if (!d.isValid()) return false;
      return d.isSame(dayjs(), "day") || d.isBefore(dayjs().add(2, "day"), "day");
    }).length;
    return { total, inProgress, done, blocked, overdue, dueSoon };
  }, [filtered]);

  const byStage = useMemo(() => {
    const map = new Map<WorkflowStageId, WorkflowItem[]>();
    for (const s of workflowStages) map.set(s.id, []);
    for (const it of filtered) map.get(it.stageId)?.push(it);
    for (const [k, arr] of map) {
      arr.sort((a, b) => {
        const prioRank: Record<WorkflowPriority, number> = {
          Critical: 4,
          High: 3,
          Medium: 2,
          Low: 1,
        };
        const p = prioRank[b.priority] - prioRank[a.priority];
        if (p !== 0) return p;
        return dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf();
      });
      map.set(k, arr);
    }
    return map;
  }, [filtered]);

  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.75}>
        <Typography variant="h5" fontWeight={900}>
          Workflow Management (Dummy Data)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track work items across stages, WIP limits, priorities, and due dates.
        </Typography>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "repeat(3, minmax(0, 1fr))",
            lg: "repeat(6, minmax(0, 1fr))",
          },
          gap: 2,
          alignItems: "stretch",
        }}
      >
        <StatTile
          label="Total Items"
          value={stats.total}
          helper="In current filters"
          tone="slate"
          icon={<FormatListBulletedIcon fontSize="small" />}
        />
        <StatTile
          label="In Progress"
          value={stats.inProgress}
          helper="Not done"
          tone="blue"
          icon={<TimelapseIcon fontSize="small" />}
        />
        <StatTile
          label="Done"
          value={stats.done}
          helper="Completed"
          tone="green"
          icon={<DoneAllIcon fontSize="small" />}
        />
        <StatTile
          label="Due Soon"
          value={stats.dueSoon}
          helper="Today + next 2 days"
          tone="teal"
          icon={<EventAvailableIcon fontSize="small" />}
        />
        <StatTile
          label="Blocked"
          value={stats.blocked}
          helper="Needs attention"
          tone="orange"
          icon={<BlockIcon fontSize="small" />}
        />
        <StatTile
          label="Overdue"
          value={stats.overdue}
          helper="Due date crossed"
          tone="red"
          icon={<EventBusyIcon fontSize="small" />}
        />
      </Box>

      <AdCard
        animate={false}
        sx={{ backgroundColor: "rgba(255,255,255,0.72)", backdropFilter: "blur(10px)" }}
        contentSx={{ p: 2 }}
      >
        <WorkflowCharts items={filtered} />
      </AdCard>

      <AdCard
        title="Work Board"
        subtitle="Move items between stages (no drag-drop; use arrows)."
        animate={false}
        sx={{ backgroundColor: "rgba(255,255,255,0.72)", backdropFilter: "blur(10px)" }}
        contentSx={{ p: 2 }}
        headerRight={
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <TextField
              size="small"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search (ref/title/tag)…"
              sx={{ minWidth: { xs: "100%", sm: 220 } }}
            />
            <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 160 } }}>
              <InputLabel id="wf-stage-label">Stage</InputLabel>
              <Select
                labelId="wf-stage-label"
                label="Stage"
                value={stage}
                onChange={(e) => setStage(e.target.value as any)}
              >
                <MenuItem value="all">All</MenuItem>
                {workflowStages.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 170 } }}>
              <InputLabel id="wf-assignee-label">Assignee</InputLabel>
              <Select
                labelId="wf-assignee-label"
                label="Assignee"
                value={assignee}
                onChange={(e) => setAssignee(String(e.target.value))}
              >
                <MenuItem value="all">All</MenuItem>
                {assignees.map((a) => (
                  <MenuItem key={a} value={a}>
                    {a}
                  </MenuItem>
                ))}
                {currentUser && !assignees.includes(currentUser) && (
                  <MenuItem value={currentUser}>{currentUser}</MenuItem>
                )}
              </Select>
            </FormControl>
          </Stack>
        }
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "repeat(3, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
              xl: "repeat(6, minmax(0, 1fr))",
            },
            gap: 2,
            alignItems: "stretch",
          }}
        >
          {workflowStages.map((s) => {
            const stageItems = byStage.get(s.id) ?? [];
            const overWip = s.wipLimit ? stageItems.length > s.wipLimit : false;
            return (
              <Box
                key={s.id}
                sx={{
                  minWidth: 0,
                  borderRadius: 3,
                  border: "1px solid rgba(2,6,23,0.10)",
                  bgcolor: "rgba(255,255,255,0.78)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ px: 1.5, py: 1.25, borderBottom: "1px solid rgba(2,6,23,0.08)" }}
                >
                  <Stack spacing={0.1} sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Typography variant="subtitle2" fontWeight={900} noWrap sx={{ minWidth: 0 }}>
                        {s.label}
                      </Typography>
                      {s.id === "done" ? (
                        <CheckCircleIcon fontSize="small" color="success" />
                      ) : overWip ? (
                        <Tooltip title={`WIP limit ${s.wipLimit} exceeded`}>
                          <WarningAmberIcon fontSize="small" color="warning" />
                        </Tooltip>
                      ) : null}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {stageItems.length}
                      {s.wipLimit ? ` / ${s.wipLimit}` : ""} items
                    </Typography>
                  </Stack>
                  <Chip size="small" label={s.id.toUpperCase()} variant="outlined" />
                </Stack>

                <Stack spacing={1} sx={{ p: 1.25, flex: 1, minHeight: 140 }}>
                  {stageItems.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">
                      No items
                    </Typography>
                  ) : (
                    stageItems.map((it) => (
                      <Box
                        key={it.id}
                        sx={{
                          p: 1.25,
                          borderRadius: 2.5,
                          border: "1px solid rgba(2,6,23,0.10)",
                          bgcolor: isOverdue(it) ? "rgba(239,68,68,0.06)" : "rgba(2,6,23,0.02)",
                        }}
                      >
                        <Stack spacing={0.75}>
                          <Stack direction="row" justifyContent="space-between" spacing={1}>
                            <Typography variant="body2" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                              {it.title}
                            </Typography>
                            <Stack direction="row" spacing={0.25} alignItems="center">
                              <Tooltip title="Move left">
                                <span>
                                  <IconButton
                                    size="small"
                                    disabled={!canMoveStage(it.stageId, "prev")}
                                    onClick={() => setItems((x) => moveItemStage(x, it.id, "prev"))}
                                  >
                                    <ArrowBackIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Move right">
                                <span>
                                  <IconButton
                                    size="small"
                                    disabled={!canMoveStage(it.stageId, "next")}
                                    onClick={() => setItems((x) => moveItemStage(x, it.id, "next"))}
                                  >
                                    <ArrowForwardIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Stack>
                          </Stack>

                          <Stack direction="row" spacing={0.75} flexWrap="wrap" alignItems="center">
                            <Chip size="small" label={it.refNo} variant="outlined" />
                            <Chip size="small" label={it.module} variant="outlined" />
                            <Chip size="small" label={it.priority} color={priorityColor(it.priority)} />
                            <Chip size="small" label={it.status} color={statusColor(it.status)} />
                            {isOverdue(it) && <Chip size="small" label="Overdue" color="error" />}
                          </Stack>

                          <Stack direction="row" spacing={1} justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">
                              Assignee: <b>{it.assignee}</b>
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Due: <b>{formatDue(it.dueDate)}</b>
                            </Typography>
                          </Stack>

                          {it.blockedReason && (
                            <Typography variant="caption" color="error">
                              {it.blockedReason}
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    ))
                  )}
                </Stack>
              </Box>
            );
          })}
        </Box>
      </AdCard>

      <AdCard
        title="Work Queue"
        subtitle="Compact table view (exportable) of all items."
        animate={false}
        sx={{ backgroundColor: "rgba(255,255,255,0.72)", backdropFilter: "blur(10px)" }}
        contentSx={{ p: 2 }}
      >
        <AdGrid
          rows={filtered.map((r) => ({ id: r.id, ...r }))}
          columns={[
            { field: "refNo", headerName: "Ref", width: 120 },
            { field: "title", headerName: "Title", flex: 1, minWidth: 260 },
            { field: "module", headerName: "Module", width: 150 },
            {
              field: "stageId",
              headerName: "Stage",
              width: 160,
              valueGetter: (p) => stageLabel(p.value as any),
            },
            {
              field: "priority",
              headerName: "Priority",
              width: 120,
              renderCell: (p) => (
                <Chip size="small" label={String(p.value)} color={priorityColor(p.value as any)} />
              ),
              sortable: false,
              filterable: false,
            },
            {
              field: "status",
              headerName: "Status",
              width: 120,
              renderCell: (p) => (
                <Chip size="small" label={String(p.value)} color={statusColor(p.value as any)} />
              ),
              sortable: false,
              filterable: false,
            },
            { field: "assignee", headerName: "Assignee", width: 130 },
            {
              field: "dueDate",
              headerName: "Due",
              width: 130,
              valueGetter: (p) => formatDue(String(p.value)),
            },
          ]}
          showToolbar
          showExport
          exportFileName="Workflow-Queue"
          pdfBrandingText="SIS Global"
          pdfTitle="Workflow Queue"
          disableColumnMenu
          sx={{
            border: "1px solid rgba(2,6,23,0.08)",
            borderRadius: 2,
            backgroundColor: "rgba(255,255,255,0.92)",
          }}
        />
      </AdCard>
    </Stack>
  );
}
