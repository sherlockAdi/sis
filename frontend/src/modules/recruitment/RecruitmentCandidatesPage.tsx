import { useEffect, useMemo, useState } from "react";
import { Chip, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import { useNavigate } from "react-router-dom";
import { AdAlertBox, AdButton, AdCard, AdPagingGrid, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { recruitmentApi, type CandidateRow } from "../../common/services/recruitmentApi";

export default function RecruitmentCandidatesPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({ open: false, message: "", severity: "success" });

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await recruitmentApi.candidates.list());
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const cols = useMemo(
    () => [
      { field: "candidate_code", headerName: "Code", width: 130 },
      {
        field: "__name",
        headerName: "Candidate",
        flex: 1,
        minWidth: 220,
        valueGetter: (...args: any[]) => {
          const row = (args?.[0] as any)?.row ?? args?.[1] ?? {};
          return `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
        },
      },
      { field: "phone", headerName: "Mobile", width: 150 },
      { field: "email", headerName: "Email", flex: 1, minWidth: 240 },
      { field: "country_name", headerName: "Country", width: 140 },
      { field: "state_name", headerName: "State", width: 140 },
      { field: "city_name", headerName: "City", width: 140 },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: (p: any) => <Chip size="small" label={String(p.value ?? "") || "-"} />,
      },
      { field: "created_at", headerName: "Created At", width: 170 },
      {
        field: "__actions",
        headerName: "Actions",
        width: 220,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const r = p.row as CandidateRow;
          return (
            <Stack direction="row" spacing={1}>
              <AdButton variant="text" startIcon={<EditIcon fontSize="small" />} onClick={() => navigate(`/portal/recruitment/candidates/${r.candidate_id}`)}>
                Edit
              </AdButton>
              <AdButton
                variant="text"
                color="error"
                startIcon={<DeleteOutlineIcon fontSize="small" />}
                onClick={async () => {
                  try {
                    await recruitmentApi.candidates.disable(r.candidate_id);
                    setToast({ open: true, message: "Candidate disabled", severity: "success" });
                    refresh();
                  } catch (e: any) {
                    setToast({ open: true, message: (e as ApiError)?.message ?? "Failed", severity: "error" });
                  }
                }}
              >
                Disable
              </AdButton>
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

      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={1.5}>
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={900}>
            Candidates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Registration and profile management
          </Typography>
        </Stack>
        <AdButton startIcon={<AddIcon fontSize="small" />} onClick={() => navigate("/portal/recruitment/candidates/new")}>
          Add Candidate
        </AdButton>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <AdPagingGrid
          rows={rows.map((r) => ({ id: r.candidate_id, ...r }))}
          columns={cols as any}
          loading={loading}
          showExport={false}
          disableColumnMenu
          height={540}
          defaultPageSize={10}
        />
      </AdCard>
    </Stack>
  );
}
