import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { AdAlertBox, AdCard, AdGrid, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { associatePortalApi, type AssociateApplicationRow } from "../../common/services/associatePortalApi";
import { recruitmentApi, type ApplicationInterviewRow } from "../../common/services/recruitmentApi";

type AssociateInterviewRow = ApplicationInterviewRow & {
  candidate_id: number;
  candidate_name: string;
  job_id: number;
  job_title: string;
  application_status: string | null;
};

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function interviewColor(value: string | null | undefined): any {
  const s = normalizeStatus(value);
  if (s.includes("postpon")) return "warning";
  if (s.includes("reject") || s.includes("cancel")) return "error";
  if (s.includes("select") || s.includes("pass") || s.includes("ready")) return "success";
  if (s.includes("short")) return "primary";
  if (s.includes("interview")) return "secondary";
  return "default";
}

export default function AssociateInterviewProcessPage() {
  const [rows, setRows] = useState<AssociateInterviewRow[]>([]);
  const [applications, setApplications] = useState<AssociateApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const apps = await associatePortalApi.applications.list();
      setApplications(apps);

      const interviewLists = await Promise.all(
        apps.map(async (app) => {
          const interviews = await recruitmentApi.applications.interviews(app.application_id);
          return interviews.map<AssociateInterviewRow>((item) => ({
            ...item,
            candidate_id: app.candidate_id,
            candidate_name: app.candidate_name,
            job_id: app.job_id,
            job_title: app.job_title,
            application_status: app.status,
          }));
        }),
      );

      setRows(interviewLists.flat());
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load interview history");
      setRows([]);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const counts = useMemo(() => {
    const total = rows.length;
    const interview = rows.filter((r) => normalizeStatus(r.result).includes("interview") || normalizeStatus(r.remarks).includes("interview")).length;
    const postponed = rows.filter((r) => normalizeStatus(r.result).includes("postpon") || normalizeStatus(r.remarks).includes("postpon")).length;
    const selected = rows.filter((r) => normalizeStatus(r.result).includes("select") || normalizeStatus(r.result).includes("pass")).length;
    return { total, interview, postponed, selected };
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (selectedStatus === "all") return rows;
    return rows.filter((r) => {
      const s = normalizeStatus(r.result) || normalizeStatus(r.remarks) || normalizeStatus(r.mode_name);
      if (selectedStatus === "selected") return s.includes("select") || s.includes("pass");
      if (selectedStatus === "postponed") return s.includes("postpon");
      if (selectedStatus === "interview") return s.includes("interview");
      return true;
    });
  }, [rows, selectedStatus]);

  const statusOptions = useMemo(
    () => [
      { key: "all", label: `All (${counts.total})` },
      { key: "interview", label: `Interviewed (${counts.interview})` },
      { key: "postponed", label: `Postponed (${counts.postponed})` },
      { key: "selected", label: `Selected (${counts.selected})` },
    ],
    [counts],
  );

  const columns = useMemo(
    () => [
      { field: "candidate_name", headerName: "Candidate", flex: 1, minWidth: 180 },
      { field: "job_title", headerName: "Job", flex: 1, minWidth: 220 },
      { field: "application_id", headerName: "App ID", width: 100 },
      { field: "mode_name", headerName: "Mode", width: 140 },
      { field: "interview_date", headerName: "Interview Date", width: 180 },
      {
        field: "result",
        headerName: "Result",
        width: 140,
        renderCell: (p: any) => {
          const value = String(p.value ?? "").trim();
          return <Chip size="small" label={value || "—"} color={interviewColor(value)} />;
        },
      },
      { field: "remarks", headerName: "Remarks", flex: 1, minWidth: 220 },
      {
        field: "application_status",
        headerName: "Application Status",
        width: 160,
        renderCell: (p: any) => <Chip size="small" label={String(p.value ?? "—")} variant="outlined" />,
      },
    ],
    [],
  );

  return (
    <Stack spacing={2.5} sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden", minWidth: 0 }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack spacing={0.25}>
        <Typography variant="h5" fontWeight={900}>
          Interview Process
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Show interviews of candidates submitted through the associate partner flow.
        </Typography>
      </Stack>

      {error ? <AdAlertBox severity="error" title="Error" message={error} /> : null}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.76)", minWidth: 0 }} contentSx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {statusOptions.map((opt) => (
              <Chip
                key={opt.key}
                clickable
                label={opt.label}
                color={selectedStatus === opt.key ? "primary" : "default"}
                variant={selectedStatus === opt.key ? "filled" : "outlined"}
                onClick={() => setSelectedStatus(opt.key)}
              />
            ))}
          </Box>

          <AdGrid
            rows={filteredRows.map((r) => ({ id: r.interview_id, ...r }))}
            columns={columns as any}
            loading={loading}
            showExport={false}
            disableColumnMenu
            sx={{ minWidth: 0 }}
          />
        </Stack>
      </AdCard>

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.76)", minWidth: 0 }} contentSx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={900} sx={{ mb: 0.5 }}>
          Applications Covered
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          This list includes interviews from {applications.length} associate applications.
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {applications.slice(0, 12).map((app) => (
            <Chip
              key={app.application_id}
              label={`${app.candidate_name} • ${app.job_title}`}
              variant="outlined"
              size="small"
            />
          ))}
        </Box>
      </AdCard>
    </Stack>
  );
}
