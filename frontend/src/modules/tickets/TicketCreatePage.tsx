import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Chip, Divider, Stack, Typography } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../common/auth/AuthContext";
import { AdButton, AdCard, AdDropDown, AdNotification, AdSearchableDropDown, AdTextArea, AdTextBox } from "../../common/ad";
import { candidateApi } from "../../common/services/candidateApi";
import { jobsApi, type JobListRow } from "../../common/services/jobsApi";
import { employeesApi } from "../../common/services/employeesApi";
import { ticketsApi, type TicketMeta } from "../../common/services/ticketsApi";
import { recruitmentApi } from "../../common/services/recruitmentApi";
import { withPortalBase } from "../../common/paths";

type TicketForm = {
  ticket_type_id: number | "";
  subject: string;
  description: string;
  priority: string;
  related_job_id: string;
  related_deployment_id: string;
  related_candidate_id: string;
  related_employee_id: string;
};

type AttachmentState = {
  file: File | null;
};

type ToastState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
};

const priorityOptions = [
  { label: "Low", value: "Low" },
  { label: "Normal", value: "Normal" },
  { label: "High", value: "High" },
  { label: "Urgent", value: "Urgent" },
];

function normalize(value: string | null | undefined) {
  return String(value ?? "").trim().toUpperCase();
}

function fileExt(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

export default function TicketCreatePage() {
  const navigate = useNavigate();
  const { me } = useAuth();
  const [meta, setMeta] = useState<TicketMeta | null>(null);
  const [openJobs, setOpenJobs] = useState<JobListRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [attachment, setAttachment] = useState<AttachmentState>({ file: null });
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [toast, setToast] = useState<ToastState>({ open: false, message: "", severity: "success" });
  const [form, setForm] = useState<TicketForm>({
    ticket_type_id: "",
    subject: "",
    description: "",
    priority: "Normal",
    related_job_id: "",
    related_deployment_id: "",
    related_candidate_id: "",
    related_employee_id: "",
  });

  const ticketTypeOptions = useMemo(() => {
    const allowed = (meta?.types ?? []).filter((t) => Number(t.can_create) === 1);
    if (allowed.length > 0) return allowed;
    return meta?.types ?? [];
  }, [meta?.types]);

  const roleCode = normalize(me?.role_code);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await ticketsApi.meta();
        if (alive) setMeta(res);
      } catch (e) {
        if (alive) {
          setToast({
            open: true,
            message: (e as any)?.message ?? "Failed to load ticket types",
            severity: "error",
          });
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (roleCode === "CANDIDATE") {
          const profile = await candidateApi.profile.me();
          if (!alive) return;
          setForm((prev) => ({
            ...prev,
            related_candidate_id: profile?.candidate_id ? String(profile.candidate_id) : prev.related_candidate_id,
          }));
        } else if (roleCode === "EMPLOYEE") {
          const profile = await employeesApi.me();
          if (!alive) return;
          setForm((prev) => ({
            ...prev,
            related_employee_id: profile?.employee_id ? String(profile.employee_id) : prev.related_employee_id,
          }));
        }
      } catch {
        // best effort auto-fill only
      }
    })();
    return () => {
      alive = false;
    };
  }, [roleCode]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await jobsApi.list();
        if (!alive) return;
        setOpenJobs(rows.filter((job) => normalize(job.status) === "OPEN"));
      } catch {
        if (alive) setOpenJobs([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const saveTicket = async () => {
    if (!form.ticket_type_id || !String(form.subject).trim()) {
      setToast({ open: true, message: "Ticket type and subject are required", severity: "warning" });
      return;
    }
    setSaving(true);
    try {
      let attachmentFilePath: string | null = null;
      let attachmentFileName: string | null = null;
      if (attachment.file) {
        setAttachmentUploading(true);
        const objectKey = `tickets/create/${Date.now()}${fileExt(attachment.file.name) || ""}`;
        const presign = await recruitmentApi.files.presignUpload(objectKey);
        const put = await fetch(presign.url, {
          method: "PUT",
          headers: { "Content-Type": attachment.file.type || "application/octet-stream" },
          body: attachment.file,
        });
        if (!put.ok) throw new Error(`Attachment upload failed (${put.status})`);
        attachmentFilePath = objectKey;
        attachmentFileName = attachment.file.name;
      }

      const created = await ticketsApi.create({
        ticket_type_id: Number(form.ticket_type_id),
        subject: form.subject,
        description: form.description || null,
        priority: form.priority,
        related_job_id: form.related_job_id ? Number(form.related_job_id) : null,
        related_deployment_id: form.related_deployment_id ? Number(form.related_deployment_id) : null,
        related_candidate_id: form.related_candidate_id ? Number(form.related_candidate_id) : null,
        related_employee_id: form.related_employee_id ? Number(form.related_employee_id) : null,
        attachment_file_path: attachmentFilePath,
        attachment_file_name: attachmentFileName,
      });

      setToast({ open: true, message: `Ticket ${created.ticket_code} created`, severity: "success" });
      navigate(withPortalBase("/helpdesk/open"));
    } catch (e) {
      setToast({
        open: true,
        message: (e as any)?.message ?? "Failed to create ticket",
        severity: "error",
      });
    } finally {
      setAttachmentUploading(false);
      setSaving(false);
    }
  };

  return (
    <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 1520, mx: "auto", overflowX: "hidden", minWidth: 0, px: { xs: 1, md: 2 }, py: { xs: 1, md: 1.5 } }}>
      <AdNotification
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />

      <AdCard
        animate={false}
        title="Create Token"
        subtitle="Raise a new ticket from this page"
        headerRight={
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <AdButton variant="text" onClick={() => navigate(withPortalBase("/helpdesk/open"))}>
              Back
            </AdButton>
            <AdButton onClick={saveTicket} loading={saving}>
              Create Token
            </AdButton>
          </Stack>
        }
        sx={{ backgroundColor: "rgba(255,255,255,0.72)", minWidth: 0 }}
        contentSx={{ p: { xs: 1.5, md: 2 } }}
      >
        <Stack spacing={1.5}>
          {meta === null ? null : null}

          <Box
            sx={{
              display: "grid",
              gap: 1.25,
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              alignItems: "start",
            }}
          >
            <AdDropDown
              variant="standard"
              label="Ticket Type"
              required
              value={form.ticket_type_id}
              options={ticketTypeOptions.map((t) => ({ label: t.ticket_type_name, value: t.ticket_type_id }))}
              onChange={(value) => setForm((prev) => ({ ...prev, ticket_type_id: Number(value) || "" }))}
            />
            <AdTextBox
              variant="standard"
              label="Subject"
              required
              size="small"
              value={form.subject}
              onChange={(value) => setForm((prev) => ({ ...prev, subject: String(value) }))}
            />
            <AdDropDown
              variant="standard"
              label="Priority"
              value={form.priority}
              options={priorityOptions}
              onChange={(value) => setForm((prev) => ({ ...prev, priority: String(value) }))}
            />
            <Box sx={{ gridColumn: { xs: "1 / -1", md: "1 / -1" } }}>
              <AdTextArea
                label="Description"
                minRows={4}
                value={form.description}
                onChange={(value) => setForm((prev) => ({ ...prev, description: String(value) }))}
              />
            </Box>
          </Box>

          <Divider />

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={900}>
                Optional Links
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Connect this token to a job, deployment, candidate, or employee.
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 1.25,
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            }}
          >
            <AdSearchableDropDown
              variant="standard"
              label="Job ID"
              value={form.related_job_id}
              options={openJobs.map((job) => ({
                label: `${job.job_code ?? `Job #${job.job_id}`} - ${job.job_title}`,
                value: job.job_id,
              }))}
              helperText="Only open jobs are shown here."
              onChange={(value) => setForm((prev) => ({ ...prev, related_job_id: String(value) }))}
            />
            <AdTextBox
              variant="standard"
              label="Deployment ID"
              type="number"
              size="small"
              value={form.related_deployment_id}
              onChange={(value) => setForm((prev) => ({ ...prev, related_deployment_id: String(value) }))}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              borderTop: "1px solid",
              borderColor: "divider",
              pt: 1.5,
            }}
          >
            <Typography variant="subtitle2" fontWeight={900}>
              Attachment
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
              <AdButton component="label" variant="outlined" startIcon={<UploadFileIcon fontSize="small" />}>
                Choose File
                <input
                  hidden
                  type="file"
                  onChange={(e) => setAttachment({ file: e.target.files?.[0] ?? null })}
                />
              </AdButton>
              {attachment.file ? <Chip size="small" color="info" label={attachment.file.name} /> : null}
            </Stack>
          </Box>

          <Alert severity="info" sx={{ py: 0.5 }}>
            Saved tokens appear instantly in the open list.
          </Alert>
        </Stack>
      </AdCard>
    </Stack>
  );
}
