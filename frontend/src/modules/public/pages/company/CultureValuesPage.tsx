import { Box, Container, Divider, Stack, Typography } from "@mui/material";
import PublicPageHero from "../../components/PublicPageHero";

export default function CultureValuesPage() {
  return (
    <Box>
      <PublicPageHero
        eyebrow="Company"
        title="Culture"
        highlight="& Values"
        subtitle="A process-led culture that protects people, employers, and outcomes."
      />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
          <Typography variant="h4" fontWeight={950} sx={{ letterSpacing: -0.7 }}>
            <Box component="span" sx={{ color: "text.primary" }}>
              “Take care of your people,
            </Box>{" "}
            <Box component="span" sx={{ color: "primary.main" }}>
              they will take care of your business.”
            </Box>
          </Typography>
          <Typography variant="caption" sx={{ mt: 1, display: "block", color: "text.secondary" }}>
            — Founder’s philosophy (adapted)
          </Typography>

          <Divider sx={{ my: 2.5 }} />

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 420px" }, gap: 3 }}>
            <Stack spacing={2}>
              {[
                "We institutionalize employee welfare through training, transparent communication, and structured documentation.",
                "Our operating system is built on clear milestones: apply → screen → interview → visa → deployment.",
                "Every stakeholder gets a dedicated experience: candidates apply and track; partners submit and monitor; employers review and approve.",
              ].map((p) => (
                <Typography key={p} sx={{ color: "text.secondary", lineHeight: 1.9 }}>
                  {p}
                </Typography>
              ))}
            </Stack>

            <Box
              sx={{
                p: 2.5,
                borderRadius: 4,
                bgcolor: "#f6f6f8",
                border: "1px solid rgba(15,23,42,0.08)",
              }}
            >
              <Typography fontWeight={950}>Our Pillars</Typography>
              <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                {[
                  "Compliance First",
                  "Owner Mindset",
                  "Customer Obsession",
                  "Aligned With Vision",
                  "Growth Appetite",
                ].map((x) => (
                  <Box key={x} sx={{ p: 1.5, borderRadius: 3, bgcolor: "white", border: "1px solid rgba(15,23,42,0.08)" }}>
                    <Typography fontWeight={900}>{x}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

