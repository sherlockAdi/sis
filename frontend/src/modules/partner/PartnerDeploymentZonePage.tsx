import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Divider, IconButton, Stack, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import HistoryIcon from "@mui/icons-material/History";
import { useNavigate } from "react-router-dom";
import { AdAlertBox, AdButton, AdCard, AdGrid, AdModal, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { deploymentApi, type DeploymentHistoryRow, type DeploymentRow } from "../../common/services/deploymentApi";
import { partnerPortalApi, type PartnerApplicationRow } from "../../common/services/partnersApi";

const stages = ["Ready", "Offered", "Visa Processing", "Biometrics", "Visa Approved", "Travel Booked", "Deployed"] as const;

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

type PartnerDeploymentRow = DeploymentRow & {
  application_status: string | null;
};

export default function PartnerDeploymentZonePage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<PartnerApplicationRow[]>([]);
  const [deployments, setDeployments] = useState<DeploymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<PartnerDeploymentRow | null>(null);
  const [history, setHistory] = useState<DeploymentHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [apps, deps] = await Promise.all([partnerPortalApi.applications.list(), deploymentApi.list()]);
      setApplications(apps);
      setDeployments(deps);
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load deployment zone");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const appById = useMemo(() => {
    const map = new Map<number, PartnerApplicationRow>();
    for (const app of applications) map.set(app.application_id, app);
    return map;
  }, [applications]);

  const rows = useMemo(() => {
    return deployments
      .map((dep) => {
        const app = appById.get(dep.application_id);
        if (!app) return null;
        return {
          ...dep,
          application_status: app.status,
        };
      })
      .filter(Boolean) as PartnerDeploymentRow[];
  }, [appById, deployments]);

  const visibleRows = useMemo(
    () =>
      rows
        .filter((row) => {
          const s = normalizeStatus(row.current_status);
          return s === "ready" || s === "offered" || s === "visa processing" || s === "biometrics" || s === "visa approved" || s === "travel booked" || s === "deployed";
        })
        .sort((a, b) => b.deployment_id - a.deployment_id),
    [rows],
  );

  const stats = useMemo(() => {
    const total = visibleRows.length;
    const byStage = stages.map((stage) => ({
      stage,
      count: visibleRows.filter((row) => normalizeStatus(row.current_status) === normalizeStatus(stage)).length,
    }));
    return { total, byStage };
  }, [visibleRows]);

  const openHistory = async (row: PartnerDeploymentRow) => {
    setActiveRow(row);
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      setHistory(await deploymentApi.history(row.deployment_id));
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load deployment history", severity: "error" });
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const cols = useMemo(
    () => [
      { field: "deployment_id", headerName: "ID", width: 80 },
      { field: "candidate_name", headerName: "Candidate", flex: 1, minWidth: 170 },
      { field: "job_title", headerName: "Job", flex: 1, minWidth: 180 },
      {
        field: "current_status",
        headerName: "Status",
        width: 150,
        renderCell: (p: any) => <Chip size="small" label={String(p.value ?? "")} color={normalizeStatus(p.value) === "deployed" ? "success" : "default"} />,
      },
      { field: "visa_type_name", headerName: "Visa", width: 140 },
      { field: "remarks", headerName: "Remarks", flex: 1, minWidth: 180 },
      {
        field: "__actions",
        headerName: "Actions",
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const r = p.row as PartnerDeploymentRow;
          return (
            <Stack direction="row" spacing={0.5}>
              <IconButton aria-label="Open candidate profile" size="small" onClick={() => navigate(`/portal/partner/applicants/${r.candidate_id}`)}>
                <OpenInNewIcon fontSize="small" />
              </IconButton>
              <IconButton aria-label="View deployment history" size="small" onClick={() => openHistory(r)}>
                <HistoryIcon fontSize="small" />
              </IconButton>
            </Stack>
          );
        },
      },
    ],
    [navigate],
  );

  return (
    <Stack spacing={2.5} sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden", minWidth: 0 }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      <Stack spacing={0.25}>
        <Typography variant="h5" fontWeight={900}>
          Deployment Zone
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track ready, visa, travel, and deployed candidates for your jobs.
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: "100%" }}>
        <AdButton variant="outlined" onClick={() => navigate("/portal/partner/deployment-zone/trade-tests")}>
          Trade Tests
        </AdButton>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
        <AdCard animate={false} contentSx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Total Deployments
          </Typography>
          <Typography variant="h4" fontWeight={950}>
            {stats.total}
          </Typography>
        </AdCard>
        <AdCard animate={false} contentSx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Ready for Deployment
          </Typography>
          <Typography variant="h4" fontWeight={950}>
            {stats.byStage.find((x) => x.stage === "Ready")?.count ?? 0}
          </Typography>
        </AdCard>
        <AdCard animate={false} contentSx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Deployed
          </Typography>
          <Typography variant="h4" fontWeight={950}>
            {stats.byStage.find((x) => x.stage === "Deployed")?.count ?? 0}
          </Typography>
        </AdCard>
      </Box>

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <AdGrid
          rows={visibleRows.map((r) => ({ id: r.deployment_id, ...r }))}
          columns={cols as any}
          loading={loading}
          disableColumnMenu
          sx={{ minWidth: 0 }}
        />
      </AdCard>

      <AdModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Deployment Record"
        actions={
          <Stack direction="row" justifyContent="flex-end" sx={{ width: "100%" }}>
            <AdButton variant="text" onClick={() => setHistoryOpen(false)}>
              Close
            </AdButton>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <Box>
            <Typography fontWeight={900}>{activeRow?.candidate_name ?? "Candidate"}</Typography>
            <Typography variant="body2" color="text.secondary">
              {activeRow?.job_title ?? "—"} • {activeRow?.current_status ?? "—"}
            </Typography>
          </Box>
          <Divider />
          <Box>
            <Typography fontWeight={900} sx={{ mb: 1 }}>
              Status History
            </Typography>
            {historyLoading ? (
              <Typography variant="body2" color="text.secondary">
                Loading history...
              </Typography>
            ) : history.length ? (
              <Stack spacing={1}>
                {history.map((item) => (
                  <Box key={item.id} sx={{ p: 1.5, border: "1px solid rgba(226,232,240,0.85)", borderRadius: 2 }}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Box>
                        <Typography fontWeight={800}>{item.status}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.changed_at}
                        </Typography>
                      </Box>
                      {item.remarks ? <Chip size="small" label={item.remarks} /> : null}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : (
              <AdAlertBox severity="info" title="No history yet" message="No deployment history records found for this candidate." />
            )}
          </Box>
        </Stack>
      </AdModal>
    </Stack>
  );
}
