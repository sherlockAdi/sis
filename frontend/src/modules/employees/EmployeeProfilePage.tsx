import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import { AdAlertBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { employeesApi, type EmployeeDetailRow } from "../../common/services/employeesApi";
import { formatJsonList } from "../../common/utils/jsonList";

function initials(name?: string | null): string {
  return String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "E";
}

function formatValue(value: string | number | null | undefined): string {
  const text = String(value ?? "").trim();
  return text || "—";
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function Ring({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        width: 108,
        height: 108,
        borderRadius: "50%",
        background: "conic-gradient(#2f76c5 0deg, #2f76c5 360deg, #d8e2ee 0deg)",
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
          textAlign: "center",
          px: 1,
        }}
      >
        <Stack spacing={0.1}>
          <Typography fontWeight={950} sx={{ fontSize: 16, lineHeight: 1 }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.1 }}>
            {label}
          </Typography>
        </Stack>
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

function MetaLine({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
      <Box sx={{ color: "text.secondary", display: "grid", placeItems: "center" }}>{icon}</Box>
      <Typography variant="body2" sx={{ lineHeight: 1.2, minWidth: 0, wordBreak: "break-word" }}>
        {label}
      </Typography>
    </Stack>
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

export default function EmployeeProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employee, setEmployee] = useState<EmployeeDetailRow | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const row = await employeesApi.me();
        if (alive) setEmployee(row);
      } catch (e: any) {
        if (alive) setError((e as ApiError)?.message ?? "Failed to load profile");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const documentItems = useMemo(
    () => [
      { label: "Passport Upload", uploaded: Boolean(employee?.passport_file_path), value: employee?.passport_file_path },
      { label: "Aadhaar Upload", uploaded: Boolean(employee?.aadhar_file_path), value: employee?.aadhar_file_path },
      { label: "PAN Upload", uploaded: Boolean(employee?.pan_file_path), value: employee?.pan_file_path },
      { label: "Voter ID Upload", uploaded: Boolean(employee?.voter_id_file_path), value: employee?.voter_id_file_path },
      { label: "Profile Photo", uploaded: Boolean(employee?.profile_photo_file_path), value: employee?.profile_photo_file_path },
    ],
    [employee],
  );

  const locationText = useMemo(
    () => [employee?.work_location].filter(Boolean).join(", ") || "—",
    [employee?.work_location],
  );

  if (loading && !employee) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#eef2f7" }}>
        <Typography color="text.secondary">Loading employee profile...</Typography>
      </Box>
    );
  }

  if (error && !employee) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#eef2f7", px: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

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
      {error ? <AdAlertBox severity="error" title="Error" message={error} /> : null}

      {!employee ? null : (
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
                      {initials(employee.employee_name)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={900} sx={{ fontSize: 16, lineHeight: 1.05 }}>
                        {employee.employee_name || "Employee"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                        Employee Code: {formatValue(employee.employee_code)}
                      </Typography>
                      <Chip
                        size="small"
                        label={`Status: ${formatValue(employee.employment_status)}`}
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
                      Employee Profile
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.3 }}>
                      Employee information and linked candidate details in one place.
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
                    <MetaLine icon={<EmailOutlinedIcon fontSize="small" />} label={`${formatValue(employee.email)} (Email)`} />
                    <MetaLine
                      icon={<FingerprintIcon fontSize="small" />}
                      label={`Passport: ${formatValue(employee.passport_number)}`}
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
                        Employee Snapshot
                      </Typography>
                      <Stack direction="row" spacing={0.8} sx={{ flexWrap: "wrap", alignItems: "center", rowGap: 0.8 }}>
                        <Chip size="small" label={`Employee ID ${formatValue(employee.employee_id)}`} sx={{ bgcolor: "#dfeaf8", fontWeight: 700 }} />
                        <Chip size="small" label={`Candidate ${formatValue(employee.candidate_id)}`} sx={{ bgcolor: "#dfeaf8", fontWeight: 700 }} />
                        <Chip size="small" label={`Deployment ${formatValue(employee.deployment_id)}`} sx={{ bgcolor: "#dfeaf8", fontWeight: 700 }} />
                        <Chip size="small" label={formatValue(employee.work_location)} sx={{ bgcolor: "#dfeaf8", fontWeight: 700 }} />
                      </Stack>
                      <Box sx={{ mt: 1.15, pt: 0.9, borderTop: "1px solid rgba(148,163,184,0.34)" }}>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.35 }}>
                          Joined on {formatDate(employee.date_of_joining)} and confirmed on {formatDate(employee.date_of_confirmation)}.
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
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
                      Profile Status
                    </Typography>
                    {/* <Ring value="100%" label="Ready" /> */}
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
                  {documentItems.map((item) => (
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
            <CompactCard title="Employment Details" sx={{ gridColumn: { md: "span 4" } }}>
              <FieldRow label="Employee ID" value={employee.employee_id} />
              <FieldRow label="Employee Code" value={employee.employee_code} />
              <FieldRow label="Employee Name" value={employee.employee_name} />
              <FieldRow label="Employee Contact Number" value={employee.employee_contact_number} />
              <FieldRow label="Work Location" value={employee.work_location} />
              <FieldRow label="Employment Status" value={employee.employment_status} />
              <FieldRow label="Date of Joining" value={formatDate(employee.date_of_joining)} />
              <FieldRow label="Date of Confirmation" value={formatDate(employee.date_of_confirmation)} />
              <FieldRow label="Shift Timing" value={employee.shift_timing} />
            </CompactCard>

            <CompactCard title="Personal Profile" sx={{ gridColumn: { md: "span 4" } }}>
              <FieldRow label="First Name" value={employee.first_name} />
              <FieldRow label="Last Name" value={employee.last_name} />
              <FieldRow label="DOB" value={formatDate(employee.dob)} />
              <FieldRow label="Gender" value={employee.gender} />
              <FieldRow label="Skills" value={formatJsonList(employee.skills)} />
              <FieldRow label="Education" value={employee.education} />
              <FieldRow label="Experience" value={employee.experience} />
              <FieldRow label="Industry Type" value={employee.industry_type} />
              <FieldRow label="Languages Known" value={formatJsonList(employee.languages_known)} />
            </CompactCard>

            {/* <CompactCard title="Address & Documents" sx={{ gridColumn: { md: "span 4" } }}>
              <FieldRow label="Address 1" value={employee.address1} />
              <FieldRow label="Address 2" value={employee.address2} />
              <FieldRow label="Pin Code" value={employee.pin_code} />
              <FieldRow label="Email" value={employee.email} />
              <FieldRow label="Phone" value={employee.phone} />
              <FieldRow label="Passport Number" value={employee.passport_number} />
              <FieldRow label="Passport Expiry Date" value={formatDate(employee.passport_expiry_date)} />
              <FieldRow label="Aadhar Number" value={employee.aadhar_number} />
              <FieldRow label="PAN Number" value={employee.pan_number} />
              <FieldRow label="Voter ID Number" value={employee.voter_id_number} />
              <FieldRow label="Passport File" value={employee.passport_file_path} />
              <FieldRow label="Aadhar File" value={employee.aadhar_file_path} />
              <FieldRow label="PAN File" value={employee.pan_file_path} />
              <FieldRow label="Voter ID File" value={employee.voter_id_file_path} />
              <FieldRow label="Profile Photo" value={employee.profile_photo_file_path} />
            </CompactCard> */}
          </Box>

          {/* <Card
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
                  Login & Linkage
                </Typography>
              </Stack>
              <Stack spacing={0.8}>
                <MetaLine icon={<PersonOutlineIcon fontSize="small" />} label={`User ID: ${formatValue(employee.user_id)}`} />
                <MetaLine icon={<BadgeOutlinedIcon fontSize="small" />} label={`Login Username: ${formatValue(employee.login_username)}`} />
                <MetaLine icon={<EmailOutlinedIcon fontSize="small" />} label={`Login Email: ${formatValue(employee.login_email)}`} />
                <MetaLine
                  icon={<LocationOnOutlinedIcon fontSize="small" />}
                  label={`Candidate Address: ${formatValue(employee.candidate_address1)}${employee.candidate_address2 ? `, ${employee.candidate_address2}` : ""}`}
                />
              </Stack>
            </CardContent>
          </Card> */}

          {/* <Card
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
                  Candidate Link
                </Typography>
                <FieldRow label="Candidate ID" value={employee.candidate_id} />
                <FieldRow label="Candidate Pincode" value={employee.candidate_pincode} />
                <FieldRow label="Created At" value={formatDateTime(employee.created_at)} />
                <FieldRow label="Updated At" value={formatDateTime(employee.updated_at)} />
                <FieldRow label="Deleted At" value={formatDateTime(employee.deleted_at)} />
              </Stack>
            </CardContent>
          </Card> */}
        </Box>
      )}
    </Container>
  );
}
