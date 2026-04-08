import { useEffect, useMemo, useState } from "react";
import { Chip, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { AdAlertBox, AdButton, AdCard, AdGrid, AdModal, AdNotification, AdTextArea, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { partnersApi, type PartnerRow } from "../../common/services/partnersApi";

export default function PartnersPage() {
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({ open: false, message: "", severity: "success" });
  const [rows, setRows] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    partner_id: 0,
    partner_name: "",
    contact_name: "",
    phone: "",
    email: "",
    address: "",
    status: true,
  });

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await partnersApi.list(true));
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load partners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const cols = useMemo(
    () => [
      { field: "partner_code", headerName: "Code", width: 120 },
      { field: "partner_name", headerName: "Partner", flex: 1, minWidth: 220 },
      { field: "contact_name", headerName: "Contact", width: 160 },
      { field: "phone", headerName: "Phone", width: 140 },
      { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
      { field: "username", headerName: "Username", width: 140 },
      {
        field: "status",
        headerName: "Status",
        width: 110,
        renderCell: (p: any) => <Chip size="small" label={Number(p.value) ? "Active" : "Inactive"} color={Number(p.value) ? "success" : "default"} />,
      },
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
              <AdButton
                variant="text"
                onClick={() => {
                  setForm({
                    partner_id: r.partner_id,
                    partner_name: r.partner_name ?? "",
                    contact_name: r.contact_name ?? "",
                    phone: r.phone ?? "",
                    email: r.email ?? "",
                    address: r.address ?? "",
                    status: Number(r.status) === 1,
                  });
                  setOpen(true);
                }}
              >
                Edit
              </AdButton>
              <AdButton
                variant="text"
                color="error"
                startIcon={<DeleteOutlineIcon fontSize="small" />}
                onClick={async () => {
                  try {
                    await partnersApi.disable(r.partner_id);
                    setToast({ open: true, message: "Partner disabled", severity: "success" });
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
    [],
  );

  const savePartner = async () => {
    setSaving(true);
    try {
      const payload = {
        partner_name: form.partner_name.trim(),
        contact_name: form.contact_name.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        status: form.status,
      };
      if (!payload.partner_name) throw new Error("Partner name is required");

      if (form.partner_id) {
        await partnersApi.update(form.partner_id, payload);
        setToast({ open: true, message: "Partner updated", severity: "success" });
      } else {
        const created = await partnersApi.create(payload);
        const emailMsg = created.emailed ? "Credentials emailed." : "Email not sent (check SMTP).";
        setToast({ open: true, message: `Partner created. Username: ${created.username}. ${emailMsg}`, severity: "success" });
      }

      setOpen(false);
      setForm({ partner_id: 0, partner_name: "", contact_name: "", phone: "", email: "", address: "", status: true });
      refresh();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Save failed", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

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
            Partner Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create partner accounts and manage status
          </Typography>
        </Stack>
        <AdButton
          startIcon={<AddIcon fontSize="small" />}
          onClick={() => {
            setForm({ partner_id: 0, partner_name: "", contact_name: "", phone: "", email: "", address: "", status: true });
            setOpen(true);
          }}
          sx={{ alignSelf: { xs: "stretch", md: "center" }, maxWidth: { xs: "100%", md: "fit-content" } }}
        >
          Add Partner
        </AdButton>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)", minWidth: 0 }} contentSx={{ p: 2 }}>
        <AdGrid rows={rows.map((r) => ({ id: r.partner_id, ...r }))} columns={cols as any} loading={loading} showExport={false} disableColumnMenu />
      </AdCard>

      <AdModal
        open={open}
        onClose={() => setOpen(false)}
        title={form.partner_id ? "Edit Partner" : "Add Partner"}
        actions={
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: "100%" }}>
            <AdButton variant="text" onClick={() => setOpen(false)}>
              Cancel
            </AdButton>
            <AdButton onClick={savePartner} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </AdButton>
          </Stack>
        }
      >
        <Stack spacing={1.5}>
          <AdTextBox label="Partner Name" required value={form.partner_name} onChange={(v) => setForm((f) => ({ ...f, partner_name: v }))} />
          <AdTextBox label="Contact Name" value={form.contact_name} onChange={(v) => setForm((f) => ({ ...f, contact_name: v }))} />
          <AdTextBox label="Phone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
          <AdTextBox label="Email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
          <AdTextArea label="Address" value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} />
        </Stack>
      </AdModal>
    </Stack>
  );
}
