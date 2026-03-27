import { Box, Container, Divider, Stack, Typography } from "@mui/material";
import PublicPageHero from "../../components/PublicPageHero";

export default function PartnerHowItWorksPage() {
  return (
    <Box>
      <PublicPageHero
        eyebrow="Partner Zone"
        title="How it"
        highlight="Works"
        subtitle="A simple, repeatable workflow for partner submissions."
      />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={2.5}>
          <Box sx={{ p: 3, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Workflow
            </Typography>
            <Divider sx={{ my: 2.5 }} />
            <Stack spacing={1.25}>
              {[
                "1) Register / onboarding request",
                "2) Access Partner portal",
                "3) Submit candidates against jobs",
                "4) Track status updates and feedback",
                "5) Improve quality and resubmit as needed",
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

