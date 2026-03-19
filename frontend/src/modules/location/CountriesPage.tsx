import { useEffect, useMemo, useState } from "react";
import { Chip, Stack, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import BlockIcon from "@mui/icons-material/Block";
import { AdAlertBox, AdButton, AdCard, AdModal, AdNotification, AdTextBox, AdGrid } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import {
  createCountry,
  disableCountry,
  listCountries,
  updateCountry,
  type Country,
} from "../../common/services/locationApi";

type CountryForm = {
  country_id?: number;
  country_name: string;
  country_code: string;
  iso_code: string;
};

export default function CountriesPage() {
  const [rows, setRows] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CountryForm>({ country_name: "", country_code: "", iso_code: "" });

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await listCountries(true);
      setRows(data);
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(apiErr?.message ?? "Failed to load countries");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const cols = useMemo(
    () => [
      { field: "country_name", headerName: "Country", flex: 1, minWidth: 220 },
      { field: "country_code", headerName: "Code", width: 110 },
      { field: "iso_code", headerName: "ISO", width: 110 },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: (p: any) => (
          <Chip size="small" label={Number(p.value) ? "Active" : "Disabled"} color={Number(p.value) ? "success" : "default"} />
        ),
      },
      {
        field: "__actions",
        headerName: "Actions",
        width: 220,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const r = p.row as Country;
          return (
            <Stack direction="row" spacing={1}>
              <AdButton
                variant="text"
                startIcon={<EditIcon fontSize="small" />}
                onClick={() => {
                  setForm({
                    country_id: r.country_id,
                    country_name: r.country_name,
                    country_code: r.country_code ?? "",
                    iso_code: r.iso_code ?? "",
                  });
                  setModalOpen(true);
                }}
              >
                Edit
              </AdButton>
              <AdButton
                variant="text"
                startIcon={<BlockIcon fontSize="small" />}
                onClick={async () => {
                  await disableCountry(r.country_id);
                  setToast({ open: true, message: "Country disabled", severity: "success" });
                  refresh();
                }}
              >
                Disable
              </AdButton>
            </Stack>
          );
        },
      },
    ],
    [],
  );

  const save = async () => {
    try {
      if (!form.country_name.trim()) throw new Error("Country name is required");
      if (form.country_id) {
        await updateCountry(form.country_id, {
          country_name: form.country_name.trim(),
          country_code: form.country_code.trim() || null,
          iso_code: form.iso_code.trim() || null,
        });
        setToast({ open: true, message: "Country updated", severity: "success" });
      } else {
        await createCountry({
          country_name: form.country_name.trim(),
          country_code: form.country_code.trim() || null,
          iso_code: form.iso_code.trim() || null,
        });
        setToast({ open: true, message: "Country created", severity: "success" });
      }
      setModalOpen(false);
      setForm({ country_name: "", country_code: "", iso_code: "" });
      refresh();
    } catch (e: any) {
      const msg = (e as ApiError)?.message ?? e?.message ?? "Save failed";
      setToast({ open: true, message: msg, severity: "error" });
    }
  };

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={900}>
            Countries
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage country master data
          </Typography>
        </Stack>

        <AdButton
          startIcon={<AddIcon fontSize="small" />}
          onClick={() => {
            setForm({ country_name: "", country_code: "", iso_code: "" });
            setModalOpen(true);
          }}
        >
          Add
        </AdButton>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <AdGrid
          rows={rows.map((r) => ({ id: r.country_id, ...r }))}
          columns={cols as any}
          loading={loading}
          showExport={false}
          disableColumnMenu
          sx={{ borderRadius: 2, backgroundColor: "rgba(255,255,255,0.92)" }}
        />
      </AdCard>

      <AdModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.country_id ? "Edit Country" : "Add Country"}
        actions={
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: "100%" }}>
            <AdButton variant="text" onClick={() => setModalOpen(false)}>
              Cancel
            </AdButton>
            <AdButton onClick={save}>Save</AdButton>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <AdTextBox label="Country Name" required value={form.country_name} onChange={(v) => setForm((f) => ({ ...f, country_name: v }))} />
          <AdTextBox label="Country Code" value={form.country_code} onChange={(v) => setForm((f) => ({ ...f, country_code: v }))} />
          <AdTextBox label="ISO Code" value={form.iso_code} onChange={(v) => setForm((f) => ({ ...f, iso_code: v }))} />
        </Stack>
      </AdModal>
    </Stack>
  );
}

