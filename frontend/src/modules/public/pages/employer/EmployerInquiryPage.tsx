import { useState } from "react";
import { Alert, Box, Button, Container, Stack, TextField, Typography } from "@mui/material";
import PublicPageHero from "../../components/PublicPageHero";

export default function EmployerInquiryPage() {
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <Box>
      <PublicPageHero
        eyebrow="Employer Zone"
        title="Contact"
        highlight="/ Inquiry"
        subtitle="Share your workforce requirement and we’ll contact you."
      />

      <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
          {submitted ? <Alert sx={{ mb: 2 }} severity="success">Thanks — we will reach out shortly.</Alert> : null}

          <Stack spacing={1.25}>
            <TextField label="Company Name" value={company} onChange={(e) => setCompany(e.target.value)} fullWidth />
            <TextField label="Work Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            <TextField label="Requirement / Message" value={message} onChange={(e) => setMessage(e.target.value)} fullWidth multiline minRows={4} />
            <Button
              variant="contained"
              onClick={() => setSubmitted(true)}
              sx={{ borderRadius: 3, bgcolor: "primary.main", "&:hover": { bgcolor: "primary.dark" } }}
            >
              Submit Inquiry
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

