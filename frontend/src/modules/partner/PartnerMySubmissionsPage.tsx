import { useEffect, useMemo, useState } from "react";
import { Chip, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useNavigate } from "react-router-dom";
import { AdAlertBox, AdButton, AdCard, AdGrid, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { partnerPortalApi, type PartnerApplicationRow } from "../../common/services/partnersApi";

export default function PartnerMySubmissionsPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const [rows, setRows] = useState<PartnerApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setRows(await partnerPortalApi.applications.list());
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(apiErr?.message ?? "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const cols = useMemo(
    () => [
      { field: "application_id", headerName: "App ID", width: 100 },
      { field: "candidate_name", headerName: "Candidate", flex: 1, minWidth: 180 },
      { field: "job_title", headerName: "Job", flex: 1, minWidth: 220 },
      { field: "application_date", headerName: "Date", width: 130 },
      {
        field: "status",
        headerName: "Status",
        width: 140,
        renderCell: (p: any) => <Chip size="small" label={String(p.value ?? "")} />,
      },
      { field: "phone", headerName: "Phone", width: 140 },
      { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
      {
        field: "__actions",
        headerName: "Actions",
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const r = p.row as PartnerApplicationRow;
          return (
            <AdButton
              variant="text"
              startIcon={<OpenInNewIcon fontSize="small" />}
              onClick={() => navigate(`/portal/partner/applicants/${r.candidate_id}`)}
            >
              View
            </AdButton>
          );
        },
      },
    ],
    [navigate],
  );

  const visibility = useMemo(
    () => ({
      phone: !isSmDown,
      email: !isMdDown,
    }),
    [isMdDown, isSmDown],
  );

  return (
    <Stack spacing={2.5} sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden", minWidth: 0 }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      <Stack spacing={0.25}>
        <Typography variant="h5" fontWeight={900}>
          Applied Candidate List
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Candidates who applied to your jobs
        </Typography>
      </Stack>
      {error && <AdAlertBox severity="error" title="Error" message={error} />}
      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)", minWidth: 0 }} contentSx={{ p: 2 }}>
        <AdGrid
          rows={rows.map((r) => ({ id: r.application_id, ...r }))}
          columns={cols as any}
          loading={loading}
          showExport={false}
          disableColumnMenu
          columnVisibilityModel={visibility as any}
          sx={{ minWidth: 0 }}
        />
      </AdCard>
    </Stack>
  );
}
