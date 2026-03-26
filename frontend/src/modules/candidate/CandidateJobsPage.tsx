import { useEffect, useMemo, useState } from "react";
import { Box, Card, CardContent, Chip, Divider, Grid, Stack, Typography } from "@mui/material";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import PlaceIcon from "@mui/icons-material/Place";
import { useNavigate } from "react-router-dom";
import { AdAlertBox, AdButton, AdCard, AdDropDown, AdNotification } from "../../common/ad";
import type { ApiError } from "../../common/services/apiFetch";
import { jobsApi, type JobListRow } from "../../common/services/jobsApi";
import { mastersApi, type JobCategory } from "../../common/services/mastersApi";
import { listCities, listCountries, listStates, type CityRow, type Country, type StateRow } from "../../common/services/locationApi";
import { candidateApi } from "../../common/services/candidateApi";

type Filters = {
  country_id?: number;
  state_id?: number;
  city_id?: number;
  category_id?: number;
  status?: string;
};

export default function CandidateJobsPage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: any }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [rows, setRows] = useState<JobListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appByJobId, setAppByJobId] = useState<Record<number, { application_id: number; status: string | null }>>({});

  const [filters, setFilters] = useState<Filters>({ status: "Open" });
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);

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
    let cancelled = false;
    (async () => {
      try {
        const apps = await candidateApi.applications.list();
        if (cancelled) return;
        const m: Record<number, { application_id: number; status: string | null }> = {};
        for (const a of apps) {
          if (!a?.job_id || !a?.application_id) continue;
          if (m[a.job_id] == null) m[a.job_id] = { application_id: a.application_id, status: a.status ?? null }; // keep latest per job
        }
        setAppByJobId(m);
      } catch (e: any) {
        // Not fatal; page still works, but we can't label jobs as applied/in-progress.
        setToast({ open: true, message: e?.message ? String(e.message) : "Unable to load application status.", severity: "warning" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
            {/*
              This list doesn't include application status, so we cross-check the candidate's applications list
              and mark jobs that already have an "Applied" application.
            */}
            {(() => {
              const app = appByJobId[r.job_id];
              const status = String(app?.status ?? "").trim();
              const statusKey = status.toLowerCase();
              const hasApp = Boolean(app?.application_id);
              const isApplied = hasApp && statusKey === "applied";

              const go = () => {
                if (isApplied) return navigate(`/portal/candidate/applications/${app!.application_id}`);
                return navigate(`/portal/candidate/jobs/${r.job_id}/apply`);
              };

              const chip =
                isApplied ? <Chip size="small" label="Applied" color="success" /> :
                hasApp ? <Chip size="small" label={status ? `In progress: ${status}` : "In progress"} /> :
                null;

              const btnLabel =
                isApplied ? "View Application" :
                hasApp ? "Continue" :
                "View & Apply";

              return (
            <Card
              onClick={go}
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
                  {r.category_name ?? "—"} • {r.status ? `Job: ${r.status}` : "Job: —"}
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
                  {chip}
                </Stack>

                <Box sx={{ mt: 1.75, display: "flex", justifyContent: "flex-end" }}>
                  <AdButton
                    variant={isApplied ? "secondary" : "primary"}
                    size="small"
                    onClick={(e: any) => {
                      e.preventDefault();
                      e.stopPropagation();
                      go();
                    }}
                  >
                    {btnLabel}
                  </AdButton>
                </Box>
              </CardContent>
            </Card>
              );
            })()}
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
