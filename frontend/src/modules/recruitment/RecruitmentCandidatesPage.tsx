import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Chip,
  Drawer,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useNavigate } from "react-router-dom";
import { AdAlertBox, AdButton, AdCard, AdDropDown, AdModal, AdNotification, AdPagingGrid } from "../../common/ad";
import { recruitmentApi, type CandidateRow } from "../../common/services/recruitmentApi";
import { formatCandidateExperience } from "../../common/utils/candidateExperience";
import { formatJsonList } from "../../common/utils/jsonList";

type VerificationFilter = "" | "verified" | "unverified";

export type RecruitmentCandidatesPageProps = {
  title?: string;
  subtitle?: string;
  forceVerificationFilter?: VerificationFilter;
  hideVerificationFilter?: boolean;
  hideAddCandidate?: boolean;
  rowActionMode?: "full" | "verify-only" | "none";
};

function initials(firstName?: string | null, lastName?: string | null): string {
  const a = String(firstName ?? "").trim().charAt(0);
  const b = String(lastName ?? "").trim().charAt(0);
  return `${a}${b}`.trim().toUpperCase() || "C";
}

function formatValue(value: string | number | null | undefined): string {
  const text = String(value ?? "").trim();
  return text || "—";
}

function formatDate(value: string | null | undefined): string {
  const text = String(value ?? "").trim();
  if (!text) return "—";
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return text;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function hasValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  if (typeof value === "boolean") return value;
  const s = String(value).trim();
  if (!s) return false;
  if (s.startsWith("[") && s.endsWith("]")) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.length > 0;
    } catch {
      // fall through
    }
  }
  return s.length > 0;
}

function isVerifiedCandidate(candidate: CandidateRow | null | undefined): boolean {
  return Boolean(candidate?.is_verified);
}

async function hydrateCandidateVerification(rows: CandidateRow[]): Promise<CandidateRow[]> {
  return Promise.all(
    rows.map(async (row) => {
      try {
        const detail = await recruitmentApi.candidates.get(row.candidate_id);
        return { ...row, is_verified: Boolean(detail.is_verified) };
      } catch {
        return { ...row, is_verified: Boolean(row.is_verified) };
      }
    }),
  );
}

const REQUIRED_FIELDS: Array<{ key: keyof CandidateRow; label: string }> = [
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "phone", label: "Mobile" },
  { key: "email", label: "Email" },
  { key: "passport_number", label: "Passport Number" },
  { key: "country_id", label: "Country" },
  { key: "state_id", label: "State" },
  { key: "city_id", label: "City" },
  { key: "father_name", label: "Father's Name" },
  { key: "address1", label: "Address 1" },
  { key: "address2", label: "Address 2" },
  { key: "pincode", label: "Pincode" },
  { key: "dob", label: "DOB" },
  { key: "gender", label: "Gender" },
  { key: "skills", label: "Skills" },
  { key: "education", label: "Education" },
  { key: "experience", label: "Experience" },
  { key: "industry_type", label: "Industry Type" },
  { key: "resume_file_path", label: "Resume Upload" },
  { key: "passport_expiry_date", label: "Passport Expiry Date" },
  { key: "passport_file_path", label: "Passport Upload" },
  { key: "aadhar_number", label: "Aadhaar Number" },
  { key: "aadhar_file_path", label: "Aadhaar Upload" },
  { key: "pan_number", label: "PAN Number" },
  { key: "pan_file_path", label: "PAN Upload" },
  { key: "voter_id_number", label: "Voter ID Number" },
  { key: "voter_id_file_path", label: "Voter ID Upload" },
  { key: "profile_photo_file_path", label: "Profile Photo" },
  { key: "languages_known", label: "Languages Known" },
];

function getMissingFields(candidate: CandidateRow | null): string[] {
  if (!candidate) return REQUIRED_FIELDS.map((f) => f.label);
  return REQUIRED_FIELDS.filter((f) => !hasValue(candidate[f.key])).map((f) => f.label);
}

function FieldRow({ label, value }: { label: string; value: string | number | null | undefined }) {
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
      <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.25, whiteSpace: "pre-line", wordBreak: "break-word" }}>
        {formatValue(value)}
      </Typography>
    </Box>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <AdCard animate={false} contentSx={{ p: 1.5 }} sx={{ backgroundColor: "rgba(255,255,255,0.88)", borderRadius: 0 }}>
      <Stack spacing={0.75}>
        <Typography fontWeight={900} sx={{ fontSize: 15, lineHeight: 1.1 }}>
          {title}
        </Typography>
        {children}
      </Stack>
    </AdCard>
  );
}

export default function RecruitmentCandidatesPage({
  title = "Candidate List",
  subtitle = "View full candidate profiles and verify registrations",
  forceVerificationFilter,
  hideVerificationFilter = false,
  hideAddCandidate = false,
  rowActionMode = "full",
}: RecruitmentCandidatesPageProps = {}) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>(forceVerificationFilter ?? "");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRow | null>(null);
  const [verifiedOverrides, setVerifiedOverrides] = useState<Record<number, boolean>>({});
  const [documentPreview, setDocumentPreview] = useState<{ open: boolean; title: string; url: string }>({
    open: false,
    title: "",
    url: "",
  });

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const listRows = await recruitmentApi.candidates.list();
      setRows(await hydrateCandidateVerification(listRows));
    } catch (e: any) {
      setError((e as Error)?.message ?? "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const rowsWithVerification = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      is_verified:
        typeof verifiedOverrides[row.candidate_id] === "boolean"
          ? verifiedOverrides[row.candidate_id]
          : row.is_verified,
    }));
  }, [rows, verifiedOverrides]);

  useEffect(() => {
    if (typeof forceVerificationFilter !== "undefined") {
      setVerificationFilter(forceVerificationFilter);
    }
  }, [forceVerificationFilter]);

  const filteredRows = useMemo(() => {
    return rowsWithVerification.filter((row) => {
      const verified = isVerifiedCandidate(row);
      if (verificationFilter === "verified") return verified;
      if (verificationFilter === "unverified") return !verified;
      return true;
    });
  }, [rowsWithVerification, verificationFilter]);

  const selectedCandidateResolved = useMemo(() => {
    if (!selectedCandidate) return null;
    return {
      ...selectedCandidate,
      is_verified:
        typeof verifiedOverrides[selectedCandidate.candidate_id] === "boolean"
          ? verifiedOverrides[selectedCandidate.candidate_id]
          : selectedCandidate.is_verified,
    };
  }, [selectedCandidate, verifiedOverrides]);

  const selectedMissingFields = useMemo(() => getMissingFields(selectedCandidateResolved), [selectedCandidateResolved]);
  const selectedProfileComplete = selectedMissingFields.length === 0;
  const selectedDocuments = useMemo(() => {
    if (!selectedCandidateResolved) return [];
    return [
      { label: "Resume Upload", uploaded: Boolean(selectedCandidateResolved.resume_file_path), value: selectedCandidateResolved.resume_file_path },
      { label: "Passport Upload", uploaded: Boolean(selectedCandidateResolved.passport_file_path), value: selectedCandidateResolved.passport_file_path },
      { label: "Aadhaar Upload", uploaded: Boolean(selectedCandidateResolved.aadhar_file_path), value: selectedCandidateResolved.aadhar_file_path },
      { label: "PAN Upload", uploaded: Boolean(selectedCandidateResolved.pan_file_path), value: selectedCandidateResolved.pan_file_path },
      { label: "Voter ID Upload", uploaded: Boolean(selectedCandidateResolved.voter_id_file_path), value: selectedCandidateResolved.voter_id_file_path },
      { label: "Profile Photo", uploaded: Boolean(selectedCandidateResolved.profile_photo_file_path), value: selectedCandidateResolved.profile_photo_file_path },
    ];
  }, [selectedCandidateResolved]);

  const openCandidateDocument = async (filePath: string | null | undefined, title: string) => {
    const path = String(filePath ?? "").trim();
    if (!path) return;
    try {
      const presign = await recruitmentApi.files.presignDownload(path);
      setDocumentPreview({ open: true, title, url: presign.url });
    } catch (e: any) {
      setToast({ open: true, message: (e as Error)?.message ?? "Failed to open document", severity: "error" });
    }
  };

  const setVerified = async (candidate: CandidateRow, nextVerified: boolean) => {
    try {
      await recruitmentApi.candidates.update(candidate.candidate_id, { is_verified: nextVerified });
      setVerifiedOverrides((current) => ({ ...current, [candidate.candidate_id]: nextVerified }));
      setToast({
        open: true,
        message: nextVerified ? "Candidate verified" : "Candidate unverified",
        severity: "success",
      });
      if (selectedCandidate?.candidate_id === candidate.candidate_id) {
        setSelectedCandidate({ ...candidate, is_verified: nextVerified });
      }
      await refresh();
    } catch (e: any) {
      setToast({ open: true, message: (e as Error)?.message ?? "Failed to update verification", severity: "error" });
    }
  };

  const cols = useMemo(
    () => [
      { field: "candidate_code", headerName: "Code", width: 120 },
      {
        field: "__name",
        headerName: "Candidate",
        flex: 1,
        minWidth: 220,
        valueGetter: (...args: any[]) => {
          const row = (args?.[0] as any)?.row ?? args?.[1] ?? {};
          return `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
        },
      },
      { field: "phone", headerName: "Mobile", width: 145 },
      { field: "email", headerName: "Email", flex: 1, minWidth: 220 },
      {
        field: "__location",
        headerName: "Location",
        flex: 1,
        minWidth: 220,
        valueGetter: (...args: any[]) => {
          const row = (args?.[0] as any)?.row ?? args?.[1] ?? {};
          return [row.city_name, row.state_name, row.country_name].filter(Boolean).join(", ");
        },
      },
      {
        field: "status",
        headerName: "Status",
        width: 115,
        renderCell: (p: any) => <Chip size="small" label={String(p.value ?? "") || "-"} />,
      },
      {
        field: "is_verified",
        headerName: "Verified",
        width: 120,
        renderCell: (p: any) => {
          const candidate = p.row as CandidateRow;
          const verified = isVerifiedCandidate(candidate);
          return <Chip size="small" label={verified ? "Verified" : "Pending"} color={verified ? "success" : "warning"} />;
        },
      },
      { field: "created_at", headerName: "Created At", width: 170 },
      ...((rowActionMode === "full" || rowActionMode === "verify-only")
        ? [
            {
              field: "__actions",
              headerName: "Actions",
              width: rowActionMode === "verify-only" ? 140 : 240,
              sortable: false,
              filterable: false,
              renderCell: (p: any) => {
                const r = p.row as CandidateRow;
                const verified = isVerifiedCandidate(r);
                const profileComplete = getMissingFields(r).length === 0;
                return (
                  <Stack direction="row" spacing={0.5}>
                    {rowActionMode === "full" ? (
                      <>
                        <AdButton
                          variant="text"
                          startIcon={<VisibilityOutlinedIcon fontSize="small" />}
                          onClick={(e: any) => {
                            e?.stopPropagation?.();
                            setSelectedCandidate(r);
                          }}
                        >
                          View
                        </AdButton>
                        <AdButton
                          variant="text"
                          color={verified ? "warning" : "success"}
                          startIcon={<VerifiedUserOutlinedIcon fontSize="small" />}
                          disabled={!verified && !profileComplete}
                          onClick={(e: any) => {
                            e?.stopPropagation?.();
                            if (!verified && !profileComplete) return;
                            void setVerified(r, !verified);
                          }}
                        >
                          {verified ? "Unverify" : "Verify"}
                        </AdButton>
                        <AdButton
                          variant="text"
                          startIcon={<EditIcon fontSize="small" />}
                          onClick={(e: any) => {
                            e?.stopPropagation?.();
                            navigate(`/portal/recruitment/candidates/${r.candidate_id}`);
                          }}
                        >
                          Edit
                        </AdButton>
                        <AdButton
                          variant="text"
                          color="error"
                          startIcon={<DeleteOutlineIcon fontSize="small" />}
                          onClick={async (e: any) => {
                            e?.stopPropagation?.();
                            try {
                              await recruitmentApi.candidates.disable(r.candidate_id);
                              setToast({ open: true, message: "Candidate disabled", severity: "success" });
                              refresh();
                            } catch (err: any) {
                              setToast({ open: true, message: (err as Error)?.message ?? "Failed", severity: "error" });
                            }
                          }}
                        >
                          Disable
                        </AdButton>
                      </>
                    ) : (
                      <AdButton
                        variant="contained"
                        color="success"
                        disabled={!profileComplete}
                        startIcon={<VerifiedUserOutlinedIcon fontSize="small" />}
                        onClick={(e: any) => {
                          e?.stopPropagation?.();
                          if (!profileComplete) return;
                          void setVerified(r, true);
                        }}
                      >
                        Verify
                      </AdButton>
                    )}
                  </Stack>
                );
              },
            },
          ]
        : []),
    ],
    [navigate, rowActionMode],
  );

  return (
    <Stack spacing={2.5} sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden", minWidth: 0 }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={1.5}>
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={900}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Stack>
        {!hideAddCandidate ? (
          <AdButton startIcon={<AddIcon fontSize="small" />} onClick={() => navigate("/portal/recruitment/candidates/new")}>
            Add Candidate
          </AdButton>
        ) : null}
      </Stack>

      {!hideVerificationFilter ? (
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
          <Box sx={{ minWidth: { xs: "100%", md: 220 } }}>
            <AdDropDown
              label="Verification"
              variant="standard"
              value={verificationFilter}
              options={[
                { label: "All Candidates", value: "" },
                { label: "Verified Only", value: "verified" },
                { label: "Unverified Only", value: "unverified" },
              ]}
              onChange={(v) => {
                if (typeof forceVerificationFilter === "undefined") {
                  setVerificationFilter(String(v) as VerificationFilter);
                }
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredRows.length} of {rows.length} candidates
          </Typography>
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Showing {filteredRows.length} verified candidates
        </Typography>
      )}

      {loading ? <AdAlertBox severity="info" title="Loading" message="Loading candidates and verification status..." /> : null}
      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <AdPagingGrid
          rows={filteredRows.map((r) => ({ id: r.candidate_id, ...r }))}
          columns={cols as any}
          loading={loading}
          disableColumnMenu
          height={560}
          defaultPageSize={10}
          onRowClick={(params) => setSelectedCandidate(params.row as CandidateRow)}
          sx={{
            "& .MuiDataGrid-row": {
              cursor: "pointer",
            },
          }}
        />
      </AdCard>

      <Drawer anchor="right" open={Boolean(selectedCandidate)} onClose={() => setSelectedCandidate(null)}>
        <Box sx={{ width: { xs: "100vw", md: 720 }, p: 2, bgcolor: "#eef2f7", height: "100%", overflow: "auto" }}>
          {selectedCandidateResolved ? (
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                  <Avatar sx={{ bgcolor: "#607086", fontWeight: 900 }}>{initials(selectedCandidateResolved.first_name, selectedCandidateResolved.last_name)}</Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h5" fontWeight={950} sx={{ lineHeight: 1.05 }}>
                      {`${selectedCandidateResolved.first_name ?? ""} ${selectedCandidateResolved.last_name ?? ""}`.trim() || "Candidate"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Candidate Code: {selectedCandidateResolved.candidate_code ?? "—"}
                    </Typography>
                  </Box>
                </Stack>
                <IconButton onClick={() => setSelectedCandidate(null)} aria-label="close">
                  <CloseIcon />
                </IconButton>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip size="small" label={`Status: ${selectedCandidateResolved.status ?? "—"}`} />
                <Chip
                  size="small"
                  label={isVerifiedCandidate(selectedCandidateResolved) ? "Verified" : "Verification pending"}
                  color={isVerifiedCandidate(selectedCandidateResolved) ? "success" : "warning"}
                />
                <Chip size="small" label={selectedProfileComplete ? "Profile Complete" : "Needs Attention"} color={selectedProfileComplete ? "success" : "default"} />
              </Stack>

              <Stack direction="row" spacing={1}>
              {rowActionMode === "full" ? (
                <>
                  {(() => {
                    const profileComplete = selectedProfileComplete;
                    const verified = isVerifiedCandidate(selectedCandidateResolved);
                    return (
                      <AdButton
                        variant={verified ? "outlined" : "contained"}
                        color={verified ? "warning" : "success"}
                        disabled={!verified && !profileComplete}
                        startIcon={<VerifiedUserOutlinedIcon fontSize="small" />}
                        onClick={() => {
                          if (!verified && !profileComplete) return;
                          void setVerified(selectedCandidateResolved, !verified);
                        }}
                      >
                        {verified ? "Unverify" : "Verify"}
                      </AdButton>
                    );
                  })()}
                  <AdButton
                    variant="text"
                    startIcon={<EditIcon fontSize="small" />}
                    onClick={() => navigate(`/portal/recruitment/candidates/${selectedCandidateResolved.candidate_id}`)}
                  >
                    Edit Candidate
                  </AdButton>
                </>
              ) : null}
              </Stack>

              <SectionCard title="Registration Details">
                <FieldRow label="Candidate Code" value={selectedCandidateResolved.candidate_code} />
                <FieldRow label="Mobile" value={selectedCandidateResolved.phone} />
                <FieldRow label="Email" value={selectedCandidateResolved.email} />
                <FieldRow label="Passport Number" value={selectedCandidateResolved.passport_number} />
                <FieldRow label="Created At" value={formatDate(selectedCandidateResolved.created_at)} />
              </SectionCard>

              <SectionCard title="Location & Address">
                <FieldRow label="Country" value={selectedCandidateResolved.country_name} />
                <FieldRow label="State" value={selectedCandidateResolved.state_name} />
                <FieldRow label="City" value={selectedCandidateResolved.city_name} />
                <FieldRow label="Address 1" value={selectedCandidateResolved.address1} />
                <FieldRow label="Address 2" value={selectedCandidateResolved.address2} />
                <FieldRow label="Pincode" value={selectedCandidateResolved.pincode} />
              </SectionCard>

              <SectionCard title="Personal Profile">
                <FieldRow label="Father's Name" value={selectedCandidateResolved.father_name} />
                <FieldRow label="DOB" value={formatDate(selectedCandidateResolved.dob)} />
                <FieldRow label="Gender" value={selectedCandidateResolved.gender} />
                <FieldRow label="Skills" value={formatJsonList(selectedCandidateResolved.skills)} />
                <FieldRow label="Education" value={selectedCandidateResolved.education} />
                <FieldRow label="Experience" value={formatCandidateExperience(selectedCandidateResolved.experience)} />
                <FieldRow label="Industry Type" value={selectedCandidateResolved.industry_type} />
                <FieldRow label="Languages Known" value={formatJsonList(selectedCandidateResolved.languages_known)} />
              </SectionCard>

              <SectionCard title="Documents">
                {selectedDocuments.map((doc) => (
                  <Box
                    key={doc.label}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 1,
                      py: 0.75,
                      borderBottom: "1px solid rgba(226,232,240,0.85)",
                      "&:last-of-type": { borderBottom: 0 },
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {doc.label}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="flex-end">
                      <Chip size="small" label={doc.uploaded ? "Uploaded" : "Missing"} color={doc.uploaded ? "success" : "default"} />
                      {doc.uploaded ? (
                        <AdButton variant="text" startIcon={<OpenInNewIcon fontSize="small" />} onClick={() => void openCandidateDocument(doc.value, doc.label)}>
                          View
                        </AdButton>
                      ) : null}
                    </Stack>
                  </Box>
                ))}
              </SectionCard>

              <SectionCard title="Profile Check">
                <FieldRow label="Profile Complete" value={selectedProfileComplete ? "Yes" : "No"} />
                <FieldRow label="Missing Fields" value={selectedMissingFields.length ? selectedMissingFields.join(", ") : "—"} />
              </SectionCard>
            </Stack>
          ) : null}
        </Box>
      </Drawer>

      <AdModal
        open={documentPreview.open}
        onClose={() => setDocumentPreview({ open: false, title: "", url: "" })}
        title={documentPreview.title || "Document"}
        maxWidth="lg"
      >
        <Box
          component="iframe"
          src={documentPreview.url}
          title={documentPreview.title || "Document"}
          sx={{
            width: "100%",
            height: { xs: "70vh", md: "78vh" },
            border: "1px solid rgba(148,163,184,0.35)",
            bgcolor: "#fff",
          }}
        />
      </AdModal>
    </Stack>
  );
}
