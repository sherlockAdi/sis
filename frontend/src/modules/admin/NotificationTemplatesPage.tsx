import { useEffect, useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import BlockIcon from "@mui/icons-material/Block";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { Box, Chip, Stack, Tab, Tabs, Typography } from "@mui/material";
import { AdAlertBox, AdButton, AdCard, AdDropDown, AdGrid, AdModal, AdNotification, AdTextArea, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { adminApi, type NotificationTemplate } from "../../common/services/adminApi";

type TemplateForm = {
  template_id?: number;
  template_code: string;
  template_name: string;
  category: string;
  channel: string;
  recipient_type: string;
  subject_template: string;
  text_template: string;
  html_template: string;
  signature_name: string;
  signature_title: string;
  status: boolean;
};

const CHANNEL_OPTIONS = [
  { label: "Email", value: "EMAIL" },
  { label: "Phone/SMS", value: "PHONE" },
  { label: "WhatsApp", value: "WHATSAPP" },
];

const RECIPIENT_OPTIONS = [
  { label: "Candidate", value: "candidate" },
  { label: "Employer", value: "employer" },
  { label: "Company", value: "company" },
  { label: "Partner", value: "partner" },
  { label: "Associate", value: "associate" },
  { label: "Employee", value: "employee" },
  { label: "User", value: "user" },
];

function bool(v: unknown): boolean {
  return Boolean(v) && String(v) !== "0";
}

function emptyForm(): TemplateForm {
  return {
    template_code: "",
    template_name: "",
    category: "GENERAL",
    channel: "EMAIL",
    recipient_type: "candidate",
    subject_template: "",
    text_template: "",
    html_template: "",
    signature_name: "",
    signature_title: "",
    status: true,
  };
}

export default function NotificationTemplatesPage() {
  const [rows, setRows] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [tab, setTab] = useState<"ALL" | "EMAIL" | "PHONE" | "WHATSAPP">("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<TemplateForm>(emptyForm());

  const refresh = async () => {
    setLoading(true);
    try {
      setRows(await adminApi.notificationTemplates.list());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      setError(null);
      try {
        await refresh();
      } catch (e: any) {
        const apiErr = e as ApiError;
        setError(apiErr?.message ?? "Failed to load notification templates");
      }
    })();
  }, []);

  const filteredRows = useMemo(() => {
    if (tab === "ALL") return rows;
    return rows.filter((row) => String(row.channel ?? "").toUpperCase() === tab);
  }, [rows, tab]);

  const cols = useMemo(
    () => [
      { field: "template_code", headerName: "Code", width: 200 },
      { field: "template_name", headerName: "Template Name", flex: 1, minWidth: 240 },
      { field: "category", headerName: "Category", width: 140 },
      { field: "channel", headerName: "Channel", width: 130 },
      { field: "recipient_type", headerName: "Recipient", width: 140 },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: (p: any) => (
          <Chip size="small" label={bool(p.value) ? "Active" : "Disabled"} color={bool(p.value) ? "success" : "default"} />
        ),
      },
      {
        field: "__actions",
        headerName: "Actions",
        width: 200,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const row = p.row as NotificationTemplate;
          return (
            <Stack direction="row" spacing={1}>
              <AdButton
                variant="text"
                startIcon={<EditIcon fontSize="small" />}
                onClick={() => {
                  setForm({
                    template_id: row.template_id,
                    template_code: row.template_code,
                    template_name: row.template_name,
                    category: row.category ?? "GENERAL",
                    channel: row.channel ?? "EMAIL",
                    recipient_type: row.recipient_type ?? "candidate",
                    subject_template: row.subject_template ?? "",
                    text_template: row.text_template ?? "",
                    html_template: row.html_template ?? "",
                    signature_name: row.signature_name ?? "",
                    signature_title: row.signature_title ?? "",
                    status: Boolean(row.status),
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
                  await adminApi.notificationTemplates.disable(row.template_id);
                  setToast({ open: true, message: "Template disabled", severity: "success" });
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
      if (!form.template_code.trim()) throw new Error("Template code is required");
      if (!form.template_name.trim()) throw new Error("Template name is required");

      const payload = {
        template_code: form.template_code.trim().toUpperCase(),
        template_name: form.template_name.trim(),
        category: form.category.trim() || "GENERAL",
        channel: form.channel.trim().toUpperCase() || "EMAIL",
        recipient_type: form.recipient_type.trim() || "candidate",
        subject_template: form.subject_template.trim() || null,
        text_template: form.text_template.trim() || null,
        html_template: form.html_template.trim() || null,
        signature_name: form.signature_name.trim() || null,
        signature_title: form.signature_title.trim() || null,
        status: form.status,
      };

      if (form.template_id) {
        await adminApi.notificationTemplates.update(form.template_id, payload);
      } else {
        await adminApi.notificationTemplates.create(payload);
      }

      setToast({ open: true, message: "Template saved", severity: "success" });
      setModalOpen(false);
      setForm(emptyForm());
      refresh();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Save failed", severity: "error" });
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="h4" fontWeight={950} sx={{ letterSpacing: -0.5 }}>
              Notification Templates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Audit and refine the email and message templates used by candidate, employer, partner, associate, and admin workflows.
            </Typography>
          </Box>
          <AdButton startIcon={<AddIcon />} onClick={() => { setForm(emptyForm()); setModalOpen(true); }}>
            New Template
          </AdButton>
        </Stack>

        {error ? <AdAlertBox severity="error" message={error} /> : null}

        <AdCard>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tab value="ALL" label={`All (${rows.length})`} />
            <Tab value="EMAIL" label={`Email (${rows.filter((r) => String(r.channel).toUpperCase() === "EMAIL").length})`} />
            <Tab value="PHONE" label={`Phone (${rows.filter((r) => String(r.channel).toUpperCase() === "PHONE").length})`} />
            <Tab value="WHATSAPP" label={`WhatsApp (${rows.filter((r) => String(r.channel).toUpperCase() === "WHATSAPP").length})`} />
          </Tabs>
          <Box sx={{ mt: 2 }}>
            <AdGrid
              rows={filteredRows.map((row) => ({ id: row.template_id, ...row }))}
              columns={cols as any}
              loading={loading}
              disableColumnMenu
              autoHeight
            />
          </Box>
        </AdCard>
      </Stack>

      <AdModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        title={form.template_id ? "Edit Template" : "New Template"}
        subtitle="Store editable templates for email and message notifications."
        actions={
          <Stack direction="row" spacing={1} sx={{ width: "100%", justifyContent: "flex-end" }}>
            <AdButton variant="outlined" onClick={() => setModalOpen(false)}>
              Cancel
            </AdButton>
            <AdButton startIcon={<SaveIcon />} onClick={save}>
              Save
            </AdButton>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <AdTextBox
              label="Template Code"
              value={form.template_code}
              onChange={(v) => setForm((prev) => ({ ...prev, template_code: v }))}
              required
            />
            <AdTextBox
              label="Template Name"
              value={form.template_name}
              onChange={(v) => setForm((prev) => ({ ...prev, template_name: v }))}
              required
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <AdTextBox
              label="Category"
              value={form.category}
              onChange={(v) => setForm((prev) => ({ ...prev, category: v }))}
            />
            <AdDropDown
              label="Channel"
              options={CHANNEL_OPTIONS}
              value={form.channel}
              onChange={(v) => setForm((prev) => ({ ...prev, channel: String(v) }))}
            />
            <AdDropDown
              label="Recipient Type"
              options={RECIPIENT_OPTIONS}
              value={form.recipient_type}
              onChange={(v) => setForm((prev) => ({ ...prev, recipient_type: String(v) }))}
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <AdTextBox
              label="Signature Name"
              value={form.signature_name}
              onChange={(v) => setForm((prev) => ({ ...prev, signature_name: v }))}
            />
            <AdTextBox
              label="Signature Title"
              value={form.signature_title}
              onChange={(v) => setForm((prev) => ({ ...prev, signature_title: v }))}
            />
          </Stack>

          <AdTextBox
            label="Subject Template"
            value={form.subject_template}
            onChange={(v) => setForm((prev) => ({ ...prev, subject_template: v }))}
            helperText="Use placeholders like {{candidate_name}}, {{job_title}}, {{summary}}, {{status_label}}."
          />

          <AdTextArea
            label="Text Template"
            value={form.text_template}
            onChange={(v) => setForm((prev) => ({ ...prev, text_template: v }))}
            minRows={6}
            helperText="Plain text version. You can use the same placeholders as the subject."
          />

          <AdTextArea
            label="HTML Template"
            value={form.html_template}
            onChange={(v) => setForm((prev) => ({ ...prev, html_template: v }))}
            minRows={8}
            helperText="HTML version for professional branded emails. Placeholders are replaced automatically."
          />

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={form.status ? "Active" : "Disabled"}
              color={form.status ? "success" : "default"}
              onClick={() => setForm((prev) => ({ ...prev, status: !prev.status }))}
            />
            <Typography variant="body2" color="text.secondary">
              Click the chip to toggle template status.
            </Typography>
          </Stack>
        </Stack>
      </AdModal>

      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((prev) => ({ ...prev, open: false }))} />
    </Box>
  );
}
