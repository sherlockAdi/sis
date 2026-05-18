import { useEffect, useMemo, useState } from "react";
import { Chip, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import { AdAlertBox, AdButton, AdCard, AdCheckBox, AdGrid, AdModal, AdNotification, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { mastersApi, type VisaChecklistMasterItem } from "../../common/services/mastersApi";

type Form = {
  checklist_item_id?: number;
  checklist_item_code: string;
  checklist_item_name: string;
  sort_order: string;
  is_required: boolean;
  status: boolean;
};

export default function VisaChecklistMasterPage() {
  const [rows, setRows] = useState<VisaChecklistMasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Form>({
    checklist_item_code: "",
    checklist_item_name: "",
    sort_order: "0",
    is_required: true,
    status: true,
  });

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setRows(await mastersApi.deploymentVisaChecklists.list(true));
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(apiErr?.message ?? "Failed to load visa checklist master");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const cols = useMemo(
    () => [
      { field: "checklist_item_code", headerName: "Code", flex: 1, minWidth: 200 },
      { field: "checklist_item_name", headerName: "Checklist Item", flex: 1.2, minWidth: 280 },
      { field: "sort_order", headerName: "Order", width: 100 },
      {
        field: "is_required",
        headerName: "Required",
        width: 120,
        renderCell: (p: any) => <Chip size="small" label={Number(p.value) ? "Yes" : "No"} color={Number(p.value) ? "primary" : "default"} />,
      },
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
          const r = p.row as VisaChecklistMasterItem;
          return (
            <Stack direction="row" spacing={1}>
              <AdButton
                variant="text"
                startIcon={<EditIcon fontSize="small" />}
                onClick={() => {
                  setForm({
                    checklist_item_id: r.checklist_item_id,
                    checklist_item_code: r.checklist_item_code,
                    checklist_item_name: r.checklist_item_name,
                    sort_order: String(r.sort_order ?? 0),
                    is_required: Boolean(Number(r.is_required)),
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
                  await mastersApi.deploymentVisaChecklists.disable(r.checklist_item_id);
                  setToast({ open: true, message: "Checklist item disabled", severity: "success" });
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
      const code = form.checklist_item_code.trim();
      const name = form.checklist_item_name.trim();
      if (!code) throw new Error("Checklist item code is required");
      if (!name) throw new Error("Checklist item name is required");

      const sortOrder = form.sort_order.trim() === "" ? 0 : Number(form.sort_order);
      if (!Number.isFinite(sortOrder)) throw new Error("Sort order must be a valid number");

      if (form.checklist_item_id) {
        await mastersApi.deploymentVisaChecklists.update(form.checklist_item_id, {
          checklist_item_code: code,
          checklist_item_name: name,
          sort_order: sortOrder,
          is_required: form.is_required,
          status: form.status,
        });
      } else {
        await mastersApi.deploymentVisaChecklists.create({
          checklist_item_code: code,
          checklist_item_name: name,
          sort_order: sortOrder,
          is_required: form.is_required,
          status: form.status,
        });
      }

      setToast({ open: true, message: "Saved", severity: "success" });
      setModalOpen(false);
      setForm({
        checklist_item_code: "",
        checklist_item_name: "",
        sort_order: "0",
        is_required: true,
        status: true,
      });
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
            Visa Checklist Master
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Deployment master for visa acknowledgement
          </Typography>
        </Stack>
        <AdButton
          startIcon={<AddIcon fontSize="small" />}
          onClick={() => {
            setForm({
              checklist_item_code: "",
              checklist_item_name: "",
              sort_order: "0",
              is_required: true,
              status: true,
            });
            setModalOpen(true);
          }}
        >
          Add
        </AdButton>
      </Stack>
      {error && <AdAlertBox severity="error" title="Error" message={error} />}
      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <AdGrid rows={rows.map((r) => ({ id: r.checklist_item_id, ...r }))} columns={cols as any} loading={loading} showExport={false} disableColumnMenu />
      </AdCard>
      <AdModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.checklist_item_id ? "Edit Visa Checklist Item" : "Add Visa Checklist Item"}
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
          <AdTextBox label="Checklist Item Code" required value={form.checklist_item_code} onChange={(v) => setForm((f) => ({ ...f, checklist_item_code: v }))} />
          <AdTextBox label="Checklist Item Name" required value={form.checklist_item_name} onChange={(v) => setForm((f) => ({ ...f, checklist_item_name: v }))} />
          <AdTextBox label="Sort Order" type="number" value={form.sort_order} onChange={(v) => setForm((f) => ({ ...f, sort_order: v }))} />
          <AdCheckBox label="Required" checked={form.is_required} onChange={(v) => setForm((f) => ({ ...f, is_required: v }))} />
          <AdCheckBox label="Active" checked={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v }))} />
        </Stack>
      </AdModal>
    </Stack>
  );
}
