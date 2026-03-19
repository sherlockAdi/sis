import { useEffect, useMemo, useState } from "react";
import { Chip, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import { AdAlertBox, AdButton, AdCard, AdCheckBox, AdGrid, AdModal, AdNotification, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { mastersApi, type DocumentType } from "../../common/services/mastersApi";

type Form = { document_type_id?: number; document_name: string; is_required: boolean };

export default function DocumentTypesPage() {
  const [rows, setRows] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({ open: false, message: "", severity: "success" });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Form>({ document_name: "", is_required: false });

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setRows(await mastersApi.documentTypes.list(true));
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(apiErr?.message ?? "Failed to load document types");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { refresh(); }, []);

  const cols = useMemo(() => [
    { field: "document_name", headerName: "Document", flex: 1, minWidth: 260 },
    { field: "is_required", headerName: "Required", width: 120, renderCell: (p: any) => <Chip size="small" label={Number(p.value) ? "Yes" : "No"} color={Number(p.value) ? "primary" : "default"} /> },
    { field: "status", headerName: "Status", width: 120, renderCell: (p: any) => <Chip size="small" label={Number(p.value) ? "Active" : "Disabled"} color={Number(p.value) ? "success" : "default"} /> },
    {
      field: "__actions", headerName: "Actions", width: 220, sortable: false, filterable: false,
      renderCell: (p: any) => {
        const r = p.row as DocumentType;
        return (
          <Stack direction="row" spacing={1}>
            <AdButton variant="text" startIcon={<EditIcon fontSize="small" />} onClick={() => { setForm({ document_type_id: r.document_type_id, document_name: r.document_name, is_required: Boolean(Number(r.is_required)) }); setModalOpen(true); }}>Edit</AdButton>
            <AdButton variant="text" startIcon={<BlockIcon fontSize="small" />} onClick={async () => { await mastersApi.documentTypes.disable(r.document_type_id); setToast({ open: true, message: "Disabled", severity: "success" }); refresh(); }}>Disable</AdButton>
          </Stack>
        );
      }
    }
  ], []);

  const save = async () => {
    try {
      if (!form.document_name.trim()) throw new Error("Document name is required");
      if (form.document_type_id) await mastersApi.documentTypes.update(form.document_type_id, { document_name: form.document_name.trim(), is_required: form.is_required });
      else await mastersApi.documentTypes.create({ document_name: form.document_name.trim(), is_required: form.is_required });
      setToast({ open: true, message: "Saved", severity: "success" });
      setModalOpen(false);
      setForm({ document_name: "", is_required: false });
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
          <Typography variant="h5" fontWeight={900}>Document Types</Typography>
          <Typography variant="body2" color="text.secondary">Document Master</Typography>
        </Stack>
        <AdButton startIcon={<AddIcon fontSize="small" />} onClick={() => { setForm({ document_name: "", is_required: false }); setModalOpen(true); }}>Add</AdButton>
      </Stack>
      {error && <AdAlertBox severity="error" title="Error" message={error} />}
      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <AdGrid rows={rows.map((r) => ({ id: r.document_type_id, ...r }))} columns={cols as any} loading={loading} showExport={false} disableColumnMenu />
      </AdCard>
      <AdModal open={modalOpen} onClose={() => setModalOpen(false)} title={form.document_type_id ? "Edit Document Type" : "Add Document Type"} actions={
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: "100%" }}>
          <AdButton variant="text" onClick={() => setModalOpen(false)}>Cancel</AdButton>
          <AdButton onClick={save}>Save</AdButton>
        </Stack>
      }>
        <Stack spacing={2}>
          <AdTextBox label="Document Name" required value={form.document_name} onChange={(v) => setForm((f) => ({ ...f, document_name: v }))} />
          <AdCheckBox label="Is Required" checked={form.is_required} onChange={(v) => setForm((f) => ({ ...f, is_required: v }))} />
        </Stack>
      </AdModal>
    </Stack>
  );
}

