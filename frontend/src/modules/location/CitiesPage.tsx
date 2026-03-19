import { useEffect, useMemo, useState } from "react";
import { Chip, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import { AdAlertBox, AdButton, AdCard, AdDropDown, AdGrid, AdModal, AdNotification, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import {
  createCity,
  disableCity,
  listCities,
  listStates,
  updateCity,
  type CityRow,
  type StateRow,
} from "../../common/services/locationApi";

type CityForm = {
  city_id?: number;
  state_id: number | "";
  city_name: string;
};

export default function CitiesPage() {
  const [states, setStates] = useState<StateRow[]>([]);
  const [rows, setRows] = useState<CityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CityForm>({ state_id: "", city_name: "" });
  const [filterStateId, setFilterStateId] = useState<number | "">("");

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [s, c] = await Promise.all([
        listStates(undefined, true),
        listCities(typeof filterStateId === "number" ? filterStateId : undefined, true),
      ]);
      setStates(s);
      setRows(c);
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(apiErr?.message ?? "Failed to load cities");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [filterStateId]);

  const stateOptions = useMemo(
    () => states.map((s) => ({ label: `${s.state_name} (${s.country_name})`, value: s.state_id })),
    [states],
  );

  const cols = useMemo(
    () => [
      { field: "country_name", headerName: "Country", flex: 1, minWidth: 200 },
      { field: "state_name", headerName: "State", flex: 1, minWidth: 200 },
      { field: "city_name", headerName: "City", flex: 1, minWidth: 220 },
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
          const r = p.row as CityRow;
          return (
            <Stack direction="row" spacing={1}>
              <AdButton
                variant="text"
                startIcon={<EditIcon fontSize="small" />}
                onClick={() => {
                  setForm({
                    city_id: r.city_id,
                    state_id: r.state_id,
                    city_name: r.city_name,
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
                  await disableCity(r.city_id);
                  setToast({ open: true, message: "City disabled", severity: "success" });
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
      if (!form.city_name.trim()) throw new Error("City name is required");
      if (typeof form.state_id !== "number") throw new Error("State is required");

      if (form.city_id) {
        await updateCity(form.city_id, {
          state_id: form.state_id,
          city_name: form.city_name.trim(),
        });
        setToast({ open: true, message: "City updated", severity: "success" });
      } else {
        await createCity({
          state_id: form.state_id,
          city_name: form.city_name.trim(),
        });
        setToast({ open: true, message: "City created", severity: "success" });
      }
      setModalOpen(false);
      setForm({ state_id: "", city_name: "" });
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
            Cities
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage city master data
          </Typography>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="stretch">
          <AdDropDown
            label="Filter State"
            options={[{ label: "All", value: "" }, ...stateOptions]}
            value={filterStateId}
            onChange={(v) => setFilterStateId(v === "" ? "" : Number(v))}
          />
          <AdButton
            startIcon={<AddIcon fontSize="small" />}
            onClick={() => {
              setForm({ state_id: typeof filterStateId === "number" ? filterStateId : "", city_name: "" });
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
          rows={rows.map((r) => ({ id: r.city_id, ...r }))}
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
        title={form.city_id ? "Edit City" : "Add City"}
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
            label="State"
            required
            options={stateOptions}
            value={form.state_id}
            onChange={(v) => setForm((f) => ({ ...f, state_id: Number(v) }))}
          />
          <AdTextBox label="City Name" required value={form.city_name} onChange={(v) => setForm((f) => ({ ...f, city_name: v }))} />
        </Stack>
      </AdModal>
    </Stack>
  );
}

