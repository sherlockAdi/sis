import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Card, CardActionArea, CardContent, Chip, Container, Divider, Stack, TextField, Typography } from "@mui/material";
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

export default function PublicJobsPage() {
  const navigate = useNavigate();
  const query = useQuery();
  const [keyword, setKeyword] = useState(() => String(query.get("keyword") ?? ""));
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [rows, setRows] = useState<JobListRow[]>([]);
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
      // keyword filtering client-side (API may not support it yet)
      const k = keyword.trim().toLowerCase();
      const filtered = k && data
        ? data.filter((r) => r.job_title.toLowerCase().includes(k) || String(r.category_name ?? "").toLowerCase().includes(k))
        : (data ?? []);
      setRows(filtered);
    } catch (e: any) {
      setRows([]);
      setError(e?.message ? String(e.message) : "Unable to load jobs right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // auto-run on first render (default: all countries)
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h3" fontWeight={950} sx={{ letterSpacing: -0.9 }}>
            Jobs
          </Typography>
          <Typography sx={{ mt: 1, color: "text.secondary", maxWidth: 860 }}>
            Search and discover jobs first. Then register to continue in the Candidate Portal.
          </Typography>
        </Box>

        <Box sx={{ p: 2.5, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems="stretch">
            <TextField
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Keyword / Role"
              fullWidth
            />
            <TextField
              select
              SelectProps={{ native: true }}
              value={selectedCountryId ?? ""}
              onChange={(e) => setSelectedCountryId(e.target.value ? Number(e.target.value) : null)}
              sx={{ minWidth: { xs: "100%", md: 260 } }}
              label="Country"
            >
              <option value="">All Countries</option>
              {countries.map((c) => (
                <option key={c.country_id} value={c.country_id}>
                  {c.country_name}
                </option>
              ))}
            </TextField>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={runSearch}
              disabled={loading}
              sx={{ borderRadius: 3 }}
            >
              {loading ? "Searching..." : "Search"}
            </Button>
          </Stack>

          <Box sx={{ mt: 1.5, display: "flex", flexWrap: "wrap", gap: 1 }}>
            {featuredCountries.map((c) => (
              <Chip
                key={c.code}
                label={`Jobs in ${c.label}`}
                component={RouterLink}
                to={`/jobs/country/${c.code}`}
                clickable
                sx={{ fontWeight: 900 }}
              />
            ))}
          </Box>
        </Box>

        {error ? <Alert severity="warning">{error}</Alert> : null}

        <Divider />

        <Box>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
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
          </Stack>

          <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            {rows.length ? (
              rows.map((r) => (
                <Card key={r.job_id} variant="outlined" sx={{ borderRadius: 4 }}>
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
              <Box sx={{ gridColumn: "1 / -1", p: 3, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
                <Typography fontWeight={950}>No jobs yet</Typography>
                <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary" }}>
                  Try a different filter, or check back shortly.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Stack>
    </Container>
  );
}
