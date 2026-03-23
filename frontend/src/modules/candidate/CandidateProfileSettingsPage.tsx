import { Box, Card, CardContent, Container, Stack, Typography } from "@mui/material";

export default function CandidateProfileSettingsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1, md: 2 } }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            Settings
          </Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
            Language, password, and preferences (dummy for now).
          </Typography>
        </Box>

        <Card variant="outlined" sx={{ borderRadius: 4 }}>
          <CardContent>
            <Typography fontWeight={950}>Coming soon</Typography>
            <Typography variant="body2" sx={{ mt: 1, color: "text.secondary", lineHeight: 1.85 }}>
              Change password, language selection, and notification preferences will appear here.
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

