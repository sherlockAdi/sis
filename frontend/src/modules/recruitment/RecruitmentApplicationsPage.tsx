import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Drawer, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import DescriptionIcon from "@mui/icons-material/Description";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloseIcon from "@mui/icons-material/Close";
import dayjs, { type Dayjs } from "dayjs";
import { AdAlertBox, AdButton, AdCard, AdDateTimePicker, AdDropDown, AdGrid, AdModal, AdNotification, AdTextArea } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { jobsApi, type JobListRow } from "../../common/services/jobsApi";
import { recruitmentApi, type ApplicationDocRow, type ApplicationInterviewRow, type ApplicationRow, type CandidateRow } from "../../common/services/recruitmentApi";
import { mastersApi, type InterviewMode } from "../../common/services/mastersApi";
import { deploymentApi } from "../../common/services/deploymentApi";
import { formatJsonList } from "../../common/utils/jsonList";

function fileExt(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx < 0) return "";
  return name.slice(idx).toLowerCase();
}

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function isShortlistedStatus(value: string | null | undefined): boolean {
  const status = normalizeStatus(value);
  return status.includes("shortlist") || status === "ready";
}

function isInterviewStatus(value: string | null | undefined): boolean {
  return normalizeStatus(value).includes("interview");
}

function displayStatus(value: string | null | undefined): string {
  if (isShortlistedStatus(value)) return "Shortlisted";
  if (isInterviewStatus(value)) return "Interview";
  return String(value ?? "").trim() || "-";
}

function isRejectedStatus(value: string | null | undefined): boolean {
  return normalizeStatus(value).includes("reject");
}

type ApplicationViewRow = ApplicationRow & {
  partner_id: number | null;
  partner_name: string | null;
};

function formatValue(value: string | number | null | undefined): string {
  const text = String(value ?? "").trim();
  return text || "—";
}

function ProfileField({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 0.3,
        py: 0.75,
        borderBottom: "1px solid rgba(226,232,240,0.85)",
        "&:last-of-type": { borderBottom: 0 },
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.1 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.25, wordBreak: "break-word" }}>
        {formatValue(value)}
      </Typography>
    </Box>
  );
}

export default function RecruitmentApplicationsPage() {
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [jobs, setJobs] = useState<JobListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [docsOpen, setDocsOpen] = useState(false);
  const [activeApp, setActiveApp] = useState<ApplicationRow | null>(null);
  const [docs, setDocs] = useState<ApplicationDocRow[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [candidateError, setCandidateError] = useState<string | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<CandidateRow | null>(null);

  const [interviewsOpen, setInterviewsOpen] = useState(false);
  const [interviews, setInterviews] = useState<ApplicationInterviewRow[]>([]);
  const [interviewsLoading, setInterviewsLoading] = useState(false);
  const [modes, setModes] = useState<InterviewMode[]>([]);
  const [schedule, setSchedule] = useState<{ mode_id: string; date: Dayjs | null; remarks: string }>({
    mode_id: "",
    date: null,
    remarks: "",
  });
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [applicationsResult, jobsResult] = await Promise.allSettled([
        recruitmentApi.applications.list(),
        jobsApi.list(),
      ]);

      if (applicationsResult.status === "fulfilled") {
        setRows(applicationsResult.value);
      } else {
        throw applicationsResult.reason;
      }

      if (jobsResult.status === "fulfilled") {
        setJobs(jobsResult.value);
      } else {
        setJobs([]);
        setToast({ open: true, message: (jobsResult.reason as ApiError)?.message ?? "Failed to load job filter data", severity: "error" });
      }
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const loadDocs = async (application_id: number) => {
    setDocsLoading(true);
    try {
      setDocs(await recruitmentApi.applications.documents(application_id));
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load documents", severity: "error" });
    } finally {
      setDocsLoading(false);
    }
  };

  const loadInterviews = async (application_id: number) => {
    setInterviewsLoading(true);
    try {
      setInterviews(await recruitmentApi.applications.interviews(application_id));
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load interviews", severity: "error" });
    } finally {
      setInterviewsLoading(false);
    }
  };

  const openCandidateProfile = async (candidateId: number) => {
    setCandidateOpen(true);
    setCandidateLoading(true);
    setCandidateError(null);
    setCandidateProfile(null);
    try {
      setCandidateProfile(await recruitmentApi.candidates.get(candidateId));
    } catch (e: any) {
      setCandidateError((e as ApiError)?.message ?? "Failed to load candidate profile");
    } finally {
      setCandidateLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setModes(await mastersApi.interviewModes.list(true));
      } catch {
        setModes([]);
      }
    })();
  }, []);

  const cols = useMemo(
    () => [
      { field: "application_id", headerName: "App ID", width: 100 },
      {
        field: "candidate_name",
        headerName: "Candidate",
        flex: 1,
        minWidth: 180,
        renderCell: (p: any) => {
          const r = p.row as ApplicationViewRow;

          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                overflow: "hidden",
              }}
            >
              {/* Candidate Name */}
              <Typography
                fontWeight={800}
                noWrap
                sx={{
                  color: "primary.main",
                  cursor: "pointer",
                  flex: 1,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  openCandidateProfile(r.candidate_id);
                }}
              >
                {r.candidate_name}
              </Typography>

              {/* Doc Icon */}
              <Tooltip title="View Documents">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveApp(r);
                    setDocsOpen(true);
                    loadDocs(r.application_id);
                  }}
                  sx={{ ml: 1 }}
                >
                  <DescriptionIcon fontSize="small" color="primary" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
      { field: "partner_name", headerName: "Employer", flex: 1, minWidth: 180 },
      { field: "job_title", headerName: "Job", flex: 1, minWidth: 220 },
      { field: "application_date", headerName: "Date", width: 130 },
      {
        field: "status",
        headerName: "Status",
        width: 140,
        renderCell: (p: any) => {
          const label = displayStatus(p.value);
          const color = isShortlistedStatus(p.value) ? "success" : isInterviewStatus(p.value) ? "info" : "default";
          return <Chip size="small" label={label} color={color as any} />;
        },
      },
    ],
    [],
  );

  const uploadForDoc = async (doc: ApplicationDocRow, file: File) => {
    if (!activeApp) return;
    try {
      const now = Date.now();
      const ext = fileExt(file.name);
      const objectKey = `candidates/${activeApp.candidate_id}/applications/${activeApp.application_id}/docs/${doc.document_type_id}/${now}${ext}`;

      const presign = await recruitmentApi.files.presignUpload(objectKey);
      const put = await fetch(presign.url, { method: "PUT", body: file });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);

      await recruitmentApi.applications.upsertDocument(activeApp.application_id, doc.document_type_id, objectKey);
      setToast({ open: true, message: "Uploaded", severity: "success" });
      loadDocs(activeApp.application_id);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Upload failed", severity: "error" });
    }
  };

  const openDoc = async (doc: ApplicationDocRow) => {
    if (!doc.file_path) return;
    try {
      const presign = await recruitmentApi.files.presignDownload(doc.file_path);
      window.open(presign.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to open file", severity: "error" });
    }
  };

  const modeOptions = useMemo(
    () => [{ label: "— Select —", value: "" }].concat(modes.map((m) => ({ label: m.mode_name, value: String(m.interview_mode_id) }))),
    [modes],
  );

  const scheduleInterview = async () => {
    if (!activeApp) return;
    const interview_mode_id = schedule.mode_id ? Number(schedule.mode_id) : 0;
    if (!interview_mode_id) {
      setToast({ open: true, message: "Select interview mode", severity: "error" });
      return;
    }
    if (!schedule.date) {
      setToast({ open: true, message: "Select interview date/time", severity: "error" });
      return;
    }
    try {
      const interview_date = dayjs(schedule.date).format("YYYY-MM-DD HH:mm:ss");
      await recruitmentApi.applications.scheduleInterview(activeApp.application_id, {
        interview_mode_id,
        interview_date,
        remarks: schedule.remarks.trim() || null,
      });
      await recruitmentApi.applications.updateStatus(activeApp.application_id, "Interview");
      setToast({ open: true, message: "Interview scheduled", severity: "success" });
      loadInterviews(activeApp.application_id);
      setSchedule({ mode_id: "", date: null, remarks: "" });
      refresh();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to schedule interview", severity: "error" });
    }
  };

  const enrichedRows: ApplicationViewRow[] = useMemo(() => {
    const jobById = new Map<number, JobListRow>(jobs.map((job) => [job.job_id, job]));
    return rows.map((row) => {
      const job = jobById.get(row.job_id);
      return {
        ...row,
        partner_id: job?.partner_id ?? null,
        partner_name: job?.partner_name ?? null,
      };
    });
  }, [rows, jobs]);

  const partnerOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const row of enrichedRows) {
      if (row.partner_id == null) continue;
      seen.set(String(row.partner_id), row.partner_name?.trim() || `Employer #${row.partner_id}`);
    }
    return [{ label: "All Employers", value: "" }].concat(
      Array.from(seen.entries()).map(([value, label]) => ({ label, value }))
    );
  }, [enrichedRows]);

  const jobOptions = useMemo(() => {
    const seen = new Map<string, string>();
    const partnerFilter = selectedPartnerId ? Number(selectedPartnerId) : null;
    for (const row of enrichedRows) {
      if (partnerFilter != null && row.partner_id !== partnerFilter) continue;
      const label = [row.job_title, row.job_code ? `(${row.job_code})` : ""].filter(Boolean).join(" ").trim();
      seen.set(String(row.job_id), label || `Job #${row.job_id}`);
    }
    return [{ label: "All Jobs", value: "" }].concat(Array.from(seen.entries()).map(([value, label]) => ({ label, value })));
  }, [enrichedRows, selectedPartnerId]);

  const statusOptions = useMemo(() => {
    const present = new Set<string>();
    for (const row of enrichedRows) {
      const status = displayStatus(row.status);
      if (status && status !== "-") present.add(status);
    }

    const ordered = ["Shortlisted", "Interview", "Applied", "Pending", "On Hold", "Rejected", "Completed", "Not Ready", "Ready"];
    const items = ordered.filter((status) => present.has(status)).map((status) => ({ label: status, value: status }));
    const extra = Array.from(present).filter((status) => !ordered.includes(status)).sort().map((status) => ({ label: status, value: status }));
    return [{ label: "All Status", value: "" }].concat(items, extra);
  }, [enrichedRows]);

  const filteredRows = useMemo(() => {
    return enrichedRows.filter((row) => {
      if (selectedPartnerId && String(row.partner_id ?? "") !== selectedPartnerId) return false;
      if (selectedJobId && String(row.job_id) !== selectedJobId) return false;
      if (!selectedStatus) return true;
      const status = normalizeStatus(row.status);
      if (selectedStatus === "Shortlisted") return isShortlistedStatus(row.status);
      if (selectedStatus === "Interview") return isInterviewStatus(row.status);
      return status === normalizeStatus(selectedStatus) || status.includes(normalizeStatus(selectedStatus));
    });
  }, [enrichedRows, selectedPartnerId, selectedJobId, selectedStatus]);

  useEffect(() => {
    if (!selectedPartnerId) return;
    const stillValid = jobOptions.some((opt) => opt.value === selectedJobId);
    if (!stillValid) setSelectedJobId("");
  }, [jobOptions, selectedJobId, selectedPartnerId]);

  const currentActiveApp = useMemo(() => {
    if (!activeApp) return null;
    return enrichedRows.find((row) => row.application_id === activeApp.application_id) ?? (activeApp as ApplicationViewRow);
  }, [activeApp, enrichedRows]);

  const candidateAddress = [candidateProfile?.address1, candidateProfile?.address2].filter(Boolean).join(", ") || "—";
  const candidateLocation = [candidateProfile?.city_name, candidateProfile?.state_name, candidateProfile?.country_name].filter(Boolean).join(", ") || "—";
  const candidateDocuments = [
    { label: "Resume", value: candidateProfile?.resume_file_path },
    { label: "Passport", value: candidateProfile?.passport_file_path },
    { label: "Aadhaar", value: candidateProfile?.aadhar_file_path },
    { label: "PAN", value: candidateProfile?.pan_file_path },
    { label: "Voter ID", value: candidateProfile?.voter_id_file_path },
    { label: "Profile Photo", value: candidateProfile?.profile_photo_file_path },
  ];

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack spacing={0.25}>
        <Typography variant="h5" fontWeight={900}>
          Applications
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Candidate applications and job-specific documents
        </Typography>
      </Stack>

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Typography fontWeight={900}>Filters</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <AdDropDown
              label="Employer"
              options={partnerOptions}
              value={selectedPartnerId}
              onChange={(v) => {
                setSelectedPartnerId(String(v));
                setSelectedJobId("");
              }}
            />
            <AdDropDown
              label="Job"
              options={jobOptions}
              value={selectedJobId}
              onChange={(v) => setSelectedJobId(String(v))}
              disabled={!jobOptions.length || (jobOptions.length === 1 && jobOptions[0]?.value === "")}
            />
            <AdDropDown
              label="Status"
              options={statusOptions}
              value={selectedStatus}
              onChange={(v) => setSelectedStatus(String(v))}
            />
            <Stack justifyContent="flex-end" sx={{ minWidth: { xs: "100%", md: 140 } }}>
              <AdButton
                variant="outlined"
                onClick={() => {
                  setSelectedPartnerId("");
                  setSelectedJobId("");
                  setSelectedStatus("");
                }}
              >
                Clear
              </AdButton>
            </Stack>
          </Stack>
        </Stack>
      </AdCard>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <AdGrid rows={filteredRows.map((r) => ({ id: r.application_id, ...r }))} columns={cols as any} loading={loading} disableColumnMenu />
      </AdCard>

      <Drawer
        anchor="right"
        open={candidateOpen}
        onClose={() => setCandidateOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 420, md: 520 },
            maxWidth: "100vw",
            bgcolor: "#f8fafc",
          },
        }}
      >
        <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2, height: "100%", overflow: "hidden" }}>
          <Stack direction="row" alignItems="flex-start" spacing={1} justifyContent="space-between">
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={950} sx={{ fontSize: 20, lineHeight: 1.1 }}>
                Student Profile
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                Full candidate record from recruitment
              </Typography>
            </Box>
            <IconButton onClick={() => setCandidateOpen(false)} aria-label="Close profile panel">
              <CloseIcon />
            </IconButton>
          </Stack>

          <Box
            sx={{
              bgcolor: "#fff",
              border: "1px solid rgba(148,163,184,0.35)",
              borderRadius: 0,
              p: 1.5,
              boxShadow: "0 8px 28px rgba(15,23,42,0.05)",
              overflow: "auto",
              flex: 1,
            }}
          >
            {candidateLoading ? (
              <Typography color="text.secondary">Loading profile...</Typography>
            ) : candidateError ? (
              <AdAlertBox severity="error" title="Profile load failed" message={candidateError} />
            ) : candidateProfile ? (
              <Stack spacing={2}>
                <Box>
                  <Typography fontWeight={950} sx={{ fontSize: 18, lineHeight: 1.1 }}>
                    {`${candidateProfile.first_name ?? ""} ${candidateProfile.last_name ?? ""}`.trim() || "Student"}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.75, flexWrap: "wrap" }}>
                    <Chip size="small" label={candidateProfile.candidate_code ?? `ID ${candidateProfile.candidate_id}`} />
                    <Chip size="small" label={candidateProfile.status ?? "—"} color="primary" />
                  </Stack>
                </Box>

                <Box>
                  <Typography fontWeight={900} sx={{ fontSize: 14, mb: 0.75 }}>
                    Registration Details
                  </Typography>
                  <ProfileField label="Candidate Code" value={candidateProfile.candidate_code} />
                  <ProfileField label="Mobile" value={candidateProfile.phone} />
                  <ProfileField label="Email" value={candidateProfile.email} />
                  <ProfileField label="Verified" value={candidateProfile.is_verified ? "Yes" : "No"} />
                  <ProfileField label="Passport Number" value={candidateProfile.passport_number} />
                  <ProfileField label="Status" value={candidateProfile.status} />
                </Box>

                <Box>
                  <Typography fontWeight={900} sx={{ fontSize: 14, mb: 0.75 }}>
                    Location & Address
                  </Typography>
                  <ProfileField label="Country" value={candidateProfile.country_name} />
                  <ProfileField label="State" value={candidateProfile.state_name} />
                  <ProfileField label="City" value={candidateProfile.city_name} />
                  <ProfileField label="Address" value={candidateAddress} />
                  <ProfileField label="Pincode" value={candidateProfile.pincode} />
                </Box>

                <Box>
                  <Typography fontWeight={900} sx={{ fontSize: 14, mb: 0.75 }}>
                    Personal Profile
                  </Typography>
                  <ProfileField label="Father's Name" value={candidateProfile.father_name} />
                  <ProfileField label="DOB" value={candidateProfile.dob} />
                  <ProfileField label="Gender" value={candidateProfile.gender} />
                  <ProfileField label="Skills" value={formatJsonList(candidateProfile.skills)} />
                  <ProfileField label="Education" value={candidateProfile.education} />
                  <ProfileField label="Experience" value={candidateProfile.experience} />
                  <ProfileField label="Industry Type" value={candidateProfile.industry_type} />
                  <ProfileField label="Languages Known" value={formatJsonList(candidateProfile.languages_known)} />
                </Box>

                <Box>
                  <Typography fontWeight={900} sx={{ fontSize: 14, mb: 0.75 }}>
                    Documents
                  </Typography>
                  <Stack spacing={0}>
                    {candidateDocuments.map((doc) => (
                      <Box
                        key={doc.label}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1fr) auto",
                          gap: 1,
                          alignItems: "center",
                          py: 0.75,
                          borderBottom: "1px solid rgba(226,232,240,0.85)",
                          "&:last-of-type": { borderBottom: 0 },
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {doc.label}
                        </Typography>
                        <Chip size="small" label={doc.value ? "Uploaded" : "Missing"} color={doc.value ? "success" : "default"} />
                      </Box>
                    ))}
                  </Stack>
                </Box>

                <Box>
                  <Typography fontWeight={900} sx={{ fontSize: 14, mb: 0.75 }}>
                    Meta
                  </Typography>
                  <ProfileField label="Location" value={candidateLocation} />
                  <ProfileField label="Created At" value={candidateProfile.created_at} />
                  <ProfileField label="Updated At" value={candidateProfile.updated_at} />
                </Box>
              </Stack>
            ) : (
              <Typography color="text.secondary">Click a candidate to view the complete profile.</Typography>
            )}
          </Box>
        </Box>
      </Drawer>

      <AdModal
        open={docsOpen}
        onClose={() => setDocsOpen(false)}
        title="Application Documents"
        subtitle={activeApp ? `${activeApp.candidate_name} • ${activeApp.job_title}` : undefined}
        maxWidth="md"
      >
        {!activeApp ? (
          <AdAlertBox severity="info" title="Select an application" message="Open documents from an application row." />
        ) : (
          <Stack spacing={1.5}>
            {docsLoading ? <Typography>Loading...</Typography> : null}
            {!docsLoading && !docs.length ? (
              <AdAlertBox severity="warning" title="No required docs" message="No job documents found for this job." />
            ) : null}

            {docs.map((d) => (
              <AdCard key={d.document_type_id} animate={false} contentSx={{ p: 1.75 }} sx={{ backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 3 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }} justifyContent="space-between">
                  <Stack spacing={0.25}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontWeight={900}>{d.document_name}</Typography>
                      {Number(d.job_is_required) ? <Chip size="small" label="Required" color="primary" /> : <Chip size="small" label="Optional" />}
                      {d.file_path ? <Chip size="small" label="Uploaded" color="success" /> : <Chip size="small" label="Pending" />}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {d.uploaded_at ? `Uploaded at: ${d.uploaded_at}` : "Not uploaded yet"}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    {d.file_path ? (
                      <AdButton variant="text" startIcon={<OpenInNewIcon fontSize="small" />} onClick={() => openDoc(d)}>
                        View
                      </AdButton>
                    ) : null}

                    <AdButton
                      component="label"
                      startIcon={<UploadFileIcon fontSize="small" />}
                    >
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
          </Stack>
        )}
      </AdModal>

      <AdModal
        open={interviewsOpen}
        onClose={() => setInterviewsOpen(false)}
        title="Schedule Interview"
        subtitle={currentActiveApp ? `${currentActiveApp.candidate_name} • ${currentActiveApp.job_title}` : undefined}
        maxWidth="md"
      >
        {!currentActiveApp ? (
          <AdAlertBox severity="info" title="Select an application" message="Open interview scheduling from an application row." />
        ) : (
          <Stack spacing={2}>
            <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.85)" }} contentSx={{ p: 2 }}>
              <Stack spacing={1.5}>
                <Typography fontWeight={900}>New Interview</Typography>
                <AdDropDown
                  label="Interview Mode"
                  options={modeOptions}
                  value={schedule.mode_id}
                  onChange={(v) => setSchedule((s) => ({ ...s, mode_id: v }))}
                />
                <AdDateTimePicker
                  label="Interview Date & Time"
                  value={schedule.date}
                  onChange={(v) => setSchedule((s) => ({ ...s, date: v }))}
                />
                <AdTextArea
                  label="Remarks (optional)"
                  value={schedule.remarks}
                  onChange={(v: string) => setSchedule((s) => ({ ...s, remarks: v }))}
                  minRows={3}
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end">
                  <AdButton variant="outlined" color="error" onClick={async () => {
                    if (!currentActiveApp) return;
                    try {
                      await recruitmentApi.applications.updateStatus(currentActiveApp.application_id, "Rejected");
                      setToast({ open: true, message: "Application rejected", severity: "success" });
                      refresh();
                      setInterviewsOpen(false);
                    } catch (e: any) {
                      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to reject application", severity: "error" });
                    }
                  }}>
                    Reject
                  </AdButton>
                  <AdButton variant="contained" onClick={scheduleInterview}>
                    Schedule
                  </AdButton>
                </Stack>
              </Stack>
            </AdCard>

            <Stack spacing={1}>
              <Typography fontWeight={900}>Scheduled Interviews</Typography>
              {interviewsLoading ? <Typography>Loading...</Typography> : null}
              {!interviewsLoading && !interviews.length ? (
                <AdAlertBox severity="info" title="No interviews yet" message="No interviews scheduled for this application." />
              ) : null}
              {interviews.map((i) => (
                <AdCard key={i.interview_id} animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.85)" }} contentSx={{ p: 1.75 }}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }} justifyContent="space-between">
                    <Stack spacing={0.25}>
                      <Typography fontWeight={900}>{i.mode_name ?? `Mode #${i.interview_mode_id ?? ""}`}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {i.interview_date ?? "—"}
                      </Typography>
                      {i.remarks ? (
                        <Typography variant="caption" color="text.secondary">
                          {i.remarks}
                        </Typography>
                      ) : null}
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {i.result ? <Chip size="small" label={i.result} /> : <Chip size="small" label="Scheduled" color="primary" />}
                    </Stack>
                  </Stack>
                </AdCard>
              ))}

              {currentActiveApp && isInterviewStatus(currentActiveApp.status) ? (
                <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.85)" }} contentSx={{ p: 1.75 }}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }} justifyContent="space-between">
                    <Typography fontWeight={900}>Interview decision</Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <AdButton
                        variant="contained"
                        color="success"
                        onClick={async () => {
                          try {
                            
                            await deploymentApi.create({ application_id: currentActiveApp.application_id, status: "Ready" });
                            await recruitmentApi.applications.updateStatus(currentActiveApp.application_id, "Deployed");
                            setToast({ open: true, message: "Marked ready for deployment", severity: "success" });
                            refresh();
                            setInterviewsOpen(false);
                          } catch (e: any) {
                            setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to mark ready", severity: "error" });
                          }
                        }}
                      >
                        Ready to Deploy
                        </AdButton>
                        <AdButton
                          variant="contained"
                          color="success"
                          onClick={async () => {
                            try {
                              await recruitmentApi.applications.updateStatus(currentActiveApp.application_id, "Postponed");
                              setToast({ open: true, message: "Interview Postponed", severity: "success" });
                              refresh();
                              setInterviewsOpen(false);
                            } catch (e: any) {
                              setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to mark ready", severity: "error" });
                            }
                          }}
                        >
                          Postponed
                        </AdButton>
                      <AdButton
                        variant="outlined"
                        color="error"
                        onClick={async () => {
                          try {
                            await recruitmentApi.applications.updateStatus(currentActiveApp.application_id, "Rejected");
                            setToast({ open: true, message: "Application rejected", severity: "success" });
                            refresh();
                            setInterviewsOpen(false);
                          } catch (e: any) {
                            setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to reject application", severity: "error" });
                          }
                        }}
                      >
                        Reject
                      </AdButton>
                    </Stack>
                  </Stack>
                </AdCard>
              ) : null}
            </Stack>
          </Stack>
        )}
      </AdModal>
    </Stack>
  );
}
