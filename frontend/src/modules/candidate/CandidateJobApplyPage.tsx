import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Alert, Box, Chip, Divider, Stack, Typography } from "@mui/material";
import { AdButton, AdCard, AdCheckBox, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { candidateApi, type CandidateApplicationDocRow, type CandidateApplicationRow } from "../../common/services/candidateApi";
import { jobsApi, type JobDetail } from "../../common/services/jobsApi";
import { recruitmentApi } from "../../common/services/recruitmentApi";

function fileExt(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx < 0) return "";
  return name.slice(idx).toLowerCase();
}

function isRequiredMissing(docs: CandidateApplicationDocRow[]): boolean {
  return docs.some((d) => Number(d.job_is_required) === 1 && !String(d.file_path ?? "").trim());
}

function moneyRange(min: string | null, max: string | null) {
  const a = String(min ?? "").trim();
  const b = String(max ?? "").trim();
  if (!a && !b) return null;
  if (a && b) return `${a} - ${b}`;
  return a || b;
}

export default function CandidateJobApplyPage() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const id = Number(jobId);

  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [job, setJob] = useState<JobDetail | null>(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);

  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [application, setApplication] = useState<CandidateApplicationRow | null>(null);
  const [appLoading, setAppLoading] = useState(false);

  const [docs, setDocs] = useState<CandidateApplicationDocRow[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const applyDisabledReason = useMemo(() => {
    if (!applicationId) return "Start application to continue.";
    if (docsLoading) return "Loading documents...";
    if (isRequiredMissing(docs)) return "Upload all required documents.";
    if (!consent) return "Consent is required.";
    if (String(application?.status ?? "").toLowerCase() === "applied") return "You already applied for this job.";
    return null;
  }, [application?.status, applicationId, consent, docs, docsLoading]);

  const loadJob = async () => {
    if (!Number.isFinite(id) || id <= 0) return;
    setJobLoading(true);
    setJobError(null);
    try {
      setJob(await jobsApi.get(id));
    } catch (e: any) {
      setJob(null);
      setJobError((e as ApiError)?.message ?? "Failed to load job");
    } finally {
      setJobLoading(false);
    }
  };

  const loadApp = async (application_id: number) => {
    try {
      setApplication(await candidateApi.applications.get(application_id));
    } catch {
      setApplication(null);
    }
  };

  const loadDocs = async (application_id: number) => {
    setDocsLoading(true);
    try {
      setDocs(await candidateApi.applications.documents(application_id));
    } catch (e: any) {
      setDocs([]);
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load documents", severity: "error" });
    } finally {
      setDocsLoading(false);
    }
  };

  const start = async () => {
    if (!Number.isFinite(id) || id <= 0) return;
    setAppLoading(true);
    try {
      const res = await candidateApi.applications.start(id);
      setApplicationId(res.application_id);
      await Promise.all([loadApp(res.application_id), loadDocs(res.application_id)]);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to start application", severity: "error" });
    } finally {
      setAppLoading(false);
    }
  };

  const uploadForDoc = async (doc: CandidateApplicationDocRow, file: File) => {
    if (!applicationId) return;
    try {
      const now = Date.now();
      const ext = fileExt(file.name);
      const objectKey = `applications/${applicationId}/docs/${doc.document_type_id}/${now}${ext}`;

      const presign = await recruitmentApi.files.presignUpload(objectKey);
      const put = await fetch(presign.url, { method: "PUT", body: file });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);

      await candidateApi.applications.upsertDocument(applicationId, doc.document_type_id, objectKey);
      setToast({ open: true, message: "Uploaded", severity: "success" });
      loadDocs(applicationId);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Upload failed", severity: "error" });
    }
  };

  const openDoc = async (doc: CandidateApplicationDocRow) => {
    if (!doc.file_path) return;
    try {
      const presign = await recruitmentApi.files.presignDownload(doc.file_path);
      window.open(presign.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to open file", severity: "error" });
    }
  };

  const submit = async () => {
    if (!applicationId) return;
    if (applyDisabledReason) return;
    setSubmitting(true);
    try {
      await candidateApi.applications.submit(applicationId);
      setToast({ open: true, message: "Applied successfully", severity: "success" });
      await loadApp(applicationId);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Apply failed", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }} justifyContent="space-between">
        <AdButton variant="text" startIcon={<ArrowBackIcon />} onClick={() => navigate("/portal/candidate/jobs")}>
          Back to Jobs
        </AdButton>

        <Stack direction="row" spacing={1} alignItems="center">
          {application?.status ? <Chip size="small" label={`Status: ${application.status}`} /> : null}
          {applicationId ? <Chip size="small" label={`App ID: ${applicationId}`} /> : null}
        </Stack>
      </Stack>

      {!Number.isFinite(id) || id <= 0 ? <Alert severity="warning">Invalid job id.</Alert> : null}
      {jobLoading ? <Alert severity="info">Loading job...</Alert> : null}
      {jobError ? <Alert severity="warning">{jobError}</Alert> : null}

      {job ? (
        <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
          <Stack spacing={1.25}>
            <Box>
              <Typography variant="h5" fontWeight={950}>
                {job.job.job_title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {job.job.job_code ? `Job Code: ${job.job.job_code}` : null}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              {job.job.status ? <Chip size="small" label={`Job Status: ${job.job.status}`} /> : null}
              {job.job.vacancy != null ? <Chip size="small" label={`${job.job.vacancy} vacancies`} /> : null}
              {moneyRange(job.job.salary_min, job.job.salary_max) ? (
                <Chip size="small" label={`Salary: ${moneyRange(job.job.salary_min, job.job.salary_max)}`} />
              ) : null}
              {job.locations?.length ? <Chip size="small" label={`${job.locations.length} location(s)`} /> : null}
              {job.documents?.length ? <Chip size="small" label={`${job.documents.length} document(s)`} /> : null}
            </Stack>

            {job.job.job_description ? (
              <>
                <Divider />
                <Box>
                  <Typography fontWeight={950}>Job Description</Typography>
                  <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary", whiteSpace: "pre-wrap" }}>
                    {job.job.job_description}
                  </Typography>
                </Box>
              </>
            ) : null}

            {job.requirements?.length ? (
              <>
                <Divider />
                <Box>
                  <Typography fontWeight={950}>Requirements</Typography>
                  <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                    {job.requirements.map((r) => (
                      <Typography key={r.requirement_id} variant="body2" sx={{ color: "text.secondary" }}>
                        • {r.requirement}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              </>
            ) : null}

            {job.benefits?.length ? (
              <>
                <Divider />
                <Box>
                  <Typography fontWeight={950}>Benefits</Typography>
                  <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                    {job.benefits.map((b) => (
                      <Typography key={b.benefit_id} variant="body2" sx={{ color: "text.secondary" }}>
                        • {b.benefit}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              </>
            ) : null}

            {job.documents?.length ? (
              <>
                <Divider />
                <Box>
                  <Typography fontWeight={950}>Required Documents (Job)</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.75 }}>
                    {job.documents.map((d) => (
                      <Chip
                        key={d.document_type_id}
                        size="small"
                        label={`${d.document_name}${Number(d.is_required) ? " • Required" : " • Optional"}`}
                        color={Number(d.is_required) ? "primary" : "default"}
                      />
                    ))}
                  </Stack>
                </Box>
              </>
            ) : null}

            {job.locations?.length ? (
              <>
                <Divider />
                <Box>
                  <Typography fontWeight={950}>Locations</Typography>
                  <Stack spacing={1} sx={{ mt: 0.75 }}>
                    {job.locations.map((l) => (
                      <AdCard
                        key={l.id}
                        animate={false}
                        contentSx={{ p: 1.5 }}
                        sx={{ backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 3 }}
                      >
                        <Stack spacing={0.5}>
                          <Typography fontWeight={900}>
                            {[l.city_name, l.state_name, l.country_name].filter(Boolean).join(", ") || "Location"}
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {l.vacancy != null ? <Chip size="small" label={`${l.vacancy} vacancies`} /> : null}
                            {moneyRange(l.salary_min, l.salary_max) ? (
                              <Chip size="small" label={`Salary: ${moneyRange(l.salary_min, l.salary_max)}`} />
                            ) : null}
                          </Stack>
                        </Stack>
                      </AdCard>
                    ))}
                  </Stack>
                </Box>
              </>
            ) : null}

            {job.status_history?.length ? (
              <>
                <Divider />
                <Box>
                  <Typography fontWeight={950}>Status History</Typography>
                  <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                    {job.status_history.map((h) => (
                      <Typography key={h.id} variant="body2" sx={{ color: "text.secondary" }}>
                        • {h.changed_at}: {h.status ?? "—"}
                        {h.remarks ? ` — ${h.remarks}` : ""}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              </>
            ) : null}
          </Stack>
        </AdCard>
      ) : null}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ md: "center" }}>
            <Box>
              <Typography fontWeight={950}>Documents</Typography>
              <Typography variant="body2" color="text.secondary">
                Upload all required documents first.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <AdButton variant="outlined" disabled={appLoading || !Number.isFinite(id) || id <= 0} onClick={start}>
                {applicationId ? "Refresh" : appLoading ? "Starting..." : "Start Application"}
              </AdButton>
              <AdButton variant="contained" disabled={Boolean(applyDisabledReason) || submitting} onClick={submit}>
                {submitting ? "Applying..." : "Apply (with consent)"}
              </AdButton>
            </Stack>
          </Stack>

          {applyDisabledReason ? <Alert severity="info">{applyDisabledReason}</Alert> : null}

          {!applicationId ? <Alert severity="warning">Click “Start Application” to unlock document uploads.</Alert> : null}
          {docsLoading ? <Typography>Loading documents...</Typography> : null}

          {!docsLoading && applicationId && !docs.length ? (
            <Alert severity="warning">No job documents found for this application.</Alert>
          ) : null}

          {docs.map((d) => (
            <AdCard
              key={d.document_type_id}
              animate={false}
              contentSx={{ p: 1.75 }}
              sx={{ backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 3 }}
            >
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }} justifyContent="space-between">
                {(() => {
                  const filePath = String(d.file_path ?? "");
                  const isPrev =
                    Boolean(filePath) &&
                    (Number(d.is_reused ?? 0) === 1 ||
                      (applicationId ? !filePath.includes(`applications/${applicationId}/docs/`) : false));
                  return (
                <Stack spacing={0.25}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography fontWeight={900}>{d.document_name}</Typography>
                    {Number(d.job_is_required) ? <Chip size="small" label="Required" color="primary" /> : <Chip size="small" label="Optional" />}
                    {d.file_path ? <Chip size="small" label="Uploaded" color="success" /> : <Chip size="small" label="Pending" />}
                    {d.file_path && isPrev ? <Chip size="small" label="Previously uploaded" /> : null}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {isPrev && d.reused_from_uploaded_at
                      ? `Previously uploaded at: ${d.reused_from_uploaded_at}`
                      : d.uploaded_at
                        ? `Uploaded at: ${d.uploaded_at}`
                        : "Not uploaded yet"}
                  </Typography>
                </Stack>
                  );
                })()}

                <Stack direction="row" spacing={1}>
                  {d.file_path ? (
                    <AdButton variant="text" startIcon={<OpenInNewIcon fontSize="small" />} onClick={() => openDoc(d)}>
                      View
                    </AdButton>
                  ) : null}

                  <AdButton component="label" startIcon={<UploadFileIcon fontSize="small" />} disabled={!applicationId}>
                    {d.file_path ? "Update" : "Upload"}
                    <input
                      type="file"
                      hidden
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadForDoc(d, f);
                        e.currentTarget.value = "";
                      }}
                    />
                  </AdButton>
                </Stack>
              </Stack>
            </AdCard>
          ))}

          <Divider />

          <AdCheckBox
            label="I confirm the above information and documents are correct, and I consent to submit this application."
            checked={consent}
            onChange={setConsent}
            disabled={!applicationId || docsLoading}
          />
        </Stack>
      </AdCard>
    </Stack>
  );
}
