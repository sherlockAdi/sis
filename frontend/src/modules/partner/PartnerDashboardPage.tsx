import { Box, Card, CardContent, Chip, Container, Stack, Typography } from "@mui/material";

export default function PartnerDashboardPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1, md: 2 } }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            Dashboard
          </Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
            Quick overview of mandates, submissions, and performance (dummy for now).
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr 1fr" }, gap: 2 }}>
          {[
            { t: "Active Jobs", v: "12", c: "New mandates" },
            { t: "Submitted", v: "48", c: "Track status" },
            { t: "Shortlisted", v: "15", c: "Follow up" },
            { t: "Selected/Deployed", v: "6", c: "View timeline" },
          ].map((x) => (
            <Card key={x.t} variant="outlined" sx={{ borderRadius: 4 }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {x.t}
                </Typography>
                <Typography variant="h4" fontWeight={950} sx={{ mt: 0.75 }}>
                  {x.v}
                </Typography>
                <Chip size="small" label={x.c} sx={{ mt: 1.25, fontWeight: 800 }} />
              </CardContent>
            </Card>
          ))}
        </Box>
      </Stack>
    </Container>
  );
}

