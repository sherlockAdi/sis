import { Box, Card, CardContent, Container, Stack, Typography } from "@mui/material";

export default function CandidateProfileTradeTestPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1, md: 2 } }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            Trade Test
          </Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
            Assigned assessments, work video uploads, and results (dummy for now).
          </Typography>
        </Box>

        <Card variant="outlined" sx={{ borderRadius: 4 }}>
          <CardContent>
            <Typography fontWeight={950}>No tests assigned</Typography>
            <Typography variant="body2" sx={{ mt: 1, color: "text.secondary", lineHeight: 1.85 }}>
              When a trade test is assigned, you will see instructions, upload fields, and scoring here.
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

