import { useEffect, useMemo, useState } from "react";
import { Chip, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import { AdAlertBox, AdButton, AdCard, AdGrid, AdModal, AdNotification, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { mastersApi, type ContractDuration } from "../../common/services/mastersApi";

type Form = { duration_id?: number; duration_name: string; months: string };

export default function ContractDurationsPage() {
  const [rows, setRows] = useState<ContractDuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({ open: false, message: "", severity: "success" });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Form>({ duration_name: "", months: "" });

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setRows(await mastersApi.contractDurations.list(true));
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(apiErr?.message ?? "Failed to load contract durations");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { refresh(); }, []);

  const cols = useMemo(() => [
    { field: "duration_name", headerName: "Duration", flex: 1, minWidth: 220 },
    { field: "months", headerName: "Months", width: 120 },
    { field: "status", headerName: "Status", width: 120, renderCell: (p: any) => <Chip size="small" label={Number(p.value) ? "Active" : "Disabled"} color={Number(p.value) ? "success" : "default"} /> },
    {
      field: "__actions", headerName: "Actions", width: 220, sortable: false, filterable: false,
      renderCell: (p: any) => {
        const r = p.row as ContractDuration;
        return (
          <Stack direction="row" spacing={1}>
            <AdButton variant="text" startIcon={<EditIcon fontSize="small" />} onClick={() => { setForm({ duration_id: r.duration_id, duration_name: r.duration_name ?? "", months: r.months?.toString() ?? "" }); setModalOpen(true); }}>Edit</AdButton>
            <AdButton variant="text" startIcon={<BlockIcon fontSize="small" />} onClick={async () => { await mastersApi.contractDurations.disable(r.duration_id); setToast({ open: true, message: "Disabled", severity: "success" }); refresh(); }}>Disable</AdButton>
          </Stack>
        );
      }
    }
  ], []);

  const save = async () => {
    try {
      const monthsNum = form.months.trim() ? Number(form.months) : null;
      if (form.months.trim() && Number.isNaN(monthsNum)) throw new Error("Months must be a number");

      if (form.duration_id) await mastersApi.contractDurations.update(form.duration_id, { duration_name: form.duration_name.trim() || null, months: monthsNum });
      else await mastersApi.contractDurations.create({ duration_name: form.duration_name.trim() || null, months: monthsNum });

      setToast({ open: true, message: "Saved", severity: "success" });
      setModalOpen(false);
      setForm({ duration_name: "", months: "" });
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
          <Typography variant="h5" fontWeight={900}>Contract Durations</Typography>
          <Typography variant="body2" color="text.secondary">Job Master</Typography>
        </Stack>
        <AdButton startIcon={<AddIcon fontSize="small" />} onClick={() => { setForm({ duration_name: "", months: "" }); setModalOpen(true); }}>Add</AdButton>
      </Stack>
      {error && <AdAlertBox severity="error" title="Error" message={error} />}
      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <AdGrid rows={rows.map((r) => ({ id: r.duration_id, ...r }))} columns={cols as any} loading={loading} showExport={false} disableColumnMenu />
      </AdCard>
      <AdModal open={modalOpen} onClose={() => setModalOpen(false)} title={form.duration_id ? "Edit Contract Duration" : "Add Contract Duration"} actions={
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: "100%" }}>
          <AdButton variant="text" onClick={() => setModalOpen(false)}>Cancel</AdButton>
          <AdButton onClick={save}>Save</AdButton>
        </Stack>
      }>
        <Stack spacing={2}>
          <AdTextBox label="Duration Name" value={form.duration_name} onChange={(v) => setForm((f) => ({ ...f, duration_name: v }))} />
          <AdTextBox label="Months" type="number" value={form.months} onChange={(v) => setForm((f) => ({ ...f, months: v }))} />
        </Stack>
      </AdModal>
    </Stack>
  );
}

