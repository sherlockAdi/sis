import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PublicPageHero from "../../components/PublicPageHero";

export default function AboutIndexPage() {
  const navigate = useNavigate();

  const items = [
    {
      title: "Company overview",
      desc: "Who we are, what we do, and how SIS Global operates.",
      to: "/about/company-overview",
    },
    {
      title: "Global presence",
      desc: "Countries served, deployment coverage, and how we scale.",
      to: "/about/global-presence",
    },
    {
      title: "Trust / certifications",
      desc: "Compliance, documentation, audit trails, and trust signals.",
      to: "/about/trust-certifications",
    },
    {
      title: "Why SIS",
      desc: "Our differentiators and why stakeholders choose SIS.",
      to: "/about/why-sis",
    },
  ];

  return (
    <Box>
      <PublicPageHero
        eyebrow="About Us"
        title="SIS Global"
        highlight="Company"
        subtitle="Choose a section to explore detailed information."
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

