import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Chip, Divider, MenuItem, Stack, TextField, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { AdAlertBox, AdButton, AdCard, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { associatePortalApi, type AssociateApplicationDocRow, type AssociateCandidateRow, type AssociateJobDocRow } from "../../common/services/associatePortalApi";
import { jobsApi, type JobDetail, type JobListRow } from "../../common/services/jobsApi";
import { recruitmentApi } from "../../common/services/recruitmentApi";

function fileExt(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx < 0) return "";
  return name.slice(idx).toLowerCase();
}

function docKey(doc: AssociateApplicationDocRow | AssociateJobDocRow): number {
  return Number(doc.job_specific_document_id ?? doc.document_type_id ?? 0);
}

function latestDocs(rows: Array<AssociateApplicationDocRow | AssociateJobDocRow>): Array<AssociateApplicationDocRow | AssociateJobDocRow> {
  const byType = new Map<number, AssociateApplicationDocRow | AssociateJobDocRow>();
  for (const row of rows) {
    const key = docKey(row);
    const existing = byType.get(key);
    if (!existing) {
      byType.set(key, row);
      continue;
    }
    const aTime = "uploaded_at" in existing && existing.uploaded_at ? new Date(existing.uploaded_at).getTime() : 0;
    const bTime = "uploaded_at" in row && row.uploaded_at ? new Date(row.uploaded_at).getTime() : 0;
    if (bTime > aTime) {
      byType.set(key, row);
      continue;
    }
    if (bTime === aTime) {
      const aId = "id" in existing ? existing.id ?? 0 : 0;
      const bId = "id" in row ? row.id ?? 0 : 0;
      if (bId > aId) byType.set(key, row);
    }
  }
  return Array.from(byType.values());
}

function hasCandidateProfileDocument(candidate: AssociateCandidateRow | null, documentName: string): boolean {
  if (!candidate) return false;
  const name = String(documentName ?? "").toLowerCase();
  const rules: Array<{ keys: string[]; value: unknown }> = [
    { keys: ["resume", "cv"], value: candidate.resume_file_path },
    { keys: ["passport"], value: candidate.passport_file_path },
    { keys: ["aadhar", "aadhaar"], value: candidate.aadhar_file_path },
    { keys: ["pan"], value: candidate.pan_file_path },
    { keys: ["voter"], value: candidate.voter_id_file_path },
    { keys: ["photo", "profile image", "profile photo"], value: candidate.profile_photo_file_path },
  ];
  return rules.some((rule) => rule.keys.some((key) => name.includes(key)) && Boolean(String(rule.value ?? "").trim()));
}

function getMissingProfileFields(candidate: AssociateCandidateRow | null): string[] {
  if (!candidate) return ["Candidate"];
  const required: Array<[keyof AssociateCandidateRow, string]> = [
    ["first_name", "First Name"],
    ["last_name", "Last Name"],
    ["phone", "Mobile"],
    ["email", "Email"],
    ["passport_number", "Passport Number"],
    ["country_id", "Country"],
    ["state_id", "State"],
    ["city_id", "City"],
    ["father_name", "Father's Name"],
    ["pincode", "Pincode"],
    ["dob", "Date of Birth"],
    ["gender", "Gender"],
    ["skills", "Skills"],
    ["education", "Education"],
    ["experience", "Experience"],
    ["industry_type", "Industry Type"],
    ["resume_file_path", "Resume Upload"],
    ["passport_expiry_date", "Passport Expiry Date"],
    ["passport_file_path", "Passport Upload"],
    ["aadhar_number", "Aadhar Number"],
    ["aadhar_file_path", "Aadhar Upload"],
    ["pan_number", "PAN Number"],
    ["pan_file_path", "PAN Upload"],
    ["voter_id_number", "Voter ID Number"],
    ["voter_id_file_path", "Voter ID Upload"],
    ["profile_photo_file_path", "Profile Photo"],
    ["languages_known", "Languages Known"],
  ];
  const missing: string[] = [];
  for (const [key, label] of required) {
    const value = candidate[key];
    const ok = value != null && String(value).trim().length > 0;
    if (!ok) missing.push(label);
  }
  return missing;
}

export default function AssociateApplyCandidatesPage() {
  const [candidates, setCandidates] = useState<AssociateCandidateRow[]>([]);
  const [jobs, setJobs] = useState<JobListRow[]>([]);
  const [candidateId, setCandidateId] = useState("");
  const [jobId, setJobId] = useState("");
  const [jobDetail, setJobDetail] = useState<JobDetail | null>(null);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [applicationDocs, setApplicationDocs] = useState<AssociateApplicationDocRow[]>([]);
  const [jobDocs, setJobDocs] = useState<AssociateJobDocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobLoading, setJobLoading] = useState(false);
  const [appLoading, setAppLoading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [candidateRows, jobRows] = await Promise.all([
          associatePortalApi.candidates.list(),
          jobsApi.preview({ status: "Open" }),
        ]);
        setCandidates(candidateRows);
        setJobs(jobRows);
        setCandidateId(candidateRows[0]?.candidate_id ? String(candidateRows[0].candidate_id) : "");
        setJobId(jobRows[0]?.job_id ? String(jobRows[0].job_id) : "");
      } catch (e: any) {
        setError((e as ApiError)?.message ?? "Failed to load candidate application options");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedCandidate = useMemo(
    () => candidates.find((c) => String(c.candidate_id) === String(candidateId)) ?? null,
    [candidateId, candidates],
  );
  const selectedJob = useMemo(
    () => jobs.find((j) => String(j.job_id) === String(jobId)) ?? null,
    [jobId, jobs],
  );

  const candidateOptions = useMemo(
    () =>
      candidates.map((c) => ({
        label: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || c.candidate_code || `Candidate #${c.candidate_id}`,
        value: String(c.candidate_id),
      })),
    [candidates],
  );
  const jobOptions = useMemo(
    () => jobs.map((j) => ({ label: `${j.job_title}${j.partner_name ? ` • ${j.partner_name}` : ""}`, value: String(j.job_id) })),
    [jobs],
  );

  const candidateMissingFields = useMemo(() => getMissingProfileFields(selectedCandidate), [selectedCandidate]);
  const candidateProfileReady = candidateMissingFields.length === 0;

  const resolvedDocs = useMemo(() => {
    const profilePathMap: Array<[string[], string | null | undefined]> = selectedCandidate
      ? [
          [["resume", "cv"], selectedCandidate.resume_file_path],
          [["passport"], selectedCandidate.passport_file_path],
          [["aadhar", "aadhaar"], selectedCandidate.aadhar_file_path],
          [["pan"], selectedCandidate.pan_file_path],
          [["voter"], selectedCandidate.voter_id_file_path],
          [["photo", "profile photo"], selectedCandidate.profile_photo_file_path],
        ]
      : [];

    const combined = [...applicationDocs, ...jobDocs];
    return latestDocs(
      combined.map((doc) => {
        if (String(doc.file_path ?? "").trim()) return doc;
        if (!selectedCandidate) return doc;
        const name = String(doc.document_name ?? "").toLowerCase();
        const matched = profilePathMap.find(([keys, path]) => path && keys.some((k) => name.includes(k)));
        if (!matched) return doc;
        return { ...doc, file_path: matched[1] ?? doc.file_path } as AssociateApplicationDocRow | AssociateJobDocRow;
      }),
    );
  }, [applicationDocs, jobDocs, selectedCandidate]);

  const missingDocNames = useMemo(
    () =>
      resolvedDocs
        .filter((d) => Number(d.job_is_required) === 1 && !String(d.file_path ?? "").trim())
        .map((d) => d.document_name),
    [resolvedDocs],
  );

  const loadJobDetail = async (id: number) => {
    if (!Number.isFinite(id) || id <= 0) return;
    setJobLoading(true);
    try {
      setJobDetail(await jobsApi.get(id));
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load job detail", severity: "error" });
    } finally {
      setJobLoading(false);
    }
  };

  useEffect(() => {
    if (!jobId) {
      setJobDetail(null);
      return;
    }
    void loadJobDetail(Number(jobId));
  }, [jobId]);

  const startApplication = async () => {
    if (!candidateId || !jobId) return;
    setAppLoading(true);
    setError(null);
    try {
      const res = await associatePortalApi.candidates.startApplication(Number(candidateId), {
        job_id: Number(jobId),
        status: "Draft",
      });
      setApplicationId(res.application_id);
      const payload = await associatePortalApi.candidates.applicationDocuments(Number(candidateId), res.application_id);
      setApplicationStatus(payload.application.status);
      setApplicationDocs(payload.documents);
      setJobDocs(payload.job_documents);
      setToast({ open: true, message: `Draft application created (#${res.application_id})`, severity: "success" });
      await loadJobDetail(Number(jobId));
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to start application", severity: "error" });
    } finally {
      setAppLoading(false);
    }
  };

  const refreshDocs = async () => {
    if (!candidateId || !applicationId) return;
    setDocsLoading(true);
    try {
      const payload = await associatePortalApi.candidates.applicationDocuments(Number(candidateId), applicationId);
      setApplicationStatus(payload.application.status);
      setApplicationDocs(payload.documents);
      setJobDocs(payload.job_documents);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load documents", severity: "error" });
    } finally {
      setDocsLoading(false);
    }
  };

  const uploadForDoc = async (doc: AssociateApplicationDocRow | AssociateJobDocRow, file: File) => {
    if (!candidateId || !applicationId) return;
    try {
      const now = Date.now();
      const ext = fileExt(file.name);
      const key = docKey(doc);
      const folder = doc.job_specific_document_id ? "job-docs" : "candidate-docs";
      const objectKey = `applications/${applicationId}/${folder}/${key}/${now}${ext}`;

      const presign = await recruitmentApi.files.presignUpload(objectKey);
      const put = await fetch(presign.url, { method: "PUT", body: file });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);

      if (doc.job_specific_document_id) {
        await associatePortalApi.candidates.upsertApplicationJobDocument(
          Number(candidateId),
          applicationId,
          doc.job_specific_document_id,
          objectKey,
        );
      } else if (doc.document_type_id) {
        await associatePortalApi.candidates.upsertApplicationDocument(
          Number(candidateId),
          applicationId,
          doc.document_type_id,
          objectKey,
        );
      } else {
        throw new Error("Unknown document type");
      }

      setToast({ open: true, message: "Uploaded", severity: "success" });
      await refreshDocs();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Upload failed", severity: "error" });
    }
  };

  const openDoc = async (doc: AssociateApplicationDocRow | AssociateJobDocRow) => {
    if (!doc.file_path) return;
    try {
      const presign = await recruitmentApi.files.presignDownload(doc.file_path);
      window.open(presign.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to open file", severity: "error" });
    }
  };

  const submit = async () => {
    if (!candidateId || !applicationId) return;
    if (applyDisabledReason) return;
    setSubmitting(true);
    try {
      await associatePortalApi.candidates.submitApplication(Number(candidateId), applicationId);
      setToast({ open: true, message: "Application submitted successfully", severity: "success" });
      await refreshDocs();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Apply failed", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const applyDisabledReason = useMemo(() => {
    if (!selectedCandidate) return "Select a candidate.";
    if (!selectedJob) return "Select a job.";
    if (!candidateProfileReady) return `Complete the candidate profile first. Missing: ${candidateMissingFields.join(", ")}.`;
    if (jobLoading) return "Loading job detail...";
    if (!applicationId) return "Start the application first.";
    if (docsLoading) return "Loading documents...";
    if (missingDocNames.length) return `Upload all required documents: ${missingDocNames.join(", ")}.`;
    if (String(applicationStatus ?? "").toLowerCase() === "applied") return "You already applied for this job.";
    return null;
  }, [applicationId, applicationStatus, candidateMissingFields, candidateProfileReady, docsLoading, jobLoading, missingDocNames, selectedCandidate, selectedJob]);

  const allDocs = useMemo(() => latestDocs([...applicationDocs, ...jobDocs]), [applicationDocs, jobDocs]);

  return (
    <Stack spacing={2.5} sx={{ width: "100%", maxWidth: 1200, mx: "auto" }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      <Stack spacing={0.5}>
        <Typography variant="h5" fontWeight={900}>
          Apply Job Candidates
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Associate Partners can map a submitted candidate to an open job, upload required job documents, and submit the application without using the public candidate journey.
        </Typography>
      </Stack>

      {error ? <AdAlertBox severity="error" title="Error" message={error} /> : null}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.78)" }} contentSx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            <TextField select label="Candidate" value={candidateId} onChange={(e) => setCandidateId(String(e.target.value))} disabled={loading}>
              <MenuItem value="">Select candidate</MenuItem>
              {candidateOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Open Job" value={jobId} onChange={(e) => setJobId(String(e.target.value))} disabled={loading}>
              <MenuItem value="">Select job</MenuItem>
              {jobOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <AdButton onClick={startApplication} disabled={appLoading || !candidateId || !jobId}>
              {appLoading ? "Starting..." : applicationId ? "Reload Draft" : "Start Draft Application"}
            </AdButton>
            <AdButton variant="outlined" onClick={refreshDocs} disabled={!applicationId || docsLoading}>
              Refresh Documents
            </AdButton>
          </Stack>

          <Alert severity="info">
            The application is saved as a draft first. Upload any missing required documents, then finalize the application from this screen.
          </Alert>
        </Stack>
      </AdCard>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2.5 }}>
        <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.82)" }} contentSx={{ p: 2.5 }}>
          <Stack spacing={1.25}>
            <Typography fontWeight={950}>Candidate Ready Check</Typography>
            <Typography variant="body2" color="text.secondary">
              This candidate is taken from the associate flow and should already be fully prepared before application.
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip size="small" label={selectedCandidate ? `Candidate #${selectedCandidate.candidate_id}` : "No candidate selected"} />
              <Chip size="small" color={candidateProfileReady ? "success" : "warning"} label={candidateProfileReady ? "Profile complete" : `${candidateMissingFields.length} missing fields`} />
              <Chip size="small" color={selectedCandidate?.is_verified ? "success" : "default"} label={selectedCandidate?.is_verified ? "Verified" : "Not verified"} />
            </Stack>
            {selectedCandidate ? (
              <Box sx={{ p: 1.5, border: "1px solid rgba(148,163,184,0.24)", borderRadius: 2, backgroundColor: "rgba(248,250,252,0.92)" }}>
                <Typography fontWeight={900}>
                  {[selectedCandidate.first_name, selectedCandidate.last_name].filter(Boolean).join(" ") || selectedCandidate.candidate_code || "Candidate"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedCandidate.phone ?? "No mobile"} {selectedCandidate.email ? `• ${selectedCandidate.email}` : ""}
                </Typography>
                {candidateMissingFields.length ? (
                  <Typography variant="caption" color="text.secondary">
                    Missing: {candidateMissingFields.join(", ")}
                  </Typography>
                ) : null}
              </Box>
            ) : null}
          </Stack>
        </AdCard>

        <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.82)" }} contentSx={{ p: 2.5 }}>
          <Stack spacing={1.25}>
            <Typography fontWeight={950}>Job Summary</Typography>
            {jobLoading ? <Typography variant="body2">Loading job detail...</Typography> : null}
            {selectedJob ? (
              <Box sx={{ p: 1.5, border: "1px solid rgba(148,163,184,0.24)", borderRadius: 2, backgroundColor: "rgba(248,250,252,0.92)" }}>
                <Typography fontWeight={900}>{selectedJob.job_title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedJob.job_code ?? `Job #${selectedJob.job_id}`} {selectedJob.partner_name ? `• ${selectedJob.partner_name}` : ""}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                  <Chip size="small" label={`${jobDetail?.documents?.length ?? 0} standard docs`} />
                  <Chip size="small" label={`${jobDetail?.job_specific_documents?.length ?? 0} job docs`} />
                  <Chip size="small" label={selectedJob.status ?? "Open"} />
                </Stack>
              </Box>
            ) : null}
            {jobDetail?.job_specific_documents?.length ? (
              <Typography variant="caption" color="text.secondary">
                Job-specific documents are uploaded below after the draft is created.
              </Typography>
            ) : null}
          </Stack>
        </AdCard>
      </Box>

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.86)" }} contentSx={{ p: 2.5 }}>
        <Stack spacing={1.5}>
          <Box>
            <Typography fontWeight={950}>Documents</Typography>
            <Typography variant="body2" color="text.secondary">
              Upload all required candidate and job-specific documents here before final submission.
            </Typography>
          </Box>

          {docsLoading ? <Typography>Loading documents...</Typography> : null}

          {!docsLoading && !allDocs.length ? <Alert severity="warning">No job documents found for this application.</Alert> : null}

          <Stack spacing={1.25}>
            {allDocs.map((d) => (
              <Box
                key={docKey(d)}
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
                        if (f) void uploadForDoc(d, f);
                        e.currentTarget.value = "";
                      }}
                    />
                  </AdButton>
                </Stack>
              </Box>
            ))}
          </Stack>

          {applicationId ? (
            <Box sx={{ pt: 0.5 }}>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                <Chip size="small" label={`Draft #${applicationId}`} />
                <Chip size="small" color={String(applicationStatus ?? "").toLowerCase() === "applied" ? "success" : "default"} label={applicationStatus ?? "Draft"} />
                {missingDocNames.length ? <Chip size="small" color="warning" label={`${missingDocNames.length} required pending`} /> : <Chip size="small" color="success" label="Ready to submit" />}
              </Stack>
              {applyDisabledReason ? <Alert severity="info">{applyDisabledReason}</Alert> : null}
            </Box>
          ) : null}
        </Stack>
      </AdCard>

      <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pb: 2 }}>
        <AdButton variant="outlined" onClick={refreshDocs} disabled={!applicationId || docsLoading}>
          Refresh
        </AdButton>
        <AdButton onClick={submit} disabled={Boolean(applyDisabledReason) || submitting}>
          {submitting ? "Applying..." : "Apply Candidate"}
        </AdButton>
      </Stack>
    </Stack>
  );
}
