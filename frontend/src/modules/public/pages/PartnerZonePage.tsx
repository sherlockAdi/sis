import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PublicPageHero from "../components/PublicPageHero";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

export default function PartnerZonePage() {
  const navigate = useNavigate();
  const [agency, setAgency] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <Box>
      <PublicPageHero
        eyebrow="Partner Zone"
        title="Sourcing"
        highlight="Partners"
        subtitle="Fast job discovery, quick submissions, transparent status updates, and performance visibility."
        actions={
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate("/portal/login/auth?portal=partner")}
              sx={{ borderRadius: 999 }}
            >
              Partner Portal Login
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                const el = document.getElementById("onboarding");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              sx={{ borderRadius: 999, fontWeight: 900 }}
            >
              Request Onboarding
            </Button>
          </Stack>
        }
      />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={2.5}>
          {/* Quick snapshot */}
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
                Speed-first partner experience
              </Typography>
              <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9 }}>
                Find mandates fast, submit candidates in minutes, and track each candidate’s status across the pipeline — with
                clear feedback and performance visibility.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.75 }}>
                <Chip label="Job mandates" sx={{ fontWeight: 900 }} />
                <Chip label="Quick submission" sx={{ fontWeight: 900 }} />
                <Chip label="Bulk upload-ready" sx={{ fontWeight: 900 }} />
                <Chip label="Status transparency" sx={{ fontWeight: 900 }} />
              </Stack>
            </Box>
            <Box
              component="img"
              src="/home/workforce-2.svg"
              alt="Partner sourcing"
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

          <Box
            id="benefits"
            sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}
          >
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Benefits
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9, maxWidth: 980 }}>
              Designed for sourcing partners to operate at scale while maintaining quality and clarity.
            </Typography>

            <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              {[
                { t: "Mandates you can act on", d: "Clear role, country, salary, eligibility, and urgency markers." },
                { t: "Fast submissions", d: "Quick candidate entry with job mapping and document checklist support." },
                { t: "Transparency", d: "Under Review → Shortlisted → Rejected → Selected → Deployed tracking." },
                { t: "Performance visibility", d: "Conversion rate, shortlist %, and monthly performance insights." },
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

          <Box
            id="how"
            sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}
          >
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              How it works
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9, maxWidth: 980 }}>
              A simple loop: onboard once, submit candidates quickly, and continuously improve quality through clear outcomes.
            </Typography>

            <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
              {[
                { n: "01", t: "Onboard", d: "KYC + agreement + basic profile setup." },
                { n: "02", t: "Submit", d: "Map candidates to Job ID and upload required docs." },
                { n: "03", t: "Track", d: "Get status updates + feedback for improvement." },
              ].map((x) => (
                <Card key={x.n} variant="outlined" sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Typography fontWeight={950} sx={{ color: "primary.main" }}>
                      {x.n}
                    </Typography>
                    <Typography fontWeight={950} sx={{ mt: 0.5 }}>
                      {x.t}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary", lineHeight: 1.85 }}>
                      {x.d}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>

          <Box
            id="submit"
            sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}
          >
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Submit candidates
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9, maxWidth: 980 }}>
              Use the Partner Portal for quick single submissions now, and bulk upload workflows as you scale.
            </Typography>

            <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              {[
                {
                  t: "Single submission",
                  d: "Add candidate details, select job, upload documents, submit in under 2 minutes.",
                },
                {
                  t: "Bulk upload (recommended)",
                  d: "Upload multiple candidates at once (CSV + documents) to reduce repetitive entry.",
                },
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

            <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
              {[
                { t: "Mandate clarity", d: "Role, country, salary, eligibility, urgency flags." },
                { t: "Rejection reason", d: "Clear feedback to improve next submissions." },
                { t: "Timeline tracking", d: "Submitted → Screening → Trade Test → Selected → Deployed." },
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

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={() => navigate("/portal/login/auth?portal=partner")}
                sx={{ borderRadius: 3, bgcolor: "primary.main", "&:hover": { bgcolor: "primary.dark" } }}
                fullWidth
              >
                Open Partner Portal
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate("/jobs")}
                sx={{ borderRadius: 3 }}
                fullWidth
              >
                Browse Jobs
              </Button>
            </Stack>
          </Box>

          <Divider />

          <Box
            id="onboarding"
            sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}
          >
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Partner onboarding
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary" }}>
              Quick onboarding request.
            </Typography>

            {submitted ? <Alert sx={{ mt: 2 }} severity="success">Thanks — we will contact you shortly.</Alert> : null}

            <Stack spacing={1.25} sx={{ mt: 2 }}>
              <TextField label="Agency Name" value={agency} onChange={(e) => setAgency(e.target.value)} fullWidth />
              <TextField label="Work Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                <Button
                  variant="contained"
                  onClick={() => setSubmitted(true)}
                  sx={{ borderRadius: 3, bgcolor: "primary.main", "&:hover": { bgcolor: "primary.dark" } }}
                  fullWidth
                >
                  Request Onboarding
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/portal/login/auth?portal=partner")}
                  sx={{ borderRadius: 3 }}
                  fullWidth
                >
                  Partner Portal Login
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
