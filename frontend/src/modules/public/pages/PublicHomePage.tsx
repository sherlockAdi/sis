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
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import GroupsIcon from "@mui/icons-material/Groups";
import ApartmentIcon from "@mui/icons-material/Apartment";
import { PORTAL_BASE } from "../../../common/paths";
import { jobsApi, type JobListRow } from "../../../common/services/jobsApi";

const audienceCards = [
  {
    title: "For Job Seekers",
    subtitle: "Discover overseas roles, register quickly, and move through a clear application path.",
    bullets: ["Country-wise job discovery", "Fast register and apply flow", "Portal handoff for tracking"],
    button: "Browse Jobs",
    to: "/jobs",
  },
  {
    title: "For Employers",
    subtitle: "Share hiring needs, work with a structured sourcing process, and track progress confidently.",
    bullets: ["Employer Zone inquiries", "Compliance-first hiring", "Deployment visibility"],
    button: "Employer Zone",
    to: "/employer-zone",
  },
  {
    title: "For Sourcing Teams",
    subtitle: "Submit candidates faster, keep status transparent, and improve turnaround with performance tracking.",
    bullets: ["Job mandate list", "Quick candidate submissions", "Progress and feedback tracking"],
    button: "Partner Zone",
    to: "/partner-zone",
  },
];

const trustCards = [
  { icon: <VerifiedIcon />, title: "Structured process", body: "Shortlisting, interviews, documents, and deployment follow one clear path." },
  { icon: <PublicIcon />, title: "Global reach", body: "Country-wise job discovery and portal routing for cross-border hiring." },
  { icon: <SupportAgentIcon />, title: "Guided support", body: "Candidates and employers get direct CTAs and fewer dead ends." },
  { icon: <ApartmentIcon />, title: "Corporate trust", body: "A clean public front-end backed by role-based portals and audit-friendly flows." },
];

const processSteps = [
  "1) Discover jobs by country or role",
  "2) Register / apply from the public site",
  "3) Screening and shortlisting",
  "4) Interview coordination",
  "5) Documentation, visa, and travel",
  "6) Deployment and status tracking",
];

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

  const featuredJobCount = useMemo(() => featured.reduce((sum, group) => sum + group.items.length, 0), [featured]);
  const featuredCountryCount = useMemo(() => featured.length || quickCountries.length, [featured.length, quickCountries]);

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

  const stats = [
    { value: `${featuredCountryCount}+`, label: "Countries discovered" },
    { value: `${featuredJobCount || "0"}+`, label: "Featured open roles" },
    { value: "3 portals", label: "Candidate, Employer, Partner" },
    { value: "1 process", label: "Search → apply → deploy" },
  ];

  return (
    <Box>
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          color: "white",
          background:
            "linear-gradient(135deg, #0f172a 0%, #111827 45%, #781727 100%)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.10), transparent 30%), radial-gradient(circle at 90% 12%, rgba(255,255,255,0.12), transparent 22%), radial-gradient(circle at 72% 82%, rgba(183,31,52,0.18), transparent 24%)",
            pointerEvents: "none",
          }}
        />
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 }, position: "relative" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1.08fr 0.92fr" },
              gap: { xs: 3, md: 4 },
              alignItems: "stretch",
            }}
          >
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {["Overseas jobs", "Employer sourcing", "Portal handoff"].map((label) => (
                  <Chip
                    key={label}
                    label={label}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.10)",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.14)",
                      fontWeight: 900,
                    }}
                  />
                ))}
              </Stack>

              <Stack spacing={1.75} sx={{ maxWidth: 860 }}>
                <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.72)", letterSpacing: 1.4 }}>
                  SIS Global Workforce Solutions
                </Typography>
                <Typography variant="h2" fontWeight={950} sx={{ letterSpacing: -1.4, fontSize: { xs: 42, md: 68 }, lineHeight: 0.98 }}>
                  One portal for jobs, sourcing, and deployment
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.82)", maxWidth: 760, lineHeight: 1.9, fontSize: 16 }}>
                  Find talent. Find work. Move faster. SIS gives candidates, employers, and sourcing teams a clear public entry point
                  and routes each journey into the right portal without mixing experiences.
                </Typography>
              </Stack>

              <Box
                sx={{
                  p: { xs: 2, md: 2.5 },
                  borderRadius: 4,
                  bgcolor: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  backdropFilter: "blur(10px)",
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
                    InputProps={{
                      sx: {
                        bgcolor: "white",
                        borderRadius: 2,
                        color: "text.primary",
                      },
                    }}
                  />
                  <Button
                    size="large"
                    variant="contained"
                    startIcon={<SearchIcon />}
                    onClick={() => navigate(`/jobs?keyword=${encodeURIComponent(keyword)}`)}
                    sx={{ bgcolor: "primary.main", "&:hover": { bgcolor: "primary.dark" }, borderRadius: 2, px: 3 }}
                  >
                    Search
                  </Button>
                </Stack>

                <Box sx={{ mt: 1.5, display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {quickCountries.map((c) => (
                    <Chip
                      key={c.code}
                      label={c.label}
                      onClick={() => navigate(`/jobs/country/${c.code}`)}
                      sx={{
                        bgcolor: "rgba(255,255,255,0.96)",
                        color: "text.primary",
                        border: "1px solid rgba(255,255,255,0.18)",
                        fontWeight: 900,
                      }}
                    />
                  ))}
                </Box>
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
                <Button size="large" variant="outlined" onClick={() => navigate("/register")} sx={{ px: 3, borderColor: "rgba(255,255,255,0.42)", color: "white" }}>
                  Register Free
                </Button>
                <Button size="large" variant="text" onClick={() => navigate(`${PORTAL_BASE}/login`)} sx={{ fontWeight: 900, color: "white" }}>
                  Portal Login
                </Button>
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" },
                  gap: 1.5,
                }}
              >
                {stats.map((s) => (
                  <Box
                    key={s.label}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    <Typography variant="h5" fontWeight={950}>
                      {s.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.72)" }}>
                      {s.label}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box
                sx={{
                  p: { xs: 2.5, md: 3 },
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.3 }}>
                  Structured pipeline
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.75, color: "rgba(255,255,255,0.78)", lineHeight: 1.8 }}>
                  Public visitors can discover jobs, employers can start an inquiry, and sourcing teams can move straight into the right
                  workflow.
                </Typography>
              </Box>
            </Stack>

            <Box sx={{ display: "grid", gap: 2 }}>
              {audienceCards.map((card, index) => (
                <Card
                  key={card.title}
                  sx={{
                    bgcolor: index === 1 ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.08)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.12)",
                    boxShadow: "none",
                  }}
                >
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Chip
                        label={card.title}
                        sx={{
                          width: "fit-content",
                          bgcolor: "rgba(255,255,255,0.12)",
                          color: "white",
                          fontWeight: 900,
                        }}
                      />
                      <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.3 }}>
                        {card.subtitle}
                      </Typography>
                      <Stack spacing={0.75}>
                        {card.bullets.map((item) => (
                          <Typography key={item} variant="body2" sx={{ color: "rgba(255,255,255,0.78)" }}>
                            • {item}
                          </Typography>
                        ))}
                      </Stack>
                      <Button
                        variant="contained"
                        onClick={() => navigate(card.to)}
                        sx={{ width: "fit-content", bgcolor: "white", color: "secondary.main", "&:hover": { bgcolor: "#f5f5f5" } }}
                      >
                        {card.button}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h4" fontWeight={950} sx={{ letterSpacing: -0.8 }}>
              Featured jobs by country
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", maxWidth: 860, lineHeight: 1.8 }}>
              Quick discovery by destination. Browse the open jobs we are currently featuring, or jump straight to the full listings.
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            {(featured.length ? featured : [{ country: "Jobs", items: [] }]).map((g) => (
              <Card key={g.country} variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
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
            <Typography variant="h4" fontWeight={950} sx={{ letterSpacing: -0.8 }}>
              Why people use SIS
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", maxWidth: 860, lineHeight: 1.8 }}>
              A focused recruitment front door that keeps candidates, employers, and sourcing teams moving in the same direction.
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            {trustCards.map((card) => (
              <Box key={card.title} sx={{ p: 2.5, borderRadius: 2, bgcolor: "white", border: "1px solid rgba(15,23,42,0.08)" }}>
                <Box sx={{ display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: 2, bgcolor: "rgba(183,31,52,0.10)", color: "primary.main" }}>
                  {card.icon}
                </Box>
                <Typography fontWeight={950} sx={{ mt: 1.25 }}>
                  {card.title}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary", lineHeight: 1.9 }}>
                  {card.body}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
              gap: 2,
              alignItems: "stretch",
            }}
          >
            <Box
              sx={{
                p: { xs: 2.5, md: 3 },
                bgcolor: "white",
                borderRadius: 4,
                border: "1px solid rgba(15,23,42,0.08)",
              }}
            >
              <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
                How it works
              </Typography>
              <Stack spacing={1.1} sx={{ mt: 2 }}>
                {processSteps.map((x) => (
                  <Typography key={x} sx={{ color: "text.secondary", lineHeight: 1.9 }}>
                    {x}
                  </Typography>
                ))}
              </Stack>
            </Box>

            <Box
              sx={{
                p: { xs: 2.5, md: 3 },
                bgcolor: "secondary.main",
                color: "white",
                borderRadius: 4,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
                  Ready to start?
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.75, opacity: 0.84, lineHeight: 1.8 }}>
                  Candidates can browse and register. Employers can share requirements in Employer Zone. Sourcing partners can submit
                  candidates through their portal.
                </Typography>
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                <Button
                  variant="contained"
                  onClick={() => navigate("/jobs")}
                  sx={{ bgcolor: "primary.main", color: "primary.contrastText", borderRadius: 2, "&:hover": { bgcolor: "primary.dark" } }}
                >
                  Browse Jobs
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/register")}
                  sx={{ borderColor: "rgba(255,255,255,0.5)", color: "white", borderRadius: 2 }}
                >
                  Register Now
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/employer-zone")}
                  sx={{ borderColor: "rgba(255,255,255,0.5)", color: "white", borderRadius: 2 }}
                >
                  Employer Zone
                </Button>
              </Stack>
            </Box>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
