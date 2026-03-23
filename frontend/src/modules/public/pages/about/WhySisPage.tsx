import { Box, Button, Container, Divider, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PublicPageHero from "../../components/PublicPageHero";

export default function WhySisPage() {
  const navigate = useNavigate();

  return (
    <Box>
      <PublicPageHero
        eyebrow="About Us"
        title="Why"
        highlight="SIS"
        subtitle="A job-portal-first micro site with a corporate trust layer and dedicated portals for execution."
      />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={2.5}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            {[
              { t: "Conversion-focused UX", d: "Users land → see jobs → search → apply/register → portal handoff." },
              { t: "Faster hiring loop", d: "Structured pipeline reduces delays and unclear ownership." },
              { t: "Partner ecosystem", d: "Sourcing partners submit candidates and track progress." },
              { t: "Employer confidence", d: "Trust signals, compliance checks, and documented steps." },
            ].map((x) => (
              <Box key={x.t} sx={{ p: 2.5, borderRadius: 4, bgcolor: "white", border: "1px solid rgba(15,23,42,0.08)" }}>
                <Typography fontWeight={950}>{x.t}</Typography>
                <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary", lineHeight: 1.85 }}>
                  {x.d}
                </Typography>
              </Box>
            ))}
          </Box>

          <Divider />

          <Box
            sx={{
              p: { xs: 2.5, md: 3 },
              borderRadius: 4,
              bgcolor: "secondary.main",
              color: "white",
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
              alignItems: { xs: "flex-start", md: "center" },
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.5 }}>
                Want to hire workforce?
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.75, opacity: 0.84 }}>
                Visit Employer Zone and share your requirement.
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => navigate("/employer-zone#inquiry")}
              sx={{ bgcolor: "primary.main", "&:hover": { bgcolor: "primary.dark" } }}
            >
              Employer Zone
            </Button>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}

