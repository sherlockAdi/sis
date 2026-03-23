import { Box, Card, CardContent, Container, Stack, Typography } from "@mui/material";

export default function PartnerPerformancePage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1, md: 2 } }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            Performance
          </Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
            Submission metrics, conversion rate, and monthly performance (dummy for now).
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
          {[
            { t: "Total Submissions", v: "48" },
            { t: "Shortlist %", v: "31%" },
            { t: "Deployment %", v: "12%" },
          ].map((x) => (
            <Card key={x.t} variant="outlined" sx={{ borderRadius: 4 }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {x.t}
                </Typography>
                <Typography variant="h4" fontWeight={950} sx={{ mt: 0.75 }}>
                  {x.v}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Stack>
    </Container>
  );
}

