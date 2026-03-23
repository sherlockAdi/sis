import { Box, Container, Divider, Stack, Typography } from "@mui/material";
import PublicPageHero from "../../components/PublicPageHero";

export default function CompanyOverviewPage() {
  return (
    <Box>
      <PublicPageHero
        eyebrow="About Us"
        title="Company"
        highlight="Overview"
        subtitle="A structured recruitment and deployment company built for transparency, trust, and speed."
      />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={2.5}>
          <Box sx={{ p: 3, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              What we do
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9 }}>
              SIS Global helps employers hire skilled workforce through a defined end-to-end journey: job publishing, sourcing,
              screening, interviews, documentation, approvals, and deployment tracking.
            </Typography>
            <Typography sx={{ mt: 1.25, color: "text.secondary", lineHeight: 1.9 }}>
              The outer website is designed like a job portal (discover → apply), and then routes users into the right portal
              experience (Candidate / Partner / Customer / Admin) for execution.
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            {[
              {
                t: "Job discovery first",
                d: "Country-wise listings and quick search like a portal, not a brochure website.",
              },
              {
                t: "Clear workflow",
                d: "Apply → screen → shortlist → interview → visa → deployment.",
              },
              {
                t: "Stakeholder portals",
                d: "Separate portals prevent UI mixing and keep journeys focused.",
              },
              {
                t: "Audit-ready data",
                d: "Status history, required documents, and approvals keep the process traceable.",
              },
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

          <Box sx={{ p: 3, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Operating principles
            </Typography>
            <Stack spacing={1.25} sx={{ mt: 1.5 }}>
              {[
                "Compliance-first documentation and verification",
                "Transparent status updates and ownership per step",
                "Faster turnaround via structured partner collaboration",
                "Employer trust signals and consistent screening",
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

