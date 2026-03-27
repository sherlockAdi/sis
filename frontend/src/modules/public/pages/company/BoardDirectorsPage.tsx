import { Box, Container, Stack, Typography } from "@mui/material";
import PublicPageHero from "../../components/PublicPageHero";

export default function BoardDirectorsPage() {
  return (
    <Box>
      <PublicPageHero eyebrow="Company" title="Board of" highlight="Directors" subtitle="Governance and oversight for long-term trust." />
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{ p: 3, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
          <Typography sx={{ color: "text.secondary", lineHeight: 1.9 }}>
            Add your directors list here (from CMS or database). This page is intentionally structured like a corporate site section.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

