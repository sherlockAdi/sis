import { useEffect, useMemo, useState } from "react";
import { Chip, Divider, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import dayjs from "dayjs";
import { useNavigate, useParams } from "react-router-dom";
import {
  AdAlertBox,
  AdButton,
  AdCard,
  AdDatePicker,
  AdNotification,
  AdSearchableDropDown,
  AdTextArea,
  AdTextBox,
} from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { recruitmentApi, type CandidateRow } from "../../common/services/recruitmentApi";
import { listCities, listCountries, listStates, type CityRow, type Country, type StateRow } from "../../common/services/locationApi";

type Form = {
  candidate_id?: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  passport_number: string;
  country_id: string;
  state_id: string;
  city_id: string;
  status: string;
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
};

type UploadKey = "resume" | "passport" | "aadhar" | "pan" | "voter" | "photo";

type PendingFiles = Record<UploadKey, File | null>;

const emptyForm: Form = {
  candidate_id: undefined,
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  passport_number: "",
  country_id: "",
  state_id: "",
  city_id: "",
  status: "New",
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
};

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

function fileExt(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

function mapCandidateForm(candidate: CandidateRow): Form {
  return {
    candidate_id: candidate.candidate_id,
    first_name: candidate.first_name ?? "",
    last_name: candidate.last_name ?? "",
    phone: candidate.phone ?? "",
    email: candidate.email ?? "",
    passport_number: candidate.passport_number ?? "",
    country_id: candidate.country_id ? String(candidate.country_id) : "",
    state_id: candidate.state_id ? String(candidate.state_id) : "",
    city_id: candidate.city_id ? String(candidate.city_id) : "",
    status: candidate.status ?? "New",
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
  const [form, setForm] = useState<Form>(emptyForm);
  const [pendingFiles, setPendingFiles] = useState<PendingFiles>(emptyPendingFiles);

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
  const statusOptions = useMemo(
    () => [
      { label: "New", value: "New" },
      { label: "Active", value: "Active" },
      { label: "Inactive", value: "Inactive" },
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
    father_name: toNull(form.father_name),
    address1: toNull(form.address1),
    address2: toNull(form.address2),
    pincode: toNull(form.pincode),
    dob: form.dob || null,
    gender: toNull(form.gender),
    skills: toNull(form.skills),
    education: toNull(form.education),
    experience: toNull(form.experience),
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
    <Stack spacing={2.5} sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden", minWidth: 0 }}>
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

      {error && <AdAlertBox severity="error" title="Error" message={error} />}

      <AdCard
        animate={false}
        title={form.candidate_id ? "Edit Candidate" : "Add Candidate"}
        subtitle="Use the full screen form for registration and candidate profile data"
        headerRight={
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <AdButton variant="text" onClick={() => navigate("/portal/recruitment/candidates")}>
              Cancel
            </AdButton>
            <AdButton onClick={saveCandidate} disabled={saving || loading}>
              {saving ? "Saving..." : form.candidate_id ? "Update Candidate" : "Save Candidate"}
            </AdButton>
          </Stack>
        }
        sx={{ backgroundColor: "rgba(255,255,255,0.72)", minWidth: 0 }}
        contentSx={{ p: 2.5 }}
      >
        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Loading candidate details...
          </Typography>
        ) : (
          <Stack spacing={2.5}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" fontWeight={800}>
                Registration
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <AdTextBox label="First Name" required value={form.first_name} onChange={(v) => setForm((f) => ({ ...f, first_name: v }))} />
                <AdTextBox label="Last Name" required value={form.last_name} onChange={(v) => setForm((f) => ({ ...f, last_name: v }))} />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <AdTextBox label="Mobile" required value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
                <AdTextBox label="Email" required type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <AdSearchableDropDown
                  label="Country"
                  options={countryOptions}
                  value={form.country_id}
                  onChange={(v) => setForm((f) => ({ ...f, country_id: String(v), state_id: "", city_id: "" }))}
                />
                <AdSearchableDropDown
                  label="State"
                  options={stateOptions}
                  value={form.state_id}
                  onChange={(v) => setForm((f) => ({ ...f, state_id: String(v), city_id: "" }))}
                  disabled={!form.country_id}
                />
                <AdSearchableDropDown
                  label="City"
                  options={cityOptions}
                  value={form.city_id}
                  onChange={(v) => setForm((f) => ({ ...f, city_id: String(v) }))}
                  disabled={!form.state_id}
                />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <AdSearchableDropDown
                  label="Status"
                  options={statusOptions}
                  value={form.status}
                  onChange={(v) => setForm((f) => ({ ...f, status: String(v) || "New" }))}
                />
                <AdTextBox
                  label="Passport Number"
                  required
                  value={form.passport_number}
                  onChange={(v) => setForm((f) => ({ ...f, passport_number: v }))}
                />
              </Stack>
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle2" fontWeight={800}>
                Profile Fields
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <AdTextBox label="Father's Name" value={form.father_name} onChange={(v) => setForm((f) => ({ ...f, father_name: v }))} />
                <AdDatePicker label="DOB" value={form.dob ? dayjs(form.dob) : null} onChange={(v) => setForm((f) => ({ ...f, dob: v ? v.format("YYYY-MM-DD") : "" }))} />
                <AdSearchableDropDown
                  label="Gender"
                  options={genderOptions}
                  value={form.gender}
                  onChange={(v) => setForm((f) => ({ ...f, gender: String(v) }))}
                />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <AdTextArea label="Address 1" value={form.address1} onChange={(v) => setForm((f) => ({ ...f, address1: v }))} />
                <AdTextArea label="Address 2" value={form.address2} onChange={(v) => setForm((f) => ({ ...f, address2: v }))} />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <AdTextBox label="Pincode" value={form.pincode} onChange={(v) => setForm((f) => ({ ...f, pincode: v }))} />
                <AdTextBox label="Skills" value={form.skills} onChange={(v) => setForm((f) => ({ ...f, skills: v }))} />
                <AdTextBox label="Languages Known" value={form.languages_known} onChange={(v) => setForm((f) => ({ ...f, languages_known: v }))} />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <AdTextBox label="Education" value={form.education} onChange={(v) => setForm((f) => ({ ...f, education: v }))} />
                <AdTextBox label="Experience" value={form.experience} onChange={(v) => setForm((f) => ({ ...f, experience: v }))} />
                <AdTextBox label="Industry Type" value={form.industry_type} onChange={(v) => setForm((f) => ({ ...f, industry_type: v }))} />
              </Stack>
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle2" fontWeight={800}>
                Documents
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <AdDatePicker
                  label="Passport Expiry Date"
                  value={form.passport_expiry_date ? dayjs(form.passport_expiry_date) : null}
                  onChange={(v) => setForm((f) => ({ ...f, passport_expiry_date: v ? v.format("YYYY-MM-DD") : "" }))}
                />
                <AdTextBox label="Aadhar Number" value={form.aadhar_number} onChange={(v) => setForm((f) => ({ ...f, aadhar_number: v }))} />
                <AdTextBox label="PAN No." value={form.pan_number} onChange={(v) => setForm((f) => ({ ...f, pan_number: v }))} />
                <AdTextBox label="Voter ID Number" value={form.voter_id_number} onChange={(v) => setForm((f) => ({ ...f, voter_id_number: v }))} />
              </Stack>

              <Stack spacing={1.25}>
                {fileChoices.map((spec) => (
                  <Stack key={spec.key} direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "center" }}>
                    <Stack sx={{ minWidth: { md: 280 } }}>
                      <Typography variant="body2" fontWeight={700}>
                        {spec.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {spec.current ? "File attached" : "Not uploaded yet"}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AdButton component="label" variant="outlined" startIcon={<UploadFileIcon fontSize="small" />}>
                        Choose File
                        <input
                          hidden
                          type="file"
                          accept={spec.accept}
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            setPendingFiles((prev) => ({ ...prev, [spec.key]: file }));
                          }}
                        />
                      </AdButton>
                      {pendingFiles[spec.key] ? <Chip size="small" color="info" label={pendingFiles[spec.key]!.name} /> : null}
                      {spec.current ? <Chip size="small" color="success" label="Saved" /> : null}
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </Stack>

            {form.candidate_id ? (
              <>
                <Divider />
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2" fontWeight={800}>
                    System Fields
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Created At: {form.created_at || "—"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Updated At: {form.updated_at || "—"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Deleted At: {form.deleted_at || "—"}
                  </Typography>
                </Stack>
              </>
            ) : null}
          </Stack>
        )}
      </AdCard>
    </Stack>
  );
}
