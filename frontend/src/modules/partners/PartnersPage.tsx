import { useEffect, useMemo, useState } from "react";
import { Chip, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import { useNavigate } from "react-router-dom";
import { AdAlertBox, AdButton, AdCard, AdGrid, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { partnersApi, type PartnerRow } from "../../common/services/partnersApi";

export default function PartnersPage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({ open: false, message: "", severity: "success" });
  const [rows, setRows] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setRows(await partnersApi.list(true));
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(apiErr?.message ?? "Failed to load employers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const cols = useMemo(
    () => [
      { field: "partner_code", headerName: "Employer Code", width: 140 },
      { field: "partner_name", headerName: "Employer", flex: 1, minWidth: 220 },
      { field: "country_name", headerName: "Country", width: 140 },
      { field: "state_name", headerName: "State", width: 140 },
      { field: "city_name", headerName: "City", width: 140 },
      { field: "contact_name", headerName: "Contact", width: 160 },
      { field: "phone", headerName: "Phone", width: 140 },
      { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
      { field: "cr_licence_number", headerName: "CR/Licence No.", width: 160 },
      { field: "website", headerName: "Website", flex: 1, minWidth: 180 },
      { field: "username", headerName: "Username", width: 140 },
      {
        field: "status",
        headerName: "Status",
        width: 110,
        renderCell: (p: any) => (
          <Chip size="small" label={Number(p.value) ? "Active" : "Inactive"} color={Number(p.value) ? "success" : "default"} />
        ),
      },
      { field: "created_at", headerName: "Created At", width: 170 },
      { field: "updated_at", headerName: "Updated At", width: 170 },
      {
        field: "__actions",
        headerName: "Actions",
        width: 220,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const r = p.row as PartnerRow;
          return (
            <Stack direction="row" spacing={1}>
              <AdButton variant="text" startIcon={<EditIcon fontSize="small" />} onClick={() => navigate(`/portal/partners/${r.partner_id}`)}>
                Edit
              </AdButton>
              <AdButton
                variant="text"
                color="error"
                startIcon={<DeleteOutlineIcon fontSize="small" />}
                onClick={async () => {
                  try {
                    await partnersApi.disable(r.partner_id);
                    setToast({ open: true, message: "Employer disabled", severity: "success" });
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
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={1.5}
        sx={{ width: "100%", maxWidth: "100%", pr: 1, flexWrap: "wrap" }}
      >
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={900}>
            Employer Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create employer accounts and manage status
          </Typography>
        </Stack>
        <AdButton
          startIcon={<AddIcon fontSize="small" />}
          onClick={() => navigate("/portal/partners/new")}
          sx={{ alignSelf: { xs: "stretch", md: "center" }, maxWidth: { xs: "100%", md: "fit-content" } }}
        >
          Add Employer
        </AdButton>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)", minWidth: 0 }} contentSx={{ p: 2 }}>
        <AdGrid rows={rows.map((r) => ({ id: r.partner_id, ...r }))} columns={cols as any} loading={loading} showExport={false} disableColumnMenu />
      </AdCard>
    </Stack>
  );
}
