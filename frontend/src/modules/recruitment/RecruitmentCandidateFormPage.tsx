import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, Container, Divider, Stack, TextField, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import dayjs from "dayjs";
import { useNavigate, useParams } from "react-router-dom";
import {
  AdAlertBox,
  AdButton,
  AdDatePicker,
  AdDropDown,
  AdNotification,
  AdPhoneField,
  AdSearchableDropDown,
  AdSearchableDropDownMulti,
  AdTextBox,
} from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { recruitmentApi, type CandidateRow } from "../../common/services/recruitmentApi";
import { getIndiaCountryId, listCities, listCountries, listStates, lookupIndianPincode, type CityRow, type Country, type StateRow } from "../../common/services/locationApi";
import { mastersApi, type Language, type Skill } from "../../common/services/mastersApi";
import CandidateExperienceEditor from "../../common/components/CandidateExperienceEditor";
import { parseCandidateExperience, serializeCandidateExperience, serializeCandidateExperienceDraft } from "../../common/utils/candidateExperience";
import { parseJsonList, serializeJsonList } from "../../common/utils/jsonList";

type Form = {
  candidate_id?: number;
  candidate_code: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  passport_number: string;
  country_id: string;
  state_id: string;
  city_id: string;
  status: string;
  is_verified: boolean;
  father_name: string;
  address1: string;
  address2: string;
  pincode: string;
  dob: string;
  gender: string;
  skills: string;
  education: string;
  experience: string;
  industry_type: string;
  resume_file_path: string;
  passport_expiry_date: string;
  passport_file_path: string;
  aadhar_number: string;
  aadhar_file_path: string;
  pan_number: string;
  pan_file_path: string;
  voter_id_number: string;
  voter_id_file_path: string;
  profile_photo_file_path: string;
  languages_known: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  profile_complete: boolean;
  missing_fields: string[];
};

type UploadKey = "resume" | "passport" | "aadhar" | "pan" | "voter" | "photo";

type PendingFiles = Record<UploadKey, File | null>;

const emptyForm: Form = {
  candidate_id: undefined,
  candidate_code: "",
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  passport_number: "",
  country_id: "",
  state_id: "",
  city_id: "",
  status: "New",
  is_verified: false,
  father_name: "",
  address1: "",
  address2: "",
  pincode: "",
  dob: "",
  gender: "",
  skills: "",
  education: "",
  experience: "",
  industry_type: "",
  resume_file_path: "",
  passport_expiry_date: "",
  passport_file_path: "",
  aadhar_number: "",
  aadhar_file_path: "",
  pan_number: "",
  pan_file_path: "",
  voter_id_number: "",
  voter_id_file_path: "",
  profile_photo_file_path: "",
  languages_known: "",
  created_at: "",
  updated_at: "",
  deleted_at: "",
  profile_complete: false,
  missing_fields: [],
};

const REQUIRED_FIELDS: Array<{ key: keyof Form; label: string }> = [
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

function hasValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  if (typeof value === "boolean") return value;
  const text = String(value).trim();
  if (!text) return false;
  if (text.startsWith("[") && text.endsWith("]")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.length > 0;
    } catch {
      // fall through
    }
  }
  return text.length > 0;
}

function getMissingFields(candidate: Form): string[] {
  return REQUIRED_FIELDS.filter((field) => !hasValue(candidate[field.key])).map((field) => field.label);
}

const emptyPendingFiles: PendingFiles = {
  resume: null,
  passport: null,
  aadhar: null,
  pan: null,
  voter: null,
  photo: null,
};

function toNull(value: string): string | null {
  const v = value.trim();
  return v ? v : null;
}

function sameText(a: string, b: string): boolean {
  return String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();
}

function fileExt(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

function mapCandidateForm(candidate: CandidateRow): Form {
  return {
    candidate_id: candidate.candidate_id,
    candidate_code: candidate.candidate_code ?? "",
    first_name: candidate.first_name ?? "",
    last_name: candidate.last_name ?? "",
    phone: candidate.phone ?? "",
    email: candidate.email ?? "",
    passport_number: candidate.passport_number ?? "",
    country_id: candidate.country_id ? String(candidate.country_id) : "",
    state_id: candidate.state_id ? String(candidate.state_id) : "",
    city_id: candidate.city_id ? String(candidate.city_id) : "",
    status: candidate.status ?? "New",
    is_verified: Boolean(candidate.is_verified),
    father_name: candidate.father_name ?? "",
    address1: candidate.address1 ?? "",
    address2: candidate.address2 ?? "",
    pincode: candidate.pincode ?? "",
    dob: candidate.dob ?? "",
    gender: candidate.gender ?? "",
    skills: candidate.skills ?? "",
    education: candidate.education ?? "",
    experience: candidate.experience ?? "",
    industry_type: candidate.industry_type ?? "",
    resume_file_path: candidate.resume_file_path ?? "",
    passport_expiry_date: candidate.passport_expiry_date ?? "",
    passport_file_path: candidate.passport_file_path ?? "",
    aadhar_number: candidate.aadhar_number ?? "",
    aadhar_file_path: candidate.aadhar_file_path ?? "",
    pan_number: candidate.pan_number ?? "",
    pan_file_path: candidate.pan_file_path ?? "",
    voter_id_number: candidate.voter_id_number ?? "",
    voter_id_file_path: candidate.voter_id_file_path ?? "",
    profile_photo_file_path: candidate.profile_photo_file_path ?? "",
    languages_known: candidate.languages_known ?? "",
    created_at: candidate.created_at ?? "",
    updated_at: candidate.updated_at ?? "",
    deleted_at: candidate.deleted_at ?? "",
    profile_complete: Boolean((candidate as any).profile_complete),
    missing_fields: (candidate as any).missing_fields ?? [],
  };
}

export default function RecruitmentCandidateFormPage({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const params = useParams();
  const candidateId = params.candidateId ? Number(params.candidateId) : null;

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [form, setForm] = useState<Form>(emptyForm);
  const [pendingFiles, setPendingFiles] = useState<PendingFiles>(emptyPendingFiles);

  useEffect(() => {
    (async () => {
      try {
        const rows = await listCountries(true);
        setCountries(rows);
        if (mode === "create") {
          const indiaId = getIndiaCountryId(rows);
          if (indiaId) {
            setForm((current) => (current.country_id ? current : { ...current, country_id: String(indiaId) }));
          }
        }
      } catch {
        setCountries([]);
      }
    })();
  }, [mode]);

  useEffect(() => {
    (async () => {
      try {
        const [skillRows, languageRows] = await Promise.all([
          mastersApi.skills.list(true),
          mastersApi.languages.list(true),
        ]);
        setSkills(skillRows);
        setLanguages(languageRows);
      } catch {
        setSkills([]);
        setLanguages([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !candidateId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const candidate = await recruitmentApi.candidates.get(candidateId);
        setForm(mapCandidateForm(candidate));
        setPendingFiles(emptyPendingFiles);
      } catch (e: any) {
        setError((e as ApiError)?.message ?? "Failed to load candidate");
      } finally {
        setLoading(false);
      }
    })();
  }, [candidateId, mode]);

  useEffect(() => {
    if (!form.country_id) {
      setStates([]);
      setCities([]);
      return;
    }
    (async () => {
      try {
        setStates(await listStates(Number(form.country_id), true));
      } catch {
        setStates([]);
      }
    })();
  }, [form.country_id]);

  useEffect(() => {
    if (!form.state_id) {
      setCities([]);
      return;
    }
    (async () => {
      try {
        setCities(await listCities(Number(form.state_id), true));
      } catch {
        setCities([]);
      }
    })();
  }, [form.state_id]);

  const applyPincodeLookup = async (rawPin: string) => {
    const lookup = await lookupIndianPincode(rawPin);
    if (!lookup) return;

    const indiaId = getIndiaCountryId(countries);
    if (!indiaId) return;
    if (form.country_id && Number(form.country_id) !== indiaId) return;

    const stateRows = states.length ? states : await listStates(indiaId, true);
    const stateMatch = stateRows.find((row) => sameText(row.state_name, lookup.state));
    if (!stateMatch) return;

    const cityRows = cities.length ? cities : await listCities(stateMatch.state_id, true);
    const cityMatch =
      cityRows.find((row) => sameText(row.city_name, lookup.district)) ??
      cityRows.find((row) => sameText(row.city_name, lookup.officeName));

    setForm((current) => ({
      ...current,
      country_id: String(indiaId),
      state_id: String(stateMatch.state_id),
      city_id: cityMatch ? String(cityMatch.city_id) : "",
    }));
  };

  const countryOptions = useMemo(
    () => countries.map((c) => ({ label: c.country_name, value: String(c.country_id) })),
    [countries],
  );
  const stateOptions = useMemo(
    () => states.map((s) => ({ label: s.state_name, value: String(s.state_id) })),
    [states],
  );
  const cityOptions = useMemo(
    () => cities.map((c) => ({ label: c.city_name, value: String(c.city_id) })),
    [cities],
  );
  const skillOptions = useMemo(() => skills.map((s) => ({ label: s.skill_name, value: s.skill_name })), [skills]);
  const languageOptions = useMemo(() => languages.map((l) => ({ label: l.language_name, value: l.language_name })), [languages]);
  const missingFields = useMemo(() => getMissingFields(form), [form]);
  const profileComplete = missingFields.length === 0;
  const statusOptions = useMemo(
    () => [
      { label: "New", value: "New" },
      { label: "Active", value: "Active" },
      { label: "Inactive", value: "Inactive" },
    ],
    [],
  );
  const verifiedOptions = useMemo(
    () => [
      { label: "No", value: "0" },
      { label: "Yes", value: "1" },
    ],
    [],
  );
  const genderOptions = useMemo(
    () => [
      { label: "Male", value: "Male" },
      { label: "Female", value: "Female" },
      { label: "Other", value: "Other" },
      { label: "Prefer not to say", value: "Prefer not to say" },
    ],
    [],
  );

  const fileChoices: Array<{ key: UploadKey; label: string; accept: string; value: string; onSet: (path: string) => void; current?: string }> = [
    {
      key: "resume",
      label: "Resume Upload (PDF/DOC)",
      accept: ".pdf,.doc,.docx",
      value: "resume",
      current: form.resume_file_path,
      onSet: (path) => setForm((f) => ({ ...f, resume_file_path: path })),
    },
    {
      key: "passport",
      label: "Passport Upload",
      accept: "image/*,.pdf",
      value: "passport",
      current: form.passport_file_path,
      onSet: (path) => setForm((f) => ({ ...f, passport_file_path: path })),
    },
    {
      key: "aadhar",
      label: "Aadhar Upload",
      accept: "image/*,.pdf",
      value: "aadhar",
      current: form.aadhar_file_path,
      onSet: (path) => setForm((f) => ({ ...f, aadhar_file_path: path })),
    },
    {
      key: "pan",
      label: "PAN Upload",
      accept: "image/*,.pdf",
      value: "pan",
      current: form.pan_file_path,
      onSet: (path) => setForm((f) => ({ ...f, pan_file_path: path })),
    },
    {
      key: "voter",
      label: "Voter ID Upload",
      accept: "image/*,.pdf",
      value: "voter",
      current: form.voter_id_file_path,
      onSet: (path) => setForm((f) => ({ ...f, voter_id_file_path: path })),
    },
    {
      key: "photo",
      label: "Profile Photo",
      accept: "image/*",
      value: "photo",
      current: form.profile_photo_file_path,
      onSet: (path) => setForm((f) => ({ ...f, profile_photo_file_path: path })),
    },
  ];

  const buildPayload = () => ({
    first_name: toNull(form.first_name),
    last_name: toNull(form.last_name),
    phone: toNull(form.phone),
    email: toNull(form.email),
    passport_number: toNull(form.passport_number),
    country_id: form.country_id ? Number(form.country_id) : null,
    state_id: form.state_id ? Number(form.state_id) : null,
    city_id: form.city_id ? Number(form.city_id) : null,
    status: form.status,
    is_verified: form.is_verified,
    father_name: toNull(form.father_name),
    address1: toNull(form.address1),
    address2: toNull(form.address2),
    pincode: toNull(form.pincode),
    dob: form.dob || null,
    gender: toNull(form.gender),
    skills: toNull(form.skills),
    education: toNull(form.education),
    experience: serializeCandidateExperience(parseCandidateExperience(form.experience)),
    industry_type: toNull(form.industry_type),
    resume_file_path: toNull(form.resume_file_path),
    passport_expiry_date: form.passport_expiry_date || null,
    passport_file_path: toNull(form.passport_file_path),
    aadhar_number: toNull(form.aadhar_number),
    aadhar_file_path: toNull(form.aadhar_file_path),
    pan_number: toNull(form.pan_number),
    pan_file_path: toNull(form.pan_file_path),
    voter_id_number: toNull(form.voter_id_number),
    voter_id_file_path: toNull(form.voter_id_file_path),
    profile_photo_file_path: toNull(form.profile_photo_file_path),
    languages_known: toNull(form.languages_known),
  });

  const uploadSelectedFiles = async (targetCandidateId: number) => {
    const uploaded: Partial<Record<UploadKey, string>> = {};
    for (const spec of fileChoices) {
      const file = pendingFiles[spec.key];
      if (!file) continue;
      const objectKey = `candidates/${targetCandidateId}/${spec.key}/${Date.now()}${fileExt(file.name)}`;
      const presign = await recruitmentApi.files.presignUpload(objectKey);
      const put = await fetch(presign.url, { method: "PUT", body: file });
      if (!put.ok) throw new Error(`Upload failed for ${spec.label} (${put.status})`);
      uploaded[spec.key] = objectKey;
    }
    return uploaded;
  };

  const saveCandidate = async () => {
    setSaving(true);
    setError(null);
    try {
      if (!form.first_name.trim()) throw new Error("First name is required");
      if (!form.last_name.trim()) throw new Error("Last name is required");
      if (!form.phone.trim()) throw new Error("Mobile is required");
      if (!form.email.trim()) throw new Error("Email is required");
      if (!form.passport_number.trim()) throw new Error("Passport number is required");

      const payload = buildPayload();
      const candidate = form.candidate_id
        ? { candidate_id: form.candidate_id }
        : await recruitmentApi.candidates.create(payload);
      const createdCandidate = form.candidate_id ? null : candidate;

      const targetCandidateId = candidate.candidate_id;
      const uploaded = await uploadSelectedFiles(targetCandidateId);
      const finalPayload = {
        ...payload,
        resume_file_path: uploaded.resume ?? payload.resume_file_path,
        passport_file_path: uploaded.passport ?? payload.passport_file_path,
        aadhar_file_path: uploaded.aadhar ?? payload.aadhar_file_path,
        pan_file_path: uploaded.pan ?? payload.pan_file_path,
        voter_id_file_path: uploaded.voter ?? payload.voter_id_file_path,
        profile_photo_file_path: uploaded.photo ?? payload.profile_photo_file_path,
      };

      await recruitmentApi.candidates.update(targetCandidateId, finalPayload);
      const authMsg = form.candidate_id
        ? "Candidate updated"
        : createdCandidate?.user_created
          ? `Candidate created. Username: ${createdCandidate.username}${createdCandidate.emailed ? " (Password emailed)" : " (Password not emailed)"}.`
          : createdCandidate?.existing_user_used
            ? `Candidate created. Existing login account linked: ${createdCandidate.username}.`
            : `Candidate created, but the login account could not be created right now${createdCandidate?.auth_error ? `: ${createdCandidate.auth_error}` : ""}.`;
      setToast({
        open: true,
        severity: "success",
        message: authMsg,
      });

      navigate(`/portal/recruitment/candidates/${targetCandidateId}`);
    } catch (e: any) {
      setToast({ open: true, severity: "error", message: (e as ApiError)?.message ?? e?.message ?? "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1, md: 1.5 } }}>
      <Stack spacing={1.5}>
        <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ flexWrap: "wrap" }}>
          <Stack spacing={0.25}>
            <Typography variant="h5" fontWeight={900}>
              {form.candidate_id ? "Edit Candidate" : "Add Candidate"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Candidate registration and profile data
            </Typography>
          </Stack>
          <AdButton variant="text" startIcon={<ArrowBackIcon fontSize="small" />} onClick={() => navigate("/portal/recruitment/candidates")}>
            Back to Candidates
          </AdButton>
        </Stack>

        {error ? <AdAlertBox severity="error" title="Error" message={error} /> : null}
        {loading ? <Alert severity="info">Loading candidate details...</Alert> : null}
        {!loading && !profileComplete ? (
          <Alert severity="warning">
            Candidate profile incomplete. Missing: {missingFields.length ? missingFields.join(", ") : "unknown fields"}.
          </Alert>
        ) : null}

        <Card
          variant="outlined"
          sx={{
            borderRadius: 0,
            borderColor: "rgba(148, 163, 184, 0.42)",
            bgcolor: "#fff",
            boxShadow: "0 8px 28px rgba(15,23,42,0.05)",
          }}
        >
          <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
            <Stack spacing={1.25}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap">
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  {form.candidate_code ? <Chip size="small" label={`Code: ${form.candidate_code}`} /> : null}
                  <Chip size="small" label={profileComplete ? "Complete" : "Incomplete"} color={profileComplete ? "success" : "warning"} />
                  <Chip size="small" label={form.is_verified ? "Verified" : "Verification pending"} color={form.is_verified ? "success" : "warning"} />
                </Stack>

                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <AdButton variant="contained" onClick={saveCandidate} disabled={saving || loading}>
                    {saving ? "Saving..." : form.candidate_id ? "Update Candidate" : "Save Candidate"}
                  </AdButton>
                </Stack>
              </Stack>

              <Divider />

              <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, alignItems: "start" }}>
                <AdTextBox variant="standard" size="small" label="First Name" required value={form.first_name} onChange={(v) => setForm((f) => ({ ...f, first_name: v }))} />
                <AdTextBox variant="standard" size="small" label="Last Name" required value={form.last_name} onChange={(v) => setForm((f) => ({ ...f, last_name: v }))} />
                <AdPhoneField required value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
                <AdTextBox variant="standard" size="small" label="Email" required type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
                <AdTextBox variant="standard" size="small" label="Passport Number" required value={form.passport_number} onChange={(v) => setForm((f) => ({ ...f, passport_number: v }))} />
                <AdSearchableDropDown
                  variant="standard"
                  label="Status"
                  options={statusOptions}
                  value={form.status}
                  onChange={(v) => setForm((f) => ({ ...f, status: String(v) || "New" }))}
                />
                <AdDropDown
                  variant="standard"
                  label="Verified"
                  options={verifiedOptions}
                  value={form.is_verified ? "1" : "0"}
                  onChange={(v) => setForm((f) => ({ ...f, is_verified: String(v) === "1" }))}
                />
                <AdSearchableDropDown
                  variant="standard"
                  label="Country"
                  options={countryOptions}
                  value={form.country_id}
                  onChange={(v) => setForm((f) => ({ ...f, country_id: String(v), state_id: "", city_id: "" }))}
                />
                <AdSearchableDropDown
                  variant="standard"
                  label="State"
                  options={stateOptions}
                  value={form.state_id}
                  onChange={(v) => setForm((f) => ({ ...f, state_id: String(v), city_id: "" }))}
                  disabled={!form.country_id}
                />
                <AdSearchableDropDown
                  variant="standard"
                  label="City"
                  options={cityOptions}
                  value={form.city_id}
                  onChange={(v) => setForm((f) => ({ ...f, city_id: String(v) }))}
                  disabled={!form.state_id}
                />
                <Box sx={{ gridColumn: { xs: "auto", md: "1 / span 2" } }}>
                  <TextField
                    variant="standard"
                    size="small"
                    label="Address 1"
                    value={form.address1}
                    onChange={(e) => setForm((f) => ({ ...f, address1: e.target.value }))}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: "auto", md: "3 / span 2" } }}>
                  <TextField
                    variant="standard"
                    size="small"
                    label="Address 2"
                    value={form.address2}
                    onChange={(e) => setForm((f) => ({ ...f, address2: e.target.value }))}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                </Box>
                <AdTextBox variant="standard" size="small" label="Father's Name" value={form.father_name} onChange={(v) => setForm((f) => ({ ...f, father_name: v }))} />
                <AdTextBox
                  variant="standard"
                  size="small"
                  label="Pincode"
                  value={form.pincode}
                  onChange={(v) => setForm((f) => ({ ...f, pincode: v }))}
                  onBlur={() => {
                    void applyPincodeLookup(form.pincode);
                  }}
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 0,
              borderColor: "rgba(148, 163, 184, 0.42)",
              bgcolor: "#fff",
              boxShadow: "0 8px 28px rgba(15,23,42,0.05)",
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
              <Stack spacing={1.5}>
                <Typography fontWeight={950}>Personal Details</Typography>
                <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, alignItems: "start" }}>
                  <AdTextBox variant="standard" size="small" label="Education" value={form.education} onChange={(v) => setForm((f) => ({ ...f, education: v }))} />
                  <AdTextBox variant="standard" size="small" label="Industry Type" value={form.industry_type} onChange={(v) => setForm((f) => ({ ...f, industry_type: v }))} />
                  <TextField
                    variant="standard"
                    size="small"
                    label="DOB"
                    type="date"
                    value={form.dob}
                    onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  <AdDropDown
                    variant="standard"
                    label="Gender"
                    options={genderOptions}
                    value={form.gender}
                    onChange={(v) => setForm((f) => ({ ...f, gender: String(v) }))}
                  />
                  <Box sx={{ gridColumn: { xs: "auto", md: "1 / span 2" } }}>
                    <AdSearchableDropDownMulti
                      variant="standard"
                      label="Skills"
                      options={skillOptions}
                      value={parseJsonList(form.skills)}
                      onChange={(v) => setForm((f) => ({ ...f, skills: serializeJsonList(v) }))}
                    />
                  </Box>
                  <Box sx={{ gridColumn: { xs: "auto", md: "1 / span 2" } }}>
                    <AdSearchableDropDownMulti
                      variant="standard"
                      label="Languages Known"
                      options={languageOptions}
                      value={parseJsonList(form.languages_known)}
                      onChange={(v) => setForm((f) => ({ ...f, languages_known: serializeJsonList(v) }))}
                    />
                  </Box>
                  <AdDatePicker
                    variant="standard"
                    label="Passport Expiry Date"
                    value={form.passport_expiry_date ? dayjs(form.passport_expiry_date) : null}
                    onChange={(v) => setForm((f) => ({ ...f, passport_expiry_date: v ? v.format("YYYY-MM-DD") : "" }))}
                  />
                  <AdTextBox variant="standard" size="small" label="Aadhaar Number" value={form.aadhar_number} onChange={(v) => setForm((f) => ({ ...f, aadhar_number: v }))} />
                  <AdTextBox variant="standard" size="small" label="PAN Number" value={form.pan_number} onChange={(v) => setForm((f) => ({ ...f, pan_number: v }))} />
                  <AdTextBox variant="standard" size="small" label="Voter ID Number" value={form.voter_id_number} onChange={(v) => setForm((f) => ({ ...f, voter_id_number: v }))} />
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card
            variant="outlined"
            sx={{
              borderRadius: 0,
              borderColor: "rgba(148, 163, 184, 0.42)",
              bgcolor: "#fff",
              boxShadow: "0 8px 28px rgba(15,23,42,0.05)",
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
              <Stack spacing={2}>
                <Typography fontWeight={950}>Documents</Typography>

                {fileChoices.map((doc) => {
                  const filePath = doc.current;
                  return (
                    <Box
                      key={doc.key}
                      sx={{
                        px: 0.25,
                        py: 0.75,
                        borderBottom: "1px solid rgba(226,232,240,0.85)",
                        "&:last-of-type": { borderBottom: 0 },
                      }}
                    >
                      <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="space-between">
                        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                          <Typography fontWeight={800} sx={{ minWidth: 0, wordBreak: "break-word" }}>
                            {doc.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {filePath ? "File attached" : "Not uploaded yet"}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.75} flexShrink={0}>
                          <AdButton variant="text" onClick={() => (filePath ? void recruitmentApi.files.presignDownload(filePath).then((presign) => window.open(presign.url, "_blank", "noopener,noreferrer")) : undefined)} disabled={!filePath}>
                            View
                          </AdButton>
                          <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                            {filePath ? "Update" : "Upload"}
                            <input
                              type="file"
                              hidden
                              accept={doc.accept}
                              onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                setPendingFiles((prev) => ({ ...prev, [doc.key]: file }));
                              }}
                            />
                          </Button>
                        </Stack>
                      </Stack>
                      {pendingFiles[doc.key] ? (
                        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 0.75 }}>
                          <Chip size="small" color="info" label={pendingFiles[doc.key]!.name} />
                        </Stack>
                      ) : null}
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Card
          variant="outlined"
          sx={{
            borderRadius: 0,
            borderColor: "rgba(148, 163, 184, 0.42)",
            bgcolor: "#fff",
            boxShadow: "0 8px 28px rgba(15,23,42,0.05)",
          }}
        >
          <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
            <Stack spacing={1.5}>
              <Typography fontWeight={950}>Experience</Typography>
              <CandidateExperienceEditor
                value={parseCandidateExperience(form.experience)}
                countryOptions={countryOptions}
                onChange={(experience) => setForm((f) => ({ ...f, experience: serializeCandidateExperienceDraft(experience) }))}
              />
            </Stack>
          </CardContent>
        </Card>

        <Stack direction="row" justifyContent="flex-end">
          <Typography variant="caption" color="text.secondary">
            Created At: {form.created_at || "—"} {form.updated_at ? `• Updated At: ${form.updated_at}` : ""}
          </Typography>
        </Stack>
      </Stack>
    </Container>
  );
}
