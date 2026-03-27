import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PublicPageHero from "../../components/PublicPageHero";

export default function PartnerZoneLandingPage() {
  const navigate = useNavigate();

  const items = [
    {
      title: "Benefits",
      desc: "Visibility, structured submissions, and transparent progress tracking.",
      to: "/partner-zone/benefits",
    },
    {
      title: "How it works",
      desc: "Onboard → submit candidates → track updates → improve quality.",
      to: "/partner-zone/how-it-works",
    },
    {
      title: "Submit candidates",
      desc: "Clear CTA to submit profiles and redirect to Partner portal login.",
      to: "/partner-zone/submit-candidates",
    },
  ];

  return (
    <Box>
      <PublicPageHero
        eyebrow="Partner Zone"
        title="Sourcing"
        highlight="Partners"
        subtitle="A dedicated partner journey for agencies — benefits, workflow, and submission handoff."
      />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          {items.map((x) => (
            <Box
              key={x.to}
              sx={{
                p: { xs: 2.5, md: 3 },
                bgcolor: "white",
                borderRadius: 4,
                border: "1px solid rgba(15,23,42,0.08)",
              }}
            >
              <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
                {x.title}
              </Typography>
              <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9 }}>
                {x.desc}
              </Typography>
              <Stack direction="row" spacing={1.25} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate(x.to)}
                  sx={{ bgcolor: "primary.main", "&:hover": { bgcolor: "primary.dark" } }}
                >
                  Open
                </Button>
              </Stack>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

