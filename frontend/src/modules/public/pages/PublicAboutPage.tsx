import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Box, Container, Divider, Stack, Typography } from "@mui/material";
import PublicPageHero from "../components/PublicPageHero";

export default function PublicAboutPage() {
  const location = useLocation();

  useEffect(() => {
    const id = String(location.hash ?? "").replace(/^#/, "").trim();
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash]);

  return (
    <Box>
      <PublicPageHero
        eyebrow="About Us"
        title="SIS Global"
        highlight="Overview"
        subtitle="Company overview, global presence, trust signals, and why SIS — in one clean page."
      />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={2.5}>
          <Box
            id="overview"
            sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}
          >
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Company overview
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9 }}>
              SIS Global connects skilled workforce with trusted employers using a structured recruitment and deployment process.
              We focus on clarity, compliance, and speed — so stakeholders can act with confidence.
            </Typography>
          </Box>

          <Box
            id="presence"
            sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}
          >
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Global presence
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9 }}>
              Country-wise discovery (UAE, Saudi, Qatar and more) with portal-based execution for each user type.
              Candidates, partners, and employers get dedicated journeys for better outcomes.
            </Typography>
          </Box>

          <Box
            id="trust"
            sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}
          >
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Trust / certifications
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9 }}>
              A corporate trust layer built into the workflow: documentation, status history, approvals, and clear responsibilities.
              Plug in your certifications/logos here when ready.
            </Typography>
          </Box>

          <Box
            id="why"
            sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}
          >
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Why SIS
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9 }}>
              One entry point that works like a job portal (search → discover → apply), and then routes users into the right portal
              (Candidate / Partner / Customer / Admin) without mixing experiences.
            </Typography>
          </Box>

          <Divider />
        </Stack>
      </Container>
    </Box>
  );
}
