import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { AdAlertBox, AdButton, AdCard, AdDropDown, AdGrid, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { leadsApi, type LeadInput, type LeadRow, type LeadStatus, type LeadType } from "../../common/services/leadsApi";

const leadTypeOptions = [
  { label: "Undecided", value: "UNDECIDED" },
  { label: "Employer", value: "EMPLOYER" },
  { label: "Associate Partner", value: "ASSOCIATE" },
];

const statusOptions = [
  { label: "New", value: "NEW" },
  { label: "Contacted", value: "CONTACTED" },
  { label: "Qualified", value: "QUALIFIED" },
  { label: "Converted", value: "CONVERTED" },
  { label: "Closed", value: "CLOSED" },
];

function emptyForm(): LeadInput {
  return {
    lead_type: "UNDECIDED",
    organisation_name: "",
    contact_name: "",
    phone: "",
    email: "",
    address: "",
    source: "Admin",
    status: "NEW",
    notes: "",
  };
}

function statusColor(value: LeadStatus): any {
  if (value === "NEW") return "primary";
  if (value === "CONTACTED") return "info";
  if (value === "QUALIFIED") return "success";
  if (value === "CONVERTED") return "secondary";
  if (value === "CLOSED") return "default";
  return "default";
}

function typeLabel(value: LeadType): string {
  if (value === "EMPLOYER") return "Employer";
  if (value === "ASSOCIATE") return "Associate";
  return "Undecided";
}

export default function LeadPanelPage() {
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LeadRow | null>(null);
  const [form, setForm] = useState<LeadInput>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({ open: false, message: "", severity: "success" });

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setRows(await leadsApi.list({ include_closed: true }));
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (row: LeadRow) => {
    setEditing(row);
    setForm({
      lead_type: row.lead_type,
      organisation_name: row.organisation_name ?? "",
      contact_name: row.contact_name ?? "",
      phone: row.phone ?? "",
      email: row.email ?? "",
      country_id: row.country_id,
      state_id: row.state_id,
      city_id: row.city_id,
      address: row.address ?? "",
      source: row.source ?? "",
      status: row.status,
      notes: row.notes ?? "",
    });
    setDialogOpen(true);
  };

  const saveLead = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        organisation_name: String(form.organisation_name ?? "").trim() || null,
        contact_name: String(form.contact_name ?? "").trim(),
        phone: String(form.phone ?? "").trim() || null,
        email: String(form.email ?? "").trim() || null,
        address: String(form.address ?? "").trim() || null,
        source: String(form.source ?? "").trim() || null,
        notes: String(form.notes ?? "").trim() || null,
      };
      if (editing) {
        await leadsApi.update(editing.lead_id, payload);
        setToast({ open: true, message: "Lead updated", severity: "success" });
      } else {
        await leadsApi.create(payload);
        setToast({ open: true, message: "Lead created", severity: "success" });
      }
      setDialogOpen(false);
      await refresh();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to save lead", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    return {
      total: rows.length,
      newCount: rows.filter((row) => row.status === "NEW").length,
      qualified: rows.filter((row) => row.status === "QUALIFIED").length,
      converted: rows.filter((row) => row.status === "CONVERTED").length,
    };
  }, [rows]);

  const columns = useMemo(
    () => [
      { field: "lead_code", headerName: "Lead Code", width: 130 },
      {
        field: "lead_type",
        headerName: "Lead Type",
        width: 150,
        renderCell: (p: any) => <Chip size="small" label={typeLabel(p.value)} variant="outlined" />,
      },
      { field: "organisation_name", headerName: "Organisation", flex: 1, minWidth: 200 },
      { field: "contact_name", headerName: "Contact", width: 170 },
      { field: "phone", headerName: "Phone", width: 140 },
      { field: "email", headerName: "Email", flex: 1, minWidth: 210 },
      { field: "city_name", headerName: "City", width: 130 },
      { field: "source", headerName: "Source", width: 130 },
      {
        field: "status",
        headerName: "Status",
        width: 140,
        renderCell: (p: any) => <Chip size="small" label={String(p.value ?? "")} color={statusColor(p.value)} />,
      },
      { field: "created_at", headerName: "Created", width: 170 },
      {
        field: "__actions",
        headerName: "Actions",
        width: 260,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const row = p.row as LeadRow;
          return (
            <Stack direction="row" spacing={1}>
              <AdButton variant="text" size="small" startIcon={<EditIcon fontSize="small" />} onClick={() => openEdit(row)}>
                Edit
              </AdButton>
              <AdButton
                variant="text"
                size="small"
                disabled={row.status === "CLOSED"}
                onClick={async () => {
                  try {
                    await leadsApi.close(row.lead_id);
                    setToast({ open: true, message: "Lead closed", severity: "success" });
                    refresh();
                  } catch (e: any) {
                    setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to close lead", severity: "error" });
                  }
                }}
              >
                Close
              </AdButton>
            </Stack>
          );
        },
      },
    ],
    [],
  );

  return (
    <Stack spacing={2.5} sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden", minWidth: 0 }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5} alignItems={{ md: "center" }}>
        <Box>
          <Typography variant="h5" fontWeight={950}>
            Lead Panel
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Basic employer and associate partner inquiries before full profile creation.
          </Typography>
        </Box>
        <AdButton startIcon={<AddIcon fontSize="small" />} onClick={openCreate}>
          Add Lead
        </AdButton>
      </Stack>

      {error ? <AdAlertBox severity="error" title="Error" message={error} /> : null}

      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" } }}>
        {[
          { label: "Total Leads", value: stats.total },
          { label: "New", value: stats.newCount },
          { label: "Qualified", value: stats.qualified },
          { label: "Converted", value: stats.converted },
        ].map((item) => (
          <AdCard key={item.label} animate={false} sx={{ borderRadius: 0, boxShadow: "none", border: "1px solid rgba(15,23,42,0.10)" }} contentSx={{ p: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: "uppercase" }}>
              {item.label}
            </Typography>
            <Typography variant="h4" fontWeight={950}>
              {item.value}
            </Typography>
          </AdCard>
        ))}
      </Box>

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)", minWidth: 0 }} contentSx={{ p: 2 }}>
        <AdGrid rows={rows.map((row) => ({ id: row.lead_id, ...row }))} columns={columns as any} loading={loading} disableColumnMenu />
      </AdCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing ? "Edit Lead" : "Add Lead"}</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, mt: 1 }}>
            <AdDropDown
              label="Lead Type"
              options={leadTypeOptions}
              value={form.lead_type ?? "UNDECIDED"}
              onChange={(value) => setForm((prev) => ({ ...prev, lead_type: value as LeadType }))}
            />
            <AdDropDown
              label="Status"
              options={statusOptions}
              value={form.status ?? "NEW"}
              onChange={(value) => setForm((prev) => ({ ...prev, status: value as LeadStatus }))}
            />
            <TextField label="Organisation" value={form.organisation_name ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, organisation_name: e.target.value }))} />
            <TextField label="Contact Name" required value={form.contact_name ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, contact_name: e.target.value }))} />
            <TextField label="Phone" value={form.phone ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, "").slice(0, 15) }))} />
            <TextField label="Email" type="email" value={form.email ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
            <TextField label="Source" value={form.source ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, source: e.target.value }))} />
            <TextField label="Address" value={form.address ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
            <TextField
              label="Notes"
              multiline
              minRows={3}
              sx={{ gridColumn: { xs: "auto", md: "1 / -1" } }}
              value={form.notes ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <AdButton variant="text" onClick={() => setDialogOpen(false)}>
            Cancel
          </AdButton>
          <AdButton onClick={saveLead} disabled={saving}>
            {saving ? "Saving..." : "Save Lead"}
          </AdButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
