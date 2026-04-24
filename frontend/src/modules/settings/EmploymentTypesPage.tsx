import { useEffect, useMemo, useState } from "react";
import { Chip, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import { AdAlertBox, AdButton, AdCard, AdCheckBox, AdGrid, AdModal, AdNotification, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { mastersApi, type EmploymentType } from "../../common/services/mastersApi";

type Form = { employment_type_id?: number; type_name: string; description: string; status: boolean };

export default function EmploymentTypesPage() {
  const [rows, setRows] = useState<EmploymentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Form>({ type_name: "", description: "", status: true });

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setRows(await mastersApi.employmentTypes.list(true));
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(apiErr?.message ?? "Failed to load employment types");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const cols = useMemo(
    () => [
      { field: "type_name", headerName: "Employment Type", flex: 1, minWidth: 240 },
      { field: "description", headerName: "Description", flex: 1, minWidth: 260 },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: (p: any) => <Chip size="small" label={Number(p.value) ? "Active" : "Inactive"} color={Number(p.value) ? "success" : "default"} />,
      },
      {
        field: "__actions",
        headerName: "Actions",
        width: 220,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const r = p.row as EmploymentType;
          return (
            <Stack direction="row" spacing={1}>
              <AdButton
                variant="text"
                startIcon={<EditIcon fontSize="small" />}
                onClick={() => {
                  setForm({
                    employment_type_id: r.employment_type_id,
                    type_name: r.type_name,
                    description: r.description ?? "",
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
                  await mastersApi.employmentTypes.disable(r.employment_type_id);
                  setToast({ open: true, message: "Employment type disabled", severity: "success" });
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
      if (!form.type_name.trim()) throw new Error("Employment type name is required");
      if (form.employment_type_id) {
        await mastersApi.employmentTypes.update(form.employment_type_id, {
          type_name: form.type_name.trim(),
          description: form.description.trim() || null,
          status: form.status,
        });
      } else {
        await mastersApi.employmentTypes.create({
          type_name: form.type_name.trim(),
          description: form.description.trim() || null,
          status: form.status,
        });
      }
      setToast({ open: true, message: "Saved", severity: "success" });
      setModalOpen(false);
      setForm({ type_name: "", description: "", status: true });
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
            Employment Types
          </Typography>
          <Typography variant="body2" color="text.secondary">
            System setting master
          </Typography>
        </Stack>
        <AdButton
          startIcon={<AddIcon fontSize="small" />}
          onClick={() => {
            setForm({ type_name: "", description: "", status: true });
            setModalOpen(true);
          }}
        >
          Add
        </AdButton>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <AdGrid rows={rows.map((r) => ({ id: r.employment_type_id, ...r }))} columns={cols as any} loading={loading} showExport={false} disableColumnMenu />
      </AdCard>

      <AdModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.employment_type_id ? "Edit Employment Type" : "Add Employment Type"}
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
          <AdTextBox label="Type Name" required value={form.type_name} onChange={(v) => setForm((f) => ({ ...f, type_name: v }))} />
          <AdTextBox label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} />
          <AdCheckBox label="Active" checked={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v }))} />
        </Stack>
      </AdModal>
    </Stack>
  );
}
