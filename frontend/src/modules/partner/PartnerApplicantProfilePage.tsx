import { useEffect, useMemo, useState } from "react";
import { Box, Chip, IconButton, Stack, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useNavigate, useParams } from "react-router-dom";
import { AdAlertBox, AdButton, AdCard, AdGrid, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { mastersApi, type DocumentType } from "../../common/services/mastersApi";
import { partnerPortalApi, type PartnerApplicationRow, type PartnerCandidateDocumentRow, type PartnerCandidateRow } from "../../common/services/partnersApi";
import { recruitmentApi } from "../../common/services/recruitmentApi";

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
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [applications, setApplications] = useState<PartnerApplicationRow[]>([]);
  const [interviews, setInterviews] = useState<PartnerInterviewRow[]>([]);
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

  const activeApplication = useMemo(() => {
    if (!candidateApplications.length) return null;
    return [...candidateApplications].sort((a, b) => {
      const ad = a.application_date ? new Date(a.application_date).getTime() : 0;
      const bd = b.application_date ? new Date(b.application_date).getTime() : 0;
      return bd - ad;
    })[0];
  }, [candidateApplications]);

  const candidateInterviews = useMemo(
    () => interviews.filter((i) => Number(i.candidate_id) === Number(candidateId)),
    [interviews, candidateId],
  );

  const journey = useMemo(() => buildJourney(activeApplication, candidateInterviews), [activeApplication, candidateInterviews]);

  return (
    <Stack spacing={2.5} sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden", minWidth: 0 }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={900}>
            Candidate Profile
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View candidate details and documents
          </Typography>
        </Stack>
        <AdButton variant="text" onClick={() => navigate(-1)}>
          Back
        </AdButton>
      </Stack>

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        ) : candidate ? (
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={900} sx={{ fontSize: 18, lineHeight: 1.1 }}>
                  {`${candidate.first_name ?? ""} ${candidate.last_name ?? ""}`.trim() || "—"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {candidate.candidate_code ?? `ID ${candidate.candidate_id}`}
                </Typography>
              </Box>
              <Chip size="small" label={candidate.status ?? "—"} />
            </Stack>

            <Box>
              <Typography fontWeight={900} sx={{ fontSize: 14, mb: 0.75 }}>
                Journey
              </Typography>
              {journey.length ? (
                <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                  {journey.map((step) => (
                    <JourneyStep key={step.key} label={step.label} active={step.active} completed={step.completed} />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No journey history available yet.
                </Typography>
              )}
            </Box>

            <Box>
              <Typography fontWeight={900} sx={{ fontSize: 14, mb: 0.75 }}>
                Registration Details
              </Typography>
              <ProfileField label="Candidate Code" value={candidate.candidate_code} />
              <ProfileField label="First Name" value={candidate.first_name} />
              <ProfileField label="Last Name" value={candidate.last_name} />
              <ProfileField label="Mobile" value={candidate.phone} />
              <ProfileField label="Email" value={candidate.email} />
              <ProfileField label="Passport Number" value={candidate.passport_number} />
              <ProfileField label="Status" value={candidate.status} />
              {activeApplication ? <ProfileField label="Application Status" value={activeApplication.status} /> : null}
            </Box>

            <Box>
              <Typography fontWeight={900} sx={{ fontSize: 14, mb: 0.75 }}>
                Location & Address
              </Typography>
              <ProfileField label="Country" value={candidate.country_name} />
              <ProfileField label="State" value={candidate.state_name} />
              <ProfileField label="City" value={candidate.city_name} />
              <ProfileField label="Address 1" value={candidate.address1} />
              <ProfileField label="Address 2" value={candidate.address2} />
              <ProfileField label="Pincode" value={candidate.pincode} />
            </Box>

            <Box>
              <Typography fontWeight={900} sx={{ fontSize: 14, mb: 0.75 }}>
                Personal Profile
              </Typography>
              <ProfileField label="Father's Name" value={candidate.father_name} />
              <ProfileField label="DOB" value={candidate.dob} />
              <ProfileField label="Gender" value={candidate.gender} />
              <ProfileField label="Skills" value={candidate.skills} />
              <ProfileField label="Education" value={candidate.education} />
              <ProfileField label="Experience" value={candidate.experience} />
              <ProfileField label="Industry Type" value={candidate.industry_type} />
              <ProfileField label="Languages Known" value={candidate.languages_known} />
            </Box>

            <Box>
              <Typography fontWeight={900} sx={{ fontSize: 14, mb: 0.75 }}>
                Verification Files
              </Typography>
              <FileField label="Resume File" value={candidate.resume_file_path} onOpen={openDoc} />
              <ProfileField label="Passport Expiry Date" value={candidate.passport_expiry_date} />
              <FileField label="Passport File" value={candidate.passport_file_path} onOpen={openDoc} />
              <ProfileField label="Aadhaar Number" value={candidate.aadhar_number} />
              <FileField label="Aadhaar File" value={candidate.aadhar_file_path} onOpen={openDoc} />
              <ProfileField label="PAN Number" value={candidate.pan_number} />
              <FileField label="PAN File" value={candidate.pan_file_path} onOpen={openDoc} />
              <ProfileField label="Voter ID Number" value={candidate.voter_id_number} />
              <FileField label="Voter ID File" value={candidate.voter_id_file_path} onOpen={openDoc} />
              <FileField label="Profile Photo" value={candidate.profile_photo_file_path} onOpen={openDoc} />
            </Box>
          </Stack>
        ) : null}
      </AdCard>

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Typography fontWeight={900}>Documents</Typography>
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
            showExport={false}
            disableColumnMenu
          />
        </Stack>
      </AdCard>
    </Stack>
  );
}

function ProfileField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "140px minmax(0, 1fr)",
        gap: 1,
        py: 0.65,
        borderBottom: "1px solid rgba(226,232,240,0.8)",
        "&:last-of-type": { borderBottom: 0 },
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} sx={{ wordBreak: "break-word" }}>
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
        gridTemplateColumns: "140px minmax(0, 1fr) auto",
        gap: 1,
        py: 0.65,
        borderBottom: "1px solid rgba(226,232,240,0.8)",
        alignItems: "center",
        "&:last-of-type": { borderBottom: 0 },
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} sx={{ wordBreak: "break-word" }}>
        {value ? "Uploaded" : "—"}
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

type JourneyStepModel = {
  key: string;
  label: string;
  active: boolean;
  completed: boolean;
};

function buildJourney(activeApplication: PartnerApplicationRow | null, interviews: PartnerInterviewRow[]): JourneyStepModel[] {
  const status = normalizeStatus(activeApplication?.status);
  const latestInterview = [...interviews].sort((a, b) => {
    const ad = a.interview_date ? new Date(a.interview_date).getTime() : 0;
    const bd = b.interview_date ? new Date(b.interview_date).getTime() : 0;
    return bd - ad;
  })[0];
  const interviewText = normalizeStatus(latestInterview?.result ?? latestInterview?.mode_name ?? "");
  const remarkText = normalizeStatus(latestInterview?.remarks ?? "");

  const shortlisted = status.includes("shortlist") || status === "ready" || status.includes("screen");
  const interview = status.includes("interview") || interviews.length > 0;
  const postponed = interviewText.includes("postpon") || remarkText.includes("postpon");
  const rescheduled = interviewText.includes("resched") || remarkText.includes("resched") || interviews.length > 1;
  const offered = status.includes("offer") || status.includes("select") || interviewText.includes("offer");

  return [
    { key: "shortlisted", label: "Shortlisted", active: shortlisted, completed: shortlisted },
    { key: "interview", label: "Interview", active: interview && !postponed, completed: interview && !postponed },
    { key: "postponed", label: "Postponed", active: postponed, completed: postponed },
    { key: "reschedule", label: "Reschedule", active: rescheduled, completed: rescheduled },
    { key: "offered", label: "Offered", active: offered, completed: offered },
  ];
}

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function JourneyStep({ label, active, completed }: { label: string; active: boolean; completed: boolean }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 120,
        px: 1.25,
        py: 1,
        borderRadius: 2,
        border: "1px solid",
        borderColor: completed ? "success.main" : active ? "primary.main" : "rgba(148,163,184,0.5)",
        bgcolor: completed ? "rgba(34,197,94,0.08)" : active ? "rgba(37,99,235,0.08)" : "rgba(255,255,255,0.7)",
      }}
    >
      <Typography variant="body2" fontWeight={800} textAlign="center">
        {label}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
        {completed ? "Done" : active ? "Current" : "Pending"}
      </Typography>
    </Box>
  );
}
