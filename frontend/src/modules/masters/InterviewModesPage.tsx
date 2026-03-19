import { useEffect, useMemo, useState } from "react";
import { Chip, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import { AdAlertBox, AdButton, AdCard, AdGrid, AdModal, AdNotification, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { mastersApi, type InterviewMode } from "../../common/services/mastersApi";

type Form = { interview_mode_id?: number; mode_name: string; description: string };

export default function InterviewModesPage() {
  const [rows, setRows] = useState<InterviewMode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({ open: false, message: "", severity: "success" });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Form>({ mode_name: "", description: "" });

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setRows(await mastersApi.interviewModes.list(true));
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(apiErr?.message ?? "Failed to load interview modes");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { refresh(); }, []);

  const cols = useMemo(() => [
    { field: "mode_name", headerName: "Mode", flex: 1, minWidth: 220 },
    { field: "description", headerName: "Description", flex: 1, minWidth: 260 },
    { field: "status", headerName: "Status", width: 120, renderCell: (p: any) => <Chip size="small" label={Number(p.value) ? "Active" : "Disabled"} color={Number(p.value) ? "success" : "default"} /> },
    {
      field: "__actions", headerName: "Actions", width: 220, sortable: false, filterable: false,
      renderCell: (p: any) => {
        const r = p.row as InterviewMode;
        return (
          <Stack direction="row" spacing={1}>
            <AdButton variant="text" startIcon={<EditIcon fontSize="small" />} onClick={() => { setForm({ interview_mode_id: r.interview_mode_id, mode_name: r.mode_name, description: r.description ?? "" }); setModalOpen(true); }}>Edit</AdButton>
            <AdButton variant="text" startIcon={<BlockIcon fontSize="small" />} onClick={async () => { await mastersApi.interviewModes.disable(r.interview_mode_id); setToast({ open: true, message: "Disabled", severity: "success" }); refresh(); }}>Disable</AdButton>
          </Stack>
        );
      }
    }
  ], []);

  const save = async () => {
    try {
      if (!form.mode_name.trim()) throw new Error("Mode name is required");
      if (form.interview_mode_id) await mastersApi.interviewModes.update(form.interview_mode_id, { mode_name: form.mode_name.trim(), description: form.description.trim() || null });
      else await mastersApi.interviewModes.create({ mode_name: form.mode_name.trim(), description: form.description.trim() || null });
      setToast({ open: true, message: "Saved", severity: "success" });
      setModalOpen(false);
      setForm({ mode_name: "", description: "" });
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
          <Typography variant="h5" fontWeight={900}>Interview Modes</Typography>
          <Typography variant="body2" color="text.secondary">Recruitment Master</Typography>
        </Stack>
        <AdButton startIcon={<AddIcon fontSize="small" />} onClick={() => { setForm({ mode_name: "", description: "" }); setModalOpen(true); }}>Add</AdButton>
      </Stack>
      {error && <AdAlertBox severity="error" title="Error" message={error} />}
      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <AdGrid rows={rows.map((r) => ({ id: r.interview_mode_id, ...r }))} columns={cols as any} loading={loading} showExport={false} disableColumnMenu />
      </AdCard>
      <AdModal open={modalOpen} onClose={() => setModalOpen(false)} title={form.interview_mode_id ? "Edit Interview Mode" : "Add Interview Mode"} actions={
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: "100%" }}>
          <AdButton variant="text" onClick={() => setModalOpen(false)}>Cancel</AdButton>
          <AdButton onClick={save}>Save</AdButton>
        </Stack>
      }>
        <Stack spacing={2}>
          <AdTextBox label="Mode Name" required value={form.mode_name} onChange={(v) => setForm((f) => ({ ...f, mode_name: v }))} />
          <AdTextBox label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} />
        </Stack>
      </AdModal>
    </Stack>
  );
}

