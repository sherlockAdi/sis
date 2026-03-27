import { Box, Container, Divider, Stack, Typography } from "@mui/material";
import PublicPageHero from "../../components/PublicPageHero";

export default function EmployerProcessPage() {
  return (
    <Box>
      <PublicPageHero
        eyebrow="Employer Zone"
        title="Hiring"
        highlight="Process"
        subtitle="A clear, step-by-step workflow designed for speed and visibility."
      />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={2.5}>
          <Box sx={{ p: 3, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              How it works
            </Typography>
            <Divider sx={{ my: 2.5 }} />
            <Stack spacing={1.25}>
              {[
                "1) Inquiry & requirement brief",
                "2) Role definition + document checklist",
                "3) Sourcing partner pipeline",
                "4) Shortlist & interview coordination",
                "5) Documentation & approvals",
                "6) Onboarding & deployment",
              ].map((x) => (
                <Typography key={x} sx={{ color: "text.secondary", lineHeight: 1.9 }}>
                  {x}
                </Typography>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}

