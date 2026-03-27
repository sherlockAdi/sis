import { Box, Card, CardContent, Container, Stack, TextField, Typography } from "@mui/material";

export default function PartnerSubmitCandidatePage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1, md: 2 } }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            Submit Candidate
          </Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
            Quick candidate entry against a Job ID (dummy form for now).
          </Typography>
        </Box>

        <Card variant="outlined" sx={{ borderRadius: 4 }}>
          <CardContent>
            <Stack spacing={1.5}>
              <TextField label="Job ID / Job Code" placeholder="e.g. JOB000123 or UAESEC001" />
              <TextField label="Candidate Name" placeholder="Full name" />
              <TextField label="Mobile" placeholder="+91..." />
              <TextField label="Skill" placeholder="Security / Electrician / Helper..." />
              <TextField label="Experience (Years)" placeholder="e.g. 2" />
              <TextField label="Documents" placeholder="Upload will be added here (bulk upload later)" disabled />
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

