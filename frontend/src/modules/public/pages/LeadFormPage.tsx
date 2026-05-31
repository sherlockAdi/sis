import { useState } from "react";
import { Box, Stack, TextField, Typography } from "@mui/material";
import { AdAlertBox, AdButton, AdCard, AdDropDown, AdNotification } from "../../../common/ad";
import type { ApiError } from "../../../common/services/apiFetch";
import { publicLeadsApi, type LeadInput, type LeadType } from "../../../common/services/leadsApi";

const leadTypeOptions = [
  { label: "Not sure yet", value: "UNDECIDED" },
  { label: "Employer", value: "EMPLOYER" },
  { label: "Associate Partner", value: "ASSOCIATE" },
];

export default function LeadFormPage() {
  const [form, setForm] = useState<LeadInput>({
    lead_type: "UNDECIDED",
    organisation_name: "",
    contact_name: "",
    phone: "",
    email: "",
    address: "",
    source: "Website",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({ open: false, message: "", severity: "success" });

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await publicLeadsApi.create({
        ...form,
        organisation_name: String(form.organisation_name ?? "").trim() || null,
        contact_name: String(form.contact_name ?? "").trim(),
        phone: String(form.phone ?? "").trim() || null,
        email: String(form.email ?? "").trim() || null,
        address: String(form.address ?? "").trim() || null,
        notes: String(form.notes ?? "").trim() || null,
      });
      setToast({ open: true, message: `Lead submitted successfully${res.lead_code ? ` (${res.lead_code})` : ""}.`, severity: "success" });
      setForm({ lead_type: "UNDECIDED", organisation_name: "", contact_name: "", phone: "", email: "", address: "", source: "Website", notes: "" });
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to submit lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 }, maxWidth: 1040, mx: "auto", width: "100%" }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h4" fontWeight={950}>
            Lead Form
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Share basic information first. Our team will complete the employer or associate partner profile after review.
          </Typography>
        </Box>

        {error ? <AdAlertBox severity="error" title="Submission failed" message={error} onClose={() => setError(null)} /> : null}

        <AdCard animate={false} sx={{ borderRadius: 0, boxShadow: "none", border: "1px solid rgba(15,23,42,0.10)" }} contentSx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            <AdDropDown
              label="Lead Type"
              options={leadTypeOptions}
              value={form.lead_type ?? "UNDECIDED"}
              onChange={(value) => setForm((prev) => ({ ...prev, lead_type: value as LeadType }))}
            />
            <TextField label="Organisation" value={form.organisation_name ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, organisation_name: e.target.value }))} />
            <TextField label="Contact Name" required value={form.contact_name ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, contact_name: e.target.value }))} />
            <TextField
              label="Phone"
              value={form.phone ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, "").slice(0, 15) }))}
            />
            <TextField label="Email" type="email" value={form.email ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
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
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
            <AdButton onClick={submit} disabled={saving}>
              {saving ? "Submitting..." : "Submit Lead"}
            </AdButton>
          </Stack>
        </AdCard>
      </Stack>
    </Box>
  );
}
