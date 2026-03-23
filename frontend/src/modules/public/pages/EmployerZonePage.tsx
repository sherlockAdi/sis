import { useState } from "react";
import { Alert, Box, Button, Container, Divider, Stack, TextField, Typography } from "@mui/material";
import PublicPageHero from "../components/PublicPageHero";

export default function EmployerZonePage() {
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <Box>
      <PublicPageHero
        eyebrow="Employer Zone"
        title="Hire"
        highlight="Workforce"
        subtitle="For companies hiring workforce — clear process, compliance support, and structured sourcing."
      />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={2.5}>
          <Box
            id="why"
            sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}
          >
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Why partner with SIS
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9 }}>
              Clear recruitment workflow, documentation controls, transparent status updates, and consistent screening standards.
            </Typography>
          </Box>

          <Box
            id="solutions"
            sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}
          >
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Workforce solutions
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9 }}>
              Role-based hiring, sourcing partner collaboration, shortlist management, and deployment readiness tracking.
            </Typography>
          </Box>

          <Box
            id="process"
            sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}
          >
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Process
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9 }}>
              Inquiry → role brief → sourcing → shortlist → interview → documentation → onboarding → deployment.
            </Typography>
          </Box>

          <Divider />

          <Box
            id="inquiry"
            sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}
          >
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Contact / Inquiry form
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary" }}>
              Leave your details — we will contact you.
            </Typography>

            {submitted ? <Alert sx={{ mt: 2 }} severity="success">Thanks — we will reach out shortly.</Alert> : null}

            <Stack spacing={1.25} sx={{ mt: 2 }}>
              <TextField label="Company Name" value={company} onChange={(e) => setCompany(e.target.value)} fullWidth />
              <TextField label="Work Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
              <TextField label="Requirement / Message" value={message} onChange={(e) => setMessage(e.target.value)} fullWidth multiline minRows={4} />
              <Button variant="contained" onClick={() => setSubmitted(true)} sx={{ borderRadius: 3, bgcolor: "primary.main", "&:hover": { bgcolor: "primary.dark" } }}>
                Submit Inquiry
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
