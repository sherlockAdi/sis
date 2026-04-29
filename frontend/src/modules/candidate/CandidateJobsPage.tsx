import { useEffect, useMemo, useState } from "react";
import { Box, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";
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

type CandidateProfile = Awaited<ReturnType<typeof candidateApi.profile.me>>;

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
  const [profile, setProfile] = useState<CandidateProfile | null>(null);

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

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const row = await candidateApi.profile.me();
        if (alive) setProfile(row);
      } catch {
        if (alive) setProfile(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const profileComplete = Boolean(profile?.profile_complete) && (profile?.missing_fields?.length ?? 0) === 0;

  return (
    <Stack spacing={2}>
      <AdNotification open={toast.open} message={toast.message} severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <Card
        variant="outlined"
        sx={{
          borderRadius: 0,
          borderColor: "rgba(148, 163, 184, 0.42)",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
          background:
            "linear-gradient(135deg, rgba(238,242,255,0.98) 0%, rgba(255,255,255,0.98) 55%, rgba(236,248,255,0.98) 100%)",
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 2.25 } }}>
          <Stack spacing={1.25}>
            <Stack spacing={0.4}>
              <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
                My Jobs
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720, lineHeight: 1.7 }}>
                Browse the current openings, compare cards quickly, and open the one that matches your profile.
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <AdCard animate={false} sx={{ backgroundColor: "rgba(255,255,255,0.72)" }} contentSx={{ p: { xs: 1.5, md: 2 } }}>
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" },
            alignItems: "end",
          }}
        >
          <Box sx={{ gridColumn: { xs: "1 / -1", lg: "span 1" } }}>
            <AdDropDown
              label="Country"
              options={countryOptions}
              value={filters.country_id ? String(filters.country_id) : ""}
              onChange={(v) => setFilters((f) => ({ ...f, country_id: v ? Number(v) : undefined }))}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1 / -1", lg: "span 1" } }}>
            <AdDropDown
              label="State"
              options={stateOptions}
              disabled={!filters.country_id}
              value={filters.state_id ? String(filters.state_id) : ""}
              onChange={(v) => setFilters((f) => ({ ...f, state_id: v ? Number(v) : undefined }))}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1 / -1", lg: "span 1" } }}>
            <AdDropDown
              label="City"
              options={cityOptions}
              disabled={!filters.state_id}
              value={filters.city_id ? String(filters.city_id) : ""}
              onChange={(v) => setFilters((f) => ({ ...f, city_id: v ? Number(v) : undefined }))}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1 / -1", lg: "span 1" } }}>
            <AdDropDown
              label="Category"
              options={categoryOptions}
              value={filters.category_id ? String(filters.category_id) : ""}
              onChange={(v) => setFilters((f) => ({ ...f, category_id: v ? Number(v) : undefined }))}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1 / -1", lg: "span 1" } }}>
            <AdDropDown
              label="Status"
              options={statusOptions}
              value={filters.status ?? ""}
              onChange={(v) => setFilters((f) => ({ ...f, status: v || undefined }))}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1 / -1", lg: "span 1" } }}>
            <AdButton fullWidth variant="contained" onClick={() => search()} disabled={loading}>
              Search
            </AdButton>
          </Box>
        </Box>
      </AdCard>

      {!profileComplete ? (
        <AdAlertBox
          severity="warning"
          title="Complete your profile before applying"
          message={`Missing fields: ${(profile?.missing_fields ?? []).join(", ") || "profile details and uploads"}.`}
        />
      ) : null}

      {error ? <AdAlertBox severity="error" title="Error" message={error} /> : null}

      <Typography variant="subtitle1" fontWeight={900} sx={{ mt: 0.5 }}>
        Browse Openings
      </Typography>

      <Box
        sx={{
          display: "grid",
          gap: 0.5,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
          },
          alignItems: "stretch",
        }}
      >
        {loading ? (
          <Box sx={{ gridColumn: "1 / -1" }}>
            <Typography>Loading...</Typography>
          </Box>
        ) : null}
        {!loading && !rows.length ? (
          <Box sx={{ gridColumn: "1 / -1" }}>
            <AdAlertBox severity="info" title="No jobs" message="No jobs found for the selected filters." />
          </Box>
        ) : null}
        {rows.map((r) => (
          <Box key={r.job_id} sx={{ display: "flex", minWidth: 0, width: "100%" }}>
            {(() => {
              const app = appByJobId[r.job_id];
              const status = String(app?.status ?? "").trim();
              const statusKey = status.toLowerCase();
              const hasApp = Boolean(app?.application_id);
              const isApplied = hasApp && statusKey === "applied";

              const go = () => {
                if (!profileComplete) return navigate("/portal/candidate/profile/settings");
                if (isApplied) return navigate(`/portal/candidate/applications/${app!.application_id}`);
                return navigate(`/portal/candidate/jobs/${r.job_id}/apply`);
              };

              const btnLabel = !profileComplete ? "Complete Profile" : isApplied ? "View Application" : hasApp ? "Continue" : "View & Apply";
              const statusLabel = !profileComplete
                ? "Profile incomplete"
                : isApplied
                  ? "Applied"
                  : hasApp
                    ? status
                      ? `In progress: ${status}`
                      : "In progress"
                    : "";

              return (
                <Card
                  onClick={go}
                  sx={{
                    cursor: "pointer",
                    borderRadius: 0,
                    height: "100%",
                    width: "100%",
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    borderLeft: "1px solid rgba(15, 23, 42, 0.45)",
                    borderBottom: "1px solid rgba(15, 23, 42, 0.45)",
                    borderTop: 0,
                    borderRight: 0,
                    boxShadow: "none",
                  }}
                >
                  <CardContent sx={{ p: 1.5, display: "flex", flexDirection: "column", flex: 1 }}>
                    <Stack spacing={0.9} sx={{ flex: 1 }}>
                      <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1, minHeight: 64 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="flex-start">
                            <WorkOutlineIcon fontSize="small" sx={{ mt: 0.2, flexShrink: 0 }} />
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography
                                fontWeight={900}
                                sx={{
                                  lineHeight: 1.15,
                                  display: "-webkit-box",
                                  WebkitBoxOrient: "vertical",
                                  WebkitLineClamp: 2,
                                  overflow: "hidden",
                                  minWidth: 0,
                                  wordBreak: "break-word",
                                }}
                              >
                                {r.job_title}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  mt: 0.5,
                                  display: "-webkit-box",
                                  WebkitBoxOrient: "vertical",
                                  WebkitLineClamp: 1,
                                  overflow: "hidden",
                                  minWidth: 0,
                                }}
                              >
                                {r.category_name ?? "—"} • {r.status ? `Job: ${r.status}` : "Job: —"}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 0.25 }} />

                      <Stack direction="row" spacing={1} alignItems="center">
                        <PlaceIcon fontSize="small" />
                        <Typography
                          variant="body2"
                          sx={{
                            lineHeight: 1.3,
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 1,
                            overflow: "hidden",
                            minWidth: 0,
                          }}
                        >
                          {r.country_name ?? "Multiple locations"}
                        </Typography>
                      </Stack>

                      <Stack spacing={0.15} sx={{ pt: 0.25 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                          Vacancy: {r.vacancy ?? 0}
                        </Typography>
                        {r.salary_min || r.salary_max ? (
                          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                            Salary: {[r.salary_min, r.salary_max].filter(Boolean).join(" - ")}
                          </Typography>
                        ) : null}
                      </Stack>
                    </Stack>

                    <Box sx={{ pt: 1.25, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, minWidth: 0 }}>
                        {statusLabel}
                      </Typography>
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
          </Box>
        ))}
      </Box>
    </Stack>
  );
}
