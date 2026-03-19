import { useEffect, useMemo, useState } from "react";
import { Box, Card, CardContent, Chip, Divider, Grid, Stack, Typography } from "@mui/material";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import PlaceIcon from "@mui/icons-material/Place";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { AdAlertBox, AdButton, AdCard, AdDropDown, AdModal, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { jobsApi, type JobDetail, type JobListRow } from "../../common/services/jobsApi";
import { mastersApi, type JobCategory } from "../../common/services/mastersApi";
import { listCities, listCountries, listStates, type CityRow, type Country, type StateRow } from "../../common/services/locationApi";
import { candidateApi, type CandidateApplicationDocRow } from "../../common/services/candidateApi";
import { recruitmentApi } from "../../common/services/recruitmentApi";

type Filters = {
  country_id?: number;
  state_id?: number;
  city_id?: number;
  category_id?: number;
  status?: string;
};

function fileExt(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx < 0) return "";
  return name.slice(idx).toLowerCase();
}

export default function CandidateJobsPage() {
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [rows, setRows] = useState<JobListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({ status: "Open" });
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  const [docsOpen, setDocsOpen] = useState(false);
  const [activeApplicationId, setActiveApplicationId] = useState<number | null>(null);
  const [docs, setDocs] = useState<CandidateApplicationDocRow[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [cos, cats] = await Promise.all([listCountries(true), mastersApi.jobCategories.list(true)]);
        setCountries(cos);
        setCategories(cats);
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    if (!filters.country_id) {
      setStates([]);
      setCities([]);
      setFilters((f) => ({ ...f, state_id: undefined, city_id: undefined }));
      return;
    }
    (async () => {
      try {
        setStates(await listStates(filters.country_id!, true));
      } catch {
        setStates([]);
      }
    })();
  }, [filters.country_id]);

  useEffect(() => {
    if (!filters.state_id) {
      setCities([]);
      setFilters((f) => ({ ...f, city_id: undefined }));
      return;
    }
    (async () => {
      try {
        setCities(await listCities(filters.state_id!, true));
      } catch {
        setCities([]);
      }
    })();
  }, [filters.state_id]);

  const countryOptions = useMemo(
    () => [{ label: "All Countries", value: "" }].concat(countries.map((c) => ({ label: c.country_name, value: String(c.country_id) }))),
    [countries],
  );
  const stateOptions = useMemo(
    () => [{ label: "All States", value: "" }].concat(states.map((s) => ({ label: s.state_name, value: String(s.state_id) }))),
    [states],
  );
  const cityOptions = useMemo(
    () => [{ label: "All Cities", value: "" }].concat(cities.map((c) => ({ label: c.city_name, value: String(c.city_id) }))),
    [cities],
  );
  const categoryOptions = useMemo(
    () => [{ label: "All Categories", value: "" }].concat(categories.map((c) => ({ label: c.category_name, value: String(c.category_id) }))),
    [categories],
  );
  const statusOptions = useMemo(
    () => [
      { label: "All Status", value: "" },
      { label: "Open", value: "Open" },
      { label: "On Hold", value: "On Hold" },
      { label: "Closed", value: "Closed" },
    ],
    [],
  );

  const search = async (override?: Filters) => {
    setLoading(true);
    setError(null);
    try {
      const active = override ?? filters;
      setRows(await jobsApi.preview(active));
    } catch (e: any) {
      setError((e as ApiError)?.message ?? "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!detailOpen || !selectedJobId) return;
    (async () => {
      setDetailLoading(true);
      try {
        setDetail(await jobsApi.get(selectedJobId));
      } catch (e: any) {
        setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load job", severity: "error" });
      } finally {
        setDetailLoading(false);
      }
    })();
  }, [detailOpen, selectedJobId]);

  const loadDocs = async (application_id: number) => {
    setDocsLoading(true);
    try {
      setDocs(await candidateApi.applications.documents(application_id));
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to load documents", severity: "error" });
    } finally {
      setDocsLoading(false);
    }
  };

  const applyToJob = async () => {
    if (!selectedJobId) return;
    setApplying(true);
    try {
      const res = await candidateApi.applications.apply(selectedJobId);
      setToast({ open: true, message: "Applied successfully", severity: "success" });
      setActiveApplicationId(res.application_id);
      setDocsOpen(true);
      loadDocs(res.application_id);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Apply failed", severity: "error" });
    } finally {
      setApplying(false);
    }
  };

  const uploadForDoc = async (doc: CandidateApplicationDocRow, file: File) => {
    if (!activeApplicationId) return;
    try {
      const now = Date.now();
      const ext = fileExt(file.name);
      const objectKey = `applications/${activeApplicationId}/docs/${doc.document_type_id}/${now}${ext}`;

      const presign = await recruitmentApi.files.presignUpload(objectKey);
      const put = await fetch(presign.url, { method: "PUT", body: file });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);

      await candidateApi.applications.upsertDocument(activeApplicationId, doc.document_type_id, objectKey);
      setToast({ open: true, message: "Uploaded", severity: "success" });
      loadDocs(activeApplicationId);
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? e?.message ?? "Upload failed", severity: "error" });
    }
  };

  const openDoc = async (doc: CandidateApplicationDocRow) => {
    if (!doc.file_path) return;
    try {
      const presign = await recruitmentApi.files.presignDownload(doc.file_path);
      window.open(presign.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setToast({ open: true, message: (e as ApiError)?.message ?? "Failed to open file", severity: "error" });
    }
  };

  return (
    <Stack spacing={2.5}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Stack spacing={0.25}>
        <Typography variant="h5" fontWeight={900}>
          Jobs
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Browse open jobs and apply. Upload documents based on the job requirements.
        </Typography>
      </Stack>

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: 2 }}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(12, minmax(0, 1fr))" },
            alignItems: "end",
          }}
        >
          <Box sx={{ gridColumn: { xs: "1 / -1", sm: "auto", md: "span 2" } }}>
            <AdDropDown
              label="Country"
              options={countryOptions}
              value={filters.country_id ? String(filters.country_id) : ""}
              onChange={(v) => setFilters((f) => ({ ...f, country_id: v ? Number(v) : undefined }))}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1 / -1", sm: "auto", md: "span 2" } }}>
            <AdDropDown
              label="State"
              options={stateOptions}
              disabled={!filters.country_id}
              value={filters.state_id ? String(filters.state_id) : ""}
              onChange={(v) => setFilters((f) => ({ ...f, state_id: v ? Number(v) : undefined }))}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1 / -1", sm: "auto", md: "span 2" } }}>
            <AdDropDown
              label="City"
              options={cityOptions}
              disabled={!filters.state_id}
              value={filters.city_id ? String(filters.city_id) : ""}
              onChange={(v) => setFilters((f) => ({ ...f, city_id: v ? Number(v) : undefined }))}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1 / -1", sm: "auto", md: "span 3" } }}>
            <AdDropDown
              label="Category"
              options={categoryOptions}
              value={filters.category_id ? String(filters.category_id) : ""}
              onChange={(v) => setFilters((f) => ({ ...f, category_id: v ? Number(v) : undefined }))}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1 / -1", sm: "auto", md: "span 2" } }}>
            <AdDropDown
              label="Status"
              options={statusOptions}
              value={filters.status ?? ""}
              onChange={(v) => setFilters((f) => ({ ...f, status: v || undefined }))}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1 / -1", sm: "auto", md: "span 1" } }}>
            <AdButton fullWidth variant="contained" onClick={() => search()} disabled={loading}>
              Search
            </AdButton>
          </Box>
        </Box>
      </AdCard>

      {error ? <AdAlertBox severity="error" title="Error" message={error} /> : null}

      <Grid container spacing={2}>
        {loading ? (
          <Grid item xs={12}>
            <Typography>Loading...</Typography>
          </Grid>
        ) : null}
        {!loading && !rows.length ? (
          <Grid item xs={12}>
            <AdAlertBox severity="info" title="No jobs" message="No jobs found for the selected filters." />
          </Grid>
        ) : null}
        {rows.map((r) => (
          <Grid key={r.job_id} item xs={12} sm={6} lg={4}>
            <Card
              onClick={() => {
                setSelectedJobId(r.job_id);
                setDetailOpen(true);
              }}
              sx={{
                cursor: "pointer",
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid rgba(148, 163, 184, 0.35)",
                boxShadow: "0 10px 35px rgba(2,6,23,0.08)",
              }}
            >
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  <WorkOutlineIcon fontSize="small" />
                  <Typography fontWeight={900}>{r.job_title}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {r.category_name ?? "—"} • {r.status ?? "—"}
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                <Stack direction="row" spacing={1} alignItems="center">
                  <PlaceIcon fontSize="small" />
                  <Typography variant="body2">
                    {r.country_name ?? "Multiple locations"}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} sx={{ mt: 1.25, flexWrap: "wrap" }}>
                  <Chip size="small" label={`Vacancy: ${r.vacancy ?? 0}`} />
                  {r.salary_min || r.salary_max ? (
                    <Chip size="small" label={`Salary: ${[r.salary_min, r.salary_max].filter(Boolean).join(" - ")}`} />
                  ) : null}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <AdModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Job Details"
        subtitle={detail?.job?.job_code ? `Job Code: ${detail.job.job_code}` : undefined}
        maxWidth="lg"
      >
        {detailLoading ? <Typography>Loading...</Typography> : null}
        {!detailLoading && !detail ? <AdAlertBox severity="info" title="Select a job" message="Click a job card to view details." /> : null}

        {detail ? (
          <Stack spacing={2}>
            <Stack spacing={0.25}>
              <Typography variant="h6" fontWeight={900}>
                {detail.job.job_title}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {detail.job.status ? <Chip size="small" label={detail.job.status} /> : null}
                {detail.job.contract_duration_id ? (
                  <Chip size="small" label={detail.locations?.length ? `${detail.locations.length} location(s)` : "Locations"} />
                ) : null}
              </Stack>
            </Stack>

            {detail.job.job_description ? (
              <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.75)" }} contentSx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                  Description
                </Typography>
                <Typography>{detail.job.job_description}</Typography>
              </AdCard>
            ) : null}

            <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.75)" }} contentSx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Required Documents
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {detail.documents?.length ? (
                  detail.documents.map((d) => (
                    <Chip key={d.document_type_id} size="small" label={`${d.document_name}${d.is_required ? " • Required" : ""}`} />
                  ))
                ) : (
                  <Typography variant="body2">No documents configured.</Typography>
                )}
              </Stack>
            </AdCard>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="flex-end">
              <AdButton
                variant="contained"
                disabled={!selectedJobId || applying}
                onClick={applyToJob}
              >
                {applying ? "Applying..." : "Apply Now"}
              </AdButton>
            </Stack>
          </Stack>
        ) : null}
      </AdModal>

      <AdModal
        open={docsOpen}
        onClose={() => setDocsOpen(false)}
        title="Application Documents"
        subtitle={activeApplicationId ? `Application #${activeApplicationId}` : undefined}
        maxWidth="md"
      >
        {!activeApplicationId ? (
          <AdAlertBox severity="info" title="No application" message="Apply to a job first." />
        ) : (
          <Stack spacing={1.5}>
            {docsLoading ? <Typography>Loading...</Typography> : null}
            {!docsLoading && !docs.length ? (
              <AdAlertBox severity="warning" title="No required docs" message="No job documents found for this application." />
            ) : null}

            {docs.map((d) => (
              <AdCard key={d.document_type_id} animate={false} contentSx={{ p: 1.75 }} sx={{ backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 3 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }} justifyContent="space-between">
                  <Stack spacing={0.25}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontWeight={900}>{d.document_name}</Typography>
                      {Number(d.job_is_required) ? <Chip size="small" label="Required" color="primary" /> : <Chip size="small" label="Optional" />}
                      {d.file_path ? <Chip size="small" label="Uploaded" color="success" /> : <Chip size="small" label="Pending" />}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {d.uploaded_at ? `Uploaded at: ${d.uploaded_at}` : "Not uploaded yet"}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    {d.file_path ? (
                      <AdButton variant="text" startIcon={<OpenInNewIcon fontSize="small" />} onClick={() => openDoc(d)}>
                        View
                      </AdButton>
                    ) : null}

                    <AdButton component="label" startIcon={<UploadFileIcon fontSize="small" />}>
                      {d.file_path ? "Update" : "Upload"}
                      <input
                        type="file"
                        hidden
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadForDoc(d, f);
                          e.currentTarget.value = "";
                        }}
                      />
                    </AdButton>
                  </Stack>
                </Stack>
              </AdCard>
            ))}
          </Stack>
        )}
      </AdModal>
    </Stack>
  );
}

