import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { AdAlertBox, AdButton, AdCard, AdDropDown, AdGrid, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { candidateApi, type CandidateApplicationRow } from "../../common/services/candidateApi";

function normStatus(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

export default function CandidateApplicationsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<CandidateApplicationRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
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
      setRows(await candidateApi.applications.list());
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const statusOptions = useMemo(() => {
    const unique = Array.from(
      new Set(rows.map((r) => String(r.status ?? "").trim()).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
    return [{ label: "All statuses", value: "" }].concat(unique.map((s) => ({ label: s, value: s })));
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!statusFilter) return rows;
    const wanted = normStatus(statusFilter);
    return rows.filter((r) => normStatus(r.status) === wanted);
  }, [rows, statusFilter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const applied = rows.filter((r) => normStatus(r.status) === "applied").length;
    const draft = rows.filter((r) => normStatus(r.status) === "draft").length;
    const other = total - applied - draft;
    return { total, applied, draft, other };
  }, [rows]);

  const cols = useMemo(
    () => [
      { field: "application_id", headerName: "App ID", width: 110 },
      { field: "job_title", headerName: "Job", flex: 1, minWidth: 260 },
      { field: "job_code", headerName: "Job Code", width: 130 },
      { field: "application_date", headerName: "Date", width: 130 },
      {
        field: "status",
        headerName: "Status",
        width: 140,
        renderCell: (p: any) => {
          const v = String(p.value ?? "");
          const k = normStatus(v);
          const color: any = k === "applied" ? "success" : k === "draft" ? "warning" : "default";
          return <Chip size="small" label={v} color={color} />;
        },
      },
      {
        field: "__actions",
        headerName: "",
        width: 240,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const r = p.row as CandidateApplicationRow;
          const k = normStatus(r.status);
          const isApplied = k === "applied";
          return (
            <Stack direction="row" spacing={0.75}>
              <AdButton variant="text" onClick={() => navigate(`/portal/candidate/applications/${r.application_id}`)}>
                View
              </AdButton>
              <AdButton variant="text" onClick={() => navigate(`/portal/candidate/jobs/${r.job_id}/apply`)}>
                {isApplied ? "View Job" : "Continue"}
              </AdButton>
            </Stack>
          );
        },
      },
    ],
    [],
  );

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack spacing={0.25}>
        <Typography variant="h5" fontWeight={900}>
          My Applications
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track your job applications.
        </Typography>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.25 }}>
        {[
          { t: "Total", v: stats.total },
          { t: "Applied", v: stats.applied },
          { t: "Draft", v: stats.draft },
          { t: "Other", v: stats.other },
        ].map((x) => (
          <AdCard key={x.t} animate={false} contentSx={{ p: 1.5 }} sx={{ backgroundColor: "rgba(255,255,255,0.72)", borderRadius: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {x.t}
            </Typography>
            <Typography variant="h6" fontWeight={950}>
              {x.v}
            </Typography>
          </AdCard>
        ))}
      </Box>

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }} justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Box sx={{ width: { xs: "100%", md: 260 } }}>
            <AdDropDown label="Status" options={statusOptions} value={statusFilter} onChange={(v) => setStatusFilter(String(v))} />
          </Box>
          <Stack direction="row" spacing={1}>
            <AdButton variant="secondary" onClick={() => refresh()} loading={loading}>
              Refresh
            </AdButton>
          </Stack>
        </Stack>

        <AdGrid
          rows={filteredRows.map((r) => ({ id: r.application_id, ...r }))}
          columns={cols as any}
          loading={loading}
          showToolbar
          showExport={false}
          disableColumnMenu
          onRowClick={(p: any) => navigate(`/portal/candidate/applications/${p.row.application_id}`)}
          sx={{ minHeight: 420 }}
        />
      </AdCard>
    </Stack>
  );
}
