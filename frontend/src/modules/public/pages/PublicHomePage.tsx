import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SearchIcon from "@mui/icons-material/Search";
import VerifiedIcon from "@mui/icons-material/Verified";
import PublicIcon from "@mui/icons-material/Public";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import { PORTAL_BASE } from "../../../common/paths";
import { jobsApi, type JobListRow } from "../../../common/services/jobsApi";

export default function PublicHomePage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [featured, setFeatured] = useState<Array<{ country: string; items: JobListRow[] }>>([]);

  const quickCountries = useMemo(
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
        const rows = await jobsApi.preview({ status: "Open" }, { auth: false });
        if (cancelled) return;
        const byCountry = new Map<string, JobListRow[]>();
        for (const r of rows) {
          const key = String(r.country_name ?? "Other").trim() || "Other";
          if (!byCountry.has(key)) byCountry.set(key, []);
          byCountry.get(key)!.push(r);
        }
        const grouped = Array.from(byCountry.entries())
          .map(([country, items]) => ({ country, items: items.slice(0, 4) }))
          .slice(0, 6);
        setFeatured(grouped);
      } catch {
        setFeatured([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Box>
      <Box
        sx={{
          bgcolor: "background.paper",
          borderBottom: "1px solid rgba(15,23,42,0.08)",
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" }, gap: 3, alignItems: "center" }}>
            <Stack spacing={2.25}>
              <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: 1.2 }}>
                Overseas Jobs • Employer Trust • Portal Handoff
              </Typography>
              <Typography variant="h2" fontWeight={950} sx={{ letterSpacing: -1.2, fontSize: { xs: 38, md: 64 } }}>
                Your Gateway to{" "}
                <Box component="span" sx={{ color: "primary.main" }}>
                  Global Careers
                </Box>
              </Typography>
              <Typography sx={{ color: "text.secondary", maxWidth: 720, lineHeight: 1.9 }}>
                Naukri-style job discovery + Gulf portal speed + corporate trust signals. Users land, discover jobs, and then move into the
                right portal: Candidate / Partner / Customer / Admin.
              </Typography>

              <Box
                sx={{
                  p: { xs: 2, md: 2.5 },
                  borderRadius: 4,
                  bgcolor: "#f6f6f8",
                  border: "1px solid rgba(15,23,42,0.10)",
                }}
              >
                <Typography fontWeight={950} sx={{ mb: 1 }}>
                  Search jobs
                </Typography>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems="stretch">
                  <TextField
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Keyword / Role / Skill"
                    fullWidth
                    InputProps={{ sx: { bgcolor: "white", borderRadius: 3 } }}
                  />
                  <Button
                    size="large"
                    variant="contained"
                    startIcon={<SearchIcon />}
                    onClick={() => navigate(`/jobs?keyword=${encodeURIComponent(keyword)}`)}
                    sx={{ bgcolor: "primary.main", "&:hover": { bgcolor: "primary.dark" }, borderRadius: 3, px: 3 }}
                  >
                    Search
                  </Button>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
                  {quickCountries.map((c) => (
                    <Chip
                      key={c.code}
                      label={c.label}
                      onClick={() => navigate(`/jobs/country/${c.code}`)}
                      sx={{ bgcolor: "white", border: "1px solid rgba(15,23,42,0.10)" }}
                    />
                  ))}
                </Stack>
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                <Button
                  size="large"
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate("/jobs")}
                  sx={{ bgcolor: "primary.main", color: "primary.contrastText", px: 3, "&:hover": { bgcolor: "primary.dark" } }}
                >
                  Apply Now
                </Button>
                <Button size="large" variant="outlined" onClick={() => navigate("/register")} sx={{ px: 3 }}>
                  Register Free
                </Button>
                <Button size="large" variant="text" onClick={() => navigate(`${PORTAL_BASE}/login`)} sx={{ fontWeight: 900 }}>
                  Portal Login
                </Button>
              </Stack>
            </Stack>

            <Box
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid rgba(15,23,42,0.10)",
                boxShadow: "0 20px 60px rgba(17,24,39,0.18)",
              }}
            >
              <Box
                component="img"
                alt="Workforce collage"
                src="/home/hero-collage.svg"
                sx={{ width: "100%", height: { xs: 240, md: 420 }, objectFit: "cover", display: "block" }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h4" fontWeight={950} sx={{ letterSpacing: -0.6 }}>
              Featured Jobs (Country-wise)
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", maxWidth: 860 }}>
              Quick discovery by destination. Click a job to view details.
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            {(featured.length ? featured : [{ country: "Jobs", items: [] }]).map((g) => (
              <Card key={g.country} variant="outlined" sx={{ borderRadius: 4 }}>
                <CardContent>
                  <Typography fontWeight={950}>{g.country}</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
                    Top roles updated recently
                  </Typography>
                </CardContent>
                <Divider />
                {g.items.length ? (
                  g.items.map((r) => (
                    <CardActionArea key={r.job_id} onClick={() => navigate(`/jobs/${r.job_id}`)}>
                      <Box sx={{ px: 2.5, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                        <Box>
                          <Typography fontWeight={900}>{r.job_title}</Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {r.category_name ?? "Role"} • {r.duration_name ?? "Contract"}
                          </Typography>
                        </Box>
                        <Chip size="small" label={r.vacancy != null ? `${r.vacancy} vacancies` : "View"} />
                      </Box>
                    </CardActionArea>
                  ))
                ) : (
                  <Box sx={{ px: 2.5, py: 2 }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      No featured jobs yet. Browse all jobs to explore.
                    </Typography>
                    <Button sx={{ mt: 1 }} variant="contained" onClick={() => navigate("/jobs")}>
                      Browse Jobs
                    </Button>
                  </Box>
                )}
              </Card>
            ))}
          </Box>

          <Box>
            <Typography variant="h4" fontWeight={950} sx={{ letterSpacing: -0.6 }}>
              Why Choose SIS Global
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", maxWidth: 860 }}>
              Naukri-style job discovery + Gulf portal efficiency + corporate trust signals — designed for conversion, not content.
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            {[
              { t: "Fast Apply & Register", d: "Short forms and clear CTAs that take users to the right portal." },
              { t: "Country Coverage", d: "UAE, Saudi, Qatar and more — browse country pages instantly." },
              { t: "Clear Process", d: "Apply → Screening → Interview → Visa → Deployment." },
              { t: "Partner & Employer Zones", d: "Separate pages for employers and sourcing partners to build trust." },
            ].map((s) => (
              <Box key={s.t} sx={{ p: 2.5, borderRadius: 4, bgcolor: "white", border: "1px solid rgba(15,23,42,0.08)" }}>
                <Typography fontWeight={950}>{s.t}</Typography>
                <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary" }}>
                  {s.d}
                </Typography>
              </Box>
            ))}
          </Box>

          <Divider />

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            <Box
              sx={{
                p: { xs: 2.5, md: 3 },
                bgcolor: "white",
                borderRadius: 4,
                border: "1px solid rgba(15,23,42,0.08)",
              }}
            >
              <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
                Process Flow (How it works)
              </Typography>
              <Stack spacing={1} sx={{ mt: 2 }}>
                {[
                  "1) Discover jobs by country or role",
                  "2) Apply / Register (quick CTA)",
                  "3) Screening & shortlisting",
                  "4) Interview coordination",
                  "5) Documentation & visa process",
                  "6) Deployment & tracking",
                ].map((x) => (
                  <Typography key={x} sx={{ color: "text.secondary", lineHeight: 1.9 }}>
                    {x}
                  </Typography>
                ))}
              </Stack>
            </Box>

            <Box
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid rgba(15,23,42,0.10)",
                boxShadow: "0 16px 50px rgba(17,24,39,0.10)",
              }}
            >
              <Box component="img" alt="Workforce" src="/home/workforce-1.svg" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            <Box
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid rgba(15,23,42,0.10)",
                boxShadow: "0 16px 50px rgba(17,24,39,0.10)",
              }}
            >
              <Box component="img" alt="Workforce" src="/home/workforce-2.svg" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </Box>
            <Box
              sx={{
                p: { xs: 2.5, md: 3 },
                bgcolor: "white",
                borderRadius: 4,
                border: "1px solid rgba(15,23,42,0.08)",
              }}
            >
              <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
                Employer Trust + Candidate Benefits
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
                {[
                  { icon: <VerifiedIcon />, title: "Trust", body: "Documents, approvals, and status history." },
                  { icon: <PublicIcon />, title: "Discovery", body: "Country-wise jobs and fast filtering." },
                  { icon: <SupportAgentIcon />, title: "Support", body: "Guided steps and clear CTAs." },
                ].map((c) => (
                  <Box
                    key={c.title}
                    sx={{
                      flex: 1,
                      p: 2,
                      borderRadius: 3,
                      bgcolor: "#f6f6f8",
                      border: "1px solid rgba(15,23,42,0.08)",
                    }}
                  >
                    <Box sx={{ display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 2, bgcolor: "rgba(198,40,40,0.10)", color: "primary.main" }}>
                      {c.icon}
                    </Box>
                    <Typography fontWeight={950} sx={{ mt: 1 }}>
                      {c.title}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
                      {c.body}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>

          <Box
            sx={{
              p: { xs: 2.5, md: 3 },
              borderRadius: 4,
              bgcolor: "secondary.main",
              color: "white",
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
              alignItems: { xs: "flex-start", md: "center" },
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.5 }}>
                Ready to apply or hire?
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.75, opacity: 0.84 }}>
                Candidates: browse jobs and register. Employers: share requirements in Employer Zone.
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ width: { xs: "100%", md: "auto" } }}>
              <Button
                variant="contained"
                onClick={() => navigate("/jobs")}
                sx={{ bgcolor: "primary.main", color: "primary.contrastText", borderRadius: 999, "&:hover": { bgcolor: "primary.dark" } }}
              >
                Browse Jobs
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate("/register")}
                sx={{ borderColor: "rgba(255,255,255,0.5)", color: "white", borderRadius: 999 }}
              >
                Register Now
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate("/employer-zone")}
                sx={{ borderColor: "rgba(255,255,255,0.5)", color: "white", borderRadius: 999 }}
              >
                Employer Zone
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
