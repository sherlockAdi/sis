import { useEffect, useMemo, useState } from "react";
import { Box, Checkbox, Divider, FormControlLabel, Stack, Typography, FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";
import { AdAlertBox, AdButton, AdCard, AdDropDown, AdNotification, AdTextArea, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { jobsApi } from "../../common/services/jobsApi";
import {
  mastersApi,
  type ContractDuration,
  type DocumentType,
  type EmploymentType,
  type JobCategory,
  type Language,
  type WorkMode,
  type Currency,
} from "../../common/services/mastersApi";
import { listCities, listCountries, listStates, type CityRow, type Country, type StateRow } from "../../common/services/locationApi";
import { partnersApi, type PartnerRow } from "../../common/services/partnersApi";
import { useAuth } from "../../common/auth/AuthContext";

type Form = {
  job_id?: number;
  job_code: string;
  job_title: string;
  category_id: string;
  contract_duration_id: string;
  status: string;
  job_description: string;
  partner_id: string;
  employment_type_id: string;
  work_mode_id: string;
  currency_id: string;
  compensation_text: string;
  vacancy: string;
  salary_min: string;
  salary_max: string;
  country_id: string;
  state_id: string;
  city_id: string;
  min_education: string;
  min_experience: string;
  min_age: string;
  max_age: string;
  gender_requirement: string;
  language_ids: string[];
  benefitsText: string;
  documents: Record<number, { include: boolean; is_required: boolean }>;
};

function lines(s: string): string[] {
  return s
    .split(/\r?\n/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function JobFormPage({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const params = useParams();
  const jobId = params.jobId ? Number(params.jobId) : null;
  const { me } = useAuth();
  const role = String(me?.role_code ?? "").toUpperCase();
  const isPartner = role === "SOURCING" || role === "PARTNER";

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [durations, setDurations] = useState<ContractDuration[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<EmploymentType[]>([]);
  const [workModes, setWorkModes] = useState<WorkMode[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [partners, setPartners] = useState<PartnerRow[]>([]);

  const [form, setForm] = useState<Form>({
    job_code: "",
    job_title: "",
    category_id: "",
    contract_duration_id: "",
    status: "Open",
    job_description: "",
    partner_id: "",
    employment_type_id: "",
    work_mode_id: "",
    currency_id: "",
    compensation_text: "",
    vacancy: "",
    salary_min: "",
    salary_max: "",
    country_id: "",
    state_id: "",
    city_id: "",
    min_education: "",
    min_experience: "",
    min_age: "",
    max_age: "",
    gender_requirement: "",
    language_ids: [],
    benefitsText: "",
    documents: {},
  });

  useEffect(() => {
    (async () => {
      try {
        const [cats, durs, docs, cos] = await Promise.all([
          mastersApi.jobCategories.list(true),
          mastersApi.contractDurations.list(true),
          mastersApi.documentTypes.list(true),
          listCountries(true),
        ]);
        const [et, wm, langs, curs] = await Promise.all([
          mastersApi.employmentTypes.list(true),
          mastersApi.workModes.list(true),
          mastersApi.languages.list(true),
          mastersApi.currencies.list(true),
        ]);
        setCategories(cats);
        setDurations(durs);
        setDocTypes(docs);
        setCountries(cos);
        setEmploymentTypes(et);
        setWorkModes(wm);
        setLanguages(langs);
        setCurrencies(curs);
        if (!isPartner) {
          setPartners(await partnersApi.list(true));
        }
      } catch {
        // ignore
      }
    })();
  }, [isPartner]);

  useEffect(() => {
    if (mode !== "edit" || !jobId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const d = await jobsApi.get(jobId);
        const docMap: Form["documents"] = {};
        for (const dt of docTypes) {
          const existing = d.documents.find((x) => x.document_type_id === dt.document_type_id);
          docMap[dt.document_type_id] = {
            include: Boolean(existing),
            is_required: existing ? Boolean(Number(existing.is_required)) : Boolean(Number(dt.is_required)),
          };
        }

        const globalBen = d.benefits.filter((x: any) => x.location_id == null).map((x: any) => x.benefit);
        const loc = d.locations?.[0];

        setForm({
          job_id: d.job.job_id,
          job_code: d.job.job_code ?? "",
          job_title: d.job.job_title ?? "",
          category_id: d.job.category_id ? String(d.job.category_id) : "",
          contract_duration_id: d.job.contract_duration_id ? String(d.job.contract_duration_id) : "",
          status: d.job.status ?? "Open",
          job_description: d.job.job_description ?? "",
          partner_id: d.job.partner_id ? String(d.job.partner_id) : "",
          employment_type_id: d.job.employment_type_id ? String(d.job.employment_type_id) : "",
          work_mode_id: d.job.work_mode_id ? String(d.job.work_mode_id) : "",
          currency_id: d.job.currency_id ? String(d.job.currency_id) : "",
          compensation_text: d.job.compensation_text ?? "",
          vacancy: d.job.vacancy != null ? String(d.job.vacancy) : loc?.vacancy != null ? String(loc.vacancy) : "",
          salary_min: d.job.salary_min ?? loc?.salary_min ?? "",
          salary_max: d.job.salary_max ?? loc?.salary_max ?? "",
          country_id: loc?.country_id ? String(loc.country_id) : d.job.country_id ? String(d.job.country_id) : "",
          state_id: loc?.state_id ? String(loc.state_id) : "",
          city_id: loc?.city_id ? String(loc.city_id) : "",
          min_education: d.job.min_education ?? "",
          min_experience: d.job.min_experience ?? "",
          min_age: d.job.min_age != null ? String(d.job.min_age) : "",
          max_age: d.job.max_age != null ? String(d.job.max_age) : "",
          gender_requirement: d.job.gender_requirement ?? "",
          language_ids: (d.languages ?? []).map((l: any) => String(l.language_id)),
          benefitsText: (globalBen ?? []).join("\n"),
          documents: docMap,
        });
      } catch (e: any) {
        setError((e as ApiError)?.message ?? "Failed to load job");
      } finally {
        setLoading(false);
      }
    })();
  }, [docTypes, jobId, mode]);

  useEffect(() => {
    if (!form.country_id) {
      setStates([]);
      setCities([]);
      return;
    }
    (async () => {
      try {
        const st = await listStates(Number(form.country_id), true);
        setStates(st);
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
        const ct = await listCities(Number(form.state_id), true);
        setCities(ct);
      } catch {
        setCities([]);
      }
    })();
  }, [form.state_id]);

  const categoryOptions = useMemo(
    () => [{ label: "— Select —", value: "" }].concat(categories.map((c) => ({ label: c.category_name, value: String(c.category_id) }))),
    [categories],
  );
  const durationOptions = useMemo(
    () => [{ label: "— Select —", value: "" }].concat(durations.map((d) => ({ label: d.duration_name ?? `#${d.duration_id}`, value: String(d.duration_id) }))),
    [durations],
  );
  const partnerOptions = useMemo(
    () =>
      [{ label: "— Select —", value: "" }].concat(
        partners
          .slice()
          .sort((a, b) => String(a.partner_name ?? "").localeCompare(String(b.partner_name ?? "")))
          .map((p) => ({ label: `${p.partner_name}${p.partner_code ? ` (${p.partner_code})` : ""}`, value: String(p.partner_id) })),
      ),
    [partners],
  );
  const countryOptions = useMemo(
    () => [{ label: "— Select —", value: "" }].concat(countries.map((c) => ({ label: c.country_name, value: String(c.country_id) }))),
    [countries],
  );
  const stateOptions = useMemo(
    () => [{ label: "— Select —", value: "" }].concat(states.map((s) => ({ label: s.state_name, value: String(s.state_id) }))),
    [states],
  );
  const cityOptions = useMemo(
    () => [{ label: "— Select —", value: "" }].concat(cities.map((c) => ({ label: c.city_name, value: String(c.city_id) }))),
    [cities],
  );
  const employmentTypeOptions = useMemo(
    () => [{ label: "— Select —", value: "" }].concat(employmentTypes.map((e) => ({ label: e.type_name, value: String(e.employment_type_id) }))),
    [employmentTypes],
  );
  const workModeOptions = useMemo(
    () => [{ label: "— Select —", value: "" }].concat(workModes.map((w) => ({ label: w.mode_name, value: String(w.work_mode_id) }))),
    [workModes],
  );
  const currencyOptions = useMemo(
    () =>
      [{ label: "— Select —", value: "" }].concat(
        currencies.map((c) => ({
          label: `${c.currency_code ?? c.currency_name ?? "Currency"}${c.currency_name ? ` - ${c.currency_name}` : ""}`,
          value: String(c.currency_id),
        })),
      ),
    [currencies],
  );

  const save = async () => {
    try {
      if (!form.job_title.trim()) throw new Error("Job title is required");
      if (!form.job_code.trim()) throw new Error("Job code is required");
      if (!form.category_id) throw new Error("Category is required");
      if (!form.contract_duration_id) throw new Error("Contract duration is required");
      if (!form.employment_type_id) throw new Error("Employment type is required");
      if (!form.work_mode_id) throw new Error("Work mode is required");
      if (!form.country_id) throw new Error("Country is required");
      if (!form.vacancy || Number(form.vacancy) <= 0) throw new Error("Number of openings is required");
      if (!form.currency_id) throw new Error("Currency is required");
      if (!form.salary_min || !form.salary_max) throw new Error("Salary range is required");
      if (!form.compensation_text.trim()) throw new Error("Compensation details are required");
      if (!form.min_education.trim()) throw new Error("Minimum education is required");
      if (!form.min_experience.trim()) throw new Error("Minimum experience is required");
      if (!form.min_age || !form.max_age) throw new Error("Age range is required");
      if (form.language_ids.length === 0) throw new Error("At least one language is required");
      setSaving(true);

      const payload = {
        job_code: form.job_code.trim() || null,
        job_title: form.job_title.trim(),
        category_id: form.category_id ? Number(form.category_id) : null,
        country_id: form.country_id ? Number(form.country_id) : null,
        contract_duration_id: form.contract_duration_id ? Number(form.contract_duration_id) : null,
        status: form.status || null,
        job_description: form.job_description.trim() || null,
        partner_id: form.partner_id ? Number(form.partner_id) : null,
        employment_type_id: form.employment_type_id ? Number(form.employment_type_id) : null,
        work_mode_id: form.work_mode_id ? Number(form.work_mode_id) : null,
        currency_id: form.currency_id ? Number(form.currency_id) : null,
        compensation_text: form.compensation_text.trim() || null,
        vacancy: form.vacancy ? Number(form.vacancy) : null,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        min_education: form.min_education.trim() || null,
        min_experience: form.min_experience.trim() || null,
        min_age: form.min_age ? Number(form.min_age) : null,
        max_age: form.max_age ? Number(form.max_age) : null,
        gender_requirement: form.gender_requirement.trim() || null,
        language_ids: form.language_ids.map((id) => Number(id)).filter((id) => Number.isFinite(id)),
        documents: Object.entries(form.documents)
          .filter(([, v]) => v.include)
          .map(([document_type_id, v]) => ({ document_type_id: Number(document_type_id), is_required: v.is_required })),
        benefits: lines(form.benefitsText),
        location: {
          country_id: form.country_id ? Number(form.country_id) : null,
          state_id: form.state_id ? Number(form.state_id) : null,
          city_id: form.city_id ? Number(form.city_id) : null,
        },
      };

      if (mode === "edit" && jobId) await jobsApi.update(jobId, payload);
      else await jobsApi.create(payload);

      setToast({ open: true, message: "Saved", severity: "success" });
      const target = isPartner ? "/portal/partner/job-mandates" : "/portal/jobs";
      setTimeout(() => navigate(target), 400);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Save failed", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={1.75} sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden", minWidth: 0 }}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
        <Stack spacing={0.25}>
          <Typography variant="h6" fontWeight={900}>
            {mode === "edit" ? "Edit Job" : "Add Job"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {mode === "edit" ? "Update job details" : "Create a new job posting"}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <AdButton variant="text" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
            Back
          </AdButton>
          <AdButton onClick={save} disabled={saving || loading}>
            Save
          </AdButton>
        </Stack>
      </Stack>

      {error ? <AdAlertBox severity="error" title="Error" message={error} /> : null}

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)", minWidth: 0 }} contentSx={{ p: 1.5 }}>
        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <AdTextBox label="Job Code" required size="small" value={form.job_code} onChange={(v) => setForm((f) => ({ ...f, job_code: v }))} />
              <AdTextBox label="Job Title" required size="small" value={form.job_title} onChange={(v) => setForm((f) => ({ ...f, job_title: v }))} />
              <AdDropDown
                label="Status"
                options={[{ label: "Open", value: "Open" }, { label: "On Hold", value: "On Hold" }, { label: "Closed", value: "Closed" }]}
                value={form.status}
                onChange={(v) => setForm((f) => ({ ...f, status: v }))}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <AdDropDown label="Category" options={categoryOptions} value={form.category_id} onChange={(v) => setForm((f) => ({ ...f, category_id: v }))} />
              <AdDropDown
                label="Employment Type"
                options={employmentTypeOptions}
                value={form.employment_type_id}
                onChange={(v) => setForm((f) => ({ ...f, employment_type_id: v }))}
              />
              <AdDropDown
                label="Contract Duration"
                options={durationOptions}
                value={form.contract_duration_id}
                onChange={(v) => setForm((f) => ({ ...f, contract_duration_id: v }))}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <AdDropDown
                label="Work Mode"
                options={workModeOptions}
                value={form.work_mode_id}
                onChange={(v) => setForm((f) => ({ ...f, work_mode_id: v }))}
              />
              {!isPartner ? (
                <AdDropDown
                  label="Partner (optional)"
                  options={partnerOptions}
                  value={form.partner_id}
                  onChange={(v) => setForm((f) => ({ ...f, partner_id: v }))}
                />
              ) : null}
              <Box sx={{ flex: 1 }} />
            </Stack>

            <Stack spacing={0.75}>
              <Typography fontWeight={800} variant="subtitle2">
                Work Location
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <AdDropDown
                  label="Country"
                  options={countryOptions}
                  value={form.country_id}
                  onChange={(v) => setForm((f) => ({ ...f, country_id: v, state_id: "", city_id: "" }))}
                />
                <AdDropDown
                  label="State"
                  options={stateOptions}
                  value={form.state_id}
                  onChange={(v) => setForm((f) => ({ ...f, state_id: v, city_id: "" }))}
                />
                <AdDropDown label="City" options={cityOptions} value={form.city_id} onChange={(v) => setForm((f) => ({ ...f, city_id: v }))} />
              </Stack>
            </Stack>

            <Stack spacing={0.75}>
              <Typography fontWeight={800} variant="subtitle2">
                Compensation
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <AdTextBox
                  label="Number Of Openings"
                  required
                  type="number"
                  size="small"
                  value={form.vacancy}
                  onChange={(v) => setForm((f) => ({ ...f, vacancy: v }))}
                />
                <AdDropDown
                  label="Currency"
                  options={currencyOptions}
                  value={form.currency_id}
                  onChange={(v) => setForm((f) => ({ ...f, currency_id: v }))}
                />
                <AdTextBox
                  label="Salary Min"
                  required
                  type="number"
                  size="small"
                  value={form.salary_min}
                  onChange={(v) => setForm((f) => ({ ...f, salary_min: v }))}
                />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <AdTextBox
                  label="Salary Max"
                  required
                  type="number"
                  size="small"
                  value={form.salary_max}
                  onChange={(v) => setForm((f) => ({ ...f, salary_max: v }))}
                />
                <Box sx={{ flex: 1 }} />
                <Box sx={{ flex: 1 }} />
              </Stack>
              <AdTextArea
                label="Compensation Details"
                required
                minRows={2}
                value={form.compensation_text}
                onChange={(v) => setForm((f) => ({ ...f, compensation_text: v }))}
              />
              <AdTextArea
                label="Benefits (one per line)"
                minRows={2}
                value={form.benefitsText}
                onChange={(v) => setForm((f) => ({ ...f, benefitsText: v }))}
              />
            </Stack>

            <Stack spacing={0.75}>
              <Typography fontWeight={800} variant="subtitle2">
                Candidate Eligibility
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <AdTextBox
                  label="Minimum Education"
                  required
                  size="small"
                  value={form.min_education}
                  onChange={(v) => setForm((f) => ({ ...f, min_education: v }))}
                />
                <AdTextBox
                  label="Minimum Experience"
                  required
                  size="small"
                  value={form.min_experience}
                  onChange={(v) => setForm((f) => ({ ...f, min_experience: v }))}
                />
                <AdDropDown
                  label="Gender (if applicable)"
                  options={[
                    { label: "— Select —", value: "" },
                    { label: "Any", value: "Any" },
                    { label: "Male", value: "Male" },
                    { label: "Female", value: "Female" },
                    { label: "Other", value: "Other" },
                  ]}
                  value={form.gender_requirement}
                  onChange={(v) => setForm((f) => ({ ...f, gender_requirement: v }))}
                />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <AdTextBox label="Min Age" required type="number" size="small" value={form.min_age} onChange={(v) => setForm((f) => ({ ...f, min_age: v }))} />
                <AdTextBox label="Max Age" required type="number" size="small" value={form.max_age} onChange={(v) => setForm((f) => ({ ...f, max_age: v }))} />
                <FormControl fullWidth size="small">
                  <InputLabel id="job-language-label">Language Requirement</InputLabel>
                  <Select
                    labelId="job-language-label"
                    multiple
                    value={form.language_ids}
                    label="Language Requirement"
                    onChange={(event: SelectChangeEvent<string[]>) => {
                      const value = event.target.value;
                      setForm((f) => ({ ...f, language_ids: typeof value === "string" ? value.split(",") : value }));
                    }}
                    renderValue={(selected) =>
                      languages
                        .filter((l) => selected.includes(String(l.language_id)))
                        .map((l) => l.language_name)
                        .join(", ")
                    }
                  >
                    {languages.map((l) => (
                      <MenuItem key={l.language_id} value={String(l.language_id)}>
                        <Checkbox checked={form.language_ids.includes(String(l.language_id))} />
                        <Typography variant="body2">{l.language_name}</Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>

              <AdTextArea label="Job Description" minRows={2} value={form.job_description} onChange={(v) => setForm((f) => ({ ...f, job_description: v }))} />

            <Divider />

            <Stack spacing={0.75}>
              <Typography fontWeight={800} variant="subtitle2">
                Documents
              </Typography>
              {docTypes.map((dt) => {
                const v = form.documents[dt.document_type_id] ?? { include: false, is_required: Boolean(Number(dt.is_required)) };
                return (
                  <Stack key={dt.document_type_id} direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={v.include}
                          onChange={(_, checked) =>
                            setForm((f) => ({
                              ...f,
                              documents: { ...f.documents, [dt.document_type_id]: { ...v, include: checked } },
                            }))
                          }
                        />
                      }
                      label={dt.document_name}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={v.is_required}
                          disabled={!v.include}
                          onChange={(_, checked) =>
                            setForm((f) => ({
                              ...f,
                              documents: { ...f.documents, [dt.document_type_id]: { ...v, is_required: checked } },
                            }))
                          }
                        />
                      }
                      label="Required"
                    />
                  </Stack>
                );
              })}
            </Stack>
          </Stack>
        )}
      </AdCard>
    </Stack>
  );
}
