import { useEffect, useMemo, useState } from "react";
import { Chip, Divider, Stack, Typography, Checkbox, FormControlLabel } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { AdAlertBox, AdButton, AdCard, AdDropDown, AdGrid, AdModal, AdNotification, AdTextArea, AdTextBox } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { jobsApi, type JobListRow } from "../../common/services/jobsApi";
import { mastersApi, type ContractDuration, type DocumentType, type JobCategory } from "../../common/services/mastersApi";
import { listCities, listCountries, listStates, type CityRow, type Country, type StateRow } from "../../common/services/locationApi";

type Form = {
  job_id?: number;
  job_code: string;
  job_title: string;
  category_id: string;
  contract_duration_id: string;
  status: string;
  job_description: string;
  documents: Record<number, { include: boolean; is_required: boolean }>;
  locations: Array<{
    country_id: string;
    state_id: string;
    city_id: string;
    vacancy: string;
    salary_min: string;
    salary_max: string;
    requirementsText: string;
    benefitsText: string;
  }>;
};

function lines(s: string): string[] {
  return s
    .split(/\r?\n/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function JobsPage() {
  const [rows, setRows] = useState<JobListRow[]>([]);
  const [loading, setLoading] = useState(true);
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

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Form>({
    job_code: "",
    job_title: "",
    category_id: "",
    contract_duration_id: "",
    status: "Open",
    job_description: "",
    documents: {},
    locations: [
      {
        country_id: "",
        state_id: "",
        city_id: "",
        vacancy: "",
        salary_min: "",
        salary_max: "",
        requirementsText: "",
        benefitsText: "",
      },
    ],
  });

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setRows(await jobsApi.list());
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(apiErr?.message ?? "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    (async () => {
      try {
        const [cats, durs, docs, cos] = await Promise.all([
          mastersApi.jobCategories.list(true),
          mastersApi.contractDurations.list(true),
          mastersApi.documentTypes.list(true),
          listCountries(true),
        ]);
        setCategories(cats);
        setDurations(durs);
        setDocTypes(docs);
        setCountries(cos);
      } catch {
        // ignore; list page still works
      }
    })();
  }, []);

  // Dependent dropdown data (loaded on-demand for the location currently being edited)
  const [activeLocIndex, setActiveLocIndex] = useState(0);
  useEffect(() => {
    const loc = form.locations[activeLocIndex];
    if (!loc?.country_id) {
      setStates([]);
      setCities([]);
      return;
    }
    (async () => {
      try {
        const st = await listStates(Number(loc.country_id), true);
        setStates(st);
      } catch {
        setStates([]);
      }
    })();
  }, [activeLocIndex, form.locations]);

  useEffect(() => {
    const loc = form.locations[activeLocIndex];
    if (!loc?.state_id) {
      setCities([]);
      return;
    }
    (async () => {
      try {
        const ct = await listCities(Number(loc.state_id), true);
        setCities(ct);
      } catch {
        setCities([]);
      }
    })();
  }, [activeLocIndex, form.locations]);

  const categoryOptions = useMemo(
    () => [{ label: "— Select —", value: "" }].concat(categories.map((c) => ({ label: c.category_name, value: String(c.category_id) }))),
    [categories],
  );
  const durationOptions = useMemo(
    () => [{ label: "— Select —", value: "" }].concat(durations.map((d) => ({ label: d.duration_name ?? `#${d.duration_id}`, value: String(d.duration_id) }))),
    [durations],
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

  const cols = useMemo(
    () => [
      { field: "job_code", headerName: "Code", width: 140 },
      { field: "job_title", headerName: "Title", flex: 1, minWidth: 240 },
      { field: "category_name", headerName: "Category", width: 180 },
      { field: "country_name", headerName: "Country", width: 180 },
      { field: "vacancy", headerName: "Vacancy", width: 110 },
      {
        field: "status",
        headerName: "Status",
        width: 140,
        renderCell: (p: any) => (
          <Chip
            size="small"
            label={String(p.value ?? "")}
            color={String(p.value ?? "").toLowerCase() === "open" ? "success" : "default"}
          />
        ),
      },
      {
        field: "__actions",
        headerName: "Actions",
        width: 260,
        sortable: false,
        filterable: false,
        renderCell: (p: any) => {
          const r = p.row as JobListRow;
          return (
            <Stack direction="row" spacing={1}>
              <AdButton
                variant="text"
                startIcon={<EditIcon fontSize="small" />}
                onClick={async () => {
                  try {
                    const d = await jobsApi.get(r.job_id);
                    const docMap: Form["documents"] = {};
                    for (const dt of docTypes) {
                      const existing = d.documents.find((x) => x.document_type_id === dt.document_type_id);
                      docMap[dt.document_type_id] = {
                        include: Boolean(existing),
                        is_required: existing ? Boolean(Number(existing.is_required)) : Boolean(Number(dt.is_required)),
                      };
                    }

                    const globalReq = d.requirements.filter((x: any) => x.location_id == null).map((x: any) => x.requirement);
                    const globalBen = d.benefits.filter((x: any) => x.location_id == null).map((x: any) => x.benefit);

                    const locForms = (d.locations.length ? d.locations : [{ country_id: d.job.country_id, state_id: null, city_id: null } as any]).map(
                      (loc: any) => {
                        const req = d.requirements
                          .filter((x: any) => x.location_id === loc.id)
                          .map((x: any) => x.requirement);
                        const ben = d.benefits
                          .filter((x: any) => x.location_id === loc.id)
                          .map((x: any) => x.benefit);
                        return {
                          country_id: loc.country_id ? String(loc.country_id) : (d.job.country_id ? String(d.job.country_id) : ""),
                          state_id: loc.state_id ? String(loc.state_id) : "",
                          city_id: loc.city_id ? String(loc.city_id) : "",
                          vacancy: loc.vacancy != null ? String(loc.vacancy) : "",
                          salary_min: loc.salary_min ?? "",
                          salary_max: loc.salary_max ?? "",
                          requirementsText: (req.length ? req : globalReq).join("\n"),
                          benefitsText: (ben.length ? ben : globalBen).join("\n"),
                        };
                      },
                    );

                    setForm({
                      job_id: d.job.job_id,
                      job_code: d.job.job_code ?? "",
                      job_title: d.job.job_title ?? "",
                      category_id: d.job.category_id ? String(d.job.category_id) : "",
                      contract_duration_id: d.job.contract_duration_id ? String(d.job.contract_duration_id) : "",
                      status: d.job.status ?? "Open",
                      job_description: d.job.job_description ?? "",
                      documents: docMap,
                      locations: locForms,
                    });
                    setActiveLocIndex(0);
                    setModalOpen(true);
                  } catch (e: any) {
                    setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load job", severity: "error" });
                  }
                }}
              >
                Edit
              </AdButton>
              <AdButton
                variant="text"
                startIcon={<DeleteIcon fontSize="small" />}
                onClick={async () => {
                  if (!confirm("Delete this job?")) return;
                  try {
                    await jobsApi.remove(r.job_id);
                    setToast({ open: true, message: "Deleted", severity: "success" });
                    refresh();
                  } catch (e: any) {
                    setToast({ open: true, message: (e as ApiError)?.message ?? "Delete failed", severity: "error" });
                  }
                }}
              >
                Delete
              </AdButton>
            </Stack>
          );
        },
      },
    ],
    [docTypes],
  );

  const openAdd = () => {
    const docMap: Form["documents"] = {};
    for (const dt of docTypes) {
      docMap[dt.document_type_id] = { include: false, is_required: Boolean(Number(dt.is_required)) };
    }
    setForm({
      job_code: "",
      job_title: "",
      category_id: "",
      contract_duration_id: "",
      status: "Open",
      job_description: "",
      documents: docMap,
      locations: [
        {
          country_id: "",
          state_id: "",
          city_id: "",
          vacancy: "",
          salary_min: "",
          salary_max: "",
          requirementsText: "",
          benefitsText: "",
        },
      ],
    });
    setActiveLocIndex(0);
    setModalOpen(true);
  };

  const save = async () => {
    try {
      if (!form.job_title.trim()) throw new Error("Job title is required");
      const docs = Object.entries(form.documents)
        .filter(([, v]) => v.include)
        .map(([id, v]) => ({ document_type_id: Number(id), is_required: v.is_required }));

      const payload = {
        job_code: form.job_code.trim() || null,
        job_title: form.job_title.trim(),
        category_id: form.category_id ? Number(form.category_id) : null,
        contract_duration_id: form.contract_duration_id ? Number(form.contract_duration_id) : null,
        status: form.status || null,
        job_description: form.job_description || null,
        documents: docs,
        locations: form.locations
          .filter((l) => l.country_id || l.state_id || l.city_id)
          .map((l) => ({
            country_id: l.country_id ? Number(l.country_id) : null,
            state_id: l.state_id ? Number(l.state_id) : null,
            city_id: l.city_id ? Number(l.city_id) : null,
            vacancy: l.vacancy ? Number(l.vacancy) : null,
            salary_min: l.salary_min ? Number(l.salary_min) : null,
            salary_max: l.salary_max ? Number(l.salary_max) : null,
            requirements: lines(l.requirementsText),
            benefits: lines(l.benefitsText),
          })),
      };

      if (form.job_id) await jobsApi.update(form.job_id, payload);
      else await jobsApi.create(payload);

      setToast({ open: true, message: "Saved", severity: "success" });
      setModalOpen(false);
      refresh();
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Save failed", severity: "error" });
    }
  };

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={900}>
            Job Postings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage job openings
          </Typography>
        </Stack>
        <AdButton startIcon={<AddIcon fontSize="small" />} onClick={openAdd}>
          Add Job
        </AdButton>
      </Stack>
      {error && <AdAlertBox severity="error" title="Error" message={error} />}
      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <AdGrid rows={rows.map((r) => ({ id: r.job_id, ...r }))} columns={cols as any} loading={loading} showExport={false} disableColumnMenu />
      </AdCard>

      <AdModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.job_id ? "Edit Job" : "Add Job"}
        maxWidth="lg"
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
            boxShadow: "0 24px 80px rgba(2,6,23,0.18)",
          },
        }}
        actions={
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: "100%" }}>
            <AdButton variant="text" onClick={() => setModalOpen(false)}>
              Cancel
            </AdButton>
            <AdButton onClick={save}>Save</AdButton>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <AdTextBox label="Job Code (optional)" value={form.job_code} onChange={(v) => setForm((f) => ({ ...f, job_code: v }))} />
            <AdDropDown label="Status" options={[{ label: "Open", value: "Open" }, { label: "On Hold", value: "On Hold" }, { label: "Closed", value: "Closed" }]} value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v }))} />
          </Stack>

          <AdTextBox label="Job Title" required value={form.job_title} onChange={(v) => setForm((f) => ({ ...f, job_title: v }))} />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <AdDropDown label="Category" options={categoryOptions} value={form.category_id} onChange={(v) => setForm((f) => ({ ...f, category_id: v }))} />
            <AdDropDown label="Contract Duration" options={durationOptions} value={form.contract_duration_id} onChange={(v) => setForm((f) => ({ ...f, contract_duration_id: v }))} />
          </Stack>

          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography fontWeight={900}>Locations</Typography>
                <AdButton
                  variant="text"
                  startIcon={<AddIcon fontSize="small" />}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      locations: f.locations.concat([
                        {
                          country_id: "",
                          state_id: "",
                          city_id: "",
                          vacancy: "",
                          salary_min: "",
                          salary_max: "",
                          requirementsText: "",
                          benefitsText: "",
                        },
                      ]),
                    }))
                  }
                >
                  Add Location
                </AdButton>
            </Stack>
            {form.locations.map((loc, idx) => (
              <AdCard key={idx} animate={false} contentSx={{ p: 2 }} sx={{ backgroundColor: "rgba(255,255,255,0.7)" }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography fontWeight={850}>Location {idx + 1}</Typography>
                    <Stack direction="row" spacing={1}>
                      {form.locations.length > 1 ? (
                        <AdButton
                          variant="text"
                          startIcon={<DeleteIcon fontSize="small" />}
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              locations: f.locations.filter((_, i) => i !== idx),
                            }))
                          }
                        >
                          Remove
                        </AdButton>
                      ) : null}
                    </Stack>
                  </Stack>

                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    onFocusCapture={() => setActiveLocIndex(idx)}
                  >
                    <AdDropDown
                      label="Country"
                      options={countryOptions}
                      value={loc.country_id}
                      onChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          locations: f.locations.map((x, i) =>
                            i === idx ? { ...x, country_id: v, state_id: "", city_id: "" } : x,
                          ),
                        }))
                      }
                    />
                    <AdDropDown
                      label="State"
                      options={idx === activeLocIndex ? stateOptions : [{ label: "— Select —", value: "" }]}
                      value={loc.state_id}
                      onChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          locations: f.locations.map((x, i) => (i === idx ? { ...x, state_id: v, city_id: "" } : x)),
                        }))
                      }
                    />
                    <AdDropDown
                      label="City"
                      options={idx === activeLocIndex ? cityOptions : [{ label: "— Select —", value: "" }]}
                      value={loc.city_id}
                      onChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          locations: f.locations.map((x, i) => (i === idx ? { ...x, city_id: v } : x)),
                        }))
                      }
                    />
                  </Stack>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <AdTextBox
                      label="Vacancy"
                      type="number"
                      value={loc.vacancy}
                      onChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          locations: f.locations.map((x, i) => (i === idx ? { ...x, vacancy: v } : x)),
                        }))
                      }
                    />
                    <AdTextBox
                      label="Salary Min"
                      type="number"
                      value={loc.salary_min}
                      onChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          locations: f.locations.map((x, i) => (i === idx ? { ...x, salary_min: v } : x)),
                        }))
                      }
                    />
                    <AdTextBox
                      label="Salary Max"
                      type="number"
                      value={loc.salary_max}
                      onChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          locations: f.locations.map((x, i) => (i === idx ? { ...x, salary_max: v } : x)),
                        }))
                      }
                    />
                  </Stack>

                  <AdTextArea
                    label="Requirements (one per line)"
                    value={loc.requirementsText}
                    onChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        locations: f.locations.map((x, i) => (i === idx ? { ...x, requirementsText: v } : x)),
                      }))
                    }
                  />
                  <AdTextArea
                    label="Benefits (one per line)"
                    value={loc.benefitsText}
                    onChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        locations: f.locations.map((x, i) => (i === idx ? { ...x, benefitsText: v } : x)),
                      }))
                    }
                  />
                </Stack>
              </AdCard>
            ))}
          </Stack>

          <AdTextArea label="Job Description" value={form.job_description} onChange={(v) => setForm((f) => ({ ...f, job_description: v }))} />

          <Divider />

          <Stack spacing={1}>
            <Typography fontWeight={900}>Documents</Typography>
            {docTypes.map((dt) => {
              const v = form.documents[dt.document_type_id] ?? { include: false, is_required: Boolean(Number(dt.is_required)) };
              return (
                <Stack key={dt.document_type_id} direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
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
      </AdModal>
    </Stack>
  );
}
