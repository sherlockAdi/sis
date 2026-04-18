import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Button,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import { useNavigate } from "react-router-dom";
import { candidateApi } from "../../common/services/candidateApi";

type CandidateProfile = Awaited<ReturnType<typeof candidateApi.profile.me>>;

function initials(firstName?: string | null, lastName?: string | null): string {
  const a = String(firstName ?? "").trim().charAt(0);
  const b = String(lastName ?? "").trim().charAt(0);
  return `${a}${b}`.trim().toUpperCase() || "C";
}

function formatValue(value: string | number | null | undefined): string {
  const text = String(value ?? "").trim();
  if (!text) return "—";
  if (/^\d{4}-\d{2}-\d{2}(?:[T\s].*)?$/.test(text)) {
    const d = new Date(text);
    if (!Number.isNaN(d.getTime())) {
      return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(d);
    }
  }
  return text;
}

function Ring({ value }: { value: number }) {
  const color = value >= 100 ? "#2f76c5" : "#4c8cd8";
  return (
    <Box
      sx={{
        width: 108,
        height: 108,
        borderRadius: "50%",
        background: `conic-gradient(${color} ${value * 3.6}deg, #d8e2ee 0deg)`,
        display: "grid",
        placeItems: "center",
        boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
      }}
    >
      <Box
        sx={{
          width: 84,
          height: 84,
          borderRadius: "50%",
          bgcolor: "background.paper",
          display: "grid",
          placeItems: "center",
          boxShadow: "inset 0 0 0 1px rgba(148,163,184,0.15)",
        }}
      >
        <Typography fontWeight={950} sx={{ fontSize: 21, lineHeight: 1 }}>
          {value}%
        </Typography>
      </Box>
    </Box>
  );
}

function FieldRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        gap: 1,
        py: 0.7,
        alignItems: "center",
        borderBottom: "1px solid rgba(226,232,240,0.9)",
        "&:last-of-type": { borderBottom: 0 },
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={700}
        sx={{ lineHeight: 1.2, minWidth: 0, wordBreak: "break-word", textAlign: "right" }}
      >
        {formatValue(value)}
      </Typography>
    </Box>
  );
}

function CompactCard({
  title,
  subtitle,
  children,
  sx,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  sx?: object;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 0,
        borderColor: "rgba(148,163,184,0.42)",
        bgcolor: "#fff",
        boxShadow: "0 8px 28px rgba(15,23,42,0.05)",
        ...sx,
      }}
    >
      <CardContent sx={{ p: 1.35, "&:last-child": { pb: 1.35 } }}>
        <Stack spacing={0.55}>
          <Stack spacing={0.1}>
            <Typography fontWeight={950} sx={{ fontSize: 17, lineHeight: 1.15 }}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.25 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Stack>
          {children}
        </Stack>
      </CardContent>
    </Card>
  );
}

function MetaLine({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
      <Box sx={{ color: "text.secondary", display: "grid", placeItems: "center" }}>{icon}</Box>
      <Typography variant="body2" sx={{ lineHeight: 1.2, minWidth: 0, wordBreak: "break-word" }}>
        {label}
      </Typography>
    </Stack>
  );
}

function StatusPill({ complete }: { complete: boolean }) {
  return (
    <Chip
      size="small"
      label={complete ? "Complete" : "Needs attention"}
      color={complete ? "success" : "warning"}
      sx={{ height: 22, fontWeight: 800 }}
    />
  );
}

function DocumentChip({ uploaded }: { uploaded: boolean }) {
  return (
    <Chip
      size="small"
      label={uploaded ? "Uploaded" : "Missing"}
      sx={{
        height: 22,
        fontSize: 12,
        fontWeight: 800,
        bgcolor: uploaded ? "#dff3e3" : "#f4f6f8",
        color: uploaded ? "#24703a" : "text.secondary",
      }}
    />
  );
}

export default function CandidateHomePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const row = await candidateApi.profile.me();
        if (alive) setProfile(row);
      } catch (e: any) {
        if (alive) setError(e?.message ?? "Failed to load profile");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const missingFields = profile?.missing_fields ?? [];
  const profileComplete = Boolean(profile?.profile_complete) && missingFields.length === 0;
  const completionScore = profileComplete ? 100 : Math.max(0, 100 - missingFields.length * 3);
  const docCount = useMemo(
    () =>
      [
        profile?.resume_file_path,
        profile?.passport_file_path,
        profile?.aadhar_file_path,
        profile?.pan_file_path,
        profile?.voter_id_file_path,
        profile?.profile_photo_file_path,
      ].filter(Boolean).length,
    [profile],
  );
  const locationText = useMemo(
    () => [profile?.city_name, profile?.state_name, profile?.country_name].filter(Boolean).join(", ") || "—",
    [profile?.city_name, profile?.state_name, profile?.country_name],
  );

  if (loading && !profile) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#eef2f7" }}>
        <Typography color="text.secondary">Loading profile...</Typography>
      </Box>
    );
  }

  if (error && !profile) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#eef2f7", px: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const documents = [
    { label: "Resume", uploaded: Boolean(profile?.resume_file_path), value: profile?.resume_file_path },
    { label: "Passport Expiry", uploaded: Boolean(profile?.passport_expiry_date), value: profile?.passport_expiry_date },
    { label: "Passport Upload", uploaded: Boolean(profile?.passport_file_path), value: profile?.passport_file_path },
    { label: "Aadhaar Number", uploaded: Boolean(profile?.aadhar_number), value: profile?.aadhar_number },
    { label: "Aadhaar Upload", uploaded: Boolean(profile?.aadhar_file_path), value: profile?.aadhar_file_path },
    { label: "PAN Number", uploaded: Boolean(profile?.pan_number), value: profile?.pan_number },
    { label: "PAN Upload", uploaded: Boolean(profile?.pan_file_path), value: profile?.pan_file_path },
    { label: "Voter ID Number", uploaded: Boolean(profile?.voter_id_number), value: profile?.voter_id_number },
    { label: "Voter ID Upload", uploaded: Boolean(profile?.voter_id_file_path), value: profile?.voter_id_file_path },
    { label: "Profile Photo", uploaded: Boolean(profile?.profile_photo_file_path), value: profile?.profile_photo_file_path },
  ];

  return (
    <Container
      maxWidth="xl"
      disableGutters
      sx={{
        minHeight: "100vh",
        px: { xs: 1, md: 1.5 },
        py: { xs: 1, md: 1.5 },
        bgcolor: "#eef2f7",
        backgroundImage:
          "radial-gradient(circle at top left, rgba(78,129,198,0.13), transparent 30%), radial-gradient(circle at top right, rgba(96,165,250,0.12), transparent 28%)",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(12, minmax(0, 1fr))",
          },
          gap: 1.2,
          alignItems: "start",
        }}
      >
        <Card
          variant="outlined"
          sx={{
            gridColumn: { xl: "span 8" },
            borderRadius: 0,
            borderColor: "rgba(148,163,184,0.42)",
            bgcolor: "#edf3f8",
            boxShadow: "0 8px 28px rgba(15,23,42,0.05)",
          }}
        >
          <CardContent sx={{ p: 1.35, position: "relative", "&:last-child": { pb: 1.35 } }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
              sx={{ minWidth: 0 }}
            >
              <Stack spacing={1} sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" spacing={1.1} alignItems="center" sx={{ minWidth: 0 }}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: "#6f7f91",
                      fontWeight: 900,
                      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)",
                    }}
                  >
                    {initials(profile?.first_name, profile?.last_name)}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={900} sx={{ fontSize: 16, lineHeight: 1.05 }}>
                      {`${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "Candidate"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                      Candidate Code: {profile?.candidate_code ?? "—"}
                    </Typography>
                    <Chip
                      size="small"
                      label={`Status: ${profile?.status ?? "—"}`}
                      sx={{
                        mt: 0.6,
                        height: 22,
                        fontWeight: 800,
                        bgcolor: "#f4f6f9",
                      }}
                    />
                  </Box>
                </Stack>

                <Box>
                  <Typography fontWeight={950} sx={{ fontSize: { xs: 20, md: 24 }, lineHeight: 1.05 }}>
                    Candidate Dashboard
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.3 }}>
                    Your profile, documents, and readiness status in one place.
                  </Typography>
                </Box>

                <Stack
                  direction="row"
                  spacing={1.8}
                  sx={{
                    flexWrap: "wrap",
                    rowGap: 1,
                    "& > *": { minWidth: 0 },
                  }}
                >
                  <MetaLine icon={<EmailOutlinedIcon fontSize="small" />} label={`${profile?.email ?? "—"} (Email)`} />
                  <MetaLine
                    icon={<FingerprintIcon fontSize="small" />}
                    label={`Passport: ${profile?.passport_number ?? "—"}${docCount ? `  |  ${docCount} uploaded` : ""}`}
                  />
                  <MetaLine icon={<LocationOnOutlinedIcon fontSize="small" />} label={locationText} />
                </Stack>

                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 0,
                    bgcolor: "#eef5fb",
                    borderColor: "rgba(148,163,184,0.3)",
                  }}
                >
                  <CardContent sx={{ p: 1.15, "&:last-child": { pb: 1.15 } }}>
                    <Typography fontWeight={900} sx={{ fontSize: 16, lineHeight: 1.15, mb: 0.75 }}>
                      Registration
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={0.8}
                      sx={{ flexWrap: "wrap", alignItems: "center", rowGap: 0.8 }}
                    >
                      <Chip size="small" label="Personal info" sx={{ bgcolor: "#dfeaf8", fontWeight: 700 }} />
                      <KeyboardArrowRightIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                      <Chip size="small" label="Documents" sx={{ bgcolor: "#dfeaf8", fontWeight: 700 }} />
                      <KeyboardArrowRightIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                      <Chip size="small" label="Uploads" sx={{ bgcolor: "#dfeaf8", fontWeight: 700 }} />
                    </Stack>
                    <Box sx={{ mt: 1.15, pt: 0.9, borderTop: "1px solid rgba(148,163,184,0.34)" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.35 }}>
                      Complete: {profileComplete ? "You can apply now" : "Complete profile before applying"}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>

                <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 0.5 }}>
                  <Button
                    variant="contained"
                    onClick={() => navigate("/portal/candidate/profile/settings")}
                    sx={{
                      borderRadius: 0,
                      textTransform: "none",
                      fontWeight: 900,
                      px: 2,
                      boxShadow: "none",
                    }}
                  >
                    Edit Profile
                  </Button>
                </Box>
              </Stack>

              <Box
                sx={{
                  position: "absolute",
                  top: { xs: 12, md: 16 },
                  right: { xs: 12, md: 16 },
                  minWidth: 130,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Stack spacing={1} alignItems="center">
                  <Typography fontWeight={900} sx={{ alignSelf: "flex-start", fontSize: 17 }}>
                    Profile Completion
                  </Typography>
                  <Ring value={completionScore} />
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card
          variant="outlined"
          sx={{
            gridColumn: { xl: "span 4" },
            borderRadius: 0,
            borderColor: "rgba(148,163,184,0.42)",
            bgcolor: "#fff",
            boxShadow: "0 8px 28px rgba(15,23,42,0.05)",
          }}
        >
          <CardContent sx={{ p: 1.25, "&:last-child": { pb: 1.25 } }}>
            <Stack spacing={0.8}>
              <Typography fontWeight={900} sx={{ fontSize: 17 }}>
                Document Status
              </Typography>
              <Box sx={{ display: "grid", gap: 0.15 }}>
                {documents.map((item) => (
                  <Box
                    key={item.label}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) auto",
                      gap: 1,
                      py: 0.45,
                      alignItems: "center",
                    }}
                  >
                    <Stack direction="row" spacing={0.8} alignItems="center" sx={{ minWidth: 0 }}>
                      <DescriptionOutlinedIcon sx={{ fontSize: 17, color: "text.secondary", flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ lineHeight: 1.15, minWidth: 0 }}>
                        {item.label}
                      </Typography>
                    </Stack>
                    <DocumentChip uploaded={item.uploaded} />
                  </Box>
                ))}
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Box
          sx={{
            gridColumn: "1 / -1",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(12, minmax(0, 1fr))" },
            gap: 1.2,
          }}
        >
          <CompactCard title="Registration Details" sx={{ gridColumn: { md: "span 4" } }}>
            <FieldRow label="Candidate Code" value={profile?.candidate_code} />
            <FieldRow label="First Name" value={profile?.first_name} />
            <FieldRow label="Last Name" value={profile?.last_name} />
            <FieldRow label="Mobile" value={profile?.phone} />
            <FieldRow label="Email" value={profile?.email} />
            <FieldRow label="Passport Number" value={profile?.passport_number} />
            <FieldRow label="Status" value={profile?.status} />
          </CompactCard>

          <CompactCard title="Location & Address" sx={{ gridColumn: { md: "span 4" } }}>
            <FieldRow label="Country" value={profile?.country_name} />
            <FieldRow label="State" value={profile?.state_name} />
            <FieldRow label="City" value={profile?.city_name} />
            <FieldRow label="Address 1" value={profile?.address1} />
            <FieldRow label="Address 2" value={profile?.address2} />
            <FieldRow label="Pincode" value={profile?.pincode} />
          </CompactCard>

          <CompactCard title="Personal Profile" sx={{ gridColumn: { md: "span 4" } }}>
            <FieldRow label="Father's Name" value={profile?.father_name} />
            <FieldRow label="DOB" value={profile?.dob} />
            <FieldRow label="Gender" value={profile?.gender} />
            <FieldRow label="Skills" value={profile?.skills} />
            <FieldRow label="Education" value={profile?.education} />
            <FieldRow label="Experience" value={profile?.experience} />
            <FieldRow label="Industry Type" value={profile?.industry_type} />
            <FieldRow label="Languages Known" value={profile?.languages_known} />
          </CompactCard>
        </Box>

        <Card
          variant="outlined"
          sx={{
            gridColumn: { xl: "span 3" },
            borderRadius: 0,
            borderColor: "rgba(148,163,184,0.42)",
            bgcolor: "#fff",
            boxShadow: "0 8px 28px rgba(15,23,42,0.05)",
          }}
        >
          <CardContent sx={{ p: 1.25, "&:last-child": { pb: 1.25 } }}>
            <Stack spacing={1}>
              <Typography fontWeight={900} sx={{ fontSize: 17 }}>
                Missing Checklist
              </Typography>
              <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ flexWrap: "wrap" }}>
                <Chip
                  size="small"
                  label={missingFields.length ? missingFields.join(", ") : "All required fields completed"}
                  sx={{
                    bgcolor: missingFields.length ? "#fff7e6" : "#e7f5ea",
                    height: "auto",
                    py: 0.4,
                    "& .MuiChip-label": { whiteSpace: "normal" },
                  }}
                />
                <StatusPill complete={profileComplete} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.35 }}>
                Finish these items to unlock job applications.
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Card
          variant="outlined"
          sx={{
            gridColumn: { xl: "span 9" },
            borderRadius: 0,
            borderColor: "rgba(148,163,184,0.42)",
            bgcolor: "#fbfdff",
            boxShadow: "0 8px 28px rgba(15,23,42,0.04)",
          }}
        >
          <CardContent sx={{ p: 1.25, "&:last-child": { pb: 1.25 } }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.9 }}>
              <WorkOutlineIcon sx={{ color: "text.secondary", fontSize: 18 }} />
              <Typography fontWeight={900} sx={{ fontSize: 16 }}>
                Readiness Notes
              </Typography>
            </Stack>
            <Stack spacing={0.8}>
              <MetaLine
                icon={<VerifiedUserOutlinedIcon fontSize="small" />}
                label={profileComplete ? "Profile looks complete and ready for applications." : "Profile still has missing sections that need attention."}
              />
              <MetaLine
                icon={<PersonOutlineIcon fontSize="small" />}
                label={`Missing fields: ${missingFields.length ? missingFields.join(", ") : "None"}`}
              />
              <MetaLine
                icon={<BadgeOutlinedIcon fontSize="small" />}
                label={`Registration status: ${formatValue(profile?.status)}`}
              />
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
