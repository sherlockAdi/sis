import { useEffect, useMemo, useState } from "react";
import { Chip, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import { AdAlertBox, AdButton, AdCard, AdDropDown, AdGrid, AdModal, AdNotification, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import {
  createState,
  disableState,
  listCountries,
  listStates,
  updateState,
  type Country,
  type StateRow,
} from "../../common/services/locationApi";

type StateForm = {
  state_id?: number;
  country_id: number | "";
  state_name: string;
  state_code: string;
};

export default function StatesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [rows, setRows] = useState<StateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<StateForm>({ country_id: "", state_name: "", state_code: "" });
  const [filterCountryId, setFilterCountryId] = useState<number | "">("");

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [c, s] = await Promise.all([
        listCountries(true),
        listStates(typeof filterCountryId === "number" ? filterCountryId : undefined, true),
      ]);
      setCountries(c);
      setRows(s);
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(apiErr?.message ?? "Failed to load states");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [filterCountryId]);

  const countryOptions = useMemo(
    () => countries.map((c) => ({ label: c.country_name, value: c.country_id })),
    [countries],
  );

  const cols = useMemo(
    () => [
      { field: "country_name", headerName: "Country", flex: 1, minWidth: 220 },
      { field: "state_name", headerName: "State", flex: 1, minWidth: 220 },
      { field: "state_code", headerName: "Code", width: 140 },
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
          const r = p.row as StateRow;
          return (
            <Stack direction="row" spacing={1}>
              <AdButton
                variant="text"
                startIcon={<EditIcon fontSize="small" />}
                onClick={() => {
                  setForm({
                    state_id: r.state_id,
                    country_id: r.country_id,
                    state_name: r.state_name,
                    state_code: r.state_code ?? "",
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
                  await disableState(r.state_id);
                  setToast({ open: true, message: "State disabled", severity: "success" });
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
      if (!form.state_name.trim()) throw new Error("State name is required");
      if (typeof form.country_id !== "number") throw new Error("Country is required");

      if (form.state_id) {
        await updateState(form.state_id, {
          country_id: form.country_id,
          state_name: form.state_name.trim(),
          state_code: form.state_code.trim() || null,
        });
        setToast({ open: true, message: "State updated", severity: "success" });
      } else {
        await createState({
          country_id: form.country_id,
          state_name: form.state_name.trim(),
          state_code: form.state_code.trim() || null,
        });
        setToast({ open: true, message: "State created", severity: "success" });
      }
      setModalOpen(false);
      setForm({ country_id: "", state_name: "", state_code: "" });
      refresh();
    } catch (e: any) {
      const msg = (e as ApiError)?.message ?? e?.message ?? "Save failed";
      setToast({ open: true, message: msg, severity: "error" });
    }
  };

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} spacing={1.5}>
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={900}>
            States
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage state master data
          </Typography>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="stretch">
          <AdDropDown
            label="Filter Country"
            options={[{ label: "All", value: "" }, ...countryOptions]}
            value={filterCountryId}
            onChange={(v) => setFilterCountryId(v === "" ? "" : Number(v))}
          />
          <AdButton
            startIcon={<AddIcon fontSize="small" />}
            onClick={() => {
              setForm({ country_id: typeof filterCountryId === "number" ? filterCountryId : "", state_name: "", state_code: "" });
              setModalOpen(true);
            }}
          >
            Add
          </AdButton>
        </Stack>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <AdGrid
          rows={rows.map((r) => ({ id: r.state_id, ...r }))}
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
        title={form.state_id ? "Edit State" : "Add State"}
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
          <AdDropDown
            label="Country"
            required
            options={countryOptions}
            value={form.country_id}
            onChange={(v) => setForm((f) => ({ ...f, country_id: Number(v) }))}
          />
          <AdTextBox label="State Name" required value={form.state_name} onChange={(v) => setForm((f) => ({ ...f, state_name: v }))} />
          <AdTextBox label="State Code" value={form.state_code} onChange={(v) => setForm((f) => ({ ...f, state_code: v }))} />
        </Stack>
      </AdModal>
    </Stack>
  );
}

