import { Box, Button, Chip, Divider, Stack, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

export default function PlaceholderPage({
  title,
  description,
  nextLinks,
}: {
  title: string;
  description?: string;
  nextLinks?: Array<{ label: string; to: string }>;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={1.25}>
        <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.4 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description ?? "This module is scaffolded as a dummy page for now. Menu Management can point here until the real screens are built."}
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip size="small" label={`Route: ${location.pathname}`} />
          <Chip size="small" label="Status: Coming soon" color="warning" variant="outlined" />
        </Stack>

        {nextLinks?.length ? (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography fontWeight={950}>Quick links</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
              {nextLinks.map((l) => (
                <Button key={l.to} variant="outlined" onClick={() => navigate(l.to)} sx={{ textTransform: "none", fontWeight: 900 }}>
                  {l.label}
                </Button>
              ))}
            </Stack>
          </>
        ) : null}
      </Stack>
    </Box>
  );
}

