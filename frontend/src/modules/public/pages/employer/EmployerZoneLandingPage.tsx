import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PublicPageHero from "../../components/PublicPageHero";

export default function EmployerZoneLandingPage() {
  const navigate = useNavigate();

  const items = [
    {
      title: "Why partner with SIS",
      desc: "Trust layer, compliance, and predictable delivery.",
      to: "/employer-zone/why-partner-with-sis",
    },
    {
      title: "Workforce solutions",
      desc: "Role-based hiring, sourcing, screening, and deployment workflow.",
      to: "/employer-zone/workforce-solutions",
    },
    {
      title: "Process",
      desc: "Inquiry → shortlist → interview → documentation → onboarding → deployment.",
      to: "/employer-zone/process",
    },
    {
      title: "Contact / Inquiry form",
      desc: "Share your requirement and we’ll get back quickly.",
      to: "/employer-zone/contact",
    },
  ];

  return (
    <Box>
      <PublicPageHero
        eyebrow="Employer Zone"
        title="Hire"
        highlight="Workforce"
        subtitle="A focused corporate entry for employers — then execution continues inside the Customer/Employer portal."
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

