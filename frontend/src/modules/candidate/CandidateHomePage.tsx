import { Box, Button, Card, CardContent, Chip, Container, Divider, Stack, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";

export default function CandidateHomePage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1, md: 2 } }}>
      <Stack spacing={2.5}>
        <Card variant="outlined" sx={{ borderRadius: 4, overflow: "hidden" }}>
          <Box
            sx={{
              p: { xs: 2, md: 2.5 },
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.08) 0%, rgba(59,130,246,0.10) 45%, rgba(14,116,144,0.10) 100%)",
            }}
          >
            <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
              Candidate Dashboard
            </Typography>
            <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
              Quick snapshot, next actions, and your application pipeline.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.25, flexWrap: "wrap" }}>
              <Chip size="small" label="Complete profile" />
              <Chip size="small" label="Verify documents" />
              <Chip size="small" label="Track applications" />
            </Stack>
          </Box>
        </Card>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr 1fr" }, gap: 2 }}>
          {[
            { t: "Profile Completion", v: "65%", chip: "Finish profile" },
            { t: "Applications", v: "2 Active", chip: "Track status" },
            { t: "Documents", v: "3 Uploaded", chip: "Update files" },
            { t: "Training", v: "1 Module", chip: "Continue" },
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

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: 2 }}>
          <Card variant="outlined" sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography fontWeight={950}>Next Steps</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Complete these to improve your chances.
              </Typography>
              <Stack spacing={1} sx={{ mt: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="body2">Upload missing documents</Typography>
                  <Button size="small" variant="outlined" onClick={() => navigate("/portal/candidate/profile/documents")}>
                    Upload
                  </Button>
                </Box>
                <Divider />
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="body2">Apply to more jobs</Typography>
                  <Button size="small" variant="contained" onClick={() => navigate("/portal/candidate/jobs")} endIcon={<ArrowForwardIcon />}>
                    Browse
                  </Button>
                </Box>
                <Divider />
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="body2">Continue training module</Typography>
                  <Button size="small" variant="outlined" onClick={() => navigate("/portal/candidate/training")}>
                    Continue
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography fontWeight={950}>Quick Actions</Typography>
              <Stack spacing={1} sx={{ mt: 1.25 }}>
                <Button variant="contained" onClick={() => navigate("/portal/candidate/jobs")} endIcon={<ArrowForwardIcon />}>
                  Apply for Job
                </Button>
                <Button variant="outlined" onClick={() => navigate("/portal/candidate/profile/documents")}>
                  Upload Documents
                </Button>
                <Button variant="outlined" onClick={() => navigate("/portal/candidate/profile/deployment")}>
                  Deployment Status
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Container>
  );
}
