import { Box, Button, Container, Divider, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PublicPageHero from "../../components/PublicPageHero";
import { PORTAL_BASE } from "../../../../common/paths";

export default function PartnerSubmitCandidatesPage() {
  const navigate = useNavigate();

  return (
    <Box>
      <PublicPageHero
        eyebrow="Partner Zone"
        title="Submit"
        highlight="Candidates"
        subtitle="Use the Partner portal to submit profiles and track progress."
      />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{ p: 3, bgcolor: "white", borderRadius: 4, border: "1px solid rgba(15,23,42,0.08)" }}>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            Submission CTA
          </Typography>
          <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.9 }}>
            Partner submissions happen inside the portal so you can upload candidate details, attach documents, and track status
            updates.
          </Typography>

          <Divider sx={{ my: 2.5 }} />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
            <Button
              variant="contained"
              onClick={() => navigate(`${PORTAL_BASE}/login?portal=sourcing`)}
              sx={{ bgcolor: "primary.main", "&:hover": { bgcolor: "primary.dark" }, borderRadius: 3 }}
              fullWidth
            >
              Partner Portal Login
            </Button>
            <Button variant="outlined" onClick={() => navigate("/register")} sx={{ borderRadius: 3 }} fullWidth>
              Get Registered
            </Button>
            <Button variant="outlined" onClick={() => navigate("/jobs")} sx={{ borderRadius: 3 }} fullWidth>
              Browse Jobs
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
