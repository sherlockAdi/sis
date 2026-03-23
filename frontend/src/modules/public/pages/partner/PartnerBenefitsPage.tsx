import { Box, Container, Divider, Stack, Typography } from "@mui/material";
import PublicPageHero from "../../components/PublicPageHero";

export default function PartnerBenefitsPage() {
  return (
    <Box>
      <PublicPageHero
        eyebrow="Partner Zone"
        title="Partner"
        highlight="Benefits"
        subtitle="Structured sourcing programs with clear visibility and accountability."
      />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={2.5}>
          <Box sx={{ p: 3, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              What partners get
            </Typography>
            <Divider sx={{ my: 2.5 }} />
            <Stack spacing={1.1}>
              {[
                "Clear submission requirements per job and location",
                "Candidate progress tracking (shortlist → interview → documentation → deployment)",
                "Feedback loop to improve candidate quality",
                "Performance visibility for sourcing programs",
              ].map((x) => (
                <Typography key={x} sx={{ color: "text.secondary", lineHeight: 1.9 }}>
                  • {x}
                </Typography>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}

