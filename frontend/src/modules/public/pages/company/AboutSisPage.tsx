import { Box, Container, Divider, Stack, Typography } from "@mui/material";
import PublicPageHero from "../../components/PublicPageHero";

export default function AboutSisPage() {
  return (
    <Box>
      <PublicPageHero
        eyebrow="Company"
        title="SIS –"
        highlight="A Billion Dollar Indian MNC"
        subtitle="A trust-first corporate layer for global recruitment, workforce solutions, and structured deployments."
      />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "420px 1fr" }, gap: 3 }}>
          <Box sx={{ p: 3, bgcolor: "white", border: "1px solid rgba(15,23,42,0.08)", borderRadius: 4 }}>
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Leadership Highlights
            </Typography>
            <Stack spacing={1.25} sx={{ mt: 2 }}>
              {[
                { k: "#1", t: "Security Solutions in India" },
                { k: "#1", t: "Facility Management (select markets)" },
                { k: "Top 5", t: "Integrated Workforce Programs" },
                { k: "10+", t: "Countries Served" },
              ].map((x) => (
                <Box key={x.t} sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                  <Typography fontWeight={950} sx={{ color: "primary.main", minWidth: 52 }}>
                    {x.k}
                  </Typography>
                  <Typography fontWeight={900}>{x.t}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Box sx={{ p: 3, bgcolor: "white", border: "1px solid rgba(15,23,42,0.08)", borderRadius: 4 }}>
            <Stack spacing={2}>
              {[
                "SIS Global commenced operations with a mission to standardize workforce sourcing and deployment across multiple geographies.",
                "We combine compliance-first recruitment, structured screening, and transparent documentation to help employers hire with confidence.",
                "Our portal ecosystem routes each stakeholder to the right experience: Candidate, Partner, Customer, and Admin.",
              ].map((p) => (
                <Typography key={p} sx={{ color: "text.secondary", lineHeight: 1.9 }}>
                  {p}
                </Typography>
              ))}
              <Divider />
              <Typography fontWeight={950}>What makes us different</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                {[
                  { t: "Trust Layer", d: "Verified process and clear timelines." },
                  { t: "Job Discovery First", d: "Country-wise jobs like a portal, not a brochure." },
                  { t: "Partner Network", d: "Agency workflows with visibility and accountability." },
                  { t: "Compliance Ready", d: "Documents, status history, and audit trails." },
                ].map((x) => (
                  <Box key={x.t} sx={{ p: 2, borderRadius: 3, bgcolor: "#f6f6f8", border: "1px solid rgba(15,23,42,0.08)" }}>
                    <Typography fontWeight={950}>{x.t}</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
                      {x.d}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

