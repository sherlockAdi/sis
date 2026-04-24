import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const items = [
  {
    title: "Job Categories",
    description: "Manage the job category master used when creating job posts.",
    to: "/portal/masters/job/categories",
  },
  {
    title: "Employment Types",
    description: "Manage full-time, part-time, contract, and similar hiring modes.",
    to: "/portal/settings/employment-types",
  },
  {
    title: "Work Modes",
    description: "Configure remote, hybrid, onsite, and any custom work modes.",
    to: "/portal/settings/work-modes",
  },
  {
    title: "Currencies",
    description: "Maintain currency codes, symbols, names, and country mapping.",
    to: "/portal/settings/currencies",
  },
  {
    title: "Languages",
    description: "Manage languages used across candidate, job, and profile workflows.",
    to: "/portal/masters/recruitment/languages",
  },
  {
    title: "Education",
    description: "Maintain education master values used in candidate profiles and filters.",
    to: "/portal/settings/education",
  },
  {
    title: "Skills",
    description: "Maintain the skills master used across candidate profiles and jobs.",
    to: "/portal/settings/skills",
  },
  {
    title: "States",
    description: "Manage states as part of the location master hierarchy.",
    to: "/portal/settings/states",
  },
  {
    title: "Cities",
    description: "Manage cities and link them to the correct state.",
    to: "/portal/settings/cities",
  },
];

export default function SystemSettingsPage() {
  const navigate = useNavigate();

  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.25}>
        <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
          System Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Master data used across jobs, locations, and candidate workflows.
        </Typography>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
          gap: 2,
        }}
      >
        {items.map((item) => (
          <Card key={item.title} variant="outlined" sx={{ borderRadius: 4 }}>
            <CardContent>
              <Stack spacing={1.25}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <Typography fontWeight={950}>{item.title}</Typography>
                  <Chip size="small" label="Master" variant="outlined" />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  {item.description}
                </Typography>
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate(item.to)}
                  sx={{ alignSelf: "flex-start", borderRadius: 999, textTransform: "none", fontWeight: 900 }}
                >
                  Open
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Stack>
  );
}
