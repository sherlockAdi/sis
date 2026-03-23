import { Box, Card, CardContent, Container, Stack, Typography } from "@mui/material";

export default function CandidateProfileDocumentsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1, md: 2 } }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            My Documents
          </Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
            Upload required documents and track verification (dummy for now).
          </Typography>
        </Box>

        <Card variant="outlined" sx={{ borderRadius: 4 }}>
          <CardContent>
            <Typography fontWeight={950}>Required documents</Typography>
            <Typography variant="body2" sx={{ mt: 1, color: "text.secondary", lineHeight: 1.85 }}>
              Passport, Photo, Certificates, Resume, Medical, Police Clearance (as required per job).
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

