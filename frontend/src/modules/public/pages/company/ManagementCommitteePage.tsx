import { Box, Container, Stack, Typography } from "@mui/material";
import PublicPageHero from "../../components/PublicPageHero";

export default function ManagementCommitteePage() {
  return (
    <Box>
      <PublicPageHero
        eyebrow="Company"
        title="Management"
        highlight="Committee"
        subtitle="Leadership across recruitment, compliance, training, and deployment operations."
      />
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{ p: 3, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
          <Typography sx={{ color: "text.secondary", lineHeight: 1.9 }}>
            Add your committee list here (from CMS or database). This page matches the corporate structure in your reference site.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

