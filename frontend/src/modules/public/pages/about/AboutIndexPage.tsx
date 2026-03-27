import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";
import PublicPageHero from "../../components/PublicPageHero";

export default function AboutIndexPage() {
  const navigate = useNavigate();

  return (
    <Box>
      <PublicPageHero
        eyebrow="About Us"
        title="SIS Global"
        highlight="Company"
        subtitle="A recruitment + deployment platform designed for trust, transparency, and scale."
        actions={
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={() => navigate("/jobs")} sx={{ borderRadius: 999 }}>
              Explore Jobs
            </Button>
            <Button variant="outlined" onClick={() => navigate("/register")} sx={{ borderRadius: 999, fontWeight: 900 }}>
              Register Free
            </Button>
          </Stack>
        }
      />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={2.5}>
          {/* Snapshot */}
          <Box
            sx={{
              p: { xs: 2.5, md: 3 },
              bgcolor: "white",
              borderRadius: 4,
              border: "1px solid rgba(15,23,42,0.08)",
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.15fr 0.85fr" },
              gap: 2,
              alignItems: "center",
            }}
          >
            <Box>
              <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
                Naukri-like discovery + corporate trust layer
              </Typography>
              <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9 }}>
                The outer site helps users discover jobs quickly. The portals handle execution (applications, submissions,
                compliance, deployment tracking) with audit-ready visibility.
              </Typography>
              <Box sx={{ mt: 1.75, display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Chip label="Jobs-first UX" sx={{ fontWeight: 900 }} />
                <Chip label="Role-based portals" sx={{ fontWeight: 900 }} />
                <Chip label="Compliance tracking" sx={{ fontWeight: 900 }} />
                <Chip label="Process-driven workflow" sx={{ fontWeight: 900 }} />
              </Box>
            </Box>
            <Box
              component="img"
              src="/assests/about.jpeg"
              alt="SIS Global"
              sx={{
                width: "100%",
                maxHeight: 220,
                objectFit: "cover",
                borderRadius: 3,
                border: "1px solid rgba(15,23,42,0.08)",
                bgcolor: "rgba(2,6,23,0.02)",
              }}
            />
          </Box>

          <Box id="overview" sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Company overview
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9, maxWidth: 980 }}>
              SIS Global connects skilled workforce with trusted employers using a structured recruitment and deployment process:
              mandates → sourcing → screening → documentation → approvals → deployment tracking.
            </Typography>
            <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              {[
                { t: "Structured workflow", d: "Clear stages and ownership across recruitment and deployment." },
                { t: "Separate portals", d: "Candidate / Partner / Employer / Admin journeys stay focused." },
                { t: "Document controls", d: "Required docs per job and verification status to reduce delays." },
                { t: "Traceable history", d: "Status history and audit trail for accountability." },
              ].map((x) => (
                <Card key={x.t} variant="outlined" sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Typography fontWeight={950}>{x.t}</Typography>
                    <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary", lineHeight: 1.85 }}>
                      {x.d}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>

          <Box id="presence" sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Global presence
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9, maxWidth: 980 }}>
              Country-wise job discovery and deployment readiness tracking for employers operating across regions.
            </Typography>
            <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
              {["UAE", "Saudi Arabia", "Qatar", "Oman", "Kuwait", "India"].map((x) => (
                <Chip key={x} label={x} sx={{ fontWeight: 900 }} />
              ))}
            </Box>
          </Box>

          <Box id="trust" sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Trust / certifications
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9, maxWidth: 980 }}>
              The platform is designed to support compliance-first workflows: checklists, verification status, expiry alerts,
              and structured reporting.
            </Typography>
            <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
              {[
                { t: "Document verification", d: "Role-wise required document sets and verification checkpoints." },
                { t: "Audit-ready logs", d: "Status changes and remarks tracked for accountability." },
                { t: "Secure workflows", d: "Portal separation to prevent UI mixing and reduce errors." },
              ].map((x) => (
                <Card key={x.t} variant="outlined" sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Typography fontWeight={950}>{x.t}</Typography>
                    <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary", lineHeight: 1.85 }}>
                      {x.d}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>

          <Box id="why" sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Why SIS
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9, maxWidth: 980 }}>
              Because hiring at scale needs speed and control — not one or the other.
            </Typography>
            <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              {[
                { t: "Job discovery first", d: "Users land and instantly see jobs, search, and apply/register." },
                { t: "Process-based operations", d: "Recruitment → Training → Deployment → Workforce → Reports." },
                { t: "Partner performance tracking", d: "Conversion visibility and feedback loops improve quality." },
                { t: "Employer visibility", d: "Stage-wise pipeline and pending actions reduce follow-ups." },
              ].map((x) => (
                <Card key={x.t} variant="outlined" sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Typography fontWeight={950}>{x.t}</Typography>
                    <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary", lineHeight: 1.85 }}>
                      {x.d}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>

          <Divider />

          <Box sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Next step
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9 }}>
              Explore jobs or register to continue inside the portal.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 2 }}>
              <Button variant="contained" onClick={() => navigate("/jobs")} sx={{ borderRadius: 3 }}>
                Browse Jobs
              </Button>
              <Button variant="outlined" onClick={() => navigate("/register")} sx={{ borderRadius: 3, fontWeight: 900 }}>
                Register Free
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
