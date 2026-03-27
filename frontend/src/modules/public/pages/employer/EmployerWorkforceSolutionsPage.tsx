import { Box, Container, Divider, Stack, Typography } from "@mui/material";
import PublicPageHero from "../../components/PublicPageHero";

export default function EmployerWorkforceSolutionsPage() {
  return (
    <Box>
      <PublicPageHero
        eyebrow="Employer Zone"
        title="Workforce"
        highlight="Solutions"
        subtitle="Role-based hiring programs with consistent quality and compliance."
      />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={2.5}>
          <Box sx={{ p: 3, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Solutions we support
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9 }}>
              From job posting to deployment, SIS combines sourcing partners, standardized screening, and documentation workflows
              to deliver candidates faster — without sacrificing compliance.
            </Typography>
            <Divider sx={{ my: 2.5 }} />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              {[
                { t: "Bulk hiring", d: "High-volume roles with structured shortlisting." },
                { t: "Skilled roles", d: "Role-based requirements and interview readiness." },
                { t: "Documentation support", d: "Required documents per location with clear checklists." },
                { t: "Deployment tracking", d: "Visibility into milestones through the portal workflow." },
              ].map((x) => (
                <Box key={x.t} sx={{ p: 2.5, borderRadius: 4, bgcolor: "#f6f6f8", border: "1px solid rgba(15,23,42,0.08)" }}>
                  <Typography fontWeight={950}>{x.t}</Typography>
                  <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary", lineHeight: 1.85 }}>
                    {x.d}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}

