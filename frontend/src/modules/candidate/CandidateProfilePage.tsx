import { Box, Card, CardActionArea, CardContent, Container, Stack, Typography } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useNavigate } from "react-router-dom";

const tiles = [
  { t: "My Documents", d: "Upload and track verification", to: "/portal/candidate/profile/documents" },
  { t: "Trade Test", d: "Assigned tests and work videos", to: "/portal/candidate/profile/trade-test" },
  { t: "Deployment Status", d: "Visa → travel → joining tracker", to: "/portal/candidate/profile/deployment" },
  { t: "Helpdesk", d: "Raise and track tickets", to: "/portal/candidate/profile/helpdesk" },
  { t: "Settings", d: "Password, language, logout", to: "/portal/candidate/profile/settings" },
];

export default function CandidateProfilePage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1, md: 2 } }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            Profile
          </Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
            Manage your profile, documents, and progress.
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          {tiles.map((x) => (
            <Card key={x.to} variant="outlined" sx={{ borderRadius: 4 }}>
              <CardActionArea onClick={() => navigate(x.to)}>
                <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={950}>{x.t}</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
                      {x.d}
                    </Typography>
                  </Box>
                  <ChevronRightIcon />
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Stack>
    </Container>
  );
}

