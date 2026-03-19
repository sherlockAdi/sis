import { Grid, Typography } from "@mui/material";
import { AdStatCard } from "../../common/ad";

export default function OpdDashboard() {
  return (
    <>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        OPD Dashboard
      </Typography>

      <Typography variant="body1" color="text.secondary" gutterBottom>
        Quick view of outpatient metrics (fully responsive AD toolkit widgets).
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <AdStatCard label="Patients Today" value="128" helperText="+12% vs yesterday" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <AdStatCard label="Avg. Wait (min)" value="18" helperText="Target &lt; 20 min" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <AdStatCard label="Open Tickets" value="6" helperText="Labs / Imaging follow-ups" />
        </Grid>
      </Grid>
    </>
  );
}
