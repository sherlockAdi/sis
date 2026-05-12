import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  Chip,
  Container,
  Divider,
  FormControlLabel,
  FormGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { listPublicCountries, type Country } from "../../../common/services/locationApi";
import { jobsApi, type JobListRow } from "../../../common/services/jobsApi";
import { getAuthToken } from "../../../common/services/tokenStorage";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function moneyRange(min: string | null, max: string | null) {
  const a = String(min ?? "").trim();
  const b = String(max ?? "").trim();
  if (!a && !b) return null;
  if (a && b) return `${a} - ${b}`;
  return a || b;
}

function normalize(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function uniqueValues(rows: JobListRow[], getter: (row: JobListRow) => string | null | undefined) {
  const seen = new Map<string, string>();
  rows.forEach((row) => {
    const raw = String(getter(row) ?? "").trim();
    if (!raw) return;
    const key = raw.toLowerCase();
    if (!seen.has(key)) seen.set(key, raw);
  });
  return Array.from(seen.entries()).map(([value, label]) => ({ value, label }));
}

export default function PublicJobsPage() {
  const navigate = useNavigate();
  const query = useQuery();
  const [keyword, setKeyword] = useState(() => String(query.get("keyword") ?? ""));
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [rows, setRows] = useState<JobListRow[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState<string[]>([]);
  const [selectedWorkModes, setSelectedWorkModes] = useState<string[]>([]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const token = getAuthToken();

  const goApply = (job_id: number) => {
    const target = `/portal/candidate/jobs/${job_id}/apply`;
    if (token) navigate(target);
    else navigate("/register", { state: { from: target } });
  };

  const featuredCountries = useMemo(
    () => [
      { label: "UAE", code: "uae" },
      { label: "Saudi", code: "saudi" },
      { label: "Qatar", code: "qatar" },
      { label: "Kuwait", code: "kuwait" },
      { label: "Oman", code: "oman" },
    ],
    [],
  );

  const categoryOptions = useMemo(() => uniqueValues(rows, (r) => r.category_name), [rows]);
  const employmentTypeOptions = useMemo(() => uniqueValues(rows, (r) => r.employment_type_name), [rows]);
  const workModeOptions = useMemo(() => uniqueValues(rows, (r) => r.work_mode_name), [rows]);
  const durationOptions = useMemo(() => uniqueValues(rows, (r) => r.duration_name), [rows]);
  const statusOptions = useMemo(() => uniqueValues(rows, (r) => r.status), [rows]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listPublicCountries();
        if (!cancelled) setCountries(data);
      } catch {
        // optional; page still works with quick country chips
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const runSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: JobListRow[] | null = null;
      try {
        data = await jobsApi.preview(
          { country_id: selectedCountryId ?? undefined, status: "Open" },
          { auth: false },
        );
      } catch (e) {
        // If public jobs API isn't deployed yet, fall back to the secured endpoint when a token exists.
        if (getAuthToken()) {
          data = await jobsApi.preview({ country_id: selectedCountryId ?? undefined, status: "Open" });
        } else {
          throw e;
        }
      }
      setRows(data ?? []);
    } catch (e: any) {
      setRows([]);
      setError(e?.message ? String(e.message) : "Unable to load jobs right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return rows.filter((r) => {
      if (k && ![r.job_title, r.category_name, r.country_name, r.partner_name, r.work_mode_name, r.employment_type_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(k))) {
        return false;
      }
      if (selectedCountryId != null && r.country_id !== selectedCountryId) return false;
      if (selectedCategories.length && !selectedCategories.includes(normalize(r.category_name))) return false;
      if (selectedEmploymentTypes.length && !selectedEmploymentTypes.includes(normalize(r.employment_type_name))) return false;
      if (selectedWorkModes.length && !selectedWorkModes.includes(normalize(r.work_mode_name))) return false;
      if (selectedDurations.length && !selectedDurations.includes(normalize(r.duration_name))) return false;
      if (selectedStatuses.length && !selectedStatuses.includes(normalize(r.status))) return false;
      return true;
    });
  }, [rows, keyword, selectedCountryId, selectedCategories, selectedEmploymentTypes, selectedWorkModes, selectedDurations, selectedStatuses]);

  const toggleValue = (value: string, list: string[], setList: (next: string[]) => void) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f6f7fb", py: { xs: 3, md: 4 } }}>
      <Container maxWidth="xl">
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h3" fontWeight={950} sx={{ letterSpacing: -0.9 }}>
              Jobs
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", maxWidth: 860 }}>
              Search and discover jobs first. Then register to continue in the Candidate Portal.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "280px 1fr" },
              gap: 2,
              alignItems: "start",
            }}
          >
            <Box
              sx={{
                bgcolor: "#fff",
                border: "1px solid rgba(15,23,42,0.08)",
                borderRadius: 3,
                p: 2,
                position: "sticky",
                top: 16,
              }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" fontWeight={900}>
                    Refine Search
                  </Typography>
                </Box>

                <TextField
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Keyword / Role"
                  fullWidth
                  size="small"
                />

                <Box>
                  <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1 }}>
                    Country
                  </Typography>
                  <TextField
                    select
                    SelectProps={{ native: true }}
                    value={selectedCountryId ?? ""}
                    onChange={(e) => setSelectedCountryId(e.target.value ? Number(e.target.value) : null)}
                    fullWidth
                    size="small"
                  >
                    <option value="">All Countries</option>
                    {countries.map((c) => (
                      <option key={c.country_id} value={c.country_id}>
                        {c.country_name}
                      </option>
                    ))}
                  </TextField>
                  <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                    {featuredCountries.map((c) => (
                      <Chip
                        key={c.code}
                        label={c.label}
                        component={RouterLink}
                        to={`/jobs/country/${c.code}`}
                        clickable
                        size="small"
                        sx={{ fontWeight: 800 }}
                      />
                    ))}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1 }}>
                    Category
                  </Typography>
                  <FormGroup sx={{ gap: 0.25 }}>
                    {categoryOptions.slice(0, 6).map((opt) => (
                      <FormControlLabel
                        key={opt.value}
                        control={
                          <Checkbox
                            size="small"
                            checked={selectedCategories.includes(opt.value)}
                            onChange={() => toggleValue(opt.value, selectedCategories, setSelectedCategories)}
                          />
                        }
                        label={opt.label}
                      />
                    ))}
                  </FormGroup>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1 }}>
                    Employment Type
                  </Typography>
                  <FormGroup sx={{ gap: 0.25 }}>
                    {employmentTypeOptions.slice(0, 6).map((opt) => (
                      <FormControlLabel
                        key={opt.value}
                        control={
                          <Checkbox
                            size="small"
                            checked={selectedEmploymentTypes.includes(opt.value)}
                            onChange={() => toggleValue(opt.value, selectedEmploymentTypes, setSelectedEmploymentTypes)}
                          />
                        }
                        label={opt.label}
                      />
                    ))}
                  </FormGroup>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1 }}>
                    Work Mode
                  </Typography>
                  <FormGroup sx={{ gap: 0.25 }}>
                    {workModeOptions.slice(0, 6).map((opt) => (
                      <FormControlLabel
                        key={opt.value}
                        control={
                          <Checkbox
                            size="small"
                            checked={selectedWorkModes.includes(opt.value)}
                            onChange={() => toggleValue(opt.value, selectedWorkModes, setSelectedWorkModes)}
                          />
                        }
                        label={opt.label}
                      />
                    ))}
                  </FormGroup>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1 }}>
                    Duration
                  </Typography>
                  <FormGroup sx={{ gap: 0.25 }}>
                    {durationOptions.slice(0, 6).map((opt) => (
                      <FormControlLabel
                        key={opt.value}
                        control={
                          <Checkbox
                            size="small"
                            checked={selectedDurations.includes(opt.value)}
                            onChange={() => toggleValue(opt.value, selectedDurations, setSelectedDurations)}
                          />
                        }
                        label={opt.label}
                      />
                    ))}
                  </FormGroup>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1 }}>
                    Status
                  </Typography>
                  <FormGroup sx={{ gap: 0.25 }}>
                    {statusOptions.slice(0, 6).map((opt) => (
                      <FormControlLabel
                        key={opt.value}
                        control={
                          <Checkbox
                            size="small"
                            checked={selectedStatuses.includes(opt.value)}
                            onChange={() => toggleValue(opt.value, selectedStatuses, setSelectedStatuses)}
                          />
                        }
                        label={opt.label}
                      />
                    ))}
                  </FormGroup>
                </Box>

                <Button
                  variant="outlined"
                  onClick={() => {
                    setKeyword("");
                    setSelectedCountryId(null);
                    setSelectedCategories([]);
                    setSelectedEmploymentTypes([]);
                    setSelectedWorkModes([]);
                    setSelectedDurations([]);
                    setSelectedStatuses([]);
                  }}
                  sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
                >
                  Clear Filters
                </Button>
              </Stack>
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ p: 2.5, bgcolor: "white", borderRadius: 3, border: "1px solid rgba(15,23,42,0.08)" }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems="stretch">
                  <TextField
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Keyword / Role"
                    fullWidth
                    size="small"
                  />
                  <Button
                    variant="contained"
                    startIcon={<SearchIcon />}
                    onClick={runSearch}
                    disabled={loading}
                    sx={{ borderRadius: 2, minWidth: 140, fontWeight: 900 }}
                  >
                    {loading ? "Searching..." : "Search"}
                  </Button>
                </Stack>
              </Box>

              {error ? <Alert severity="warning" sx={{ mt: 2 }}>{error}</Alert> : null}

              <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
                  Listings
                </Typography>
                <Button
                  variant="outlined"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => (token ? navigate("/portal/candidate/jobs") : navigate("/register"))}
                  sx={{ textTransform: "none", fontWeight: 950, borderRadius: 999 }}
                >
                  {token ? "Go to Candidate Portal" : "Register to Apply"}
                </Button>
              </Box>

              <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                {filteredRows.length ? (
                  filteredRows.map((r) => (
                    <Card key={r.job_id} variant="outlined" sx={{ borderRadius: 3 }}>
                      <CardActionArea onClick={() => navigate(`/jobs/${r.job_id}`)}>
                        <CardContent>
                          <Typography fontWeight={950}>{r.job_title}</Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
                            {(r.country_name ?? "Country") + (r.category_name ? ` • ${r.category_name}` : "")}
                          </Typography>
                          <Box sx={{ mt: 1.25, display: "flex", flexWrap: "wrap", gap: 1 }}>
                            {r.vacancy != null ? <Chip size="small" label={`${r.vacancy} vacancies`} /> : null}
                            {moneyRange(r.salary_min, r.salary_max) ? (
                              <Chip size="small" label={`Salary: ${moneyRange(r.salary_min, r.salary_max)}`} />
                            ) : null}
                            {r.duration_name ? <Chip size="small" label={r.duration_name} /> : null}
                          </Box>

                          <Box sx={{ mt: 1.75, display: "flex", justifyContent: "flex-end" }}>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                goApply(r.job_id);
                              }}
                              sx={{ borderRadius: 999, fontWeight: 950, textTransform: "none" }}
                            >
                              Apply
                            </Button>
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  ))
                ) : (
                  <Box sx={{ gridColumn: "1 / -1", p: 3, bgcolor: "white", borderRadius: 3, border: "1px solid rgba(15,23,42,0.08)" }}>
                    <Typography fontWeight={950}>No jobs yet</Typography>
                    <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary" }}>
                      Try a different filter, or check back shortly.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
