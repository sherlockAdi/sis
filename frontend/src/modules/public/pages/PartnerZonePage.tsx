import { useState } from "react";
import { Alert, Box, Button, Container, Divider, Stack, TextField, Typography } from "@mui/material";
import { PORTAL_BASE } from "../../../common/paths";
import { useNavigate } from "react-router-dom";
import PublicPageHero from "../components/PublicPageHero";

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
        subtitle="Benefits, how it works, and a clear submission CTA (portal login stays in footer)."
      />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={2.5}>
          <Box
            id="benefits"
            sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}
          >
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Benefits
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9 }}>
              Clear submission workflow, transparent candidate progress, and structured reporting for sourcing performance.
            </Typography>
          </Box>

          <Box
            id="how"
            sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}
          >
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              How it works
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9 }}>
              Onboard → submit candidates → track status updates → improve quality through feedback loops.
            </Typography>
          </Box>

          <Box
            id="submit"
            sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}
          >
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Submit candidates
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9 }}>
              Use the Partner portal to upload and manage referrals. (Portal logins remain in the footer as requested.)
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={() => navigate("/register")}
                sx={{ borderRadius: 3, bgcolor: "primary.main", "&:hover": { bgcolor: "primary.dark" } }}
                fullWidth
              >
                Get Registered
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

          <Box sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
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
                  onClick={() => navigate(`${PORTAL_BASE}/login?portal=sourcing`)}
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
