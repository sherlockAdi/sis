import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Card, CardContent, Chip, Container, Divider, Stack, TextField, Typography } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { AdButton, AdDropDown, AdFilePreviewDialog, AdNotification, AdPhoneField, AdSearchableDropDown, AdSearchableDropDownMulti, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { candidateApi } from "../../common/services/candidateApi";
import { mastersApi, type Education, type JobCategory, type Language, type Skill } from "../../common/services/mastersApi";
import { recruitmentApi } from "../../common/services/recruitmentApi";
import { getIndiaCountryId, listCountries, listStates, listCities, lookupIndianPincode, type Country, type StateRow, type CityRow } from "../../common/services/locationApi";
import { parseJsonList, serializeJsonList } from "../../common/utils/jsonList";

type CandidateProfileForm = {
  candidate_id: number | null;
  candidate_code: string;
  is_verified: boolean;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  passport_number: string;
  country_id: string;
  state_id: string;
  city_id: string;
  father_name: string;
  address1: string;
  address2: string;
  pincode: string;
  dob: string;
  gender: string;
  skills: string[];
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
  languages_known: string[];
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  profile_complete: boolean;
  missing_fields: string[];
};

const emptyForm: CandidateProfileForm = {
  candidate_id: null,
  candidate_code: "",
  is_verified: false,
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  passport_number: "",
  country_id: "",
  state_id: "",
  city_id: "",
  father_name: "",
  address1: "",
  address2: "",
  pincode: "",
  dob: "",
  gender: "",
  skills: [],
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
  languages_known: [],
  status: "",
  created_at: "",
  updated_at: "",
  deleted_at: "",
  profile_complete: false,
  missing_fields: [],
};

function mapProfile(row: Awaited<ReturnType<typeof candidateApi.profile.me>>): CandidateProfileForm {
  return {
    candidate_id: row.candidate_id ?? null,
    candidate_code: row.candidate_code ?? "",
    is_verified: Boolean((row as any).is_verified),
    first_name: row.first_name ?? "",
    last_name: row.last_name ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    passport_number: row.passport_number ?? "",
    country_id: row.country_id ? String(row.country_id) : "",
    state_id: row.state_id ? String(row.state_id) : "",
    city_id: row.city_id ? String(row.city_id) : "",
    father_name: row.father_name ?? "",
    address1: row.address1 ?? "",
    address2: row.address2 ?? "",
    pincode: row.pincode ?? "",
    dob: normalizeDateInput(row.dob),
    gender: row.gender ?? "",
    skills: parseJsonList(row.skills),
    education: row.education ?? "",
    experience: row.experience ?? "",
    industry_type: row.industry_type ?? "",
    resume_file_path: row.resume_file_path ?? "",
    passport_expiry_date: normalizeDateInput(row.passport_expiry_date),
    passport_file_path: row.passport_file_path ?? "",
    aadhar_number: row.aadhar_number ?? "",
    aadhar_file_path: row.aadhar_file_path ?? "",
    pan_number: row.pan_number ?? "",
    pan_file_path: row.pan_file_path ?? "",
    voter_id_number: row.voter_id_number ?? "",
    voter_id_file_path: row.voter_id_file_path ?? "",
    profile_photo_file_path: row.profile_photo_file_path ?? "",
    languages_known: parseJsonList(row.languages_known),
    status: row.status ?? "",
    created_at: row.created_at ?? "",
    updated_at: row.updated_at ?? "",
    deleted_at: row.deleted_at ?? "",
    profile_complete: Boolean(row.profile_complete),
    missing_fields: row.missing_fields ?? [],
  };
}

function fieldValue(value: string) {
  const v = value.trim();
  return v ? v : null;
}

function normalizeDateInput(value?: string | null): string {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  return trimmed.split(/[T\s]/)[0];
}

function sameText(a: string, b: string): boolean {
  return String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();
}

export default function CandidateProfileSettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CandidateProfileForm>(emptyForm);
  const [preview, setPreview] = useState<{ open: boolean; title: string; filePath: string | null }>({
    open: false,
    title: "",
    filePath: null,
  });
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await listCountries(true);
        if (alive) setCountries(rows);
        if (alive) {
          const indiaId = getIndiaCountryId(rows);
          if (indiaId) {
            setForm((current) => (current.country_id ? current : { ...current, country_id: String(indiaId) }));
          }
        }
      } catch {
        if (alive) setCountries([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [skillRows, educationRows, categoryRows, languageRows] = await Promise.all([
          mastersApi.skills.list(true),
          mastersApi.educations.list(true),
          mastersApi.jobCategories.list(true),
          mastersApi.languages.list(true),
        ]);
        if (!alive) return;
        setSkills(skillRows);
        setEducations(educationRows);
        setJobCategories(categoryRows);
        setLanguages(languageRows);
      } catch {
        if (!alive) return;
        setSkills([]);
        setEducations([]);
        setJobCategories([]);
        setLanguages([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const row = await candidateApi.profile.me();
        if (!alive) return;
        setForm(mapProfile(row));
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

  useEffect(() => {
    if (!form.country_id) {
      setStates([]);
      setCities([]);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const rows = await listStates(Number(form.country_id), true);
        if (!alive) return;
        setStates(rows);
      } catch {
        if (alive) setStates([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [form.country_id]);

  useEffect(() => {
    if (!form.state_id) {
      setCities([]);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const rows = await listCities(Number(form.state_id), true);
        if (!alive) return;
        setCities(rows);
      } catch {
        if (alive) setCities([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [form.state_id]);

  const missingFields = form.missing_fields ?? [];
  const profileComplete = form.profile_complete && missingFields.length === 0;

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
  const educationOptions = useMemo(
    () => educations.map((e) => ({ label: e.education_name, value: e.education_name })),
    [educations],
  );
  const jobCategoryOptions = useMemo(
    () => jobCategories.map((c) => ({ label: c.category_name, value: c.category_name })),
    [jobCategories],
  );
  const languageOptions = useMemo(
    () => languages.map((l) => ({ label: l.language_name, value: l.language_name })),
    [languages],
  );

  const uploadProfileFile = async (field: keyof Pick<
    CandidateProfileForm,
    | "resume_file_path"
    | "passport_file_path"
    | "aadhar_file_path"
    | "pan_file_path"
    | "voter_id_file_path"
    | "profile_photo_file_path"
  >, file: File) => {
    const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase() : "";
    const key = `candidate-profile/${form.candidate_id ?? "me"}/${field}/${Date.now()}${ext}`;
    const presign = await recruitmentApi.files.presignUpload(key);
    const put = await fetch(presign.url, { method: "PUT", body: file });
    if (!put.ok) throw new Error(`Upload failed (${put.status})`);
    await candidateApi.profile.update({ [field]: key } as any);
    setForm((f) => ({ ...f, [field]: key } as CandidateProfileForm));
  };

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

  const viewProfileFile = (filePath: string) => {
    setPreview({ open: true, title: "Profile Document Preview", filePath });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await candidateApi.profile.update({
        first_name: fieldValue(form.first_name),
        last_name: fieldValue(form.last_name),
        phone: fieldValue(form.phone),
        email: fieldValue(form.email),
        passport_number: fieldValue(form.passport_number),
        country_id: form.country_id ? Number(form.country_id) : null,
        state_id: form.state_id ? Number(form.state_id) : null,
        city_id: form.city_id ? Number(form.city_id) : null,
        father_name: fieldValue(form.father_name),
        address1: fieldValue(form.address1),
        address2: fieldValue(form.address2),
        pincode: fieldValue(form.pincode),
        dob: fieldValue(form.dob),
        gender: fieldValue(form.gender),
        skills: serializeJsonList(form.skills),
        education: fieldValue(form.education),
        experience: fieldValue(form.experience),
        industry_type: fieldValue(form.industry_type),
        resume_file_path: fieldValue(form.resume_file_path),
        passport_expiry_date: fieldValue(form.passport_expiry_date),
        passport_file_path: fieldValue(form.passport_file_path),
        aadhar_number: fieldValue(form.aadhar_number),
        aadhar_file_path: fieldValue(form.aadhar_file_path),
        pan_number: fieldValue(form.pan_number),
        pan_file_path: fieldValue(form.pan_file_path),
        voter_id_number: fieldValue(form.voter_id_number),
        voter_id_file_path: fieldValue(form.voter_id_file_path),
        profile_photo_file_path: fieldValue(form.profile_photo_file_path),
        languages_known: serializeJsonList(form.languages_known),
      });
      setToast({ open: true, message: "Profile saved", severity: "success" });
      const returnTo = String((location.state as any)?.returnTo ?? "").trim();
      if (returnTo) {
        navigate(returnTo, { replace: true });
        return;
      }
      const latest = await candidateApi.profile.me();
      setForm(mapProfile(latest));
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to save profile");
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to save profile", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1, md: 1.5 } }}>
      <Stack spacing={1.5}>
        <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
        <AdFilePreviewDialog
          open={preview.open}
          title={preview.title}
          filePath={preview.filePath}
          onClose={() => setPreview({ open: false, title: "", filePath: null })}
        />

        {error ? <Alert severity="error">{error}</Alert> : null}
        {loading ? <Alert severity="info">Loading profile...</Alert> : null}
        {!loading && !profileComplete ? (
          <Alert severity="warning">
            Profile incomplete. Missing: {missingFields.length ? missingFields.join(", ") : "unknown fields"}.
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
                  <Chip
                    size="small"
                    label={form.is_verified ? "Verified" : "Verification pending"}
                    color={form.is_verified ? "success" : "warning"}
                  />
                  <AdButton variant="contained" onClick={save} disabled={saving || loading}>
                    {saving ? "Saving..." : "Save Profile"}
                  </AdButton>
                </Stack>
              </Stack>

              <Divider />

              <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, alignItems: "start" }}>
                <AdTextBox variant="standard" size="small" label="First Name" value={form.first_name} onChange={(v) => setForm((f) => ({ ...f, first_name: v }))} />
                <AdTextBox variant="standard" size="small" label="Last Name" value={form.last_name} onChange={(v) => setForm((f) => ({ ...f, last_name: v }))} />
                <AdPhoneField value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
                <AdTextBox variant="standard" size="small" label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
                <AdTextBox variant="standard" size="small" label="Passport Number" value={form.passport_number} onChange={(v) => setForm((f) => ({ ...f, passport_number: v }))} />
                <AdSearchableDropDown variant="standard" label="Country" options={countryOptions} value={form.country_id} onChange={(v) => setForm((f) => ({ ...f, country_id: String(v), state_id: "", city_id: "" }))} />
                <AdSearchableDropDown variant="standard" label="State" options={stateOptions} disabled={!form.country_id} value={form.state_id} onChange={(v) => setForm((f) => ({ ...f, state_id: String(v), city_id: "" }))} />
                <AdSearchableDropDown variant="standard" label="City" options={cityOptions} disabled={!form.state_id} value={form.city_id} onChange={(v) => setForm((f) => ({ ...f, city_id: String(v) }))} />
                <AdDropDown
                  variant="standard"
                  label="Gender"
                  options={[
                    { label: "Select", value: "" },
                    { label: "Male", value: "Male" },
                    { label: "Female", value: "Female" },
                    { label: "Other", value: "Other" },
                  ]}
                  value={form.gender}
                  onChange={(v) => setForm((f) => ({ ...f, gender: String(v) }))}
                />
                <AdTextBox variant="standard" size="small" label="Address 1" value={form.address1} onChange={(v) => setForm((f) => ({ ...f, address1: v }))} />
                <AdTextBox variant="standard" size="small" label="Address 2" value={form.address2} onChange={(v) => setForm((f) => ({ ...f, address2: v }))} />
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
                  <AdSearchableDropDown
                    variant="standard"
                    label="Education"
                    options={educationOptions}
                    value={form.education}
                    onChange={(v) => setForm((f) => ({ ...f, education: String(v) }))}
                  />
                  <AdSearchableDropDown
                    variant="standard"
                    label="Job Category"
                    options={jobCategoryOptions}
                    value={form.industry_type}
                    onChange={(v) => setForm((f) => ({ ...f, industry_type: String(v) }))}
                  />
                  <Box sx={{ gridColumn: { xs: "auto", md: "1 / span 2" } }}>
                    <AdSearchableDropDownMulti
                      variant="standard"
                      label="Skills"
                      options={skillOptions}
                      value={form.skills}
                      onChange={(v) => setForm((f) => ({ ...f, skills: v }))}
                    />
                  </Box>
                  <Box sx={{ gridColumn: { xs: "auto", md: "1 / span 2" } }}>
                    <TextField
                      variant="standard"
                      size="small"
                      label="Experience"
                      value={form.experience}
                      onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
                      fullWidth
                      multiline
                      minRows={2}
                    />
                  </Box>
                  <Box sx={{ gridColumn: { xs: "auto", md: "1 / span 2" } }}>
                    <AdSearchableDropDownMulti
                      variant="standard"
                      label="Languages Known"
                      options={languageOptions}
                      value={form.languages_known}
                      onChange={(v) => setForm((f) => ({ ...f, languages_known: v }))}
                    />
                  </Box>
                  <TextField
                    variant="standard"
                    size="small"
                    label="Passport Expiry Date"
                    type="date"
                    value={form.passport_expiry_date}
                    onChange={(e) => setForm((f) => ({ ...f, passport_expiry_date: e.target.value }))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
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

                {([
                  { key: "resume_file_path", label: "Resume Upload", accept: ".pdf,.doc,.docx" },
                  { key: "passport_file_path", label: "Passport Upload", accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx" },
                  { key: "aadhar_file_path", label: "Aadhaar Upload", accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx" },
                  { key: "pan_file_path", label: "PAN Upload", accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx" },
                  { key: "voter_id_file_path", label: "Voter ID Upload", accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx" },
                  { key: "profile_photo_file_path", label: "Profile Photo", accept: "image/*" },
                ] as const).map((doc) => {
                  const filePath = form[doc.key];
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
                        <Typography fontWeight={800} sx={{ minWidth: 0, wordBreak: "break-word" }}>
                          {doc.label}
                        </Typography>
                        <Stack direction="row" spacing={0.75} flexShrink={0}>
                          <AdButton variant="text" onClick={() => filePath ? void viewProfileFile(filePath) : undefined} disabled={!filePath}>
                            View
                          </AdButton>
                          <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                            Update
                            <input
                              type="file"
                              hidden
                              accept={doc.accept}
                              onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;
                                try {
                                  await uploadProfileFile(doc.key, f);
                                  setToast({ open: true, message: `${doc.label} uploaded`, severity: "success" });
                                } catch (err: any) {
                                  setToast({ open: true, message: err?.message ?? "Upload failed", severity: "error" });
                                } finally {
                                  e.currentTarget.value = "";
                                }
                              }}
                            />
                          </Button>
                        </Stack>
                      </Stack>
                    </Box>
                  );
                })}

                {/* Personal detail fields moved above */}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Container>
  );
}
