import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, Container, Divider, Stack, TextField, Typography } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { AdButton, AdDropDown, AdNotification, AdSearchableDropDown, AdSearchableDropDownMulti, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { associatePortalApi } from "../../common/services/associatePortalApi";
import { recruitmentApi } from "../../common/services/recruitmentApi";
import { mastersApi, type Education, type JobCategory, type Language, type Skill } from "../../common/services/mastersApi";
import { listCities, listCountries, listStates, type CityRow, type Country, type StateRow } from "../../common/services/locationApi";
import { parseJsonList, serializeJsonList } from "../../common/utils/jsonList";

type Form = {
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
  status: string;
};

const emptyForm: Form = {
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
  status: "Associate Draft",
};

export default function AssociateCreateCandidatesPage() {
  const [form, setForm] = useState<Form>(emptyForm);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    (async () => {
      try {
        setCountries(await listCountries(true));
      } catch {
        setCountries([]);
      }
    })();
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

  const countryOptions = useMemo(() => countries.map((c) => ({ label: c.country_name, value: String(c.country_id) })), [countries]);
  const stateOptions = useMemo(() => states.map((s) => ({ label: s.state_name, value: String(s.state_id) })), [states]);
  const cityOptions = useMemo(() => cities.map((c) => ({ label: c.city_name, value: String(c.city_id) })), [cities]);
  const skillOptions = useMemo(() => skills.map((s) => ({ label: s.skill_name, value: s.skill_name })), [skills]);
  const educationOptions = useMemo(() => educations.map((e) => ({ label: e.education_name, value: e.education_name })), [educations]);
  const jobCategoryOptions = useMemo(() => jobCategories.map((c) => ({ label: c.category_name, value: c.category_name })), [jobCategories]);
  const languageOptions = useMemo(() => languages.map((l) => ({ label: l.language_name, value: l.language_name })), [languages]);

  const uploadProfileFile = async (
    field:
      | "resume_file_path"
      | "passport_file_path"
      | "aadhar_file_path"
      | "pan_file_path"
      | "voter_id_file_path"
      | "profile_photo_file_path",
    file: File,
  ) => {
    const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase() : "";
    const key = `associate-candidate/${field}/${Date.now()}${ext}`;
    const presign = await recruitmentApi.files.presignUpload(key);
    const put = await fetch(presign.url, { method: "PUT", body: file });
    if (!put.ok) throw new Error(`Upload failed (${put.status})`);
    setForm((f) => ({ ...f, [field]: key }));
  };

  const viewProfileFile = async (filePath: string) => {
    const presign = await recruitmentApi.files.presignDownload(filePath);
    window.open(presign.url, "_blank", "noopener,noreferrer");
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await associatePortalApi.candidates.create({
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        passport_number: form.passport_number.trim() || null,
        country_id: form.country_id ? Number(form.country_id) : null,
        state_id: form.state_id ? Number(form.state_id) : null,
        city_id: form.city_id ? Number(form.city_id) : null,
        father_name: form.father_name.trim() || null,
        address1: form.address1.trim() || null,
        address2: form.address2.trim() || null,
        pincode: form.pincode.trim() || null,
        dob: form.dob || null,
        gender: form.gender.trim() || null,
        skills: form.skills.trim() || null,
        education: form.education.trim() || null,
        experience: form.experience.trim() || null,
        industry_type: form.industry_type.trim() || null,
        resume_file_path: form.resume_file_path.trim() || null,
        passport_expiry_date: form.passport_expiry_date || null,
        passport_file_path: form.passport_file_path.trim() || null,
        aadhar_number: form.aadhar_number.trim() || null,
        aadhar_file_path: form.aadhar_file_path.trim() || null,
        pan_number: form.pan_number.trim() || null,
        pan_file_path: form.pan_file_path.trim() || null,
        voter_id_number: form.voter_id_number.trim() || null,
        voter_id_file_path: form.voter_id_file_path.trim() || null,
        profile_photo_file_path: form.profile_photo_file_path.trim() || null,
        languages_known: form.languages_known.trim() || null,
      });
      setToast({
        open: true,
        message: `Candidate saved as ${res.username}. Login will be created only after final confirmation.`,
        severity: "success",
      });
      setForm(emptyForm);
    } catch (e: any) {
      setError((e as ApiError)?.message ?? e?.message ?? "Failed to save candidate");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1, md: 1.5 } }}>
      <Stack spacing={1.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      <Stack spacing={0.5}>
        <Typography variant="h5" fontWeight={900}>
          Create Associate Candidate
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Candidate details stay under associate control until the original contact details are confirmed at the ready stage.
        </Typography>
      </Stack>
      {error ? <Alert severity="error">{error}</Alert> : null}

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
                <Chip size="small" label={form.status || "Associate Draft"} />
                <Chip size="small" label="Associate Verified" color="success" />
                <AdButton variant="contained" onClick={submit} disabled={saving || loading}>
                  {saving ? "Saving..." : "Save Candidate"}
                </AdButton>
              </Stack>
            </Stack>

            <Divider />

            <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, alignItems: "start" }}>
              <AdTextBox variant="standard" size="small" label="First Name" value={form.first_name} onChange={(v) => setForm((f) => ({ ...f, first_name: v }))} />
              <AdTextBox variant="standard" size="small" label="Last Name" value={form.last_name} onChange={(v) => setForm((f) => ({ ...f, last_name: v }))} />
              <AdTextBox variant="standard" size="small" label="Reference Mobile" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
              <AdTextBox variant="standard" size="small" label="Reference Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
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
              <AdTextBox variant="standard" size="small" label="Father's Name" value={form.father_name} onChange={(v) => setForm((f) => ({ ...f, father_name: v }))} />
              <AdTextBox variant="standard" size="small" label="Address 1" value={form.address1} onChange={(v) => setForm((f) => ({ ...f, address1: v }))} />
              <AdTextBox variant="standard" size="small" label="Address 2" value={form.address2} onChange={(v) => setForm((f) => ({ ...f, address2: v }))} />
              <AdTextBox variant="standard" size="small" label="Pincode" value={form.pincode} onChange={(v) => setForm((f) => ({ ...f, pincode: v }))} />
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
              <Typography fontWeight={950}>Profile Details</Typography>
              <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, alignItems: "start" }}>
                <AdSearchableDropDown variant="standard" label="Education" options={educationOptions} value={form.education} onChange={(v) => setForm((f) => ({ ...f, education: String(v) }))} />
                <AdSearchableDropDown variant="standard" label="Job Category" options={jobCategoryOptions} value={form.industry_type} onChange={(v) => setForm((f) => ({ ...f, industry_type: String(v) }))} />
                <Box sx={{ gridColumn: { xs: "auto", md: "1 / span 2" } }}>
                  <AdSearchableDropDownMulti variant="standard" label="Skills" options={skillOptions} value={form.skills ? parseJsonList(form.skills) : []} onChange={(v) => setForm((f) => ({ ...f, skills: serializeJsonList(v) }))} />
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
                  <AdSearchableDropDownMulti variant="standard" label="Languages Known" options={languageOptions} value={form.languages_known ? parseJsonList(form.languages_known) : []} onChange={(v) => setForm((f) => ({ ...f, languages_known: serializeJsonList(v) }))} />
                </Box>
                <TextField variant="standard" size="small" label="Passport Expiry Date" type="date" value={form.passport_expiry_date} onChange={(e) => setForm((f) => ({ ...f, passport_expiry_date: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
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
                        <AdButton variant="text" onClick={() => (filePath ? void viewProfileFile(filePath) : undefined)} disabled={!filePath}>
                          View
                        </AdButton>
                        <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                          Upload
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
            </Stack>
          </CardContent>
        </Card>
      </Box>
      </Stack>
    </Container>
  );
}
