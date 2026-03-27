import { Box, Container, Divider, Stack, Typography } from "@mui/material";
import PublicPageHero from "../../components/PublicPageHero";

export default function TrainingDevelopmentPage() {
  return (
    <Box>
      <PublicPageHero
        eyebrow="Company"
        title="Training"
        highlight="& Development"
        subtitle="Structured readiness programs for interviews, documentation, and deployment."
      />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "380px 1fr" }, gap: 3 }}>
          <Box sx={{ p: 3, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
            <Typography fontWeight={950}>At a glance</Typography>
            <Stack spacing={1.25} sx={{ mt: 2 }}>
              {[
                { k: "25+", v: "Training programs" },
                { k: "10K+", v: "Candidates trained" },
                { k: "Role-based", v: "Industry modules" },
              ].map((x) => (
                <Box key={x.v} sx={{ display: "flex", gap: 1.25, alignItems: "baseline" }}>
                  <Typography fontWeight={950} sx={{ color: "primary.main", minWidth: 64 }}>
                    {x.k}
                  </Typography>
                  <Typography fontWeight={900}>{x.v}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Box sx={{ p: 3, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Structured Induction Training
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9 }}>
              Our training focuses on role readiness, documentation accuracy, interview preparation, and on-site behavioral standards.
              This improves selection success and reduces deployment risk.
            </Typography>

            <Divider sx={{ my: 2.5 }} />

            <Typography fontWeight={950}>What we cover</Typography>
            <Box sx={{ mt: 1.25, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.25 }}>
              {[
                "Process & compliance",
                "Interview readiness",
                "Basic trade/role skills",
                "Workplace safety",
                "Documentation checklist",
                "Communication basics",
              ].map((x) => (
                <Box key={x} sx={{ p: 1.75, borderRadius: 3, bgcolor: "#f6f6f8", border: "1px solid rgba(15,23,42,0.08)" }}>
                  <Typography fontWeight={900}>{x}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

