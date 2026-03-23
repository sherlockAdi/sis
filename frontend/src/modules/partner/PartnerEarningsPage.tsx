import { Box, Card, CardContent, Container, Stack, Typography } from "@mui/material";

export default function PartnerEarningsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1, md: 2 } }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            Earnings
          </Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
            Commission, payment status, and invoices (dummy for now).
          </Typography>
        </Box>

        <Card variant="outlined" sx={{ borderRadius: 4 }}>
          <CardContent>
            <Typography fontWeight={950}>Wallet</Typography>
            <Typography variant="body2" sx={{ mt: 1, color: "text.secondary", lineHeight: 1.85 }}>
              Pending • Approved • Paid — partner payout workflows will appear here.
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

