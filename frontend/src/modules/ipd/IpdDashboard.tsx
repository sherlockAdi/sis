import { Grid, Typography } from "@mui/material";
import { AdStatCard } from "../../common/ad";

export default function IpdDashboard() {
  return (
    <>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        IPD Dashboard
      </Typography>

      <Typography variant="body1" color="text.secondary" gutterBottom>
        Inpatient overview using the shared AD toolkit components.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <AdStatCard label="Occupied Beds" value="72 / 96" helperText="75% utilization" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <AdStatCard label="Discharges Today" value="24" helperText="3 pending billing" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <AdStatCard label="Critical Cases" value="9" helperText="ICU / HDU alerts" />
        </Grid>
      </Grid>
    </>
  );
}
