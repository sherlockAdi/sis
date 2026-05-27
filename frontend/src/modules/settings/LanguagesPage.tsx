import { useEffect, useMemo, useState } from "react";
import { Chip, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import { AdAlertBox, AdButton, AdCard, AdCheckBox, AdGrid, AdModal, AdNotification, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { mastersApi, type Language } from "../../common/services/mastersApi";

type Form = { language_id?: number; language_name: string; status: boolean };

export default function LanguagesPage() {
  const [rows, setRows] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Form>({ language_name: "", status: true });

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setRows(await mastersApi.languages.list(true));
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(apiErr?.message ?? "Failed to load languages");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const cols = useMemo(
    () => [
      { field: "language_name", headerName: "Language", flex: 1, minWidth: 260 },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: (p: any) => (
          <Chip size="small" label={Number(p.value) ? "Active" : "Inactive"} color={Number(p.value) ? "success" : "default"} />
        ),
      },
      {
        field: "__actions",
        headerName: "Actions",
        width: 220,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const r = p.row as Language;
          return (
            <Stack direction="row" spacing={1}>
              <AdButton
                variant="text"
                startIcon={<EditIcon fontSize="small" />}
                onClick={() => {
                  setForm({
                    language_id: r.language_id,
                    language_name: r.language_name,
                    status: Boolean(Number(r.status)),
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
                  await mastersApi.languages.disable(r.language_id);
                  setToast({ open: true, message: "Language disabled", severity: "success" });
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
      if (!form.language_name.trim()) throw new Error("Language name is required");
      if (form.language_id) {
        await mastersApi.languages.update(form.language_id, {
          language_name: form.language_name.trim(),
          status: form.status,
        });
      } else {
        await mastersApi.languages.create({
          language_name: form.language_name.trim(),
          status: form.status,
        });
      }
      setToast({ open: true, message: "Saved", severity: "success" });
      setModalOpen(false);
      setForm({ language_name: "", status: true });
      refresh();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Save failed", severity: "error" });
    }
  };

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={900}>
            Languages
          </Typography>
          <Typography variant="body2" color="text.secondary">
            System setting master
          </Typography>
        </Stack>
        <AdButton
          startIcon={<AddIcon fontSize="small" />}
          onClick={() => {
            setForm({ language_name: "", status: true });
            setModalOpen(true);
          }}
        >
          Add
        </AdButton>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <AdGrid rows={rows.map((r) => ({ id: r.language_id, ...r }))} columns={cols as any} loading={loading} disableColumnMenu />
      </AdCard>

      <AdModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.language_id ? "Edit Language" : "Add Language"}
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
          <AdTextBox label="Language Name" required value={form.language_name} onChange={(v) => setForm((f) => ({ ...f, language_name: v }))} />
          <AdCheckBox label="Active" checked={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v }))} />
        </Stack>
      </AdModal>
    </Stack>
  );
}
