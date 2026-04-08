import { useEffect, useMemo, useState } from "react";
import { Chip, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { AdAlertBox, AdButton, AdCard, AdGrid, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { jobsApi, type JobListRow } from "../../common/services/jobsApi";

export default function JobsPage() {
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const [rows, setRows] = useState<JobListRow[]>([]);
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
      setRows(await jobsApi.list());
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(apiErr?.message ?? "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const cols = useMemo(
    () => [
      { field: "job_code", headerName: "Code", width: 110 },
      { field: "job_title", headerName: "Title", flex: 1.2, minWidth: 160 },
      { field: "partner_name", headerName: "Partner", flex: 0.9, minWidth: 160 },
      { field: "category_name", headerName: "Category", flex: 0.9, minWidth: 140 },
      { field: "country_name", headerName: "Country", flex: 0.9, minWidth: 140 },
      { field: "vacancy", headerName: "Vacancy", width: 90 },
      {
        field: "status",
        headerName: "Status",
        width: 100,
        renderCell: (p: any) => (
          <Chip
            size="small"
            label={String(p.value ?? "")}
            color={String(p.value ?? "").toLowerCase() === "open" ? "success" : "default"}
          />
        ),
      },
      {
        field: "__actions",
        headerName: "Actions",
        width: 180,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const r = p.row as JobListRow;
          return (
            <Stack direction="row" spacing={1}>
              <AdButton variant="text" startIcon={<EditIcon fontSize="small" />} onClick={() => navigate(`/portal/jobs/${r.job_id}`)}>
                Edit
              </AdButton>
              <AdButton
                variant="text"
                color="error"
                startIcon={<DeleteIcon fontSize="small" />}
                onClick={async () => {
                  try {
                    await jobsApi.remove(r.job_id);
                    setToast({ open: true, message: "Job deleted", severity: "success" });
                    refresh();
                  } catch (e: any) {
                    setToast({ open: true, message: (e as ApiError)?.message ?? "Failed", severity: "error" });
                  }
                }}
              >
                Delete
              </AdButton>
            </Stack>
          );
        },
      },
    ],
    [navigate],
  );

  const jobVisibility = useMemo(
    () => ({
      country_name: !isMdDown,
      category_name: !isMdDown,
      partner_name: !isMdDown,
      job_code: !isSmDown,
    }),
    [isMdDown, isSmDown],
  );

  return (
    <Stack spacing={2.5} sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden", minWidth: 0 }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={1.5}
        sx={{ width: "100%", maxWidth: "100%", pr: 1, flexWrap: "wrap" }}
      >
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={900}>
            Job Postings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage job openings
          </Typography>
        </Stack>
        <AdButton
          startIcon={<AddIcon fontSize="small" />}
          onClick={() => navigate("/portal/jobs/new")}
          sx={{ alignSelf: { xs: "stretch", md: "center" }, maxWidth: { xs: "100%", md: "fit-content" } }}
        >
          Add Job
        </AdButton>
      </Stack>
      {error && <AdAlertBox severity="error" title="Error" message={error} />}
      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)", minWidth: 0 }} contentSx={{ p: 2 }}>
        <AdGrid
          rows={rows.map((r) => ({ id: r.job_id, ...r }))}
          columns={cols as any}
          loading={loading}
          showExport={false}
          disableColumnMenu
          columnVisibilityModel={jobVisibility as any}
          sx={{ minWidth: 0 }}
        />
      </AdCard>
    </Stack>
  );
}
