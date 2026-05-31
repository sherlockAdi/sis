import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Box, Chip, IconButton, Stack, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { AdAlertBox, AdButton, AdCard, AdGrid, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { mastersApi, type DocumentType } from "../../common/services/mastersApi";
import {
  partnerPortalApi,
  type PartnerApplicationRow,
  type PartnerCandidateDocumentRow,
  type PartnerCandidateRow,
  type PartnerCandidateTradeTestRow,
} from "../../common/services/partnersApi";
import { recruitmentApi } from "../../common/services/recruitmentApi";
import { formatJsonList } from "../../common/utils/jsonList";

const HIDDEN_CONTACT_TEXT = "Available after employee conversion";

type PartnerInterviewRow = {
  interview_id: number;
  application_id: number;
  candidate_id: number;
  candidate_name: string;
  job_id: number;
  job_title: string;
  mode_name: string | null;
  interview_date: string | null;
  result: string | null;
  remarks: string | null;
};

export default function PartnerApplicantProfilePage() {
  const navigate = useNavigate();
  const params = useParams();
  const candidateId = params.candidateId ? Number(params.candidateId) : null;

  const [candidate, setCandidate] = useState<PartnerCandidateRow | null>(null);
  const [docs, setDocs] = useState<PartnerCandidateDocumentRow[]>([]);
  const [tradeTest, setTradeTest] = useState<PartnerCandidateTradeTestRow | null>(null);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [applications, setApplications] = useState<PartnerApplicationRow[]>([]);
  const [interviews, setInterviews] = useState<PartnerInterviewRow[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    (async () => {
      try {
        setDocTypes(await mastersApi.documentTypes.list(true));
      } catch {
        setDocTypes([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [apps, ints] = await Promise.all([partnerPortalApi.applications.list(), partnerPortalApi.interviews.list()]);
        setApplications(apps);
        setInterviews(ints);
      } catch {
        setApplications([]);
        setInterviews([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!candidateId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await partnerPortalApi.candidates.get(candidateId);
        setCandidate(res.candidate);
        setDocs(res.documents ?? []);
        setTradeTest(res.trade_test ?? null);
      } catch (e: any) {
        setError((e as ApiError)?.message ?? "Failed to load candidate");
      } finally {
        setLoading(false);
      }
    })();
  }, [candidateId]);

  const docName = (document_type_id: number) => docTypes.find((d) => d.document_type_id === document_type_id)?.document_name ?? `#${document_type_id}`;

  const openDoc = async (file_path: string) => {
    try {
      if (/^https?:\/\//i.test(file_path)) {
        window.open(file_path, "_blank", "noopener,noreferrer");
        return;
      }
      const presign = await recruitmentApi.files.presignDownload(file_path);
      window.open(presign.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to open file", severity: "error" });
    }
  };

  const docRows = useMemo(
    () =>
      docs.map((d) => ({
        id: d.id,
        document_type_id: d.document_type_id,
        document_name: docName(d.document_type_id),
        file_path: d.file_path,
        uploaded_at: d.uploaded_at,
      })),
    [docs, docTypes],
  );

  const candidateApplications = useMemo(
    () => applications.filter((a) => Number(a.candidate_id) === Number(candidateId)),
    [applications, candidateId],
  );

  const latestApplication = useMemo(() => {
    if (!candidateApplications.length) return null;
    return [...candidateApplications].sort((a, b) => {
      const ad = a.application_date ? new Date(a.application_date).getTime() : 0;
      const bd = b.application_date ? new Date(b.application_date).getTime() : 0;
      return bd - ad;
    })[0];
  }, [candidateApplications]);

  useEffect(() => {
    if (!candidateApplications.length) {
      setSelectedApplicationId(null);
      return;
    }

    const hasSelection = selectedApplicationId != null && candidateApplications.some((app) => app.application_id === selectedApplicationId);
    if (!hasSelection) {
      setSelectedApplicationId(latestApplication?.application_id ?? candidateApplications[0].application_id);
    }
  }, [candidateApplications, latestApplication, selectedApplicationId]);

  const activeApplication = useMemo(() => {
    if (!candidateApplications.length) return null;
    const selected = candidateApplications.find((app) => app.application_id === selectedApplicationId);
    return selected ?? latestApplication;
  }, [candidateApplications, latestApplication, selectedApplicationId]);

  const candidateInterviews = useMemo(
    () => interviews.filter((i) => Number(i.candidate_id) === Number(candidateId) && Number(i.application_id) === Number(activeApplication?.application_id)),
    [activeApplication?.application_id, interviews, candidateId],
  );
  const tradeVideoLinks = tradeTest?.trade_video_links ?? [];
  const hasTradeVideo =
    tradeTest?.trade_video_source === "google_drive"
      ? Boolean(String(tradeTest.trade_video_external_file_id ?? "").trim() || String(tradeTest.trade_video_external_file_url ?? "").trim())
      : Boolean(tradeTest?.trade_video_file_path?.trim());

  const journey = useMemo(() => buildJourney(activeApplication, candidateInterviews), [activeApplication, candidateInterviews]);
  const currentJourney = journey.find((step) => step.state === "current") ?? journey[0] ?? null;
  const candidateName = `${candidate?.first_name ?? ""} ${candidate?.last_name ?? ""}`.trim() || "Candidate";
  const candidateCode = candidate?.candidate_code ?? (candidate ? `ID ${candidate.candidate_id}` : "—");
  const selectedJobLabel = activeApplication ? activeApplication.job_title : "No job selected yet";
  const selectedApplicationStatus = activeApplication ? formatApplicationStatus(activeApplication.status) : "No application";
  const selectedApplicationStatusTone = getStatusTone(activeApplication?.status);
  const candidateStatusTone = getStatusTone(candidate?.status);
  const candidatePhoneValue = candidate?.phone ?? HIDDEN_CONTACT_TEXT;
  const candidateEmailValue = candidate?.email ?? HIDDEN_CONTACT_TEXT;

  return (
    <Stack
      spacing={2.5}
      sx={{
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        minWidth: 0,
        pb: 2,
      }}
    >
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1}>
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={900}>
            Applicant Profile
          </Typography>
          <Typography variant="body2" color="text.secondary">
            One candidate, one job journey, with interview history and documents in view.
          </Typography>
        </Stack>
        <AdButton variant="text" onClick={() => navigate(-1)} sx={{ alignSelf: { xs: "stretch", sm: "center" } }}>
          Back
        </AdButton>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      {loading && !candidate ? (
        <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.76)" }} contentSx={{ p: 2.5 }}>
          <Typography variant="body2" color="text.secondary">
            Loading applicant profile...
          </Typography>
        </AdCard>
      ) : candidate ? (
        <Stack spacing={2.5} sx={{ width: "100%", minWidth: 0 }}>
          <AdCard
            animate={false}
            sx={{
              overflow: "hidden",
              border: "1px solid rgba(148,163,184,0.18)",
              background: "linear-gradient(135deg, rgba(15,23,42,0.97) 0%, rgba(29,78,216,0.95) 55%, rgba(14,165,233,0.92) 100%)",
              boxShadow: "0 28px 80px rgba(15,23,42,0.18)",
            }}
            contentSx={{ p: 0 }}
          >
            <Box sx={{ p: { xs: 2.25, md: 3 }, color: "#fff" }}>
              <Stack direction={{ xs: "column", lg: "row" }} spacing={2.5} alignItems={{ lg: "center" }} justifyContent="space-between">
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                  <Box
                    sx={{
                      width: 76,
                      height: 76,
                      flexShrink: 0,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "rgba(255,255,255,0.16)",
                      border: "1px solid rgba(255,255,255,0.24)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
                      fontSize: 28,
                      fontWeight: 900,
                      letterSpacing: 0.5,
                    }}
                  >
                    {buildInitials(candidateName)}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 0.75 }}>
                      <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.1 }}>
                        {candidateName}
                      </Typography>
                      <Chip
                        size="small"
                        label={selectedApplicationStatus}
                        sx={{
                          color: selectedApplicationStatusTone.text,
                          bgcolor: selectedApplicationStatusTone.bg,
                          fontWeight: 800,
                          border: "1px solid rgba(255,255,255,0.12)",
                        }}
                      />
                    </Stack>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.84)", fontWeight: 700 }}>
                      {candidateCode}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.78)", mt: 0.5 }}>
                      {selectedJobLabel}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: "flex-start", lg: "flex-end" }}>
                  <Chip
                    size="small"
                    label={formatApplicationStatus(candidate?.status)}
                    sx={{
                      bgcolor: candidateStatusTone.bg,
                      color: candidateStatusTone.text,
                      fontWeight: 800,
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  />
                  <Chip
                    size="small"
                    label={currentJourney?.label ? `Journey: ${currentJourney.label}` : "Journey: Applied"}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.16)",
                      color: "#fff",
                      fontWeight: 800,
                      border: "1px solid rgba(255,255,255,0.16)",
                    }}
                  />
                  <Chip
                    size="small"
                    label={`${candidateApplications.length} job${candidateApplications.length === 1 ? "" : "s"}`}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.12)",
                      color: "#fff",
                      fontWeight: 700,
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  />
                  <Chip
                    size="small"
                    label={`${candidateInterviews.length} interview${candidateInterviews.length === 1 ? "" : "s"}`}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.12)",
                      color: "#fff",
                      fontWeight: 700,
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  />
                </Stack>
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.25}
                sx={{ mt: 2.5, width: "100%" }}
              >
                <SummaryStat label="Application" value={activeApplication ? `#${activeApplication.application_id}` : "—"} helper={activeApplication?.application_date ? formatDateTime(activeApplication.application_date) : "No application selected"} />
                <SummaryStat label="Interview" value={candidateInterviews.length ? String(candidateInterviews.length) : "0"} helper={candidateInterviews[0]?.mode_name ?? "No interview yet"} />
                <SummaryStat label="Documents" value={String(docRows.length)} helper={docRows.length ? "Files uploaded" : "No documents"} />
                <SummaryStat label="Trade Media" value={`${hasTradeVideo ? 1 : 0} / ${tradeVideoLinks.length}`} helper={hasTradeVideo ? "Video plus links" : "Links only"} />
              </Stack>
            </Box>
          </AdCard>

          {candidateApplications.length > 1 ? (
            <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.82)" }} contentSx={{ p: 2.25 }}>
              <Stack spacing={1.25}>
                <Typography fontWeight={900}>Choose job journey</Typography>
                <Typography variant="body2" color="text.secondary">
                  This profile can have multiple applications. Select the job you want to inspect.
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {candidateApplications.map((app) => {
                    const isSelected = app.application_id === activeApplication?.application_id;
                    return (
                      <Chip
                        key={app.application_id}
                        clickable
                        onClick={() => setSelectedApplicationId(app.application_id)}
                        label={`${app.job_title} • ${formatApplicationStatus(app.status)}`}
                        variant={isSelected ? "filled" : "outlined"}
                        color={isSelected ? "primary" : "default"}
                        sx={{ fontWeight: isSelected ? 800 : 600 }}
                      />
                    );
                  })}
                </Stack>
              </Stack>
            </AdCard>
          ) : null}

          <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.82)" }} contentSx={{ p: 2.25 }}>
            <Stack spacing={1.5}>
              <Stack spacing={0.25}>
                <Typography fontWeight={900}>Journey</Typography>
                <Typography variant="body2" color="text.secondary">
                  Progress is shown for the selected job only. Applied, shortlisted, interview, postponement, reschedule, and offer all stay tied to one application.
                </Typography>
              </Stack>
              {journey.length ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                      lg: "repeat(3, minmax(0, 1fr))",
                    },
                    gap: 1.25,
                  }}
                >
                  {journey.map((step) => (
                    <JourneyStep key={step.key} label={step.label} note={step.note} state={step.state} />
                  ))}
                </Box>
              ) : (
                <AdAlertBox severity="info" title="No application yet" message="This candidate does not have a job application attached yet." />
              )}
            </Stack>
          </AdCard>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                xl: "minmax(0, 1.4fr) minmax(320px, 0.9fr)",
              },
              gap: 2.5,
              alignItems: "start",
            }}
          >
            <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.82)" }} contentSx={{ p: 2.25 }}>
              <Stack spacing={2}>
                <Stack spacing={0.25}>
                  <Typography fontWeight={900}>Profile Details</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Registration, location, and verification details for the candidate record.
                  </Typography>
                </Stack>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: 1.5,
                  }}
                >
                  <SectionCard title="Registration Details">
                    <ProfileField label="Candidate Code" value={candidate.candidate_code} />
                    <ProfileField label="First Name" value={candidate.first_name} />
                    <ProfileField label="Last Name" value={candidate.last_name} />
                    <ProfileField label="Mobile" value={candidatePhoneValue} />
                    <ProfileField label="Email" value={candidateEmailValue} />
                    <ProfileField label="Passport Number" value={candidate.passport_number} />
                    <ProfileField label="Candidate Status" value={candidate.status} />
                    {activeApplication ? <ProfileField label="Application Status" value={activeApplication.status} /> : null}
                  </SectionCard>

                  <SectionCard title="Location & Address">
                    <ProfileField label="Country" value={candidate.country_name} />
                    <ProfileField label="State" value={candidate.state_name} />
                    <ProfileField label="City" value={candidate.city_name} />
                    <ProfileField label="Address 1" value={candidate.address1} />
                    <ProfileField label="Address 2" value={candidate.address2} />
                    <ProfileField label="Pincode" value={candidate.pincode} />
                  </SectionCard>

                  <SectionCard title="Personal Profile">
                    <ProfileField label="Father's Name" value={candidate.father_name} />
                    <ProfileField label="DOB" value={candidate.dob} />
                    <ProfileField label="Gender" value={candidate.gender} />
                    <ProfileField label="Skills" value={formatJsonList(candidate.skills)} />
                    <ProfileField label="Education" value={candidate.education} />
                    <ProfileField label="Experience" value={candidate.experience} />
                    <ProfileField label="Industry Type" value={candidate.industry_type} />
                    <ProfileField label="Languages Known" value={formatJsonList(candidate.languages_known)} />
                  </SectionCard>

                  <SectionCard title="Verification Files">
                    <FileField label="Resume File" value={candidate.resume_file_path} onOpen={openDoc} />
                    <ProfileField label="Passport Expiry" value={candidate.passport_expiry_date} />
                    <FileField label="Passport File" value={candidate.passport_file_path} onOpen={openDoc} />
                    <ProfileField label="Aadhaar Number" value={candidate.aadhar_number} />
                    <FileField label="Aadhaar File" value={candidate.aadhar_file_path} onOpen={openDoc} />
                    <ProfileField label="PAN Number" value={candidate.pan_number} />
                    <FileField label="PAN File" value={candidate.pan_file_path} onOpen={openDoc} />
                    <ProfileField label="Voter ID Number" value={candidate.voter_id_number} />
                    <FileField label="Voter ID File" value={candidate.voter_id_file_path} onOpen={openDoc} />
                    <FileField label="Profile Photo" value={candidate.profile_photo_file_path} onOpen={openDoc} />
                  </SectionCard>
                </Box>
              </Stack>
            </AdCard>

            <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.82)" }} contentSx={{ p: 2.25 }}>
              <Stack spacing={1.5}>
                <Stack spacing={0.25}>
                  <Typography fontWeight={900}>Documents</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Uploaded files for the candidate record.
                  </Typography>
                </Stack>
                <AdGrid
                  rows={docRows.map((r) => ({ ...r, id: r.id }))}
                  columns={[
                    { field: "document_name", headerName: "Document", flex: 1, minWidth: 200 },
                    { field: "uploaded_at", headerName: "Uploaded", width: 170 },
                    {
                      field: "__actions",
                      headerName: "View",
                      width: 120,
                      sortable: false,
                      filterable: false,
                      renderCell: (p: any) => {
                        const r = p.row as any;
                        if (!r.file_path) return "—";
                        return (
                          <IconButton aria-label="Open document" onClick={() => openDoc(String(r.file_path))} size="small">
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        );
                      },
                    },
                  ] as any}
                  loading={loading}
                  disableColumnMenu
                />
              </Stack>
            </AdCard>

            <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.82)" }} contentSx={{ p: 2.25 }}>
              <Stack spacing={1.5}>
                <Stack spacing={0.25}>
                  <Typography fontWeight={900}>Trade Test Media</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Trade video file and link references shared by the candidate.
                  </Typography>
                </Stack>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: 1.5,
                  }}
                >
                  <SectionCard title="Trade Video File">
                    <ProfileField label="File Name" value={tradeTest?.trade_video_file_name} />
                    <ProfileField label="Size" value={tradeTest?.trade_video_file_size ? formatBytes(tradeTest.trade_video_file_size) : "—"} />
                    <ProfileField label="Uploaded At" value={tradeTest?.trade_video_uploaded_at} />
                    <FileField
                      label="Open Video"
                      value={
                        tradeTest?.trade_video_source === "google_drive"
                          ? tradeTest.trade_video_external_file_url ||
                            buildGoogleDriveShareUrl(tradeTest.trade_video_external_file_id) ||
                            tradeTest.trade_video_external_file_id ||
                            null
                          : tradeTest?.trade_video_file_path
                      }
                      onOpen={openDoc}
                    />
                    {tradeTest?.trade_video_source === "google_drive" ? (
                      <>
                        <ProfileField label="Source" value="Google Drive" />
                        <ProfileField label="File ID" value={tradeTest.trade_video_external_file_id} />
                        <ProfileField label="Share Link" value={tradeTest.trade_video_external_file_url} />
                      </>
                    ) : null}
                  </SectionCard>

                  <SectionCard title="Trade Video Links">
                    {tradeVideoLinks.length ? (
                      <Stack spacing={1}>
                        {tradeVideoLinks.map((link) => (
                          <Box
                            key={link.id}
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "1fr auto",
                              gap: 1,
                              alignItems: "center",
                              px: 1.25,
                              py: 0.9,
                              borderRadius: 2,
                              bgcolor: "rgba(248,250,252,0.9)",
                              border: "1px solid rgba(148,163,184,0.16)",
                            }}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={800} sx={{ wordBreak: "break-word" }}>
                                {link.title || "Trade video link"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                                {link.url}
                              </Typography>
                            </Box>
                            <IconButton size="small" onClick={() => window.open(link.url, "_blank", "noopener,noreferrer")} aria-label="Open trade video link">
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No trade video links available.
                      </Typography>
                    )}
                  </SectionCard>
                </Box>
              </Stack>
            </AdCard>
          </Box>
        </Stack>
      ) : null}
    </Stack>
  );
}

function ProfileField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "128px minmax(0, 1fr)",
        gap: 1,
        alignItems: "center",
        px: 1.25,
        py: 0.9,
        borderRadius: 2,
        bgcolor: "rgba(248,250,252,0.9)",
        border: "1px solid rgba(148,163,184,0.16)",
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={800} sx={{ wordBreak: "break-word", color: "text.primary" }}>
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

function FileField({
  label,
  value,
  onOpen,
}: {
  label: string;
  value: string | null | undefined;
  onOpen: (file_path: string) => Promise<void>;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "128px minmax(0, 1fr) auto",
        gap: 1,
        alignItems: "center",
        px: 1.25,
        py: 0.9,
        borderRadius: 2,
        bgcolor: "rgba(248,250,252,0.9)",
        border: "1px solid rgba(148,163,184,0.16)",
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={800} sx={{ wordBreak: "break-word" }}>
        {value ? "Uploaded" : "Not uploaded"}
      </Typography>
      {value ? (
        <IconButton aria-label={`View ${label}`} size="small" onClick={() => onOpen(value)}>
          <OpenInNewIcon fontSize="small" />
        </IconButton>
      ) : (
        <Box />
      )}
    </Box>
  );
}

function formatBytes(bytes: number | null): string {
  if (!bytes || !Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function buildGoogleDriveShareUrl(fileId: string | null): string | null {
  const id = String(fileId ?? "").trim();
  return id ? `https://drive.google.com/file/d/${id}/view?usp=sharing` : null;
}

type JourneyStepModel = {
  key: string;
  label: string;
  state: "done" | "current" | "pending";
  note: string;
};

function buildJourney(activeApplication: PartnerApplicationRow | null, interviews: PartnerInterviewRow[]): JourneyStepModel[] {
  if (!activeApplication) return [];

  const status = normalizeStatus(activeApplication.status);
  const latestInterview = [...interviews].sort((a, b) => {
    const ad = a.interview_date ? new Date(a.interview_date).getTime() : 0;
    const bd = b.interview_date ? new Date(b.interview_date).getTime() : 0;
    return bd - ad;
  })[0];
  const interviewText = normalizeStatus([latestInterview?.result, latestInterview?.mode_name, latestInterview?.remarks].filter(Boolean).join(" "));
  const hasPostponed = status.includes("postpon") || interviewText.includes("postpon");
  const hasReschedule = status.includes("resched") || interviewText.includes("resched");
  const hasOffer = status.includes("offer") || status.includes("ready") || status.includes("deploy") || interviewText.includes("offer");
  const hasInterview = hasOffer || hasReschedule || hasPostponed || status.includes("interview") || interviews.length > 0;
  const hasShortlist = hasInterview || status.includes("shortlist") || status.includes("screen") || status === "ready" || status.includes("offer") || status.includes("deploy");

  const currentKey = hasOffer ? "offered" : hasInterview ? "interview" : hasShortlist ? "shortlisted" : "applied";

  const steps: Array<{ key: JourneyStepModel["key"]; label: string; note: string; evidence: boolean }> = [
    { key: "applied", label: "Applied", note: "Application received for this job", evidence: true },
    { key: "shortlisted", label: "Shortlisted", note: hasShortlist ? "Moved into review for this application" : "Waiting for shortlist", evidence: hasShortlist },
    {
      key: "interview",
      label: "Interview",
      note: latestInterview
        ? `${hasPostponed ? "Postponed" : hasReschedule ? "Reschedule pending" : latestInterview.mode_name ?? "Interview"}${latestInterview.interview_date ? ` • ${formatDateTime(latestInterview.interview_date)}` : ""}`
        : hasPostponed
          ? "Postponed"
          : "Interview not scheduled yet",
      evidence: hasInterview,
    },
    {
      key: "offered",
      label: "Offered",
      note: hasOffer ? "Offer / ready to deploy stage reached" : "Offer pending",
      evidence: hasOffer,
    },
  ];

  return steps.map((step) => ({
    key: step.key,
    label: step.label,
    note: step.note,
    state: step.key === currentKey ? "current" : step.evidence ? "done" : "pending",
  }));
}

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function formatApplicationStatus(value: string | null | undefined): string {
  const status = normalizeStatus(value);
  if (!status) return "—";
  if (status.includes("shortlist")) return "Shortlisted";
  if (status.includes("postpon")) return "Postponed";
  if (status.includes("resched")) return "Reschedule";
  if (status.includes("interview")) return "Interview";
  if (status.includes("offer")) return "Offered";
  if (status.includes("ready")) return "Ready to Deploy";
  if (status.includes("deploy")) return "Deployed";
  return status.replace(/\b\w/g, (m) => m.toUpperCase());
}

function getStatusTone(value: string | null | undefined): { bg: string; text: string } {
  const status = normalizeStatus(value);
  if (status.includes("shortlist") || status.includes("offer") || status.includes("ready")) return { bg: "rgba(34,197,94,0.18)", text: "#dcfce7" };
  if (status.includes("interview")) return { bg: "rgba(14,165,233,0.18)", text: "#e0f2fe" };
  if (status.includes("postpon")) return { bg: "rgba(251,191,36,0.2)", text: "#fef3c7" };
  return { bg: "rgba(255,255,255,0.16)", text: "#fff" };
}

function buildInitials(value: string): string {
  const parts = value.split(" ").filter(Boolean);
  if (!parts.length) return "C";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD MMM YYYY, HH:mm") : String(value);
}

function SummaryStat({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        px: 1.5,
        py: 1.25,
        borderRadius: 2.5,
        bgcolor: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.72)", fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase" }}>
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={900} sx={{ color: "#fff", lineHeight: 1.15, mt: 0.4 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.76)", mt: 0.25 }}>
        {helper}
      </Typography>
    </Box>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        borderRadius: 3,
        p: 1.5,
        bgcolor: "rgba(255,255,255,0.82)",
        border: "1px solid rgba(148,163,184,0.16)",
        boxShadow: "0 10px 28px rgba(15,23,42,0.04)",
      }}
    >
      <Typography fontWeight={900} sx={{ mb: 1.25 }}>
        {title}
      </Typography>
      <Stack spacing={1}>
        {children}
      </Stack>
    </Box>
  );
}

function JourneyStep({ label, note, state }: { label: string; note: string; state: "done" | "current" | "pending" }) {
  const style =
    state === "done"
      ? {
          bgcolor: "rgba(34,197,94,0.08)",
          borderColor: "rgba(34,197,94,0.28)",
          titleColor: "success.main",
          chipBg: "rgba(34,197,94,0.14)",
          chipText: "success.dark",
          chipLabel: "Done",
        }
      : state === "current"
        ? {
            bgcolor: "rgba(37,99,235,0.08)",
            borderColor: "rgba(37,99,235,0.34)",
            titleColor: "primary.main",
            chipBg: "rgba(37,99,235,0.14)",
            chipText: "primary.dark",
            chipLabel: "Current",
          }
        : {
            bgcolor: "rgba(148,163,184,0.08)",
            borderColor: "rgba(148,163,184,0.24)",
            titleColor: "text.primary",
            chipBg: "rgba(148,163,184,0.14)",
            chipText: "text.secondary",
            chipLabel: "Pending",
          };

  return (
    <Box
      sx={{
        minWidth: 0,
        px: 1.5,
        py: 1.25,
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: style.borderColor,
        bgcolor: style.bgcolor,
      }}
    >
      <Stack spacing={0.7}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography variant="body2" fontWeight={900} sx={{ color: style.titleColor }}>
            {label}
          </Typography>
          <Box
            sx={{
              px: 0.9,
              py: 0.2,
              borderRadius: 999,
              bgcolor: style.chipBg,
              color: style.chipText,
              fontSize: 11,
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            {style.chipLabel}
          </Box>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ minHeight: 36, lineHeight: 1.4 }}>
          {note}
        </Typography>
      </Stack>
    </Box>
  );
}
