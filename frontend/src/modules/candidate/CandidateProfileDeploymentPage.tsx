import { Box, Card, CardContent, Container, Stack, Step, StepLabel, Stepper, Typography } from "@mui/material";

const steps = ["Ready", "Visa", "Biometrics", "Approved", "Travel", "Deployed"];

export default function CandidateProfileDeploymentPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1, md: 2 } }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            Deployment Status
          </Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
            Visual tracker for your deployment pipeline (dummy for now).
          </Typography>
        </Box>

        <Card variant="outlined" sx={{ borderRadius: 4 }}>
          <CardContent>
            <Typography fontWeight={950}>Pipeline</Typography>
            <Box sx={{ mt: 2 }}>
              <Stepper activeStep={1} alternativeLabel>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
            <Typography variant="body2" sx={{ mt: 2, color: "text.secondary", lineHeight: 1.85 }}>
              Once deployment integration is added, this will show stage-wise tracking, required docs, travel details, and
              joining info.
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

