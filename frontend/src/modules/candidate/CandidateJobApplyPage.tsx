import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Alert, Box, Button, Chip, Container, Divider, Stack, Typography } from "@mui/material";
import { AdButton, AdCard, AdCheckBox, AdNotification, AdRichTextContent } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { candidateApi, type CandidateApplicationDocRow, type CandidateApplicationRow } from "../../common/services/candidateApi";
import { jobsApi, type JobDetail } from "../../common/services/jobsApi";
import { recruitmentApi } from "../../common/services/recruitmentApi";

function fileExt(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx < 0) return "";
  return name.slice(idx).toLowerCase();
}

function docKey(doc: CandidateApplicationDocRow): number {
  return Number(doc.job_specific_document_id ?? doc.document_type_id ?? 0);
}

function moneyRange(min: string | null, max: string | null) {
  const a = String(min ?? "").trim();
  const b = String(max ?? "").trim();
  if (!a && !b) return null;
  if (a && b) return `${a} - ${b}`;
  return a || b;
}

function latestDocs(rows: CandidateApplicationDocRow[]): CandidateApplicationDocRow[] {
  const byType = new Map<number, CandidateApplicationDocRow>();
  for (const row of rows) {
    const key = docKey(row);
    const existing = byType.get(key);
    if (!existing) {
      byType.set(key, row);
      continue;
    }
    const aTime = existing.uploaded_at ? new Date(existing.uploaded_at).getTime() : 0;
    const bTime = row.uploaded_at ? new Date(row.uploaded_at).getTime() : 0;
    if (bTime > aTime) {
      byType.set(key, row);
      continue;
    }
    if (bTime === aTime) {
      const aId = existing.candidate_document_id ?? 0;
      const bId = row.candidate_document_id ?? 0;
      if (bId > aId) byType.set(key, row);
    }
  }
  return Array.from(byType.values());
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
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof candidateApi.profile.me>> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const profileComplete = Boolean(profile?.profile_complete) && (profile?.missing_fields?.length ?? 0) === 0;

  const [docs, setDocs] = useState<CandidateApplicationDocRow[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resolvedDocs = useMemo(() => {
    const profilePathMap: Array<[string[], string | null | undefined]> = [
      [["resume", "cv"], profile?.resume_file_path],
      [["passport"], profile?.passport_file_path],
      [["aadhar", "aadhaar"], profile?.aadhar_file_path],
      [["pan"], profile?.pan_file_path],
      [["voter"], profile?.voter_id_file_path],
      [["photo", "profile photo"], profile?.profile_photo_file_path],
    ];

    return docs.map((doc) => {
      if (String(doc.file_path ?? "").trim()) return doc;
      if (doc.document_type_id == null) return doc;
      const name = String(doc.document_name ?? "").toLowerCase();
      const matched = profilePathMap.find(([keys, path]) => path && keys.some((k) => name.includes(k)));
      if (!matched) return doc;
      return { ...doc, file_path: matched[1] ?? doc.file_path };
    });
  }, [docs, profile]);

  const missingDocNames = useMemo(
    () =>
      resolvedDocs
        .filter((d) => Number(d.job_is_required) === 1 && !String(d.file_path ?? "").trim())
        .map((d) => d.document_name),
    [resolvedDocs],
  );

  const applyDisabledReason = useMemo(() => {
    if (profileLoading) return "Loading profile...";
    if (!profileComplete) {
      const missing = profile?.missing_fields?.length ? profile.missing_fields.join(", ") : "profile details and uploads";
      return `Complete your profile before applying. Missing: ${missing}.`;
    }
    if (!applicationId) return "Start application to continue.";
    if (docsLoading) return "Loading documents...";
    if (missingDocNames.length) return `Upload all required documents: ${missingDocNames.join(", ")}.`;
    if (!consent) return "Consent is required.";
    if (String(application?.status ?? "").toLowerCase() === "applied") return "You already applied for this job.";
    return null;
  }, [application?.status, applicationId, consent, docsLoading, missingDocNames, profile, profileComplete, profileLoading]);

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

  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      setProfile(await candidateApi.profile.me());
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
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
      const rows = await candidateApi.applications.documents(application_id);
      setDocs(latestDocs(rows));
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
      const key = docKey(doc);
      const folder = doc.job_specific_document_id ? "job-docs" : "docs";
      const objectKey = `applications/${applicationId}/${folder}/${key}/${now}${ext}`;

      const presign = await recruitmentApi.files.presignUpload(objectKey);
      const put = await fetch(presign.url, { method: "PUT", body: file });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);

      if (doc.job_specific_document_id) {
        await candidateApi.applications.upsertJobSpecificDocument(applicationId, doc.job_specific_document_id, objectKey);
      } else if (doc.document_type_id) {
        await candidateApi.applications.upsertDocument(applicationId, doc.document_type_id, objectKey);
      } else {
        throw new Error("Unknown document type");
      }
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

  const jobDocuments = useMemo(
    () => [...(job?.documents ?? []), ...(job?.job_specific_documents ?? [])],
    [job],
  );

  useEffect(() => {
    loadJob();
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5}>
        <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

        <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }} justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight={950} sx={{ letterSpacing: -0.6, lineHeight: 1.1 }}>
              Apply for Job
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Review the job, upload required documents, and submit your application.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            {application?.status ? <Chip size="small" label={`Status: ${application.status}`} /> : null}
            {applicationId ? <Chip size="small" label={`App ID: ${applicationId}`} /> : null}
            <AdButton variant="text" startIcon={<ArrowBackIcon />} onClick={() => navigate("/portal/candidate/jobs")}>
              Back to Jobs
            </AdButton>
          </Stack>
        </Stack>
        {!Number.isFinite(id) || id <= 0 ? <Alert severity="warning">Invalid job id.</Alert> : null}
        {jobLoading ? <Alert severity="info">Loading job...</Alert> : null}
        {jobError ? <Alert severity="warning">{jobError}</Alert> : null}
        {profileLoading ? <Alert severity="info">Loading profile...</Alert> : null}
        {!profileComplete ? (
          <Alert
            severity="warning"
            action={
              <Button color="inherit" size="small" onClick={() => navigate("/portal/candidate/profile/settings")}>
                Complete Profile
              </Button>
            }
          >
            Complete your profile before applying. Missing: {profile?.missing_fields?.join(", ") || "profile details and uploads"}.
          </Alert>
        ) : null}

        {!applicationId && job ? (
          <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.86)" }} contentSx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="h5" fontWeight={950} sx={{ lineHeight: 1.1 }}>
                  {job.job.job_title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {job.job.job_code ? `Job Code: ${job.job.job_code}` : "Job details"}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                {job.job.status ? <Chip size="small" label={`Job Status: ${job.job.status}`} /> : null}
                {job.job.vacancy != null ? <Chip size="small" label={`${job.job.vacancy} vacancies`} /> : null}
                {moneyRange(job.job.salary_min, job.job.salary_max) ? (
                  <Chip size="small" label={`Salary: ${moneyRange(job.job.salary_min, job.job.salary_max)}`} />
                ) : null}
                {job.locations?.length ? <Chip size="small" label={`${job.locations.length} location(s)`} /> : null}
                {jobDocuments.length ? <Chip size="small" label={`${jobDocuments.length} document(s)`} /> : null}
              </Stack>

              {job.job.job_description ? (
                <>
                  <Divider />
                  <Box>
                    <Typography fontWeight={950}>Job Description</Typography>
                    <Box sx={{ mt: 0.75 }}>
                      <AdRichTextContent html={job.job.job_description} />
                    </Box>
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
                          sx={{ backgroundColor: "rgba(255,255,255,0.82)", borderRadius: 0 }}
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

        <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.86)" }} contentSx={{ p: 2 }}>
          <Stack spacing={1.25}>
            <Box>
              <Typography fontWeight={950}>Application</Typography>
              <Typography variant="body2" color="text.secondary">
                Start the application, upload documents, and submit once everything is complete.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <AdButton variant="outlined" disabled={appLoading || !Number.isFinite(id) || id <= 0 || !profileComplete} onClick={start}>
                {applicationId ? "Refresh" : appLoading ? "Starting..." : "Start Application"}
              </AdButton>
              <AdButton variant="contained" disabled={Boolean(applyDisabledReason) || submitting} onClick={submit}>
                {submitting ? "Applying..." : "Apply (with consent)"}
              </AdButton>
            </Stack>

            <AdCheckBox
              label="I confirm the above information and documents are correct, and I consent to submit this application."
              checked={consent}
              onChange={setConsent}
              disabled={!applicationId || docsLoading}
            />

            {applyDisabledReason && applicationId ? <Alert severity="info">{applyDisabledReason}</Alert> : null}
          </Stack>
        </AdCard>

        {applicationId ? (
          <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.86)" }} contentSx={{ p: 2 }}>
            <Stack spacing={1.25}>
              <Box>
                <Typography fontWeight={950}>Documents</Typography>
                <Typography variant="body2" color="text.secondary">
                  Upload all required documents first.
                </Typography>
              </Box>

              {docsLoading ? <Typography>Loading documents...</Typography> : null}

              {!docsLoading && !resolvedDocs.length ? (
                <Alert severity="warning">No job documents found for this application.</Alert>
              ) : null}

              <Stack spacing={1}>
                {resolvedDocs.map((d) => (
                  <Box
                    key={d.document_type_id}
                    sx={{
                      p: 1.5,
                      border: "1px solid rgba(148,163,184,0.28)",
                      backgroundColor: "rgba(248,250,252,0.9)",
                      display: "flex",
                      alignItems: { xs: "stretch", md: "center" },
                      justifyContent: "space-between",
                      gap: 1,
                      flexDirection: { xs: "column", md: "row" },
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography fontWeight={900}>{d.document_name}</Typography>
                        {Number(d.job_is_required) ? <Chip size="small" label="Required" color="primary" /> : <Chip size="small" label="Optional" />}
                        {d.file_path ? <Chip size="small" label="Uploaded" color="success" /> : <Chip size="small" label="Pending" />}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {d.uploaded_at ? `Uploaded at: ${d.uploaded_at}` : "Not uploaded yet"}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
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
                  </Box>
                ))}
              </Stack>
          </Stack>
        </AdCard>
        ) : null}
      </Stack>
    </Container>
  );
}
