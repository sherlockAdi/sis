import { Box, Container, Divider, Stack, Typography } from "@mui/material";
import PublicPageHero from "../../components/PublicPageHero";

export default function GlobalPresencePage() {
  return (
    <Box>
      <PublicPageHero
        eyebrow="About Us"
        title="Global"
        highlight="Presence"
        subtitle="Country-wise discovery with on-ground execution support through the portal ecosystem."
      />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={2.5}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "360px 1fr" }, gap: 2 }}>
            <Box sx={{ p: 3, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
              <Typography fontWeight={950}>Countries served</Typography>
              <Stack spacing={1.1} sx={{ mt: 1.5 }}>
                {["UAE", "Saudi Arabia", "Qatar", "Kuwait", "Oman", "Bahrain"].map((c) => (
                  <Typography key={c} sx={{ color: "text.secondary" }}>
                    • {c}
                  </Typography>
                ))}
              </Stack>
            </Box>
            <Box sx={{ p: 3, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
              <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
                How we scale globally
              </Typography>
              <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9 }}>
                We standardize the process layer (jobs, requirements, documents, status history) and localize execution by
                country via partner networks and workflow routing.
              </Typography>
              <Divider sx={{ my: 2.5 }} />
              <Typography fontWeight={950}>What stays consistent</Typography>
              <Stack spacing={1.1} sx={{ mt: 1.25 }}>
                {[
                  "Single job format and discovery UX",
                  "Document checklist and required items",
                  "Status history for transparency",
                  "Role-based portal access",
                ].map((x) => (
                  <Typography key={x} sx={{ color: "text.secondary", lineHeight: 1.9 }}>
                    • {x}
                  </Typography>
                ))}
              </Stack>
            </Box>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}

