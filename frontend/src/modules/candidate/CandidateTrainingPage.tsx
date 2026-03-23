import { Box, Card, CardContent, Chip, Container, Stack, Typography } from "@mui/material";

export default function CandidateTrainingPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1, md: 2 } }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            Training
          </Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
            Assigned training, progress, and certificates (dummy for now).
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          {[
            { t: "Assigned Training", d: "2 modules pending", chip: "Start" },
            { t: "Completed", d: "1 certificate available", chip: "View" },
          ].map((x) => (
            <Card key={x.t} variant="outlined" sx={{ borderRadius: 4 }}>
              <CardContent>
                <Typography fontWeight={950}>{x.t}</Typography>
                <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary" }}>
                  {x.d}
                </Typography>
                <Chip size="small" label={x.chip} sx={{ mt: 1.25, fontWeight: 800 }} />
              </CardContent>
            </Card>
          ))}
        </Box>
      </Stack>
    </Container>
  );
}

