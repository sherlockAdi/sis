import { Box, Button, Card, CardContent, Chip, Container, Stack, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";

export default function CandidateHomePage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1, md: 2 } }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            Home
          </Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
            Quick snapshot and next actions.
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
          {[
            { t: "Profile Completion", v: "65%", chip: "Complete profile" },
            { t: "Applications", v: "2 Active", chip: "Track status" },
            { t: "Alerts", v: "1 Pending", chip: "Upload docs" },
          ].map((x) => (
            <Card key={x.t} variant="outlined" sx={{ borderRadius: 4 }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {x.t}
                </Typography>
                <Typography variant="h4" fontWeight={950} sx={{ mt: 0.75 }}>
                  {x.v}
                </Typography>
                <Chip size="small" label={x.chip} sx={{ mt: 1.25, fontWeight: 800 }} />
              </CardContent>
            </Card>
          ))}
        </Box>

        <Card variant="outlined" sx={{ borderRadius: 4 }}>
          <CardContent>
            <Typography fontWeight={950}>Quick actions</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.25, flexWrap: "wrap" }}>
              <Button variant="contained" onClick={() => navigate("/portal/candidate/jobs")} endIcon={<ArrowForwardIcon />}>
                Apply for Job
              </Button>
              <Button variant="outlined" onClick={() => navigate("/portal/candidate/profile/documents")}>
                Upload Documents
              </Button>
              <Button variant="outlined" onClick={() => navigate("/portal/candidate/training")}>
                Continue Training
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

