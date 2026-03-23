import { Box, Card, CardActionArea, CardContent, Container, Stack, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

export default function PartnerJobMandatesPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1, md: 2 } }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
            Job Mandates
          </Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
            Browse job mandates and submit candidates quickly (dummy listing for now).
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          {[
            { t: "UAE • Security Guard", d: "120 vacancies • Salary 1800-2200 AED • Urgent" },
            { t: "Saudi • Helper / Labour", d: "80 vacancies • Immediate deployment" },
            { t: "Qatar • Electrician", d: "40 vacancies • Trade test required" },
            { t: "Oman • Housekeeping", d: "60 vacancies • Hospitality" },
          ].map((x) => (
            <Card key={x.t} variant="outlined" sx={{ borderRadius: 4 }}>
              <CardActionArea>
                <CardContent>
                  <Typography fontWeight={950}>{x.t}</Typography>
                  <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary" }}>
                    {x.d}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.25, color: "primary.main" }}>
                    <Typography fontWeight={900}>Submit Candidate</Typography>
                    <ArrowForwardIcon fontSize="small" />
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Stack>
    </Container>
  );
}

