import { Box, Card, CardContent, Chip, Container, Stack, Typography } from "@mui/material";

export default function PartnerMySubmissionsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1, md: 2 } }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            My Submissions
          </Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
            Track candidate status per submission (dummy for now).
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          {[
            { t: "Rahul • UAE Security Guard", s: "Under Review" },
            { t: "Imran • Qatar Electrician", s: "Shortlisted" },
            { t: "Suresh • Saudi Helper", s: "Rejected" },
            { t: "Naveen • UAE Security Guard", s: "Selected" },
          ].map((x) => (
            <Card key={x.t} variant="outlined" sx={{ borderRadius: 4 }}>
              <CardContent>
                <Typography fontWeight={950}>{x.t}</Typography>
                <Chip size="small" label={x.s} sx={{ mt: 1.25, fontWeight: 800 }} />
              </CardContent>
            </Card>
          ))}
        </Box>
      </Stack>
    </Container>
  );
}

