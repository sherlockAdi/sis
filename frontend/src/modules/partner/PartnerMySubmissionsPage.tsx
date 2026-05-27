import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Drawer, IconButton, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import { AdAlertBox, AdButton, AdCard, AdGrid, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { mastersApi, type DocumentType } from "../../common/services/mastersApi";
import { recruitmentApi } from "../../common/services/recruitmentApi";
import { partnerPortalApi, type PartnerApplicationRow, type PartnerCandidateRow } from "../../common/services/partnersApi";
import { formatJsonList } from "../../common/utils/jsonList";

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function isShortlistedStatus(value: string | null | undefined): boolean {
  return normalizeStatus(value).includes("shortlist") || normalizeStatus(value) === "ready";
}

function isAppliedStatus(value: string | null | undefined): boolean {
  return normalizeStatus(value) === "applied";
}

export default function PartnerMySubmissionsPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const [rows, setRows] = useState<PartnerApplicationRow[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [candidateError, setCandidateError] = useState<string | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<PartnerCandidateRow | null>(null);
  const [candidateDocuments, setCandidateDocuments] = useState<Array<{ id: number; label: string; file_path: string | null; uploaded_at: string | null }>>([]);
  const [shortlistingId, setShortlistingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setRows(await partnerPortalApi.applications.list());
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(apiErr?.message ?? "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  async function openCandidate(candidate_id: number) {
    setCandidateOpen(true);
    setCandidateLoading(true);
    setCandidateError(null);
    setCandidateProfile(null);
    setCandidateDocuments([]);
    try {
      const [candidateRes, docs] = await Promise.all([
        partnerPortalApi.candidates.get(candidate_id),
        docTypes.length ? Promise.resolve(docTypes) : mastersApi.documentTypes.list(true).catch(() => []),
      ]);
      setDocTypes(Array.isArray(docs) ? docs : []);
      setCandidateProfile(candidateRes.candidate);
      setCandidateDocuments(
        (candidateRes.documents ?? []).map((doc) => ({
          id: doc.id,
          label: docs.find((d) => d.document_type_id === doc.document_type_id)?.document_name ?? `Document #${doc.document_type_id}`,
          file_path: doc.file_path,
          uploaded_at: doc.uploaded_at,
        })),
      );
    } catch (e: any) {
      setCandidateError((e as ApiError)?.message ?? "Failed to load candidate profile");
    } finally {
      setCandidateLoading(false);
    }
  }

  async function openFile(file_path: string) {
    try {
      const presign = await recruitmentApi.files.presignDownload(file_path);
      window.open(presign.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to open file", severity: "error" });
    }
  }

  async function shortlistApplication(application_id: number) {
    setShortlistingId(application_id);
    try {
      await recruitmentApi.applications.updateStatus(application_id, "Shortlist");
      setRows((prev) => prev.filter((row) => row.application_id !== application_id));
      setToast({ open: true, message: "Application shortlisted", severity: "success" });
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to shortlist application", severity: "error" });
    } finally {
      setShortlistingId((current) => (current === application_id ? null : current));
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setDocTypes(await mastersApi.documentTypes.list(true));
      } catch {
        setDocTypes([]);
      }
    })();
  }, []);

  const cols = useMemo(
    () => [
      { field: "application_id", headerName: "App ID", width: 100 },
      { field: "candidate_name", headerName: "Candidate", flex: 1, minWidth: 180 },
      { field: "job_title", headerName: "Job", flex: 1, minWidth: 220 },
      { field: "application_date", headerName: "Date", width: 130 },
      {
        field: "status",
        headerName: "Status",
        width: 140,
        renderCell: (p: any) => {
          const status = String(p.value ?? "").trim();
          return <Chip size="small" label={status || "—"} color={isShortlistedStatus(status) ? "success" : "default"} />;
        },
      },
      { field: "phone", headerName: "Phone", width: 140 },
      { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
      {
        field: "__actions",
        headerName: "Actions",
        width: 260,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const r = p.row as PartnerApplicationRow;
          const shortlisted = isShortlistedStatus(r.status);
          return (
            <Stack direction="row" spacing={0.75}>
              <IconButton
                aria-label="Open candidate full profile"
                onClick={() => navigate(`/portal/partner/applicants/${r.candidate_id}`)}
                size="small"
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
              <IconButton aria-label="Open candidate documents" onClick={() => openCandidate(r.candidate_id)} size="small">
                <BadgeOutlinedIcon fontSize="small" />
              </IconButton>
              <AdButton
                variant="contained"
                size="small"
                onClick={() => shortlistApplication(r.application_id)}
                disabled={shortlisted || shortlistingId === r.application_id}
                sx={{ minWidth: 0, whiteSpace: "nowrap" }}
              >
                {shortlistingId === r.application_id ? "Shortlisting..." : shortlisted ? "Shortlisted" : "Shortlist"}
              </AdButton>
            </Stack>
          );
        },
      },
    ],
    [navigate, openCandidate, shortlistingId],
  );

  const visibility = useMemo(
    () => ({
      phone: !isSmDown,
      email: !isMdDown,
    }),
    [isMdDown, isSmDown],
  );

  const visibleRows = useMemo(() => rows.filter((row) => isAppliedStatus(row.status)), [rows]);

  return (
    <Stack spacing={2.5} sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden", minWidth: 0 }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      <Stack spacing={0.25}>
        <Typography variant="h5" fontWeight={900}>
          Applied Candidate List
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Candidates who applied to your jobs
        </Typography>
      </Stack>
      {error && <AdAlertBox severity="error" title="Error" message={error} />}
      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)", minWidth: 0 }} contentSx={{ p: 2 }}>
        <AdGrid
          rows={visibleRows.map((r) => ({ id: r.application_id, ...r }))}
          columns={cols as any}
          loading={loading}
          disableColumnMenu
          columnVisibilityModel={visibility as any}
          sx={{ minWidth: 0 }}
        />
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
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={950} sx={{ fontSize: 20, lineHeight: 1.1 }}>
                Candidate Profile
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                Full profile opened from the document icon
              </Typography>
            </Box>
            <IconButton onClick={() => setCandidateOpen(false)} aria-label="Close candidate profile">
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
                    {`${candidateProfile.first_name ?? ""} ${candidateProfile.last_name ?? ""}`.trim() || "Candidate"}
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
                  <ProfileField label="First Name" value={candidateProfile.first_name} />
                  <ProfileField label="Last Name" value={candidateProfile.last_name} />
                  <ProfileField label="Mobile" value={candidateProfile.phone} />
                  <ProfileField label="Email" value={candidateProfile.email} />
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
                  <ProfileField label="Address 1" value={candidateProfile.address1} />
                  <ProfileField label="Address 2" value={candidateProfile.address2} />
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
                    Verification Files
                  </Typography>
                  <FileField label="Resume File" value={candidateProfile.resume_file_path} onOpen={openFile} />
                  <ProfileField label="Passport Expiry Date" value={candidateProfile.passport_expiry_date} />
                  <FileField label="Passport File" value={candidateProfile.passport_file_path} onOpen={openFile} />
                  <ProfileField label="Aadhaar Number" value={candidateProfile.aadhar_number} />
                  <FileField label="Aadhaar File" value={candidateProfile.aadhar_file_path} onOpen={openFile} />
                  <ProfileField label="PAN Number" value={candidateProfile.pan_number} />
                  <FileField label="PAN File" value={candidateProfile.pan_file_path} onOpen={openFile} />
                  <ProfileField label="Voter ID Number" value={candidateProfile.voter_id_number} />
                  <FileField label="Voter ID File" value={candidateProfile.voter_id_file_path} onOpen={openFile} />
                  <FileField label="Profile Photo" value={candidateProfile.profile_photo_file_path} onOpen={openFile} />
                </Box>

                <Box>
                  <Typography fontWeight={900} sx={{ fontSize: 14, mb: 0.75 }}>
                    Documents
                  </Typography>
                  {!candidateDocuments.length ? (
                    <Typography variant="body2" color="text.secondary">
                      No documents found.
                    </Typography>
                  ) : (
                    <Stack spacing={0}>
                      {candidateDocuments.map((doc) => (
                        <Box
                          key={doc.id}
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
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>
                              {doc.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {doc.uploaded_at ?? "—"}
                            </Typography>
                          </Box>
                          <Chip size="small" label={doc.file_path ? "Uploaded" : "Missing"} color={doc.file_path ? "success" : "default"} />
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>

                <Box>
                  <Typography fontWeight={900} sx={{ fontSize: 14, mb: 0.75 }}>
                    Meta
                  </Typography>
                  <ProfileField label="User ID" value={candidateProfile.user_id == null ? null : String(candidateProfile.user_id)} />
                  <ProfileField label="Created At" value={candidateProfile.created_at} />
                  <ProfileField label="Updated At" value={candidateProfile.updated_at} />
                </Box>
              </Stack>
            ) : (
              <Typography color="text.secondary">Click the document icon to view the candidate profile.</Typography>
            )}
          </Box>
        </Box>
      </Drawer>
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
