import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Card, CardActionArea, CardContent, Container, Divider, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { listPublicCountries, type Country } from "../../../common/services/locationApi";
import { jobsApi, type JobListRow } from "../../../common/services/jobsApi";
import { getAuthToken } from "../../../common/services/tokenStorage";

function normalizeCountryCode(code?: string) {
  const c = String(code ?? "").trim().toLowerCase();
  return c;
}

export default function PublicJobsByCountryPage() {
  const navigate = useNavigate();
  const { countryCode } = useParams();
  const norm = normalizeCountryCode(countryCode);

  const [countries, setCountries] = useState<Country[]>([]);
  const [rows, setRows] = useState<JobListRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => {
    if (!norm) return "Jobs by Country";
    return `Jobs in ${norm.toUpperCase()}`;
  }, [norm]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listPublicCountries();
        if (!cancelled) setCountries(data);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const countryId = useMemo(() => {
    if (!norm) return null;
    const byCode = countries.find((c) => String(c.country_code ?? "").trim().toLowerCase() === norm);
    if (byCode) return byCode.country_id;
    const byIso = countries.find((c) => String(c.iso_code ?? "").trim().toLowerCase() === norm);
    if (byIso) return byIso.country_id;
    const byName = countries.find((c) => c.country_name.trim().toLowerCase() === norm);
    if (byName) return byName.country_id;
    return null;
  }, [countries, norm]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!norm) return;
      setLoading(true);
      setError(null);
      try {
        let data: JobListRow[] | null = null;
        try {
          data = await jobsApi.preview(
            { country_id: countryId ?? undefined, status: "Open" },
            { auth: false },
          );
        } catch (e) {
          if (getAuthToken()) {
            data = await jobsApi.preview({ country_id: countryId ?? undefined, status: "Open" });
          } else {
            throw e;
          }
        }
        if (!cancelled) setRows(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ? String(e.message) : "Unable to load jobs right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [countryId, norm]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={2.5}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/jobs")} sx={{ textTransform: "none", fontWeight: 900 }}>
            Back to Jobs
          </Button>
          <Button variant="outlined" onClick={() => navigate("/register")} sx={{ textTransform: "none", fontWeight: 950, borderRadius: 999 }}>
            Register
          </Button>
        </Stack>

        <Box>
          <Typography variant="h3" fontWeight={950} sx={{ letterSpacing: -0.9 }}>
            {title}
          </Typography>
          <Typography sx={{ mt: 1, color: "text.secondary", maxWidth: 860 }}>
            Country-wise listing designed for fast discovery.
          </Typography>
        </Box>

        {loading ? <Alert severity="info">Loading jobs...</Alert> : null}
        {error ? <Alert severity="warning">{error}</Alert> : null}

        <Divider />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          {rows.length ? (
            rows.map((r) => (
              <Card key={r.job_id} variant="outlined" sx={{ borderRadius: 4 }}>
                <CardActionArea onClick={() => navigate(`/jobs/${r.job_id}`)}>
                  <CardContent>
                    <Typography fontWeight={950}>{r.job_title}</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
                      {(r.country_name ?? "Country") + (r.category_name ? ` • ${r.category_name}` : "")}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))
          ) : (
            <Box sx={{ gridColumn: "1 / -1", p: 3, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
              <Typography fontWeight={950}>No jobs found</Typography>
              <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary" }}>
                Try another country, or check back shortly.
              </Typography>
            </Box>
          )}
        </Box>
      </Stack>
    </Container>
  );
}
