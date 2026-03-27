import { Box, Container, Divider, Stack, Typography } from "@mui/material";
import PublicPageHero from "../../components/PublicPageHero";

export default function EmployerWhyPartnerPage() {
  return (
    <Box>
      <PublicPageHero
        eyebrow="Employer Zone"
        title="Why partner"
        highlight="with SIS"
        subtitle="Trust-first recruitment: compliance, clarity, and predictable delivery."
      />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={2.5}>
          <Box sx={{ p: 3, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Employer trust layer
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9 }}>
              SIS provides a structured hiring pipeline with documentation controls, audit-ready status updates, and clear ownership
              across steps — reducing delays and ambiguity in overseas hiring.
            </Typography>
            <Divider sx={{ my: 2.5 }} />
            <Typography fontWeight={950}>What you get</Typography>
            <Stack spacing={1.1} sx={{ mt: 1.25 }}>
              {[
                "Clear screening and shortlist criteria",
                "Transparent timelines and milestones",
                "Document checklist per job/location",
                "Partner coordination with accountability",
                "Status history for traceability",
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

